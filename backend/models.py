from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Boolean,
    ForeignKey
)

from sqlalchemy.orm import relationship

from backend.database import Base


# =========================================================
# STUDENT
# =========================================================

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)


# =========================================================
# COURSE
# =========================================================

class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)


# =========================================================
# MISSION
# =========================================================

class Mission(Base):
    __tablename__ = "missions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    mission_number = Column(Integer, nullable=False)
    passing_score = Column(Integer, default=80)

    course_id = Column(
        Integer,
        ForeignKey("courses.id"),
        nullable=False
    )

    course = relationship("Course")


# =========================================================
# STUDENT PROGRESS
# =========================================================

class Progress(Base):
    __tablename__ = "progress"

    id = Column(Integer, primary_key=True, index=True)

    student_id = Column(
        Integer,
        ForeignKey("students.id"),
        nullable=False
    )

    mission_id = Column(
        Integer,
        ForeignKey("missions.id"),
        nullable=False
    )

    score = Column(Integer, default=0)
    completed = Column(Boolean, default=False)
    unlocked = Column(Boolean, default=False)

    student = relationship("Student")
    mission = relationship("Mission")


# =========================================================
# LESSON
# =========================================================

class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    lesson_number = Column(Integer, nullable=False)

    mission_id = Column(
        Integer,
        ForeignKey("missions.id"),
        nullable=False
    )

    mission = relationship("Mission")

    media_links = relationship(
        "LessonMedia",
        back_populates="lesson",
        cascade="all, delete-orphan"
    )


# =========================================================
# MEDIA / GALLERY
# =========================================================

class Media(Base):
    __tablename__ = "media"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    # Display name shown to administrators and students
    title = Column(
        String,
        nullable=False
    )

    # Original uploaded filename
    filename = Column(
        String,
        nullable=False
    )

    # File stored on the server
    file_path = Column(
        String,
        nullable=False
    )

    # Examples:
    # powerpoint
    # video
    # pdf
    # image
    # document
    media_type = Column(
        String,
        nullable=False
    )

    # MIME type, for example:
    # application/vnd.openxmlformats-officedocument.presentationml.presentation
    # video/mp4
    # application/pdf
    mime_type = Column(
        String,
        nullable=False
    )

    # Optional description
    description = Column(
        Text,
        nullable=True
    )

    # Active media can be displayed in the LMS
    active = Column(
        Boolean,
        default=True,
        nullable=False
    )

    lesson_links = relationship(
        "LessonMedia",
        back_populates="media",
        cascade="all, delete-orphan"
    )


# =========================================================
# LESSON ↔ MEDIA
# =========================================================

class LessonMedia(Base):
    __tablename__ = "lesson_media"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    lesson_id = Column(
        Integer,
        ForeignKey("lessons.id"),
        nullable=False
    )

    media_id = Column(
        Integer,
        ForeignKey("media.id"),
        nullable=False
    )

    # Controls the order in which media appears
    display_order = Column(
        Integer,
        default=0,
        nullable=False
    )

    lesson = relationship(
        "Lesson",
        back_populates="media_links"
    )

    media = relationship(
        "Media",
        back_populates="lesson_links"
    )


# =========================================================
# ASSIGNMENT
# =========================================================

class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    instructions = Column(Text, nullable=False)

    # Reference answer entered by the administrator.
    # This is never exposed through the student endpoint.
    expected_answer = Column(
        Text,
        nullable=False,
        default=""
    )

    # Concepts that must appear in a correct answer.
    # They allow the generic evaluator to grade new
    # assignments without hard-coding each mission.
    required_concepts = Column(
        Text,
        nullable=False,
        default=""
    )

    mission_id = Column(
        Integer,
        ForeignKey("missions.id"),
        nullable=False
    )

    mission = relationship("Mission")


# =========================================================
# SUBMISSION
# =========================================================

class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True)

    student_id = Column(
        Integer,
        ForeignKey("students.id"),
        nullable=False
    )

    assignment_id = Column(
        Integer,
        ForeignKey("assignments.id"),
        nullable=False
    )

    # Student's submitted answer/code
    content = Column(
        Text,
        nullable=False
    )

    # None means it has not been evaluated yet
    score = Column(
        Integer,
        nullable=True
    )

    # Optional teacher/automatic evaluation feedback
    feedback = Column(
        Text,
        nullable=True
    )

    student = relationship("Student")
    assignment = relationship("Assignment")


# =========================================================
# USER / AUTHENTICATION
# =========================================================

class User(Base):
    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    email = Column(
        String,
        unique=True,
        nullable=False,
        index=True
    )

    password_hash = Column(
        String,
        nullable=False
    )

    role = Column(
        String,
        nullable=False
    )

    student_id = Column(
        Integer,
        ForeignKey("students.id"),
        nullable=True
    )
