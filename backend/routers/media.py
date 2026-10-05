from pathlib import Path
from uuid import uuid4

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
)
from sqlalchemy.orm import Session

from backend.database import SessionLocal
from backend import models
from backend.auth import require_admin


router = APIRouter(
    prefix="/media",
    tags=["Media"]
)


# =========================================================
# CONFIGURATION
# =========================================================

MEDIA_DIRECTORY = Path("/data/media")

ALLOWED_EXTENSIONS = {
    ".pptx": "powerpoint",
    ".mp4": "video",
    ".webm": "video",
    ".pdf": "pdf",
    ".png": "image",
    ".jpg": "image",
    ".jpeg": "image",
    ".gif": "image",
    ".webp": "image",
    ".docx": "document",
    ".txt": "document",
}


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
# UPLOAD MEDIA
# ADMIN ONLY
# =========================================================

@router.post("/upload")
async def upload_media(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No file selected."
        )

    original_filename = Path(file.filename).name
    extension = Path(original_filename).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=(
                "Unsupported file type. "
                "Allowed: PPTX, MP4, WEBM, PDF, "
                "PNG, JPG, JPEG, GIF, WEBP, DOCX and TXT."
            )
        )

    media_type = ALLOWED_EXTENSIONS[extension]

    MEDIA_DIRECTORY.mkdir(
        parents=True,
        exist_ok=True
    )

    stored_filename = (
        f"{uuid4().hex}{extension}"
    )

    file_path = MEDIA_DIRECTORY / stored_filename

    try:
        with file_path.open("wb") as destination:
            while True:
                chunk = await file.read(1024 * 1024)

                if not chunk:
                    break

                destination.write(chunk)

    except Exception as exc:
        if file_path.exists():
            file_path.unlink()

        raise HTTPException(
            status_code=500,
            detail=f"Unable to save file: {exc}"
        )

    media = models.Media(
        title=Path(original_filename).stem,
        filename=original_filename,
        file_path=str(file_path),
        media_type=media_type,
        mime_type=file.content_type or "application/octet-stream",
        description=None,
        active=True
    )

    db.add(media)
    db.commit()
    db.refresh(media)

    return {
        "id": media.id,
        "title": media.title,
        "filename": media.filename,
        "media_type": media.media_type,
        "mime_type": media.mime_type,
        "url": f"/media/{stored_filename}",
        "active": media.active
    }


# =========================================================
# GET MEDIA GALLERY
# ADMIN ONLY
# =========================================================

@router.get("")
def get_media(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    media_items = (
        db.query(models.Media)
        .order_by(models.Media.id.desc())
        .all()
    )

    return {
        "media": [
            {
                "id": media.id,
                "title": media.title,
                "filename": media.filename,
                "media_type": media.media_type,
                "mime_type": media.mime_type,
                "description": media.description,
                "url": (
                    f"/media/"
                    f"{Path(media.file_path).name}"
                ),
                "active": media.active
            }
            for media in media_items
        ]
    }


# =========================================================
# ATTACH MEDIA TO LESSON
# ADMIN ONLY
# =========================================================

@router.post("/{media_id}/lessons/{lesson_id}")
def attach_media_to_lesson(
    media_id: int,
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    media = (
        db.query(models.Media)
        .filter(models.Media.id == media_id)
        .first()
    )

    if not media:
        raise HTTPException(
            status_code=404,
            detail="Media not found."
        )

    lesson = (
        db.query(models.Lesson)
        .filter(models.Lesson.id == lesson_id)
        .first()
    )

    if not lesson:
        raise HTTPException(
            status_code=404,
            detail="Lesson not found."
        )

    existing_link = (
        db.query(models.LessonMedia)
        .filter(
            models.LessonMedia.lesson_id == lesson_id,
            models.LessonMedia.media_id == media_id
        )
        .first()
    )

    if existing_link:
        return {
            "message": "Media is already attached to this lesson.",
            "lesson_id": lesson_id,
            "media_id": media_id
        }

    current_count = (
        db.query(models.LessonMedia)
        .filter(
            models.LessonMedia.lesson_id == lesson_id
        )
        .count()
    )

    lesson_media = models.LessonMedia(
        lesson_id=lesson_id,
        media_id=media_id,
        display_order=current_count
    )

    db.add(lesson_media)
    db.commit()
    db.refresh(lesson_media)

    return {
        "message": "Media attached to lesson successfully.",
        "lesson_id": lesson_id,
        "media_id": media_id,
        "display_order": lesson_media.display_order
    }


# =========================================================
# GET MEDIA ATTACHED TO A LESSON
# ADMIN ONLY
# =========================================================

@router.get("/lesson/{lesson_id}")
def get_lesson_media(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    lesson = (
        db.query(models.Lesson)
        .filter(models.Lesson.id == lesson_id)
        .first()
    )

    if not lesson:
        raise HTTPException(
            status_code=404,
            detail="Lesson not found."
        )

    links = (
        db.query(models.LessonMedia)
        .filter(
            models.LessonMedia.lesson_id == lesson_id
        )
        .order_by(
            models.LessonMedia.display_order
        )
        .all()
    )

    return {
        "lesson_id": lesson_id,
        "media": [
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
            for link in links
            if link.media.active
        ]
    }


# =========================================================
# DELETE MEDIA
# ADMIN ONLY
# =========================================================

@router.delete("/{media_id}")
def delete_media(
    media_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    media = (
        db.query(models.Media)
        .filter(models.Media.id == media_id)
        .first()
    )

    if not media:
        raise HTTPException(
            status_code=404,
            detail="Media not found."
        )

    file_path = Path(media.file_path)

    if file_path.exists():
        file_path.unlink()

    db.delete(media)
    db.commit()

    return {
        "message": "Media deleted successfully",
        "id": media_id
    }
