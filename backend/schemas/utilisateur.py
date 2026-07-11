"""
Schemas Pydantic pour l'entite Utilisateur.

Valide les donnees envoyees au serveur (inscription, connexion, mise a jour)
et formate les donnees renvoyees au client.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class UtilisateurBase(BaseModel):
    """Attributs communs a tous les schemas utilisateur."""

    nom: str = Field(..., min_length=2, max_length=100, description="Nom complet")
    email: EmailStr = Field(..., description="Adresse email (unique)")
    role: str = Field(default="agriculteur", pattern="^(agriculteur|admin)$")


class UtilisateurCreate(UtilisateurBase):
    """Utilise lors de l'inscription (POST /utilisateurs)."""

    password: str = Field(
        ...,
        min_length=8,
        max_length=128,
        description="Mot de passe en clair (sera hashé)",
    )


class UtilisateurUpdate(BaseModel):
    """Utilise lors de la modification (PUT /utilisateurs/{id}). Tous les champs sont optionnels."""

    nom: Optional[str] = Field(None, min_length=2, max_length=100)
    email: Optional[EmailStr] = None
    role: Optional[str] = Field(None, pattern="^(agriculteur|admin)$")
    password: Optional[str] = Field(None, min_length=8, max_length=128)


class UtilisateurResponse(UtilisateurBase):
    """Renvoie au client (jamais le mot de passe)."""

    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
