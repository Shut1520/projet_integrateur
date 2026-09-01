"""
Routes API pour l'entite Action.

Represente l'execution reelle d'une commande par l'ESP32.
Relation 1:1 avec Commande.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import desc
from sqlalchemy.orm import Session

from database import get_db
from models.action import Action
from models.utilisateur import Utilisateur
from models.token import Token
from schemas.action import ActionCreate, ActionUpdate, ActionResponse
from auth import get_utilisateur_connecte, get_client_iot

router = APIRouter(prefix="/api/actions", tags=["Actions"])


def _get_ou_404(db: Session, id: int) -> Action:
    """Recupere une action par son ID ou lève une 404."""
    action = db.get(Action, id)
    if not action:
        raise HTTPException(status_code=404, detail=f"Action id={id} introuvable")
    return action


@router.get("", response_model=list[ActionResponse])
def lister_actions(
    commande_id: int | None = None,
    db: Session = Depends(get_db),
    utilisateur: Utilisateur = Depends(get_utilisateur_connecte),
):
    """Liste les actions. Peut filtrer par commande_id."""
    query = db.query(Action)
    if commande_id is not None:
        query = query.filter(Action.id_commande == commande_id)
    return query.order_by(desc(Action.date_debut)).all()


@router.get("/{id}", response_model=ActionResponse)
def lire_action(
    id: int,
    db: Session = Depends(get_db),
    utilisateur: Utilisateur = Depends(get_utilisateur_connecte),
):
    """Retourne une action specifique par son ID."""
    return _get_ou_404(db, id)


@router.post("", response_model=ActionResponse, status_code=201)
def creer_action(
    data: ActionCreate,
    db: Session = Depends(get_db),
    client: Utilisateur | Token = Depends(get_client_iot),
):
    """
    Cree une action (liee a une commande existante).
    Utilise par l'ESP32 (via cle API) quand il commence a executer une commande.
    Accepte aussi le JWT (web/CLI).
    """
    action = Action(**data.model_dump())
    db.add(action)
    db.commit()
    db.refresh(action)
    return action


@router.put("/{id}", response_model=ActionResponse)
def modifier_action(
    id: int,
    data: ActionUpdate,
    db: Session = Depends(get_db),
    client: Utilisateur | Token = Depends(get_client_iot),
):
    """
    Met a jour une action (ex: fin d'execution).
    L'ESP32 (via cle API) appelle cet endpoint pour signaler :
    - date_fin, duree, resultat, statut='termine'
    Accepte aussi le JWT (web/CLI).
    """
    action = _get_ou_404(db, id)
    for champ, valeur in data.model_dump(exclude_unset=True).items():
        setattr(action, champ, valeur)

    # Calcul automatique de la duree si date_fin est fournie et
    # que l'action a une date_debut (attendue pour une action en cours).
    if data.date_fin is not None and action.date_debut is not None:
        action.calculer_duree()

    db.commit()
    db.refresh(action)
    return action
