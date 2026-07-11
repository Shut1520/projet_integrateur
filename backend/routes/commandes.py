"""
Routes API pour l'entite Commande.

Represente un ordre envoye a un actionneur.
Peut provenir du web, du CLI ou de l'automatisation.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models.commande import Commande
from schemas.commande import CommandeCreate, CommandeUpdate, CommandeResponse

router = APIRouter(prefix="/api/commandes", tags=["Commandes"])


def _get_ou_404(db: Session, id: int) -> Commande:
    commande = db.query(Commande).get(id)
    if not commande:
        raise HTTPException(status_code=404, detail=f"Commande id={id} introuvable")
    return commande


@router.get("", response_model=list[CommandeResponse])
def lister_commandes(db: Session = Depends(get_db)):
    """Liste toutes les commandes (avec les plus recentes en premier)."""
    return db.query(Commande).order_by(Commande.timestamp.desc()).all()


@router.get("/{id}", response_model=CommandeResponse)
def lire_commande(id: int, db: Session = Depends(get_db)):
    return _get_ou_404(db, id)


@router.post("", response_model=CommandeResponse, status_code=201)
def creer_commande(data: CommandeCreate, db: Session = Depends(get_db)):
    """
    Cree une nouvelle commande.

    Si la source est 'auto', id_utilisateur doit etre None.
    Une action sera creee automatiquement des que l'ESP32 confirme l'execution.
    """
    commande = Commande(**data.model_dump())
    db.add(commande)
    db.commit()
    db.refresh(commande)
    return commande


@router.put("/{id}", response_model=CommandeResponse)
def modifier_commande(id: int, data: CommandeUpdate, db: Session = Depends(get_db)):
    """
    Met a jour le statut d'une commande.
    Utilise par l'ESP32 (via MQTT) pour signaler :
      'recue'    → l'ESP32 a recu la commande
      'executee' → la commande a ete executee avec succes
      'echouee'  → l'execution a echoue
    """
    commande = _get_ou_404(db, id)
    for champ, valeur in data.model_dump(exclude_unset=True).items():
        setattr(commande, champ, valeur)
    db.commit()
    db.refresh(commande)
    return commande


@router.delete("/{id}", status_code=204)
def supprimer_commande(id: int, db: Session = Depends(get_db)):
    commande = _get_ou_404(db, id)
    db.delete(commande)
    db.commit()
    return None
