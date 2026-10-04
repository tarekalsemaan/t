from pydantic import BaseModel


# =========================================================
# COURSE
# =========================================================

class CourseCreate(BaseModel):
    title: str


# =========================================================
# MISSION
# =========================================================

class MissionCreate(BaseModel):
    title: str
    mission_number: int
    passing_score: int = 80
    course_id: int


# =========================================================
# STUDENT
# =========================================================

class StudentCreate(BaseModel):
    name: str
    email: str
    password: str
    course_id: int | None = None


# =========================================================
# SCORE
# =========================================================

class ScoreSubmit(BaseModel):
    score: int


# =========================================================
# LESSON
# =========================================================

class LessonCreate(BaseModel):
    title: str
    content: str
    lesson_number: int
    mission_id: int


# =========================================================
# ASSIGNMENT
# =========================================================

class AssignmentCreate(BaseModel):
    title: str
    instructions: str
    expected_answer: str = ""
    required_concepts: str = ""
    mission_id: int


# =========================================================
# SUBMISSION
# =========================================================

class SubmissionCreate(BaseModel):
    student_id: int
    assignment_id: int
    content: str


# =========================================================
# SUBMISSION EVALUATION
# =========================================================
#
# The score and feedback are optional because the backend
# evaluator calculates them from the student's submission.
#
# The client should NOT be trusted to provide the score.
# =========================================================

class SubmissionEvaluation(BaseModel):
    score: int | None = None
    feedback: str | None = None


# =========================================================
# AUTHENTICATION
# =========================================================

class ConnexionRequest(BaseModel):
    email: str
    password: str


class ConnexionResponse(BaseModel):
    access_token: str
    token_type: str
    role: str
    user_id: int
    student_id: int | None = None