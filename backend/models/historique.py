"""
Modele HistoriqueAction.

Enregistre toutes les operations effectuees sur le systeme :
creations, modifications, suppressions, activations, commandes.
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func

from database import Base


class HistoriqueAction(Base):
    __tablename__ = "historique_actions"

    id = Column(Integer, primary_key=True)
    """Identifiant unique (PK auto-increment)"""

    type_action = Column(String(20), nullable=False)
    """Type d'action : creation, modification, suppression, activation, desactivation, commande"""

    entite = Column(String(20), nullable=False)
    """Entite concernee : parcelle, capteur, actionneur"""

    entite_id = Column(Integer, nullable=False)
    """ID de l'entite concernee"""

    details = Column(Text, nullable=True)
    """Description de l'action (ex: 'Nom: A -> B')"""

    id_utilisateur = Column(Integer, ForeignKey("utilisateurs.id"), nullable=False)
    """Utilisateur ayant effectue l'action"""

    created_at = Column(DateTime, default=func.now())
    """Horodatage de l'action"""

    def __repr__(self):
        return f"<HistoriqueAction(id={self.id}, type={self.type_action}, entite={self.entite}#{self.entite_id})>"
