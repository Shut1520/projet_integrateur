"""
Routes API pour l'entite Mesure.

Table a gros volume : on limite le nombre de resultats et on interdit
la modification/suppression (les mesures sont immutables).
"""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import desc
from sqlalchemy.orm import Session

from database import get_db
from models.mesure import Mesure
from schemas.mesure import MesureCreate, MesureResponse

router = APIRouter(prefix="/api/mesures", tags=["Mesures"])


@router.get("", response_model=list[MesureResponse])
def lister_mesures(
    capteur_id: Optional[int] = Query(None, description="Filtrer par capteur"),
    depuis: Optional[datetime] = Query(None, description="Date debut (ISO)"),
    jusqua: Optional[datetime] = Query(None, description="Date fin (ISO)"),
    limite: int = Query(100, ge=1, le=10000, description="Nombre max de resultats"),
    db: Session = Depends(get_db),
):
    """
    Liste les mesures avec filtres optionnels.
    Limitee a 10 000 resultats max pour eviter les surcharges.
    """
    query = db.query(Mesure)

    if capteur_id is not None:
        query = query.filter(Mesure.id_capteur == capteur_id)
    if depuis is not None:
        query = query.filter(Mesure.timestamp >= depuis)
    if jusqua is not None:
        query = query.filter(Mesure.timestamp <= jusqua)

    return query.order_by(desc(Mesure.timestamp)).limit(limite).all()


@router.get("/{id}", response_model=MesureResponse)
def lire_mesure(id: int, db: Session = Depends(get_db)):
    """Retourne une mesure specifique par son ID."""
    mesure = db.query(Mesure).get(id)
    if not mesure:
        raise HTTPException(status_code=404, detail=f"Mesure id={id} introuvable")
    return mesure


@router.get("/dernieres/{capteur_id}", response_model=list[MesureResponse])
def dernieres_mesures(
    capteur_id: int,
    nb: int = Query(10, ge=1, le=1000, description="Nombre de mesures"),
    db: Session = Depends(get_db),
):
    """
    Retourne les N dernieres mesures d'un capteur specifique.
    Utilise par le dashboard pour les graphiques temps reel.
    """
    return (
        db.query(Mesure)
        .filter(Mesure.id_capteur == capteur_id)
        .order_by(desc(Mesure.timestamp))
        .limit(nb)
        .all()
    )


@router.post("", response_model=MesureResponse, status_code=201)
def creer_mesure(data: MesureCreate, db: Session = Depends(get_db)):
    """
    Ajoute une mesure.
    Utilise par l'ESP32 (MQTT -> API) ou par saisie manuelle.
    """
    mesure = Mesure(**data.model_dump())
    db.add(mesure)
    db.commit()
    db.refresh(mesure)
    return mesure
