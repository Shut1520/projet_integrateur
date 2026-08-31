"""
Routes API pour l'entite Actionneur.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models.actionneur import Actionneur
from models.utilisateur import Utilisateur
from schemas.actionneur import ActionneurCreate, ActionneurUpdate, ActionneurResponse
from auth import get_utilisateur_connecte
from services.historique_service import enregistrer

router = APIRouter(prefix="/api/actionneurs", tags=["Actionneurs"])


def _get_ou_404(db: Session, id: int) -> Actionneur:
    """Recupere un actionneur par son ID ou lève une 404."""
    actionneur = db.get(Actionneur, id)
    if not actionneur:
        raise HTTPException(status_code=404, detail=f"Actionneur id={id} introuvable")
    return actionneur


@router.get("", response_model=list[ActionneurResponse])
def lister_actionneurs(
    db: Session = Depends(get_db),
    utilisateur: Utilisateur = Depends(get_utilisateur_connecte),
):
    """Retourne la liste de tous les actionneurs."""
    return db.query(Actionneur).all()


@router.get("/{id}", response_model=ActionneurResponse)
def lire_actionneur(
    id: int,
    db: Session = Depends(get_db),
    utilisateur: Utilisateur = Depends(get_utilisateur_connecte),
):
    """Retourne un actionneur specifique par son ID."""
    return _get_ou_404(db, id)


@router.post("", response_model=ActionneurResponse, status_code=201)
def creer_actionneur(
    data: ActionneurCreate,
    db: Session = Depends(get_db),
    utilisateur: Utilisateur = Depends(get_utilisateur_connecte),
):
    """Ajoute un nouvel actionneur a une parcelle."""
    actionneur = Actionneur(**data.model_dump())
    db.add(actionneur)
    db.flush()
    enregistrer(db, "creation", "actionneur", actionneur.id, utilisateur.id, f"Nom: {actionneur.nom}")
    db.commit()
    db.refresh(actionneur)
    return actionneur


@router.put("/{id}", response_model=ActionneurResponse)
def modifier_actionneur(
    id: int,
    data: ActionneurUpdate,
    db: Session = Depends(get_db),
    utilisateur: Utilisateur = Depends(get_utilisateur_connecte),
):
    """Met a jour un actionneur existant."""
    actionneur = _get_ou_404(db, id)
    champs_modifies = data.model_dump(exclude_unset=True)
    ancien_etat = actionneur.etat
    for champ, valeur in champs_modifies.items():
        setattr(actionneur, champ, valeur)
    details = "; ".join(f"{k}: {v}" for k, v in champs_modifies.items()) if champs_modifies else None
    enregistrer(db, "modification", "actionneur", actionneur.id, utilisateur.id, details)
    if "etat" in champs_modifies and ancien_etat != actionneur.etat:
        type_act = "activation" if actionneur.etat == "actif" else "desactivation"
        enregistrer(db, type_act, "actionneur", actionneur.id, utilisateur.id, f"{ancien_etat} -> {actionneur.etat}")
    db.commit()
    db.refresh(actionneur)
    return actionneur


@router.delete("/{id}", status_code=204)
def supprimer_actionneur(
    id: int,
    db: Session = Depends(get_db),
    utilisateur: Utilisateur = Depends(get_utilisateur_connecte),
):
    """Supprime un actionneur et ses commandes associees (CASCADE manuel)."""
    actionneur = _get_ou_404(db, id)
    nom = actionneur.nom
    enregistrer(db, "suppression", "actionneur", id, utilisateur.id, f"Nom: {nom}")
    from models.commande import Commande
    db.query(Commande).filter(Commande.id_actionneur == id).delete(synchronize_session=False)
    db.delete(actionneur)
    db.commit()
    return None
