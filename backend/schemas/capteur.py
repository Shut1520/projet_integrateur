"""
Schemas Pydantic pour l'entite Capteur.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class CapteurBase(BaseModel):
    """Attributs communs."""

    nom: str = Field(..., max_length=30, description="Ex: 'dht22', 'yl-69'")
    reference: Optional[str] = Field(
        None, max_length=50, description="Reference fabricant"
    )
    gpio: int = Field(..., ge=0, le=39, description="Broche GPIO ESP32")
    protocole: str = Field(default="digital", pattern="^(digital|analog|i2c)$")
    etat: str = Field(default="actif", pattern="^(actif|inactif|defaillant)$")
    id_parcelle: int = Field(..., description="Parcelle de rattachement")


class CapteurCreate(CapteurBase):
    """Ajout d'un capteur (POST)."""

    pass


class CapteurUpdate(BaseModel):
    """Modification d'un capteur (PUT)."""

    nom: Optional[str] = Field(None, max_length=30)
    reference: Optional[str] = Field(None, max_length=50)
    gpio: Optional[int] = Field(None, ge=0, le=39)
    protocole: Optional[str] = Field(None, pattern="^(digital|analog|i2c)$")
    etat: Optional[str] = Field(None, pattern="^(actif|inactif|defaillant)$")
    id_parcelle: Optional[int] = None


class CapteurResponse(CapteurBase):
    """Reponse au client."""

    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
