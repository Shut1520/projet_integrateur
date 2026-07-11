"""
Routes API pour l'authentification.

- POST /api/auth/register  → Creer un compte
- POST /api/auth/login     → Se connecter (recuperer un JWT)
- GET  /api/auth/me        → Profil de l'utilisateur connecte
"""

from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from passlib.context import CryptContext

from database import get_db
from models.utilisateur import Utilisateur
from schemas.utilisateur import UtilisateurCreate, UtilisateurResponse

# ─── Configuration JWT ───
SECRET_KEY = "sai_secret_key_changez_en_production"  # TODO: mettre dans .env
ALGORITHME = "HS256"
DUREE_TOKEN = 24  # heures

# ─── Contexte de hashage ───
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

router = APIRouter(prefix="/api/auth", tags=["Authentification"])


def _creer_token(utilisateur_id: int) -> str:
    """Cree un token JWT pour un utilisateur."""
    expiration = datetime.now(timezone.utc) + timedelta(hours=DUREE_TOKEN)
    payload = {
        "sub": str(utilisateur_id),
        "exp": expiration,
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHME)


def _get_utilisateur_par_token(token: str, db: Session) -> Utilisateur:
    """
    Decode un JWT et retourne l'utilisateur correspondant.
    Leve HTTPException 401 si le token est invalide ou expire.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHME])
        utilisateur_id = int(payload.get("sub"))
    except (JWTError, ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide ou expire",
            headers={"WWW-Authenticate": "Bearer"},
        )

    utilisateur = db.query(Utilisateur).get(utilisateur_id)
    if not utilisateur:
        raise HTTPException(status_code=401, detail="Utilisateur introuvable")
    return utilisateur


# ====================================================================
#  POST /api/auth/register
# ====================================================================
@router.post("/register", response_model=UtilisateurResponse, status_code=201)
def register(data: UtilisateurCreate, db: Session = Depends(get_db)):
    """
    Cree un nouveau compte utilisateur et retourne le profil.
    """
    # Verifier email unique
    existant = db.query(Utilisateur).filter(Utilisateur.email == data.email).first()
    if existant:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"L'email '{data.email}' est deja utilise",
        )

    utilisateur = Utilisateur(
        nom=data.nom,
        email=data.email,
        role=data.role,
        password_hash=pwd_context.hash(data.password),
    )
    db.add(utilisateur)
    db.commit()
    db.refresh(utilisateur)
    return utilisateur


# ====================================================================
#  POST /api/auth/login
# ====================================================================
@router.post("/login")
def login(
    email: str,
    password: str,
    db: Session = Depends(get_db),
):
    """
    Authentifie un utilisateur et retourne un token JWT.

    Envoyer:
    {
        "email": "user@example.com",
        "password": "monMot2Passe"
    }

    Retourne:
    {
        "access_token": "eyJhbGciOiJIUzI1NiIs...",
        "token_type": "bearer",
        "expires_in": 24,
        "utilisateur": { ... }
    }
    """
    # Chercher l'utilisateur par email
    utilisateur = db.query(Utilisateur).filter(Utilisateur.email == email).first()
    if not utilisateur:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect",
        )

    # Verifier le mot de passe
    if not pwd_context.verify(password, utilisateur.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect",
        )

    # Creer le token JWT
    access_token = _creer_token(utilisateur.id)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": DUREE_TOKEN,
        "utilisateur": UtilisateurResponse.model_validate(utilisateur).model_dump(),
    }


# ====================================================================
#  GET /api/auth/me
# ====================================================================
@router.get("/me", response_model=UtilisateurResponse)
def profil_utilisateur(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    """
    Retourne le profil de l'utilisateur connecte.
    Necessite un token JWT dans l'en-tete Authorization: Bearer <token>
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token manquant",
        )

    token = authorization.split(" ")[1]
    return _get_utilisateur_par_token(token, db)
