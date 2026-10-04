from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.database import SessionLocal
from backend import models
from backend.schemas import AssignmentCreate
from backend.auth import require_admin, get_current_user
from backend.progress_service import recalculate_all_mission_progress


router = APIRouter(
    prefix="/assignments",
    tags=["Assignments"]
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
# CREATE ASSIGNMENT
# ADMIN ONLY
# =========================================================

@router.post("")
def create_assignment(
    assignment: AssignmentCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    # Check that the mission exists
    mission = (
        db.query(models.Mission)
        .filter(
            models.Mission.id == assignment.mission_id
        )
        .first()
    )

    if not mission:
        return {
            "error": "Mission not found"
        }

    # Create assignment
    new_assignment = models.Assignment(
        title=assignment.title,
        instructions=assignment.instructions,
        expected_answer=assignment.expected_answer,
        required_concepts=assignment.required_concepts,
        mission_id=assignment.mission_id
    )

    db.add(new_assignment)

    # Flush first so the new assignment exists in the current
    # transaction before recalculating student progress.
    db.flush()

    # A newly added assignment changes the completion rules
    # for every student who already has progress in this mission.
    recalculate_all_mission_progress(
        db=db,
        mission_id=assignment.mission_id
    )

    db.commit()
    db.refresh(new_assignment)

    return {
        "id": new_assignment.id,
        "title": new_assignment.title,
        "instructions": new_assignment.instructions,
        "expected_answer": new_assignment.expected_answer,
        "required_concepts": new_assignment.required_concepts,
        "mission_id": new_assignment.mission_id
    }


# =========================================================
# GET ALL ASSIGNMENTS
# ADMIN DASHBOARD
# ADMIN ONLY
# =========================================================

@router.get("")
def get_assignments(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    assignments = (
        db.query(models.Assignment)
        .order_by(
            models.Assignment.mission_id,
            models.Assignment.id
        )
        .all()
    )

    return {
        "assignments": [
            {
                "id": assignment.id,
                "title": assignment.title,
                "instructions": assignment.instructions,
                "expected_answer": assignment.expected_answer,
                "required_concepts": assignment.required_concepts,
                "mission_id": assignment.mission_id
            }
            for assignment in assignments
        ]
    }


# =========================================================
# GET ASSIGNMENTS FOR A MISSION
# =========================================================
#
# Used by the Student View.
#
# IMPORTANT:
# expected_answer and required_concepts are deliberately
# NOT returned here.
#
# Students must never receive the evaluation criteria.
# =========================================================

@router.get("/mission/{mission_id}")
def get_mission_assignments(
    mission_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user.get("role") == "STUDENT":

        student_id = int(
            current_user.get("student_id", -1)
        )

        progress = (
            db.query(models.Progress)
            .filter(
                models.Progress.student_id == student_id,
                models.Progress.mission_id == mission_id
            )
            .first()
        )

        if not progress or not progress.unlocked:

            from fastapi import HTTPException, status

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Mission is locked"
            )

    elif current_user.get("role") != "ADMIN":

        from fastapi import HTTPException, status

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    # Check that the mission exists
    mission = (
        db.query(models.Mission)
        .filter(
            models.Mission.id == mission_id
        )
        .first()
    )

    if not mission:
        return {
            "error": "Mission not found"
        }

    # Get assignments for the mission
    assignments = (
        db.query(models.Assignment)
        .filter(
            models.Assignment.mission_id == mission_id
        )
        .order_by(
            models.Assignment.id
        )
        .all()
    )

    return {
        "mission_id": mission_id,
        "assignments": [
            {
                "id": assignment.id,
                "title": assignment.title,
                "instructions": assignment.instructions,
                "mission_id": assignment.mission_id
            }
            for assignment in assignments
        ]
    }


# =========================================================
# UPDATE ASSIGNMENT
# ADMIN ONLY
# =========================================================

@router.put("/{assignment_id}")
def update_assignment(
    assignment_id: int,
    assignment: AssignmentCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    # Find assignment
    existing_assignment = (
        db.query(models.Assignment)
        .filter(
            models.Assignment.id == assignment_id
        )
        .first()
    )

    if not existing_assignment:
        return {
            "error": "Assignment not found"
        }

    # Remember the original mission.
    # This matters if the administrator moves the assignment
    # from one mission to another.
    old_mission_id = existing_assignment.mission_id

    # Check that the destination mission exists
    mission = (
        db.query(models.Mission)
        .filter(
            models.Mission.id == assignment.mission_id
        )
        .first()
    )

    if not mission:
        return {
            "error": "Mission not found"
        }

    # Update assignment
    existing_assignment.title = assignment.title
    existing_assignment.instructions = assignment.instructions
    existing_assignment.expected_answer = assignment.expected_answer
    existing_assignment.required_concepts = assignment.required_concepts
    existing_assignment.mission_id = assignment.mission_id

    # Make the changes visible to recalculation queries.
    db.flush()

    # Recalculate the mission containing the assignment now.
    recalculate_all_mission_progress(
        db=db,
        mission_id=assignment.mission_id
    )

    # If the assignment was moved to another mission,
    # recalculate the old mission too.
    if old_mission_id != assignment.mission_id:
        recalculate_all_mission_progress(
            db=db,
            mission_id=old_mission_id
        )

    db.commit()
    db.refresh(existing_assignment)

    return {
        "id": existing_assignment.id,
        "title": existing_assignment.title,
        "instructions": existing_assignment.instructions,
        "expected_answer": existing_assignment.expected_answer,
        "required_concepts": existing_assignment.required_concepts,
        "mission_id": existing_assignment.mission_id
    }


# =========================================================
# DELETE ASSIGNMENT
# ADMIN ONLY
# =========================================================

@router.delete("/{assignment_id}")
def delete_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    # Find assignment
    assignment = (
        db.query(models.Assignment)
        .filter(
            models.Assignment.id == assignment_id
        )
        .first()
    )

    if not assignment:
        return {
            "error": "Assignment not found"
        }

    mission_id = assignment.mission_id

    # Keep information before deleting
    deleted_assignment = {
        "id": assignment.id,
        "title": assignment.title,
        "mission_id": assignment.mission_id
    }

    # Delete assignment
    db.delete(assignment)

    # Flush so the deleted assignment is no longer included
    # when mission progress is recalculated.
    db.flush()

    recalculate_all_mission_progress(
        db=db,
        mission_id=mission_id
    )

    db.commit()

    return {
        "message": "Assignment deleted successfully",
        "assignment": deleted_assignment
    }