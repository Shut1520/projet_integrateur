"""
Schemas Pydantic pour l'entite HistoriqueAction.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class HistoriqueActionResponse(BaseModel):
    """Reponse au client pour un enregistrement d'historique."""

    id: int
    type_action: str
    entite: str
    entite_id: int
    details: Optional[str] = None
    id_utilisateur: int
    created_at: Optional[datetime] = None
    utilisateur_nom: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
