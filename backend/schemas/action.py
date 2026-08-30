"""
Schemas Pydantic pour l'entite Action.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class ActionBase(BaseModel):
    """Attributs communs."""

    date_debut: Optional[datetime] = None
    date_fin: Optional[datetime] = Field(None, description="NULL si en cours")
    duree: Optional[int] = Field(None, ge=0, description="Duree en secondes")
    resultat: Optional[str] = None
    details: Optional[str] = None
    statut: str = Field(default="en_cours", pattern="^(en_cours|termine|echouee)$")
    id_commande: int = Field(..., description="Commande liee (UNIQUE)")


class ActionCreate(ActionBase):
    """Creation d'une action (POST)."""

    pass


class ActionUpdate(BaseModel):
    """Mise a jour d'une action (PUT) : fin d'execution."""

    date_fin: Optional[datetime] = None
    duree: Optional[int] = Field(None, ge=0)
    resultat: Optional[str] = None
    details: Optional[str] = None
    statut: Optional[str] = Field(None, pattern="^(en_cours|termine|echouee)$")


class ActionResponse(ActionBase):
    """Reponse au client."""

    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


    model_config = ConfigDict(from_attributes=True)
