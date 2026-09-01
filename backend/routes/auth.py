"""
Routes API pour l'authentification.

- POST /api/auth/register  → Creer un compte
- POST /api/auth/login     → Se connecter (recuperer un JWT)
- GET  /api/auth/me        → Profil de l'utilisateur connecte
"""

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from database import get_db
from models.utilisateur import Utilisateur
from schemas.utilisateur import UtilisateurCreate, UtilisateurResponse
from pydantic import BaseModel, EmailStr
from auth import get_utilisateur_connecte
from services.auth_service import inscrire, connecter
from config import RATE_LIMIT_ECRITURES
from services.rate_limit import limiter


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


router = APIRouter(prefix="/api/auth", tags=["Authentification"])


# ====================================================================
#  POST /api/auth/register
# ====================================================================
@router.post("/register", response_model=UtilisateurResponse, status_code=201)
@limiter.limit(RATE_LIMIT_ECRITURES)
def register(request: Request, data: UtilisateurCreate, db: Session = Depends(get_db)):
    """
    Cree un nouveau compte utilisateur et retourne le profil.
    Rate limitee (defaut 20/min) pour limiter la creation massive de comptes.
    """
    return inscrire(db, data.nom, data.email, data.password, data.role)


# ====================================================================
#  POST /api/auth/login
# ====================================================================
@router.post("/login")
@limiter.limit(RATE_LIMIT_ECRITURES)
def login(request: Request, data: LoginRequest, db: Session = Depends(get_db)):
    """
    Authentifie un utilisateur et retourne un token JWT.
    Rate limitee (defaut 20/min) contre les attaques force brute.
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
