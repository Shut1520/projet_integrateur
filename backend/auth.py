"""
Dependency injection pour l'authentification JWT.

Utilisation dans les routes :
    from auth import get_utilisateur_connecte

    @router.get("/protected")
    def ma_route(utilisateur: Utilisateur = Depends(get_utilisateur_connecte)):
        ...
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import JWTError, jwt

from database import get_db
from models.utilisateur import Utilisateur

# ─── Configuration JWT (doit etre identique a services/auth_service.py) ───
from config import JWT_SECRET_KEY
SECRET_KEY = JWT_SECRET_KEY
ALGORITHME = "HS256"

# HTTPBearer ajoute automatiquement le champ Authorization dans Swagger UI
security = HTTPBearer()


def get_utilisateur_connecte(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> Utilisateur:
    """
    Extrait le token JWT du header Authorization et retourne l'utilisateur.

    - Le header doit etre : Authorization: Bearer <token>
    - Si le token est invalide ou expire, leve une 401
    - Si l'utilisateur n'existe plus, leve une 401
    - Sinon retourne l'objet Utilisateur SQLAlchemy
    """
    token = credentials.credentials

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHME])
        utilisateur_id = int(payload.get("sub"))
    except (JWTError, ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide ou expire",
            headers={"WWW-Authenticate": "Bearer"},
        )

    utilisateur = db.get(Utilisateur, utilisateur_id)
    if not utilisateur:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Utilisateur introuvable",
        )

    return utilisateur
