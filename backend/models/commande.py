"""
Modele Commande.

Represente un ordre envoye a un actionneur.
Peut provenir du web, du CLI, ou de l'automatisation (source='auto').
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from database import Base


class Commande(Base):
    __tablename__ = "commandes"

    # ─── Identite ───
    id = Column(Integer, primary_key=True)
    type_action = Column(String(20), nullable=False, default="on")
    """'on', 'off', 'programmer'"""
    valeur_parametre = Column(String(50), nullable=True)
    """Parametre optionnel (duree en secondes, etc.)"""

    # ─── Origine ───
    source = Column(String(20), nullable=False)
    """'web', 'cli', 'auto'"""
    timestamp = Column(DateTime, default=func.now())

    # ─── Statut ───
    statut = Column(String(15), nullable=False, default="envoyee")
    """'envoyee', 'recue', 'executee', 'echouee'"""

    # ─── FK ───
    id_utilisateur = Column(Integer, ForeignKey("utilisateurs.id"), nullable=True)
    """NULL si source='auto' (pas d'humain derriere)"""
    id_actionneur = Column(Integer, ForeignKey("actionneurs.id"), nullable=False)

    # ─── Relations ───
    emetteur = relationship("Utilisateur", back_populates="commandes")
    actionneur = relationship("Actionneur", back_populates="commandes")
    action = relationship("Action", back_populates="commande", uselist=False, cascade="all, delete-orphan")
    """
    uselist=False = relation 1:1 (une commande → au plus une action)
    cascade = composition ◆
    """

    # ─── Methodes ───
    def __repr__(self):
        return f"<Commande(id={self.id}, type='{self.type_action}', source='{self.source}')>"

    def to_dict(self):
        return {
            "id": self.id,
            "type_action": self.type_action,
            "valeur_parametre": self.valeur_parametre,
            "source": self.source,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "statut": self.statut,
            "id_utilisateur": self.id_utilisateur,
            "id_actionneur": self.id_actionneur,
        }

    def est_auto(self):
        """Retourne True si la commande vient de l'automatisation."""
        return self.source == "auto"

    def est_executee(self):
        """Retourne True si la commande a ete executee."""
        return self.statut == "executee"
