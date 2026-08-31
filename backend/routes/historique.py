"""
Routes API pour l'historique des actions.

Affiche toutes les operations effectuees sur le systeme.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from database import get_db
from models.historique import HistoriqueAction
from models.utilisateur import Utilisateur
from schemas.historique import HistoriqueActionResponse
from auth import get_utilisateur_connecte

router = APIRouter(prefix="/api/historique", tags=["Historique"])


@router.get("", response_model=list[HistoriqueActionResponse])
def lister_historique(
    entite: str | None = Query(None, description="Filtrer par entite: parcelle, capteur, actionneur"),
    type_action: str | None = Query(None, description="Filtrer par type: creation, modification, suppression, activation, desactivation, commande"),
    entite_id: int | None = Query(None, description="Filtrer par ID d'entite"),
    limit: int = Query(100, ge=1, le=500, description="Nombre max de resultats"),
    db: Session = Depends(get_db),
    utilisateur: Utilisateur = Depends(get_utilisateur_connecte),
):
    """
    Liste les actions de l'historique avec filtrage optionnel.
    Les plus recentes en premier.
    """
    from models.utilisateur import Utilisateur as UtilisateurModel

    query = db.query(HistoriqueAction)

    if entite:
        query = query.filter(HistoriqueAction.entite == entite)
    if type_action:
        query = query.filter(HistoriqueAction.type_action == type_action)
    if entite_id:
        query = query.filter(HistoriqueAction.entite_id == entite_id)

    actions = query.order_by(desc(HistoriqueAction.created_at)).limit(limit).all()

    # Enrichir avec les noms des utilisateurs
    resultats = []
    for action in actions:
        u = db.get(UtilisateurModel, action.id_utilisateur)
        resultats.append(
            HistoriqueActionResponse(
                id=action.id,
                type_action=action.type_action,
                entite=action.entite,
                entite_id=action.entite_id,
                details=action.details,
                id_utilisateur=action.id_utilisateur,
                created_at=action.created_at,
                utilisateur_nom=u.nom if u else f"Utilisateur#{action.id_utilisateur}",
            )
        )

    return resultats
