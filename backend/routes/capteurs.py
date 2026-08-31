"""
Routes API pour l'entite Capteur.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models.capteur import Capteur
from models.utilisateur import Utilisateur
from schemas.capteur import CapteurCreate, CapteurUpdate, CapteurResponse
from auth import get_utilisateur_connecte
from services.historique_service import enregistrer

router = APIRouter(prefix="/api/capteurs", tags=["Capteurs"])


def _get_ou_404(db: Session, id: int) -> Capteur:
    """Recupere un capteur par son ID ou lève une 404."""
    capteur = db.get(Capteur, id)
    if not capteur:
        raise HTTPException(status_code=404, detail=f"Capteur id={id} introuvable")
    return capteur


@router.get("", response_model=list[CapteurResponse])
def lister_capteurs(
    db: Session = Depends(get_db),
    utilisateur: Utilisateur = Depends(get_utilisateur_connecte),
):
    """Retourne la liste de tous les capteurs."""
    return db.query(Capteur).all()


@router.get("/{id}", response_model=CapteurResponse)
def lire_capteur(
    id: int,
    db: Session = Depends(get_db),
    utilisateur: Utilisateur = Depends(get_utilisateur_connecte),
):
    """Retourne un capteur specifique par son ID."""
    return _get_ou_404(db, id)


@router.post("", response_model=CapteurResponse, status_code=201)
def creer_capteur(
    data: CapteurCreate,
    db: Session = Depends(get_db),
    utilisateur: Utilisateur = Depends(get_utilisateur_connecte),
):
    """Ajoute un nouveau capteur a une parcelle."""
    capteur = Capteur(**data.model_dump())
    db.add(capteur)
    db.flush()
    enregistrer(db, "creation", "capteur", capteur.id, utilisateur.id, f"Nom: {capteur.nom}")
    db.commit()
    db.refresh(capteur)
    return capteur


@router.put("/{id}", response_model=CapteurResponse)
def modifier_capteur(
    id: int,
    data: CapteurUpdate,
    db: Session = Depends(get_db),
    utilisateur: Utilisateur = Depends(get_utilisateur_connecte),
):
    """Met a jour un capteur existant."""
    capteur = _get_ou_404(db, id)
    champs_modifies = data.model_dump(exclude_unset=True)
    for champ, valeur in champs_modifies.items():
        setattr(capteur, champ, valeur)
    details = "; ".join(f"{k}: {v}" for k, v in champs_modifies.items()) if champs_modifies else None
    enregistrer(db, "modification", "capteur", capteur.id, utilisateur.id, details)
    db.commit()
    db.refresh(capteur)
    return capteur


@router.delete("/{id}", status_code=204)
def supprimer_capteur(
    id: int,
    db: Session = Depends(get_db),
    utilisateur: Utilisateur = Depends(get_utilisateur_connecte),
):
    """Supprime un capteur et ses mesures associees (CASCADE)."""
    capteur = _get_ou_404(db, id)
    nom = capteur.nom
    enregistrer(db, "suppression", "capteur", id, utilisateur.id, f"Nom: {nom}")
    db.delete(capteur)
    db.commit()
    return None
