"""
Modele Alerte.

Represente un evenement anormal detecte par le systeme.
Peut etre declenchee par une mesure (ex: CO2 eleve)
ou par une action (ex: pompe bloquee).
"""

from sqlalchemy import Column, Integer, Float, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from database import Base


class Alerte(Base):
    __tablename__ = "alertes"

    # ─── Identite ───
    id = Column(Integer, primary_key=True)
    type = Column(String(30), nullable=False)
    """Ex: 'co2_eleve', 'temp_haute', 'reservoir_vide'"""

    # ─── Contexte ───
    valeur = Column(Float, nullable=True)
    """Valeur qui a declenche l'alerte"""
    seuil = Column(Float, nullable=True)
    """Seuil qui a ete depasse"""

    # ─── Gravite ───
    severite = Column(String(10), nullable=False, default="haute")
    """'basse', 'haute', 'critique'"""
    message = Column(Text, nullable=False)
    """Message destine au dashboard"""

    # ─── Suivi ───
    etat = Column(String(15), nullable=False, default="active")
    """'active', 'reconnue', 'resolue'"""
    date_debut = Column(DateTime, default=func.now())
    date_fin = Column(DateTime, nullable=True)
    """Resolue le ... (NULL si encore active)"""

    # ─── FK ───
    id_parcelle = Column(Integer, ForeignKey("parcelles.id"), nullable=False)
    id_mesure = Column(Integer, ForeignKey("mesures.id"), nullable=True)
    """NULL si l'alerte vient d'une action"""
    id_action = Column(Integer, ForeignKey("actions.id"), nullable=True)
    """NULL si l'alerte vient d'une mesure"""

    # ─── Horodatage ───
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # ─── Relations ───
    parcelle = relationship("Parcelle", back_populates="alertes")

    # ─── Methodes ───
    def __repr__(self):
        return f"<Alerte(id={self.id}, type='{self.type}', etat='{self.etat}')>"

    def to_dict(self):
        return {
            "id": self.id,
            "type": self.type,
            "valeur": self.valeur,
            "seuil": self.seuil,
            "severite": self.severite,
            "message": self.message,
            "etat": self.etat,
            "date_debut": self.date_debut.isoformat() if self.date_debut else None,
            "date_fin": self.date_fin.isoformat() if self.date_fin else None,
            "id_parcelle": self.id_parcelle,
            "id_mesure": self.id_mesure,
            "id_action": self.id_action,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def est_active(self):
        """Retourne True si l'alerte est encore active."""
        return self.etat == "active"

    def reconnaitre(self):
        """Marque l'alerte comme reconnue (l'utilisateur l'a vue)."""
        if self.etat == "active":
            self.etat = "reconnue"

    def resoudre(self):
        """Marque l'alerte comme resolue."""
        from datetime import datetime
        self.etat = "resolue"
        self.date_fin = datetime.utcnow()
