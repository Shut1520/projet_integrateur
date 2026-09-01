"""
Dependency injection pour l'authentification JWT et le controle de role.

Utilisation dans les routes :
    from auth import get_utilisateur_connecte, exiger_admin

    @router.get("/protected")
    def ma_route(utilisateur: Utilisateur = Depends(get_utilisateur_connecte)):
        ...

    @router.get("/admin-only")
    def route_admin(utilisateur: Utilisateur = Depends(exiger_admin)):
        ...
"""

from datetime import datetime, timezone
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials, APIKeyHeader, APIKeyQuery
from sqlalchemy.orm import Session
from jose import JWTError, jwt

from database import get_db
from models.utilisateur import Utilisateur
from models.token import Token

# ─── Configuration JWT (doit etre identique a services/auth_service.py) ───
from config import JWT_SECRET_KEY
SECRET_KEY = JWT_SECRET_KEY
ALGORITHME = "HS256"

# HTTPBearer ajoute automatiquement le champ Authorization dans Swagger UI
security = HTTPBearer()
_scheme_iot = HTTPBearer(auto_error=False)
_security_api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)
_security_api_key_query = APIKeyQuery(name="api_key", auto_error=False)


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


def exiger_admin(
    utilisateur: Utilisateur = Depends(get_utilisateur_connecte),
) -> Utilisateur:
    """
    Depuis get_utilisateur_connecte, verifie que l'utilisateur a le role admin.
    Sinon leve une 403 Forbidden.
    """
    if not utilisateur.est_admin():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acces reserve aux administrateurs",
        )
    return utilisateur


# ─── Authentification par cle API (client IoT / ESP32) ───

def _valider_cle_api(cle_api: str, db: Session) -> Token:
    """
    Valide une cle API ('sk_sai_...') et retourne le Token associe.
    - Cle inconnue, inactive ou expiree → 401
    - Met a jour last_used_at a chaque utilisation.
    """
    token = db.query(Token).filter(Token.cle_api == cle_api).first()
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Cle API invalide",
        )

    if not token.actif:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Cle API revoquee",
        )

    # Verifier l'expiration en tolerant les dates naive (stockage local).
    if token.expires_at is not None:
        maintenant = datetime.now(timezone.utc).replace(tzinfo=None)
        if token.expires_at < maintenant:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Cle API expiree",
            )

    # Journaliser la derniere utilisation (sans bloquer sur une erreur).
    token.last_used_at = datetime.now()
    db.commit()
    return token


def get_client_cle_api(
    api_key_header: Annotated[str | None, Depends(_security_api_key_header)] = None,
    api_key_query: Annotated[str | None, Depends(_security_api_key_query)] = None,
    db: Session = Depends(get_db),
) -> Token:
    """
    Exige une cle API (header `X-API-Key` ou query `api_key`).
    Utilisee pour les endpoints dedies au client IoT (ex: POST /api/mesures).
    """
    cle_api = api_key_header or api_key_query
    if not cle_api:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Cle API requise (header X-API-Key)",
        )
    return _valider_cle_api(cle_api, db)


def get_client_iot(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_scheme_iot)] = None,
    api_key_header: Annotated[str | None, Depends(_security_api_key_header)] = None,
    api_key_query: Annotated[str | None, Depends(_security_api_key_query)] = None,
    db: Session = Depends(get_db),
) -> Utilisateur | Token:
    """
    Authentification 'ou' : cle API (client IoT) OU JWT (web/CLI).
    Retourne un Token si la cle API est fournie, sinon un Utilisateur.
    Utilisee pour les endpoints partages (commandes, actions).
    """
    cle_api = api_key_header or api_key_query
    if cle_api:
        return _valider_cle_api(cle_api, db)

    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentification requise (Bearer JWT ou cle API)",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHME])
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
