"""
Routes API pour l'entite Parcelle.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from database import get_db
from models.parcelle import Parcelle
from models.capteur import Capteur
from models.actionneur import Actionneur
from models.alerte import Alerte
from models.seuil import Seuil
from schemas.parcelle import ParcelleCreate, ParcelleUpdate, ParcelleResponse
from schemas.capteur import CapteurResponse
from schemas.actionneur import ActionneurResponse
from schemas.alerte import AlerteResponse
from schemas.seuil import SeuilResponse

router = APIRouter(prefix="/api/parcelles", tags=["Parcelles"])


def _get_ou_404(db: Session, id: int) -> Parcelle:
    """Recupere une parcelle par son ID ou lève une 404."""
    parcelle = db.get(Parcelle, id)
    if not parcelle:
        raise HTTPException(status_code=404, detail=f"Parcelle id={id} introuvable")
    return parcelle


@router.get("", response_model=list[ParcelleResponse])
def lister_parcelles(db: Session = Depends(get_db)):
    """Retourne la liste de toutes les parcelles."""
    return db.query(Parcelle).all()


@router.get("/{id}", response_model=ParcelleResponse)
def lire_parcelle(id: int, db: Session = Depends(get_db)):
    """Retourne une parcelle specifique par son ID."""
    return _get_ou_404(db, id)


@router.post("", response_model=ParcelleResponse, status_code=201)
def creer_parcelle(data: ParcelleCreate, db: Session = Depends(get_db)):
    """Cree une nouvelle parcelle rattachee a un utilisateur."""
    parcelle = Parcelle(**data.model_dump())
    db.add(parcelle)
    db.commit()
    db.refresh(parcelle)
    return parcelle


@router.put("/{id}", response_model=ParcelleResponse)
def modifier_parcelle(id: int, data: ParcelleUpdate, db: Session = Depends(get_db)):
    """Met a jour une parcelle existante."""
    parcelle = _get_ou_404(db, id)
    # Mise a jour partielle : seuls les champs fournis sont modifies
    for champ, valeur in data.model_dump(exclude_unset=True).items():
        setattr(parcelle, champ, valeur)
    db.commit()
    db.refresh(parcelle)
    return parcelle


@router.delete("/{id}", status_code=204)
def supprimer_parcelle(id: int, db: Session = Depends(get_db)):
    """Supprime une parcelle et tous ses capteurs/actionneurs/seuils (CASCADE)."""
    parcelle = _get_ou_404(db, id)
    db.delete(parcelle)
    db.commit()
    return None  # 204 = pas de contenu dans la reponse


# ─── Routes filles : capteurs, actionneurs, alertes, seuils ───

@router.get("/{id}/capteurs", response_model=list[CapteurResponse])
def lister_capteurs_parcelle(id: int, db: Session = Depends(get_db)):
    """Liste les capteurs attaches a une parcelle donnee."""
    parcelle = _get_ou_404(db, id)
    return parcelle.capteurs


@router.get("/{id}/actionneurs", response_model=list[ActionneurResponse])
def lister_actionneurs_parcelle(id: int, db: Session = Depends(get_db)):
    """Liste les actionneurs rattaches a une parcelle donnee."""
    parcelle = _get_ou_404(db, id)
    return parcelle.actionneurs


@router.get("/{id}/alertes", response_model=list[AlerteResponse])
def lister_alertes_parcelle(id: int, db: Session = Depends(get_db)):
    """Liste les alertes associees a une parcelle donnee."""
    parcelle = _get_ou_404(db, id)
    return parcelle.alertes


@router.get("/{id}/seuils", response_model=list[SeuilResponse])
def lister_seuils_parcelle(id: int, db: Session = Depends(get_db)):
    """Liste les seuils configures pour une parcelle donnee."""
    parcelle = _get_ou_404(db, id)
    return parcelle.seuils
