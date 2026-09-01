"""
Routes API pour l'entite Mesure.

Table a gros volume : on limite le nombre de resultats et on interdit
la modification/suppression (les mesures sont immutables).
"""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy import desc
from sqlalchemy.orm import Session

from database import get_db
from models.mesure import Mesure
from models.utilisateur import Utilisateur
from schemas.mesure import MesureCreate, MesureResponse
from auth import get_utilisateur_connecte
from config import RATE_LIMIT_MESURES
from services.rate_limit import limiter

router = APIRouter(prefix="/api/mesures", tags=["Mesures"])


@router.get("", response_model=list[MesureResponse])
def lister_mesures(
    capteur_id: Optional[int] = Query(None, description="Filtrer par capteur"),
    depuis: Optional[datetime] = Query(None, description="Date debut (ISO)"),
    jusqua: Optional[datetime] = Query(None, description="Date fin (ISO)"),
    limite: int = Query(100, ge=1, le=10000, description="Nombre max de resultats"),
    db: Session = Depends(get_db),
    utilisateur: Utilisateur = Depends(get_utilisateur_connecte),
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
def lire_mesure(
    id: int,
    db: Session = Depends(get_db),
    utilisateur: Utilisateur = Depends(get_utilisateur_connecte),
):
    """Retourne une mesure specifique par son ID."""
    mesure = db.get(Mesure, id)
    if not mesure:
        raise HTTPException(status_code=404, detail=f"Mesure id={id} introuvable")
    return mesure


@router.get("/dernieres/{capteur_id}", response_model=list[MesureResponse])
def dernieres_mesures(
    capteur_id: int,
    nb: int = Query(10, ge=1, le=1000, description="Nombre de mesures"),
    db: Session = Depends(get_db),
    utilisateur: Utilisateur = Depends(get_utilisateur_connecte),
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
@limiter.limit(RATE_LIMIT_MESURES)
def creer_mesure(request: Request, data: MesureCreate, db: Session = Depends(get_db)):
    """
    Ajoute une mesure.
    Utilise par l'ESP32 (MQTT -> API) ou par saisie manuelle.
    Publique pour permettre a l'ESP32 d'envoyer des donnees sans JWT.
    Rate limitee (defaut 60/min par IP) pour proteger la table a gros volume.
    """
    # Verifier que le capteur existe
    from models.capteur import Capteur
    capteur = db.get(Capteur, data.id_capteur)
    if not capteur:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Capteur id={data.id_capteur} introuvable",
        )

    mesure = Mesure(**data.model_dump())
    db.add(mesure)
    db.commit()
    db.refresh(mesure)
    return mesure
