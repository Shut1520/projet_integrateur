"""
Schemas Pydantic pour l'entite Seuil.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class SeuilBase(BaseModel):
    """Attributs communs."""

    type_mesure: str = Field(
        ..., max_length=20, description="Ex: 'humidite_sol', 'temperature'"
    )
    valeur_min: float = Field(..., description="Seuil bas")
    valeur_max: float = Field(..., description="Seuil haut")
    unite: str = Field(..., max_length=10, description="'%', '°C', 'ppm', 'lux'")
    id_utilisateur: int = Field(..., description="Qui a configure")
    id_parcelle: int = Field(..., description="Pour quelle parcelle")


class SeuilCreate(SeuilBase):
    """Configuration d'un seuil (POST)."""

    pass


class SeuilUpdate(BaseModel):
    """Modification d'un seuil (PUT)."""

    type_mesure: Optional[str] = Field(None, max_length=20)
    valeur_min: Optional[float] = None
    valeur_max: Optional[float] = None
    unite: Optional[str] = Field(None, max_length=10)
    id_utilisateur: Optional[int] = None
    id_parcelle: Optional[int] = None


class SeuilResponse(SeuilBase):
    """Reponse au client."""

    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
