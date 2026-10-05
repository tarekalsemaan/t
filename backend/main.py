import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles

from backend.database import Base, engine
from backend import auth_router
from backend.routers import (
    courses,
    missions,
    students,
    lessons,
    assignments,
    submissions,
    media,
)


# =========================================================
# DATABASE
# =========================================================

Base.metadata.create_all(bind=engine)


# =========================================================
# APPLICATION
# =========================================================

app = FastAPI(
    title="MissionLMS API",
    description="Backend API for MissionLMS",
    version="1.0.0",
)


# =========================================================
# CORS
# =========================================================

origins = [
    x.strip()
    for x in os.getenv(
        "CORS_ORIGINS",
        "http://127.0.0.1:5500,http://localhost:5500",
    ).split(",")
    if x.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# API ROUTERS
# =========================================================

app.include_router(courses.router)
app.include_router(missions.router)
app.include_router(students.router)
app.include_router(lessons.router)
app.include_router(assignments.router)
app.include_router(submissions.router)
app.include_router(media.router)
app.include_router(auth_router.router)


# =========================================================
# HEALTH
# =========================================================

@app.get("/health", tags=["Home"])
def health():
    return {
        "platform": "MissionLMS",
        "status": "running",
    }


# =========================================================
# FRONTEND
# =========================================================

frontend = Path(__file__).resolve().parent.parent / "frontend"

if frontend.exists():
    app.mount(
        "/app",
        StaticFiles(
            directory=str(frontend),
            html=True,
        ),
        name="frontend",
    )


# =========================================================
# MEDIA STORAGE
# =========================================================

media_directory = Path("/data/media")

media_directory.mkdir(
    parents=True,
    exist_ok=True
)

app.mount(
    "/media",
    StaticFiles(
        directory=str(media_directory)
    ),
    name="media",
)


# =========================================================
# HOME
# =========================================================

@app.get("/", include_in_schema=False)
def home():
    return RedirectResponse(
        url="/app/login.html"
    )
