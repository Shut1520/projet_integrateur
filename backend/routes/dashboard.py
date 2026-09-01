"""
Routes API pour le tableau de bord (agregats).

Un seul appel /api/dashboard renvoie toutes les donnees du Dashboard.jsx :
capteurs, actionneurs, parcelles, alertes actives et derniere mesure par capteur.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models.utilisateur import Utilisateur
from auth import get_utilisateur_connecte
from services.dashboard_service import aggregat_dashboard

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("")
def obtenir_dashboard(
    db: Session = Depends(get_db),
    utilisateur: Utilisateur = Depends(get_utilisateur_connecte),
):
    """Retourne le payload complet du tableau de bord en une seule requete."""
    return aggregat_dashboard(db)