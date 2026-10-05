from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.database import SessionLocal
from backend import models
from backend.schemas import MissionCreate
from backend.auth import require_admin


router = APIRouter(
    prefix="/missions",
    tags=["Missions"]
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
# CREATE MISSION
# =========================================================

@router.post("")
def create_mission(
    mission: MissionCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    # Check that the course exists
    course = (
        db.query(models.Course)
        .filter(models.Course.id == mission.course_id)
        .first()
    )

    if not course:
        return {
            "error": "Course not found"
        }

    # Create mission
    new_mission = models.Mission(
        title=mission.title,
        mission_number=mission.mission_number,
        passing_score=mission.passing_score,
        course_id=mission.course_id
    )

    db.add(new_mission)

    # Flush so the mission receives its database ID
    # before Progress records are created.
    db.flush()

    # Create progress for every existing student.
    # This ensures that missions added later also appear
    # in the progression of students who already exist.
    students = db.query(models.Student).all()

    for student in students:
        progress = models.Progress(
            student_id=student.id,
            mission_id=new_mission.id,
            score=0,
            completed=False
        )

        db.add(progress)

    # Save the mission and all progress records together.
    db.commit()
    db.refresh(new_mission)

    return {
        "id": new_mission.id,
        "title": new_mission.title,
        "mission_number": new_mission.mission_number,
        "passing_score": new_mission.passing_score,
        "course_id": new_mission.course_id
    }


# =========================================================
# GET ALL MISSIONS
# =========================================================

@router.get("")
def get_missions(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    missions = (
        db.query(models.Mission)
        .order_by(
            models.Mission.course_id,
            models.Mission.mission_number
        )
        .all()
    )

    return {
        "missions": [
            {
                "id": mission.id,
                "title": mission.title,
                "mission_number": mission.mission_number,
                "passing_score": mission.passing_score,
                "course_id": mission.course_id
            }
            for mission in missions
        ]
    }


# =========================================================
# UPDATE MISSION
# =========================================================

@router.put("/{mission_id}")
def update_mission(
    mission_id: int,
    mission: MissionCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    # Find mission
    existing_mission = (
        db.query(models.Mission)
        .filter(models.Mission.id == mission_id)
        .first()
    )

    if not existing_mission:
        return {
            "error": "Mission not found"
        }

    # Check that the selected course exists
    course = (
        db.query(models.Course)
        .filter(models.Course.id == mission.course_id)
        .first()
    )

    if not course:
        return {
            "error": "Course not found"
        }

    # Update mission
    existing_mission.title = mission.title
    existing_mission.mission_number = mission.mission_number
    existing_mission.passing_score = mission.passing_score
    existing_mission.course_id = mission.course_id

    db.commit()
    db.refresh(existing_mission)

    return {
        "id": existing_mission.id,
        "title": existing_mission.title,
        "mission_number": existing_mission.mission_number,
        "passing_score": existing_mission.passing_score,
        "course_id": existing_mission.course_id
    }


# =========================================================
# DELETE MISSION
# =========================================================

@router.delete("/{mission_id}")
def delete_mission(
    mission_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    # Find mission
    mission = (
        db.query(models.Mission)
        .filter(models.Mission.id == mission_id)
        .first()
    )

    if not mission:
        return {
            "error": "Mission not found"
        }

    # Do not delete a mission that still contains lessons
    lesson_count = (
        db.query(models.Lesson)
        .filter(models.Lesson.mission_id == mission_id)
        .count()
    )

    if lesson_count > 0:
        return {
            "error":
                "This mission still contains lessons. "
                "Delete its lessons first."
        }

    # Do not delete a mission that still contains assignments
    assignment_count = (
        db.query(models.Assignment)
        .filter(models.Assignment.mission_id == mission_id)
        .count()
    )

    if assignment_count > 0:
        return {
            "error":
                "This mission still contains assignments. "
                "Delete its assignments first."
        }

    # Keep information before deleting
    deleted_mission = {
        "id": mission.id,
        "title": mission.title,
        "mission_number": mission.mission_number,
        "course_id": mission.course_id
    }

    # Delete related student progress first
    (
        db.query(models.Progress)
        .filter(models.Progress.mission_id == mission_id)
        .delete(synchronize_session=False)
    )

    # Delete mission
    db.delete(mission)
    db.commit()

    return {
        "message": "Mission deleted successfully",
        "mission": deleted_mission
    }
