from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import SessionLocal
from backend import models
from backend.schemas import ConnexionRequest, ConnexionResponse
from backend.auth import verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/Connexion", response_model=ConnexionResponse)
def Connexion(credentials: ConnexionRequest, db: Session = Depends(get_db)):
    email = credentials.email.strip().lower()
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    token_data = {"sub": str(user.id), "role": user.role}
    if user.student_id is not None:
        token_data["student_id"] = str(user.student_id)
    return {
        "access_token": create_access_token(token_data),
        "token_type": "bearer",
        "role": user.role,
        "user_id": user.id,
        "student_id": user.student_id,
    }
