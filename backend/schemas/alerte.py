"""
Schemas Pydantic pour l'entite Alerte.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class AlerteBase(BaseModel):
    """Attributs communs."""

    type_alerte: str = Field(
        ..., alias="type", max_length=30, description="Ex: 'co2_eleve', 'temp_haute'"
    )
    valeur: Optional[float] = Field(None, description="Valeur declencheuse")
    seuil: Optional[float] = Field(None, description="Seuil depasse")
    severite: str = Field(default="haute", pattern="^(basse|haute|critique)$")
    message: str = Field(..., description="Message pour le dashboard")
    etat: str = Field(default="active", pattern="^(active|reconnue|resolue)$")
    date_debut: Optional[datetime] = None
    date_fin: Optional[datetime] = Field(None, description="NULL si encore active")
    id_parcelle: int = Field(..., description="Parcelle concernée")
    id_mesure: Optional[int] = Field(None, description="NULL si declenchee par action")
    id_action: Optional[int] = Field(None, description="NULL si declenchee par mesure")


class AlerteCreate(AlerteBase):
    """Creation d'une alerte (POST)."""

    pass


class AlerteUpdate(BaseModel):
    """Mise a jour d'une alerte (PUT) : reconnaissance, resolution."""

    etat: Optional[str] = Field(None, pattern="^(active|reconnue|resolue)$")
    date_fin: Optional[datetime] = None


class AlerteResponse(AlerteBase):
    """Reponse au client."""

    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
        populate_by_name = True
