"""
Modele Actionneur.

Represente un actionneur physique (pompe, ventilation, eclairage)
attache a une parcelle.
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from database import Base


class Actionneur(Base):
    __tablename__ = "actionneurs"

    # ─── Identite ───
    id = Column(Integer, primary_key=True)
    nom = Column(String(20), nullable=False)
    """Ex: 'pompe', 'ventilation', 'eclairage'"""
    reference = Column(String(50), nullable=True)

    # ─── Configuration broche ───
    gpio = Column(Integer, nullable=False)
    """Numero de broche GPIO sur l'ESP32"""

    # ─── Etat ───
    etat = Column(String(10), nullable=False, default="inactif")
    """actif, inactif"""

    # ─── FK ───
    id_parcelle = Column(Integer, ForeignKey("parcelles.id"), nullable=False)

    # ─── Horodatage ───
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # ─── Relations ───
    parcelle = relationship("Parcelle", back_populates="actionneurs")
    commandes = relationship("Commande", back_populates="actionneur")

    # ─── Methodes ───
    def __repr__(self):
        return f"<Actionneur(id={self.id}, nom='{self.nom}', gpio={self.gpio})>"

    def to_dict(self):
        return {
            "id": self.id,
            "nom": self.nom,
            "reference": self.reference,
            "gpio": self.gpio,
            "etat": self.etat,
            "id_parcelle": self.id_parcelle,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def activer(self):
        """Active l'actionneur."""
        self.etat = "actif"

    def desactiver(self):
        """Desactive l'actionneur."""
        self.etat = "inactif"

    def est_actif(self):
        """Retourne True si l'actionneur est actif."""
        return self.etat == "actif"
