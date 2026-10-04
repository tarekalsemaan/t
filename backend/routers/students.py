from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database import SessionLocal
from backend import models
from backend.schemas import StudentCreate, ScoreSubmit
from backend.auth import require_admin, get_current_user, hash_password


router = APIRouter(
    prefix="/students",
    tags=["Students"]
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
# CREATE STUDENT
# ADMIN ONLY
# =========================================================

@router.post("")
def create_student(
    student: StudentCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    email = student.email.strip().lower()
    if db.query(models.Student).filter(models.Student.email == email).first() or db.query(models.User).filter(models.User.email == email).first():
        raise HTTPException(status_code=409, detail="Email already exists")
    if len(student.password) < 8:
        raise HTTPException(status_code=400, detail="Password must contain at least 8 characters")

    new_student = models.Student(name=student.name.strip(), email=email)
    db.add(new_student)
    db.flush()
    db.add(models.User(email=email, password_hash=hash_password(student.password), role="STUDENT", student_id=new_student.id))

    if student.course_id is not None:
        missions = db.query(models.Mission).filter(models.Mission.course_id == student.course_id).order_by(models.Mission.mission_number).all()
        for index, mission in enumerate(missions):
            db.add(models.Progress(student_id=new_student.id, mission_id=mission.id, score=0, completed=False, unlocked=(index == 0)))

    db.commit()
    db.refresh(new_student)
    return {"id": new_student.id, "name": new_student.name, "email": new_student.email}


# =========================================================
# GET ALL STUDENTS
# ADMIN ONLY
# =========================================================

@router.get("")
def get_students(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    students = (
        db.query(models.Student)
        .order_by(models.Student.id)
        .all()
    )

    return {
        "students": [
            {
                "id": student.id,
                "name": student.name,
                "email": student.email
            }
            for student in students
        ]
    }


# =========================================================
# GET CURRENT STUDENT PROFILE
# STUDENT ONLY
# =========================================================

@router.get("/{student_id}")
def get_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    require_student_access(
        student_id,
        current_user
    )

    student = (
        db.query(models.Student)
        .filter(models.Student.id == student_id)
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )

    return {
        "id": student.id,
        "name": student.name,
        "email": student.email
    }


# =========================================================
# START COURSE
# STUDENT ONLY
# =========================================================

@router.post("/{student_id}/courses/{course_id}/start")
def start_course(
    student_id: int,
    course_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    require_student_access(
        student_id,
        current_user
    )

    missions = (
        db.query(models.Mission)
        .filter(models.Mission.course_id == course_id)
        .order_by(models.Mission.mission_number)
        .all()
    )

    progress_created = []

    for index, mission in enumerate(missions):

        existing_progress = (
            db.query(models.Progress)
            .filter(
                models.Progress.student_id == student_id,
                models.Progress.mission_id == mission.id
            )
            .first()
        )

        if existing_progress:
            continue

        progress = models.Progress(
            student_id=student_id,
            mission_id=mission.id,
            score=0,
            completed=False,
            unlocked=(index == 0)
        )

        db.add(progress)

        progress_created.append(
            mission.id
        )

    db.commit()

    return {
        "student_id": student_id,
        "course_id": course_id,
        "progress_created_for_missions": progress_created
    }


# =========================================================
# SUBMIT MISSION SCORE
# STUDENT ONLY
# =========================================================

@router.post("/{student_id}/missions/{mission_id}/score")
def submit_score(
    student_id: int,
    mission_id: int,
    result: ScoreSubmit,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    require_student_access(
        student_id,
        current_user
    )

    # -----------------------------------------------------
    # Validate score
    # -----------------------------------------------------

    if result.score < 0 or result.score > 100:
        return {
            "error":
                "Score must be between 0 and 100"
        }

    # -----------------------------------------------------
    # Find mission
    # -----------------------------------------------------

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

    # -----------------------------------------------------
    # Find progress
    # -----------------------------------------------------

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
            "error":
                "Student has not started this mission"
        }

    # -----------------------------------------------------
    # Mission must be unlocked
    # -----------------------------------------------------

    if not progress.unlocked:
        return {
            "error": "Mission is locked"
        }

    # -----------------------------------------------------
    # Save score
    # -----------------------------------------------------

    progress.score = result.score

    passed = (
        result.score >= mission.passing_score
    )

    # -----------------------------------------------------
    # Mission passed
    # -----------------------------------------------------

    if passed:

        progress.completed = True

        # Find the next mission by order.
        #
        # We use > instead of mission_number + 1 so the
        # platform still works if mission numbers are not
        # perfectly consecutive.

        next_mission = (
            db.query(models.Mission)
            .filter(
                models.Mission.course_id
                == mission.course_id,

                models.Mission.mission_number
                > mission.mission_number
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
                    models.Progress.student_id
                    == student_id,

                    models.Progress.mission_id
                    == next_mission.id
                )
                .first()
            )

            # If this mission was added after the student
            # started the course, create its progress now.

            if not next_progress:

                next_progress = models.Progress(
                    student_id=student_id,
                    mission_id=next_mission.id,
                    score=0,
                    completed=False,
                    unlocked=True
                )

                db.add(next_progress)

            else:

                next_progress.unlocked = True

    db.commit()

    return {
        "student_id": student_id,
        "mission_id": mission_id,
        "mission": mission.title,
        "score": result.score,
        "passing_score":
            mission.passing_score,
        "passed": passed,
        "next_mission_unlocked":
            passed
    }


# =========================================================
# GET STUDENT COURSE PROGRESS
# STUDENT ONLY
# =========================================================

@router.get("/{student_id}/courses/{course_id}/progress")
def get_course_progress(
    student_id: int,
    course_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    require_student_access(
        student_id,
        current_user
    )

    # -----------------------------------------------------
    # Find student
    # -----------------------------------------------------

    student = (
        db.query(models.Student)
        .filter(
            models.Student.id == student_id
        )
        .first()
    )

    if not student:
        return {
            "error": "Student not found"
        }

    # -----------------------------------------------------
    # Get all missions
    # -----------------------------------------------------

    missions = (
        db.query(models.Mission)
        .filter(
            models.Mission.course_id == course_id
        )
        .order_by(
            models.Mission.mission_number
        )
        .all()
    )

    # =====================================================
    # SYNCHRONIZE MISSING PROGRESS
    # =====================================================

    previous_completed = True

    for index, mission in enumerate(missions):

        progress = (
            db.query(models.Progress)
            .filter(
                models.Progress.student_id
                == student_id,

                models.Progress.mission_id
                == mission.id
            )
            .first()
        )

        # -------------------------------------------------
        # Create missing progress
        # -------------------------------------------------

        if not progress:

            # First mission is always unlocked.
            #
            # Other missions are unlocked only if the
            # previous mission has been completed.

            should_unlock = (
                index == 0
                or previous_completed
            )

            progress = models.Progress(
                student_id=student_id,
                mission_id=mission.id,
                score=0,
                completed=False,
                unlocked=should_unlock
            )

            db.add(progress)

            db.flush()

        # -------------------------------------------------
        # Keep unlocking consistent
        # -------------------------------------------------

        if index == 0:

            progress.unlocked = True

        elif previous_completed:

            progress.unlocked = True

        previous_completed = (
            progress.completed
        )

    db.commit()

    # =====================================================
    # BUILD PROGRESS RESPONSE
    # =====================================================

    results = []

    for mission in missions:

        progress = (
            db.query(models.Progress)
            .filter(
                models.Progress.student_id
                == student_id,

                models.Progress.mission_id
                == mission.id
            )
            .first()
        )

        if progress:

            results.append({

                "mission_id":
                    mission.id,

                "mission_number":
                    mission.mission_number,

                "title":
                    mission.title,

                "score":
                    progress.score,

                "passing_score":
                    mission.passing_score,

                "completed":
                    progress.completed,

                "unlocked":
                    progress.unlocked
            })

    return {
        "student_id":
            student.id,

        "student":
            student.name,

        "course_id":
            course_id,

        "missions":
            results
    }