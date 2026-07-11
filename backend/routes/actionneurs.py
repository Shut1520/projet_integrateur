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
    actionneur = db.query(Actionneur).get(id)
    if not actionneur:
        raise HTTPException(status_code=404, detail=f"Actionneur id={id} introuvable")
    return actionneur


@router.get("", response_model=list[ActionneurResponse])
def lister_actionneurs(db: Session = Depends(get_db)):
    return db.query(Actionneur).all()


@router.get("/{id}", response_model=ActionneurResponse)
def lire_actionneur(id: int, db: Session = Depends(get_db)):
    return _get_ou_404(db, id)


@router.post("", response_model=ActionneurResponse, status_code=201)
def creer_actionneur(data: ActionneurCreate, db: Session = Depends(get_db)):
    actionneur = Actionneur(**data.model_dump())
    db.add(actionneur)
    db.commit()
    db.refresh(actionneur)
    return actionneur


@router.put("/{id}", response_model=ActionneurResponse)
def modifier_actionneur(id: int, data: ActionneurUpdate, db: Session = Depends(get_db)):
    actionneur = _get_ou_404(db, id)
    for champ, valeur in data.model_dump(exclude_unset=True).items():
        setattr(actionneur, champ, valeur)
    db.commit()
    db.refresh(actionneur)
    return actionneur


@router.delete("/{id}", status_code=204)
def supprimer_actionneur(id: int, db: Session = Depends(get_db)):
    actionneur = _get_ou_404(db, id)
    db.delete(actionneur)
    db.commit()
    return None
