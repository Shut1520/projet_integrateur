"""
Package des schemas Pydantic.

Definit la validation des donnees entrants (request)
et le formatage des donnees sortants (response) de l'API REST.
"""

from .action import (
    ActionBase,
    ActionCreate,
    ActionResponse,
    ActionUpdate,
)
from .actionneur import (
    ActionneurBase,
    ActionneurCreate,
    ActionneurResponse,
    ActionneurUpdate,
)
from .alerte import (
    AlerteBase,
    AlerteCreate,
    AlerteResponse,
    AlerteUpdate,
)
from .capteur import (
    CapteurBase,
    CapteurCreate,
    CapteurResponse,
    CapteurUpdate,
)
from .commande import (
    CommandeBase,
    CommandeCreate,
    CommandeResponse,
    CommandeUpdate,
)
from .mesure import (
    MesureBase,
    MesureCreate,
    MesureResponse,
)
from .parcelle import (
    ParcelleBase,
    ParcelleCreate,
    ParcelleResponse,
    ParcelleUpdate,
)
from .seuil import (
    SeuilBase,
    SeuilCreate,
    SeuilResponse,
    SeuilUpdate,
)
from .token import (
    TokenBase,
    TokenCreate,
    TokenResponse,
    TokenUpdate,
)
from .utilisateur import (
    UtilisateurBase,
    UtilisateurCreate,
    UtilisateurResponse,
    UtilisateurUpdate,
)

__all__ = [
    # Utilisateur
    "UtilisateurBase",
    "UtilisateurCreate",
    "UtilisateurUpdate",
    "UtilisateurResponse",
    # Parcelle
    "ParcelleBase",
    "ParcelleCreate",
    "ParcelleUpdate",
    "ParcelleResponse",
    # Capteur
    "CapteurBase",
    "CapteurCreate",
    "CapteurUpdate",
    "CapteurResponse",
    # Mesure
    "MesureBase",
    "MesureCreate",
    "MesureResponse",
    # Actionneur
    "ActionneurBase",
    "ActionneurCreate",
    "ActionneurUpdate",
    "ActionneurResponse",
    # Commande
    "CommandeBase",
    "CommandeCreate",
    "CommandeUpdate",
    "CommandeResponse",
    # Action
    "ActionBase",
    "ActionCreate",
    "ActionUpdate",
    "ActionResponse",
    # Alerte
    "AlerteBase",
    "AlerteCreate",
    "AlerteUpdate",
    "AlerteResponse",
    # Seuil
    "SeuilBase",
    "SeuilCreate",
    "SeuilUpdate",
    "SeuilResponse",
    # Token
    "TokenBase",
    "TokenCreate",
    "TokenUpdate",
    "TokenResponse",
]
