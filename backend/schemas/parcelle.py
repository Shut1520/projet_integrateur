"""
Schemas Pydantic pour l'entite Parcelle.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ParcelleBase(BaseModel):
    """Attributs communs."""

    nom: str = Field(
        ..., min_length=1, max_length=100, description="Nom de la parcelle"
    )
    localisation: Optional[str] = Field(None, max_length=255, description="Emplacement")
    id_utilisateur: int = Field(..., description="Proprietaire de la parcelle")


class ParcelleCreate(ParcelleBase):
    """Creation d'une parcelle (POST)."""

    pass


class ParcelleUpdate(BaseModel):
    """Modification d'une parcelle (PUT)."""

    nom: Optional[str] = Field(None, min_length=1, max_length=100)
    localisation: Optional[str] = Field(None, max_length=255)
    id_utilisateur: Optional[int] = None


class ParcelleResponse(ParcelleBase):
    """Reponse au client."""

    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
