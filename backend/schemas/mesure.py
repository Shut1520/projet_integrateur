"""
Schemas Pydantic pour l'entite Mesure.

Table a gros volume : pas de Update (on ne modifie pas une mesure).
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class MesureBase(BaseModel):
    """Attributs communs."""

    valeur: float = Field(..., description="Valeur lue")
    unite: str = Field(..., max_length=10, description="'%', '°C', 'ppm', 'lux'")
    source: str = Field(default="esp32", pattern="^(esp32|manuel|simulation)$")
    timestamp: Optional[datetime] = Field(None, description="Horodatage de la lecture")
    id_capteur: int = Field(..., description="Capteur source")


class MesureCreate(MesureBase):
    """Ajout d'une mesure (POST)."""

    pass


class MesureResponse(MesureBase):
    """Reponse au client."""

    id: int

    model_config = ConfigDict(from_attributes=True)
