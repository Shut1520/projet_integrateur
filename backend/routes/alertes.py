"""
Routes API pour l'entite Alerte.

Les alertes sont generees automatiquement par le systeme
mais peuvent etre reconnues/resolues par l'utilisateur.
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import desc
from sqlalchemy.orm import Session

from database import get_db
from models.alerte import Alerte
from schemas.alerte import AlerteCreate, AlerteUpdate, AlerteResponse

router = APIRouter(prefix="/api/alertes", tags=["Alertes"])


def _get_ou_404(db: Session, id: int) -> Alerte:
    """Recupere une alerte par son ID ou lève une 404."""
    alerte = db.query(Alerte).get(id)
    if not alerte:
        raise HTTPException(status_code=404, detail=f"Alerte id={id} introuvable")
    return alerte


@router.get("", response_model=list[AlerteResponse])
def lister_alertes(
    etat: Optional[str] = Query(None, description="Filtrer par etat (active, reconnue, resolue)"),
    parcelle_id: Optional[int] = Query(None, description="Filtrer par parcelle"),
    severite: Optional[str] = Query(None, description="Filtrer par severite (basse, haute, critique)"),
    db: Session = Depends(get_db),
):
    """Liste les alertes avec filtres optionnels."""
    query = db.query(Alerte)
    if etat:
        query = query.filter(Alerte.etat == etat)
    if parcelle_id is not None:
        query = query.filter(Alerte.id_parcelle == parcelle_id)
    if severite:
        query = query.filter(Alerte.severite == severite)
    return query.order_by(desc(Alerte.date_debut)).all()


@router.get("/{id}", response_model=AlerteResponse)
def lire_alerte(id: int, db: Session = Depends(get_db)):
    """Retourne une alerte specifique par son ID."""
    return _get_ou_404(db, id)


@router.post("", response_model=AlerteResponse, status_code=201)
def creer_alerte(data: AlerteCreate, db: Session = Depends(get_db)):
    """
    Cree une alerte manuellement (pour les tests ou intervention manuelle).
    En production, les alertes sont generees automatiquement par le systeme.
    """
    alerte = Alerte(**data.model_dump())
    db.add(alerte)
    db.commit()
    db.refresh(alerte)
    return alerte


@router.put("/{id}", response_model=AlerteResponse)
def modifier_alerte(id: int, data: AlerteUpdate, db: Session = Depends(get_db)):
    """
    Met a jour une alerte (reconnaissance, resolution).
    """
    alerte = _get_ou_404(db, id)
    for champ, valeur in data.model_dump(exclude_unset=True).items():
        setattr(alerte, champ, valeur)
    db.commit()
    db.refresh(alerte)
    return alerte


@router.put("/{id}/reconnaitre", response_model=AlerteResponse)
def reconnaitre_alerte(id: int, db: Session = Depends(get_db)):
    """Marque une alerte comme 'reconnue' (l'utilisateur l'a vue)."""
    alerte = _get_ou_404(db, id)
    alerte.reconnaitre()
    db.commit()
    db.refresh(alerte)
    return alerte


@router.put("/{id}/resoudre", response_model=AlerteResponse)
def resoudre_alerte(id: int, db: Session = Depends(get_db)):
    """Marque une alerte comme 'resolue' avec la date de resolution."""
    alerte = _get_ou_404(db, id)
    alerte.resoudre()
    db.commit()
    db.refresh(alerte)
    return alerte
