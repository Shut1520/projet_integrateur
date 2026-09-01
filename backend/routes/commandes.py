"""
Routes API pour l'entite Commande.

Represente un ordre envoye a un actionneur.
Peut provenir du web, du CLI ou de l'automatisation.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from database import get_db
from models.commande import Commande
from models.utilisateur import Utilisateur
from models.token import Token
from schemas.commande import CommandeCreate, CommandeUpdate, CommandeResponse
from auth import get_utilisateur_connecte, get_client_iot, get_client_cle_api
from services.commande_service import creer_commande, mettre_a_jour_statut
from config import RATE_LIMIT_ECRITURES
from services.rate_limit import limiter

router = APIRouter(prefix="/api/commandes", tags=["Commandes"])


def _get_ou_404(db: Session, id: int) -> Commande:
    """Recupere une commande par son ID ou lève une 404."""
    commande = db.get(Commande, id)
    if not commande:
        raise HTTPException(status_code=404, detail=f"Commande id={id} introuvable")
    return commande


@router.get("", response_model=list[CommandeResponse])
def lister_commandes(
    db: Session = Depends(get_db),
    utilisateur: Utilisateur = Depends(get_utilisateur_connecte),
):
    """Liste toutes les commandes (avec les plus recentes en premier)."""
    return db.query(Commande).order_by(Commande.timestamp.desc()).all()


@router.get("/attente", response_model=list[CommandeResponse])
@limiter.limit(RATE_LIMIT_ECRITURES)
def commandes_en_attente(
    request: Request,
    db: Session = Depends(get_db),
    client: Token = Depends(get_client_cle_api),
):
    """
    Retourne les commandes en attente d'execution par l'ESP32
    (statut = 'envoyee'), les plus anciennes en premier (FIFO).
    Workflow pull : l'ESP32 interroge cet endpoint regulierement.
    Requiert une cle API.
    """
    return (
        db.query(Commande)
        .filter(Commande.statut == "envoyee")
        .order_by(Commande.timestamp.asc(), Commande.id.asc())
        .all()
    )


@router.get("/{id}", response_model=CommandeResponse)
def lire_commande(
    id: int,
    db: Session = Depends(get_db),
    utilisateur: Utilisateur = Depends(get_utilisateur_connecte),
):
    """Retourne une commande specifique par son ID."""
    return _get_ou_404(db, id)


@router.post("", response_model=CommandeResponse, status_code=201)
@limiter.limit(RATE_LIMIT_ECRITURES)
def creer_commande_route(
    request: Request,
    data: CommandeCreate,
    db: Session = Depends(get_db),
    utilisateur: Utilisateur = Depends(get_utilisateur_connecte),
):
    """
    Cree une nouvelle commande.

    Si la source est 'auto', id_utilisateur doit etre None.
    Une action sera creee automatiquement des que l'ESP32 confirme l'execution.
    """
    commande = creer_commande(
        db=db,
        type_action=data.type_action,
        source=data.source,
        id_actionneur=data.id_actionneur,
        id_utilisateur=data.id_utilisateur if data.source == "auto" else (data.id_utilisateur or utilisateur.id),
        valeur_parametre=data.valeur_parametre,
    )
    return commande


@router.put("/{id}", response_model=CommandeResponse)
@limiter.limit(RATE_LIMIT_ECRITURES)
def modifier_commande(
    request: Request,
    id: int,
    data: CommandeUpdate,
    db: Session = Depends(get_db),
    client: Utilisateur | Token = Depends(get_client_iot),
):
    """
    Met a jour le statut d'une commande.
    Utilise par l'ESP32 (via cle API) pour signaler :
      'recue'    → l'ESP32 a recu la commande
      'executee' → la commande a ete executee avec succes
      'echouee'  → l'execution a echoue
    Accepte aussi le JWT (web/CLI) via get_client_iot.
    """
    if data.statut:
        return mettre_a_jour_statut(db, id, data.statut)

    commande = _get_ou_404(db, id)
    for champ, valeur in data.model_dump(exclude_unset=True).items():
        setattr(commande, champ, valeur)
    db.commit()
    db.refresh(commande)
    return commande


@router.delete("/{id}", status_code=204)
@limiter.limit(RATE_LIMIT_ECRITURES)
def supprimer_commande(
    request: Request,
    id: int,
    db: Session = Depends(get_db),
    utilisateur: Utilisateur = Depends(get_utilisateur_connecte),
):
    """Supprime une commande et son action associee (CASCADE)."""
    commande = _get_ou_404(db, id)
    db.delete(commande)
    db.commit()
    return None  # 204 = pas de contenu dans la reponse
