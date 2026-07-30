"""
Routes API pour l'entite Actionneur.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models.actionneur import Actionneur
from schemas.actionneur import ActionneurCreate, ActionneurUpdate, ActionneurResponse

router = APIRouter(prefix="/api/actionneurs", tags=["Actionneurs"])


def _get_ou_404(db: Session, id: int) -> Actionneur:
    """Recupere un actionneur par son ID ou lève une 404."""
    actionneur = db.query(Actionneur).get(id)
    if not actionneur:
        raise HTTPException(status_code=404, detail=f"Actionneur id={id} introuvable")
    return actionneur


@router.get("", response_model=list[ActionneurResponse])
def lister_actionneurs(db: Session = Depends(get_db)):
    """Retourne la liste de tous les actionneurs."""
    return db.query(Actionneur).all()


@router.get("/{id}", response_model=ActionneurResponse)
def lire_actionneur(id: int, db: Session = Depends(get_db)):
    """Retourne un actionneur specifique par son ID."""
    return _get_ou_404(db, id)


@router.post("", response_model=ActionneurResponse, status_code=201)
def creer_actionneur(data: ActionneurCreate, db: Session = Depends(get_db)):
    """Ajoute un nouvel actionneur a une parcelle."""
    actionneur = Actionneur(**data.model_dump())
    db.add(actionneur)
    db.commit()
    db.refresh(actionneur)
    return actionneur


@router.put("/{id}", response_model=ActionneurResponse)
def modifier_actionneur(id: int, data: ActionneurUpdate, db: Session = Depends(get_db)):
    """Met a jour un actionneur existant."""
    actionneur = _get_ou_404(db, id)
    # Mise a jour partielle : seuls les champs fournis sont modifies
    for champ, valeur in data.model_dump(exclude_unset=True).items():
        setattr(actionneur, champ, valeur)
    db.commit()
    db.refresh(actionneur)
    return actionneur


@router.delete("/{id}", status_code=204)
def supprimer_actionneur(id: int, db: Session = Depends(get_db)):
    """Supprime un actionneur et ses commandes associees (CASCADE manuel)."""
    actionneur = _get_ou_404(db, id)
    # Supprimer d'abord les commandes liees (la FK n'a pas ON DELETE CASCADE)
    from models.commande import Commande
    db.query(Commande).filter(Commande.id_actionneur == id).delete(synchronize_session=False)
    db.delete(actionneur)
    db.commit()
    return None  # 204 = pas de contenu dans la reponse
