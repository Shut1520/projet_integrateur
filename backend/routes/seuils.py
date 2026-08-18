"""
Routes API pour l'entite Seuil.

Configuration des seuils pour l'automatisation.
Chaque seuil definit un intervalle [valeur_min, valeur_max]
pour un type de mesure sur une parcelle donnee.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models.seuil import Seuil
from schemas.seuil import SeuilCreate, SeuilUpdate, SeuilResponse

router = APIRouter(prefix="/api/seuils", tags=["Seuils"])


def _get_ou_404(db: Session, id: int) -> Seuil:
    """Recupere un seuil par son ID ou lève une 404."""
    seuil = db.get(Seuil, id)
    if not seuil:
        raise HTTPException(status_code=404, detail=f"Seuil id={id} introuvable")
    return seuil


@router.get("", response_model=list[SeuilResponse])
def lister_seuils(
    parcelle_id: int | None = None,
    db: Session = Depends(get_db),
):
    """Liste les seuils. Peut filtrer par parcelle."""
    query = db.query(Seuil)
    if parcelle_id is not None:
        query = query.filter(Seuil.id_parcelle == parcelle_id)
    return query.all()


@router.get("/{id}", response_model=SeuilResponse)
def lire_seuil(id: int, db: Session = Depends(get_db)):
    """Retourne un seuil specifique par son ID."""
    return _get_ou_404(db, id)


@router.post("", response_model=SeuilResponse, status_code=201)
def creer_seuil(data: SeuilCreate, db: Session = Depends(get_db)):
    """Configure un nouveau seuil pour une parcelle."""
    seuil = Seuil(**data.model_dump())
    db.add(seuil)
    db.commit()
    db.refresh(seuil)
    return seuil


@router.put("/{id}", response_model=SeuilResponse)
def modifier_seuil(id: int, data: SeuilUpdate, db: Session = Depends(get_db)):
    """Modifie un seuil existant."""
    seuil = _get_ou_404(db, id)
    for champ, valeur in data.model_dump(exclude_unset=True).items():
        setattr(seuil, champ, valeur)
    db.commit()
    db.refresh(seuil)
    return seuil


@router.delete("/{id}", status_code=204)
def supprimer_seuil(id: int, db: Session = Depends(get_db)):
    """Supprime un seuil."""
    seuil = _get_ou_404(db, id)
    db.delete(seuil)
    db.commit()
    return None
