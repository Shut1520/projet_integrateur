"""
Schemas Pydantic pour l'entite Actionneur.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class ActionneurBase(BaseModel):
    """Attributs communs."""

    nom: str = Field(..., max_length=20, description="Ex: 'pompe', 'ventilation'")
    reference: Optional[str] = Field(None, max_length=50)
    gpio: int = Field(..., ge=0, le=39, description="Broche GPIO ESP32")
    etat: str = Field(default="inactif", pattern="^(actif|inactif)$")
    id_parcelle: int = Field(..., description="Parcelle de rattachement")


class ActionneurCreate(ActionneurBase):
    """Ajout d'un actionneur (POST)."""

    pass


class ActionneurUpdate(BaseModel):
    """Modification d'un actionneur (PUT)."""

    nom: Optional[str] = Field(None, max_length=20)
    reference: Optional[str] = Field(None, max_length=50)
    gpio: Optional[int] = Field(None, ge=0, le=39)
    etat: Optional[str] = Field(None, pattern="^(actif|inactif)$")
    id_parcelle: Optional[int] = None


class ActionneurResponse(ActionneurBase):
    """Reponse au client."""

    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
