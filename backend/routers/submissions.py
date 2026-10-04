from typing import Optional
import re

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database import SessionLocal
from backend import models
from backend.schemas import SubmissionCreate, SubmissionEvaluation
from backend.evaluator import evaluate_submission
from backend.auth import get_current_user


router = APIRouter(
    prefix="/submissions",
    tags=["Submissions"]
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
# STUDENT ACCESS CHECK
# =========================================================

def require_student_access(
    student_id: int,
    current_user: dict
):
    if current_user.get("role") != "STUDENT":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Student access required"
        )

    token_student_id = current_user.get("student_id")

    if token_student_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Student account is not linked to a student"
        )

    if int(token_student_id) != student_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only access your own student account"
        )


# =========================================================
# NORMALIZE TEXT
# =========================================================

def normalize_text(text: str) -> str:
    """
    Normalize text before comparing answers.

    This prevents capitalization, punctuation and extra spaces
    from unfairly changing the result.
    """

    text = (text or "").lower().strip()

    text = re.sub(
        r"[^\w\s]",
        " ",
        text,
        flags=re.UNICODE
    )

    text = re.sub(
        r"\s+",
        " ",
        text
    )

    return text


# =========================================================
# GENERIC REQUIRED-CONCEPTS EVALUATOR
# =========================================================

def evaluate_required_concepts(
    student_answer: str,
    required_concepts: str
):
    """
    Evaluate an answer using administrator-configured concepts.

    One non-empty line = one required concept.
    Alternatives on the same line are separated by "|".

    Example:
        labeled data|labeled examples

    Either alternative satisfies that concept.
    """

    student_normalized = normalize_text(student_answer)

    if not student_normalized:
        return {
            "score": 0,
            "feedback": "La réponse est vide."
        }

    concept_lines = [
        line.strip()
        for line in (required_concepts or "").splitlines()
        if line.strip()
    ]

    if not concept_lines:
        return {
            "score": None,
            "feedback": (
                "Aucun concept requis n'a été configuré "
                "pour ce travail."
            )
        }

    matched_concepts = []
    missing_concepts = []

    for concept_line in concept_lines:
        alternatives = [
            normalize_text(alternative)
            for alternative in concept_line.split("|")
            if alternative.strip()
        ]

        concept_found = any(
            alternative and alternative in student_normalized
            for alternative in alternatives
        )

        if concept_found:
            matched_concepts.append(concept_line)
        else:
            missing_concepts.append(concept_line)

    score = round(
        len(matched_concepts) /
        len(concept_lines) *
        100
    )

    if not missing_concepts:
        feedback = (
            "Excellente réponse. Tous les concepts requis "
            "sont présents."
        )
    elif score >= 80:
        feedback = (
            "Bonne réponse. La majorité des concepts requis "
            "sont présents."
        )
    elif score >= 60:
        feedback = (
            "Réponse partiellement correcte. "
            "Certains concepts importants sont manquants."
        )
    else:
        feedback = (
            "La réponse doit être complétée. "
            "Plusieurs concepts requis sont manquants."
        )

    return {
        "score": score,
        "feedback": feedback
    }


# =========================================================
# GET LATEST SUBMISSION
# STUDENT ONLY
# =========================================================

@router.get(
    "/student/{student_id}/assignment/{assignment_id}/latest"
)
def get_latest_submission(
    student_id: int,
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    require_student_access(
        student_id,
        current_user
    )

    assignment = (
        db.query(models.Assignment)
        .filter(
            models.Assignment.id == assignment_id
        )
        .first()
    )

    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )

    latest_submission = (
        db.query(models.Submission)
        .filter(
            models.Submission.student_id == student_id,
            models.Submission.assignment_id == assignment_id
        )
        .order_by(
            models.Submission.id.desc()
        )
        .first()
    )

    if not latest_submission:
        return {
            "submission": None
        }

    return {
        "submission": {
            "id": latest_submission.id,
            "student_id": latest_submission.student_id,
            "assignment_id": latest_submission.assignment_id,
            "content": latest_submission.content,
            "score": latest_submission.score,
            "feedback": latest_submission.feedback
        }
    }


# =========================================================
# CREATE SUBMISSION
# STUDENT ONLY
# =========================================================

@router.post("")
def create_submission(
    submission: SubmissionCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    require_student_access(
        submission.student_id,
        current_user
    )

    student = (
        db.query(models.Student)
        .filter(
            models.Student.id == submission.student_id
        )
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )

    assignment = (
        db.query(models.Assignment)
        .filter(
            models.Assignment.id == submission.assignment_id
        )
        .first()
    )

    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )

    progress = (
        db.query(models.Progress)
        .filter(
            models.Progress.student_id == submission.student_id,
            models.Progress.mission_id == assignment.mission_id
        )
        .first()
    )

    if not progress:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Student has not started this mission"
        )

    if not progress.unlocked:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Mission is locked"
        )

    if not submission.content.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Submission content cannot be empty"
        )

    new_submission = models.Submission(
        student_id=submission.student_id,
        assignment_id=submission.assignment_id,
        content=submission.content,
        score=None,
        feedback=None
    )

    db.add(new_submission)
    db.commit()
    db.refresh(new_submission)

    return {
        "id": new_submission.id,
        "student_id": new_submission.student_id,
        "assignment_id": new_submission.assignment_id,
        "content": new_submission.content,
        "score": new_submission.score,
        "feedback": new_submission.feedback
    }


# =========================================================
# EVALUATE SUBMISSION
# STUDENT ONLY
# =========================================================

@router.post("/{submission_id}/evaluate")
def evaluate_student_submission(
    submission_id: int,
    evaluation: Optional[SubmissionEvaluation] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    submission = (
        db.query(models.Submission)
        .filter(
            models.Submission.id == submission_id
        )
        .first()
    )

    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found"
        )

    require_student_access(
        submission.student_id,
        current_user
    )

    assignment = (
        db.query(models.Assignment)
        .filter(
            models.Assignment.id == submission.assignment_id
        )
        .first()
    )

    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )

    mission = (
        db.query(models.Mission)
        .filter(
            models.Mission.id == assignment.mission_id
        )
        .first()
    )

    if not mission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mission not found"
        )

    progress = (
        db.query(models.Progress)
        .filter(
            models.Progress.student_id == submission.student_id,
            models.Progress.mission_id == mission.id
        )
        .first()
    )

    if not progress:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student progress not found"
        )

    # =====================================================
    # BACKEND EVALUATION
    # =====================================================
    #
    # CONFIGURED ASSIGNMENTS:
    # Use the required concepts configured by the administrator.
    #
    # EXISTING ASSIGNMENTS:
    # If no required concepts exist, keep using the original
    # MissionLMS evaluator.
    #
    # The browser never decides the score.
    # =====================================================

    required_concepts = (
        assignment.required_concepts or ""
    ).strip()

    if required_concepts:

        result = evaluate_required_concepts(
            student_answer=submission.content,
            required_concepts=required_concepts
        )

    else:

        result = evaluate_submission(
            assignment_title=assignment.title,
            instructions=assignment.instructions,
            content=submission.content,
            mission_number=mission.mission_number
        )

    if result["score"] is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["feedback"]
        )

    score = result["score"]
    feedback = result["feedback"]

    submission.score = score
    submission.feedback = feedback

    # =====================================================
    # ASSIGNMENT PASS / MISSION COMPLETION
    # =====================================================

    passed = (
        score >= mission.passing_score
    )

    # Flush the current evaluation so the query below can see
    # the score before the final commit.
    db.flush()

    mission_assignments = (
        db.query(models.Assignment)
        .filter(
            models.Assignment.mission_id == mission.id
        )
        .all()
    )

    assignment_best_scores = []

    for mission_assignment in mission_assignments:
        best_assignment_submission = (
            db.query(models.Submission)
            .filter(
                models.Submission.student_id == submission.student_id,
                models.Submission.assignment_id == mission_assignment.id,
                models.Submission.score.isnot(None)
            )
            .order_by(
                models.Submission.score.desc()
            )
            .first()
        )

        assignment_best_score = (
            best_assignment_submission.score
            if best_assignment_submission
            else 0
        )

        assignment_best_scores.append(
            assignment_best_score
        )

    all_assignments_passed = (
        bool(mission_assignments)
        and all(
            assignment_score >= mission.passing_score
            for assignment_score in assignment_best_scores
        )
    )

    progress.completed = all_assignments_passed

    # The mission score represents overall performance across
    # all assignments, using each assignment's best attempt.
    if assignment_best_scores:
        progress.score = round(
            sum(assignment_best_scores) /
            len(assignment_best_scores)
        )
    else:
        progress.score = 0

    best_score = progress.score

    next_mission_unlocked = False

    # =====================================================
    # UNLOCK NEXT MISSION
    # =====================================================

    if progress.completed:

        next_mission = (
            db.query(models.Mission)
            .filter(
                models.Mission.course_id == mission.course_id,
                models.Mission.mission_number > mission.mission_number
            )
            .order_by(
                models.Mission.mission_number
            )
            .first()
        )

        if next_mission:

            next_progress = (
                db.query(models.Progress)
                .filter(
                    models.Progress.student_id == submission.student_id,
                    models.Progress.mission_id == next_mission.id
                )
                .first()
            )

            if not next_progress:

                next_progress = models.Progress(
                    student_id=submission.student_id,
                    mission_id=next_mission.id,
                    score=0,
                    completed=False,
                    unlocked=True
                )

                db.add(next_progress)

                next_mission_unlocked = True

            elif not next_progress.unlocked:

                next_progress.unlocked = True

                next_mission_unlocked = True

    # =====================================================
    # SAVE
    # =====================================================

    db.commit()

    db.refresh(submission)
    db.refresh(progress)

    return {
        "submission_id": submission.id,
        "student_id": submission.student_id,
        "assignment_id": submission.assignment_id,
        "mission_id": mission.id,

        "score": submission.score,

        "best_score": best_score,

        "passing_score": mission.passing_score,

        "feedback": submission.feedback,

        "passed": passed,

        "mission_completed": progress.completed,

        "next_mission_unlocked": next_mission_unlocked
    }