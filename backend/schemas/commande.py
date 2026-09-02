"""
Schemas Pydantic pour l'entite Commande.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class CommandeBase(BaseModel):
    """Attributs communs."""

    type_action: str = Field(default="on", pattern="^(on|off|programmer)$")
    valeur_parametre: Optional[str] = Field(
        None, max_length=50, description="Duree, intensite, etc."
    )
    source: str = Field(
        ..., pattern="^(web|cli|auto)$", description="Origine de la commande"
    )
    timestamp: Optional[datetime] = None
    statut: str = Field(default="envoyee", pattern="^(envoyee|recue|executee|echouee)$")
    id_utilisateur: Optional[int] = Field(None, description="NULL si source='auto'")
    id_actionneur: int = Field(..., description="Actionneur concerne")


class CommandeCreate(CommandeBase):
    """Emission d'une commande (POST)."""

    pass


class CommandeUpdate(BaseModel):
    """Modification du statut d'une commande (PUT)."""

    type_action: Optional[str] = Field(None, pattern="^(on|off|programmer)$")
    valeur_parametre: Optional[str] = Field(None, max_length=50)
    statut: Optional[str] = Field(None, pattern="^(envoyee|recue|executee|echouee)$")


class CommandeResponse(CommandeBase):
    """Reponse au client."""

    id: int
    nom_actionneur: Optional[str] = Field(
        None, description="Nom de l'actionneur commande (relation), ex: 'pompe'"
    )

    model_config = ConfigDict(from_attributes=True)
