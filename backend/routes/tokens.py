"""
Routes API pour les Tokens (cles API CLI).

Les tokens permettent au CLI de s'authentifier sans mot de passe.
La cle_api n'est montree QU'UNE SEULE FOIS a la creation.
"""

import secrets

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from database import get_db
from models.token import Token
from models.utilisateur import Utilisateur
from schemas.token import TokenCreate, TokenUpdate, TokenResponse, TokenResponseWithKey
from auth import exiger_admin
from config import RATE_LIMIT_ECRITURES
from services.rate_limit import limiter

router = APIRouter(prefix="/api/tokens", tags=["Tokens"])


def _generer_cle_api() -> str:
    """Genere une cle API securisee (format: sk_sai_xxxx)."""
    return "sk_sai_" + secrets.token_hex(32)


def _get_ou_404(db: Session, id: int) -> Token:
    """Recupere un token par son ID ou lève une 404."""
    token = db.get(Token, id)
    if not token:
        raise HTTPException(status_code=404, detail=f"Token id={id} introuvable")
    return token


@router.get("", response_model=list[TokenResponse])
def lister_tokens(
    utilisateur_id: int | None = None,
    db: Session = Depends(get_db),
    utilisateur: Utilisateur = Depends(exiger_admin),
):
    """Liste les tokens. Peut filtrer par utilisateur."""
    query = db.query(Token)
    if utilisateur_id is not None:
        query = query.filter(Token.id_utilisateur == utilisateur_id)
    return query.all()


@router.get("/{id}", response_model=TokenResponse)
def lire_token(
    id: int,
    db: Session = Depends(get_db),
    utilisateur: Utilisateur = Depends(exiger_admin),
):
    """Detail d'un token (sans la cle_api)."""
    return _get_ou_404(db, id)


@router.post("", response_model=TokenResponseWithKey, status_code=201)
@limiter.limit(RATE_LIMIT_ECRITURES)
def creer_token(
    request: Request,
    data: TokenCreate,
    db: Session = Depends(get_db),
    utilisateur: Utilisateur = Depends(exiger_admin),
):
    """
    Cree un nouveau token.

    La cle_api est generee automatiquement et n'est montree
    QU'UNE SEULE FOIS dans la reponse.
    Conservez-la precieusement.
    """
    # Generer une cle unique
    cle_api = _generer_cle_api()

    token = Token(
        cle_api=cle_api,
        nom=data.nom,
        actif=data.actif,
        expires_at=data.expires_at,
        id_utilisateur=data.id_utilisateur,
    )
    db.add(token)
    db.commit()
    db.refresh(token)
    return token


@router.put("/{id}", response_model=TokenResponse)
@limiter.limit(RATE_LIMIT_ECRITURES)
def modifier_token(
    request: Request,
    id: int,
    data: TokenUpdate,
    db: Session = Depends(get_db),
    utilisateur: Utilisateur = Depends(exiger_admin),
):
    """
    Modifie un token (renommer, revoquer).
    On ne peut PAS recuperer la cle_api apres la creation.
    """
    token = _get_ou_404(db, id)
    for champ, valeur in data.model_dump(exclude_unset=True).items():
        setattr(token, champ, valeur)
    db.commit()
    db.refresh(token)
    return token


@router.delete("/{id}", status_code=204)
@limiter.limit(RATE_LIMIT_ECRITURES)
def supprimer_token(
    request: Request,
    id: int,
    db: Session = Depends(get_db),
    utilisateur: Utilisateur = Depends(exiger_admin),
):
    """Supprime/revoque un token."""
    token = _get_ou_404(db, id)
    db.delete(token)
    db.commit()
    return None
