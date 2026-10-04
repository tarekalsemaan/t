from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.database import SessionLocal
from backend import models
from backend.schemas import CourseCreate
from backend.auth import require_admin


router = APIRouter(
    prefix="/courses",
    tags=["Courses"]
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
# CREATE COURSE
# =========================================================

@router.post("")
def create_course(
    course: CourseCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    new_course = models.Course(
        title=course.title
    )

    db.add(new_course)
    db.commit()
    db.refresh(new_course)

    return {
        "id": new_course.id,
        "title": new_course.title
    }


# =========================================================
# GET ALL COURSES
# =========================================================

@router.get("")
def get_courses(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    courses = (
        db.query(models.Course)
        .order_by(models.Course.id)
        .all()
    )

    return {
        "courses": [
            {
                "id": course.id,
                "title": course.title
            }
            for course in courses
        ]
    }


# =========================================================
# UPDATE COURSE
# =========================================================

@router.put("/{course_id}")
def update_course(
    course_id: int,
    course: CourseCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    existing_course = (
        db.query(models.Course)
        .filter(models.Course.id == course_id)
        .first()
    )

    if not existing_course:
        return {
            "error": "Course not found"
        }

    existing_course.title = course.title

    db.commit()
    db.refresh(existing_course)

    return {
        "id": existing_course.id,
        "title": existing_course.title
    }


# =========================================================
# DELETE COURSE
# =========================================================

@router.delete("/{course_id}")
def delete_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):

    course = (
        db.query(models.Course)
        .filter(models.Course.id == course_id)
        .first()
    )

    # Course does not exist

    if not course:

        return {
            "error": "Course not found"
        }

    # -----------------------------------------------------
    # SAFETY CHECK
    # Do not delete a course that still contains missions
    # -----------------------------------------------------

    mission_count = (
        db.query(models.Mission)
        .filter(models.Mission.course_id == course_id)
        .count()
    )

    if mission_count > 0:

        return {
            "error":
                "This course still contains missions. "
                "Delete its missions first."
        }

    # Save information before deleting

    deleted_course = {
        "id": course.id,
        "title": course.title
    }

    # Delete the course

    db.delete(course)
    db.commit()

    return {
        "message": "Course deleted successfully",
        "course": deleted_course
    }