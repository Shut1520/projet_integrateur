"""
Schemas Pydantic pour l'entite Token (cle API CLI).

Seul le Create renvoie la cle_api en clair.
Le Response ne montre pas la cle (securite).
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class TokenBase(BaseModel):
    """Attributs communs."""

    nom: str = Field(..., max_length=50, description="Nom identifiant la cle")
    actif: bool = Field(default=True)
    expires_at: Optional[datetime] = Field(None, description="NULL = jamais expire")


class TokenCreate(TokenBase):
    """Demande de creation d'un token (POST)."""

    id_utilisateur: int = Field(..., description="Proprietaire du token")


class TokenUpdate(BaseModel):
    """Modification d'un token (PUT) : revoquer, renommer."""

    nom: Optional[str] = Field(None, max_length=50)
    actif: Optional[bool] = None


class TokenResponse(TokenBase):
    """Reponse au client (sans la cle)."""

    id: int
    last_used_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    id_utilisateur: int

    class Config:
        from_attributes = True


class TokenResponseWithKey(TokenResponse):
    """Utilise UNIQUEMENT lors de la creation pour montrer la cle une fois."""

    cle_api: str = Field(
        ..., description="Conservez cette cle, elle ne sera plus jamais affichee"
    )
