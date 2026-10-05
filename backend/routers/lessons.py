from pathlib import Path

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.database import SessionLocal
from backend import models
from backend.schemas import LessonCreate
from backend.auth import require_admin, get_current_user


router = APIRouter(
    tags=["Lessons"]
)


# =========================================================
# DATABASE SESSION
# =========================================================

def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


# =========================================================
# MEDIA RESPONSE
# =========================================================

def get_lesson_media(lesson):
    return [
        {
            "id": link.media.id,
            "title": link.media.title,
            "filename": link.media.filename,
            "media_type": link.media.media_type,
            "mime_type": link.media.mime_type,
            "url": (
                f"/media/"
                f"{Path(link.media.file_path).name}"
            ),
            "display_order": link.display_order
        }
        for link in sorted(
            lesson.media_links,
            key=lambda item: item.display_order
        )
        if link.media.active
    ]


# =========================================================
# CREATE LESSON
# ADMIN ONLY
# =========================================================

@router.post("/lessons")
def create_lesson(
    lesson: LessonCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    # Check that the mission exists
    mission = (
        db.query(models.Mission)
        .filter(models.Mission.id == lesson.mission_id)
        .first()
    )

    if not mission:
        return {
            "error": "Mission not found"
        }

    new_lesson = models.Lesson(
        title=lesson.title,
        content=lesson.content,
        lesson_number=lesson.lesson_number,
        mission_id=lesson.mission_id
    )

    db.add(new_lesson)
    db.commit()
    db.refresh(new_lesson)

    return {
        "id": new_lesson.id,
        "title": new_lesson.title,
        "content": new_lesson.content,
        "lesson_number": new_lesson.lesson_number,
        "mission_id": new_lesson.mission_id,
        "media": []
    }


# =========================================================
# GET ALL LESSONS
# ADMIN DASHBOARD
# ADMIN ONLY
# =========================================================

@router.get("/lessons")
def get_lessons(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    lessons = (
        db.query(models.Lesson)
        .order_by(
            models.Lesson.mission_id,
            models.Lesson.lesson_number
        )
        .all()
    )

    return {
        "lessons": [
            {
                "id": lesson.id,
                "title": lesson.title,
                "content": lesson.content,
                "lesson_number": lesson.lesson_number,
                "mission_id": lesson.mission_id,
                "media": get_lesson_media(lesson)
            }
            for lesson in lessons
        ]
    }


# =========================================================
# GET MISSION LESSONS
# =========================================================
#
# Used by the Student View.
#
# This endpoint is not Admin-only because students need
# to read lessons belonging to missions they can access.
#

@router.get("/missions/{mission_id}/lessons")
def get_mission_lessons(
    mission_id: int,
    db: Session = Depends(get_db)
):
    lessons = (
        db.query(models.Lesson)
        .filter(models.Lesson.mission_id == mission_id)
        .order_by(models.Lesson.lesson_number)
        .all()
    )

    return {
        "mission_id": mission_id,
        "lessons": [
            {
                "id": lesson.id,
                "lesson_number": lesson.lesson_number,
                "title": lesson.title,
                "content": lesson.content,
                "media": get_lesson_media(lesson)
            }
            for lesson in lessons
        ]
    }


# =========================================================
# GET LESSONS FOR STUDENT
# CHECK MISSION ACCESS FIRST
# =========================================================

@router.get("/students/{student_id}/missions/{mission_id}/lessons")
def get_student_mission_lessons(
    student_id: int,
    mission_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if (
        current_user.get("role") != "STUDENT"
        or int(current_user.get("student_id", -1)) != student_id
    ):
        from fastapi import HTTPException, status

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only access your own lessons"
        )

    # Check student's mission progress
    progress = (
        db.query(models.Progress)
        .filter(
            models.Progress.student_id == student_id,
            models.Progress.mission_id == mission_id
        )
        .first()
    )

    if not progress:
        return {
            "error": "Student has not started this mission"
        }

    # Locked missions cannot be accessed
    if not progress.unlocked:
        return {
            "error": "Mission is locked"
        }

    lessons = (
        db.query(models.Lesson)
        .filter(models.Lesson.mission_id == mission_id)
        .order_by(models.Lesson.lesson_number)
        .all()
    )

    return {
        "student_id": student_id,
        "mission_id": mission_id,
        "unlocked": True,
        "lessons": [
            {
                "id": lesson.id,
                "lesson_number": lesson.lesson_number,
                "title": lesson.title,
                "content": lesson.content,
                "media": get_lesson_media(lesson)
            }
            for lesson in lessons
        ]
    }


# =========================================================
# UPDATE LESSON
# ADMIN ONLY
# =========================================================

@router.put("/lessons/{lesson_id}")
def update_lesson(
    lesson_id: int,
    lesson: LessonCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    # Find the lesson
    existing_lesson = (
        db.query(models.Lesson)
        .filter(models.Lesson.id == lesson_id)
        .first()
    )

    if not existing_lesson:
        return {
            "error": "Lesson not found"
        }

    # Check that the mission exists
    mission = (
        db.query(models.Mission)
        .filter(models.Mission.id == lesson.mission_id)
        .first()
    )

    if not mission:
        return {
            "error": "Mission not found"
        }

    # Update lesson
    existing_lesson.title = lesson.title
    existing_lesson.content = lesson.content
    existing_lesson.lesson_number = lesson.lesson_number
    existing_lesson.mission_id = lesson.mission_id

    db.commit()
    db.refresh(existing_lesson)

    return {
        "id": existing_lesson.id,
        "title": existing_lesson.title,
        "content": existing_lesson.content,
        "lesson_number": existing_lesson.lesson_number,
        "mission_id": existing_lesson.mission_id,
        "media": get_lesson_media(existing_lesson)
    }


# =========================================================
# DELETE LESSON
# ADMIN ONLY
# =========================================================

@router.delete("/lessons/{lesson_id}")
def delete_lesson(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    # Find the lesson
    lesson = (
        db.query(models.Lesson)
        .filter(models.Lesson.id == lesson_id)
        .first()
    )

    if not lesson:
        return {
            "error": "Lesson not found"
        }

    # Keep information before deleting
    deleted_lesson = {
        "id": lesson.id,
        "title": lesson.title,
        "mission_id": lesson.mission_id
    }

    # Delete lesson
    db.delete(lesson)
    db.commit()

    return {
        "message": "Lesson deleted successfully",
        "lesson": deleted_lesson
    }
