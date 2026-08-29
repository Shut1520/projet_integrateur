"""
Service d'authentification.

Logique metier :
- Inscription (register)
- Connexion (login) + generation JWT
- Gestion des tokens API (cles pour le CLI)
"""

from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session
from jose import jwt
from werkzeug.security import generate_password_hash, check_password_hash

from models.utilisateur import Utilisateur

# ─── Configuration JWT ───
from config import JWT_SECRET_KEY
SECRET_KEY = JWT_SECRET_KEY
ALGORITHME = "HS256"
DUREE_TOKEN = 24  # heures


def creer_token(utilisateur_id: int) -> str:
    """Cree un token JWT pour un utilisateur."""
    expiration = datetime.now(timezone.utc) + timedelta(hours=DUREE_TOKEN)
    payload = {
        "sub": str(utilisateur_id),
        "exp": expiration,
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHME)


def inscrire(db: Session, nom: str, email: str, password: str, role: str) -> Utilisateur:
    """
    Inscrit un nouvel utilisateur.
    Leve une exception si l'email est deja utilise.
    """
    from fastapi import HTTPException, status

    existant = db.query(Utilisateur).filter(Utilisateur.email == email).first()
    if existant:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"L'email '{email}' est deja utilise",
        )

    utilisateur = Utilisateur(
        nom=nom,
        email=email,
        role=role,
        password_hash=generate_password_hash(password),
    )
    db.add(utilisateur)
    db.commit()
    db.refresh(utilisateur)
    return utilisateur


def connecter(db: Session, email: str, password: str) -> dict:
    """
    Authentifie un utilisateur et retourne un token JWT.
    Leve une exception si les identifiants sont incorrects.
    """
    from fastapi import HTTPException, status

    utilisateur = db.query(Utilisateur).filter(Utilisateur.email == email).first()
    if not utilisateur:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect",
        )

    if not check_password_hash(utilisateur.password_hash, password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect",
        )

    # Vérifier si le compte est actif
    if not utilisateur.actif:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Votre compte a été désactivé. Contactez un administrateur.",
        )

    access_token = creer_token(utilisateur.id)

    from schemas.utilisateur import UtilisateurResponse
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": DUREE_TOKEN,
        "utilisateur": UtilisateurResponse.model_validate(utilisateur).model_dump(),
    }
