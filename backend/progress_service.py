from sqlalchemy.orm import Session

from backend import models


# =========================================================
# RECALCULATE MISSION PROGRESS
# =========================================================

def recalculate_mission_progress(
    db: Session,
    student_id: int,
    mission_id: int
):
    """
    Recalculate a student's progress for one mission.

    Rules:
    - Every assignment in the mission must be passed.
    - The best evaluated attempt is used for each assignment.
    - An unattempted assignment has a score of 0.
    - Mission score = average of the best assignment scores.
    - Mission is completed only when every assignment reaches
      the mission passing score.
    """

    mission = (
        db.query(models.Mission)
        .filter(models.Mission.id == mission_id)
        .first()
    )

    if not mission:
        return None

    progress = (
        db.query(models.Progress)
        .filter(
            models.Progress.student_id == student_id,
            models.Progress.mission_id == mission_id
        )
        .first()
    )

    if not progress:
        return None

    assignments = (
        db.query(models.Assignment)
        .filter(models.Assignment.mission_id == mission_id)
        .all()
    )

    # A mission without assignments cannot be completed.
    if not assignments:
        progress.score = 0
        progress.completed = False

        return progress

    best_scores = []

    for assignment in assignments:

        best_submission = (
            db.query(models.Submission)
            .filter(
                models.Submission.student_id == student_id,
                models.Submission.assignment_id == assignment.id,
                models.Submission.score.isnot(None)
            )
            .order_by(
                models.Submission.score.desc()
            )
            .first()
        )

        if best_submission:
            best_scores.append(best_submission.score)
        else:
            best_scores.append(0)

    progress.score = round(
        sum(best_scores) / len(best_scores)
    )

    progress.completed = all(
        score >= mission.passing_score
        for score in best_scores
    )

    return progress


# =========================================================
# RECALCULATE ALL STUDENTS FOR A MISSION
# =========================================================

def recalculate_all_mission_progress(
    db: Session,
    mission_id: int
):
    """
    Recalculate every existing student progress record
    for a mission.

    Used when an administrator changes the assignments
    belonging to a mission.
    """

    progresses = (
        db.query(models.Progress)
        .filter(models.Progress.mission_id == mission_id)
        .all()
    )

    for progress in progresses:
        recalculate_mission_progress(
            db=db,
            student_id=progress.student_id,
            mission_id=mission_id
        )