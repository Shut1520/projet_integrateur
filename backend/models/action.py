"""
Modele Action.

Represente l'execution reelle d'une commande.
Relation 1:1 avec Commande (UNIQUE sur id_commande).
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from database import Base


class Action(Base):
    __tablename__ = "actions"

    # ─── Identite ───
    id = Column(Integer, primary_key=True)

    # ─── Chronologie ───
    date_debut = Column(DateTime, default=func.now())
    """Debut de l'execution"""
    date_fin = Column(DateTime, nullable=True)
    """Fin de l'execution (NULL si en cours)"""
    duree = Column(Integer, nullable=True)
    """Duree en secondes (calculee a la fin)"""

    # ─── Resultat ───
    resultat = Column(Text, nullable=True)
    """Message de resultat"""
    details = Column(Text, nullable=True)
    """Infos complementaires (format JSON)"""

    # ─── Statut ───
    statut = Column(String(15), nullable=False, default="en_cours")
    """'en_cours', 'termine', 'echouee'"""

    # ─── FK (UNIQUE = 1:1) ───
    id_commande = Column(Integer, ForeignKey("commandes.id"), unique=True, nullable=False)
    """UNIQUE = une commande ne peut avoir qu'une seule action"""

    # ─── Horodatage ───
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # ─── Relations ───
    commande = relationship("Commande", back_populates="action")

    # ─── Methodes ───
    def __repr__(self):
        return f"<Action(id={self.id}, statut='{self.statut}')>"

    def to_dict(self):
        return {
            "id": self.id,
            "date_debut": self.date_debut.isoformat() if self.date_debut else None,
            "date_fin": self.date_fin.isoformat() if self.date_fin else None,
            "duree": self.duree,
            "resultat": self.resultat,
            "details": self.details,
            "statut": self.statut,
            "id_commande": self.id_commande,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def calculer_duree(self):
        """Calcule la duree entre debut et fin (en secondes) et la stocke."""
        if self.date_debut and self.date_fin:
            self.duree = int((self.date_fin - self.date_debut).total_seconds())
            return self.duree
        return None
