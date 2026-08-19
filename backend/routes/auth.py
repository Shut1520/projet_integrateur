"""
Routes API pour l'authentification.

- POST /api/auth/register  → Creer un compte
- POST /api/auth/login     → Se connecter (recuperer un JWT)
- GET  /api/auth/me        → Profil de l'utilisateur connecte
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models.utilisateur import Utilisateur
from schemas.utilisateur import UtilisateurCreate, UtilisateurResponse
from pydantic import BaseModel, EmailStr
from auth import get_utilisateur_connecte
from services.auth_service import inscrire, connecter


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


router = APIRouter(prefix="/api/auth", tags=["Authentification"])


# ====================================================================
#  POST /api/auth/register
# ====================================================================
@router.post("/register", response_model=UtilisateurResponse, status_code=201)
def register(data: UtilisateurCreate, db: Session = Depends(get_db)):
    """
    Cree un nouveau compte utilisateur et retourne le profil.
    """
    return inscrire(db, data.nom, data.email, data.password, data.role)


# ====================================================================
#  POST /api/auth/login
# ====================================================================
@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    """
    Authentifie un utilisateur et retourne un token JWT.
    """
    return connecter(db, data.email, data.password)


# ====================================================================
#  GET /api/auth/me
# ====================================================================
@router.get("/me", response_model=UtilisateurResponse)
def profil_utilisateur(
    utilisateur: Utilisateur = Depends(get_utilisateur_connecte),
):
    """
    Retourne le profil de l'utilisateur connecte.
    Necessite un token JWT dans l'en-tete Authorization: Bearer <token>
    """
    return utilisateur
