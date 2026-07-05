"""
Modele Capteur.

Represente un capteur physique (DHT22, YL-69, BH1750, etc.)
attache a une parcelle.
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from database import Base


class Capteur(Base):
    __tablename__ = "capteurs"

    # ─── Identite ───
    id = Column(Integer, primary_key=True)
    nom = Column(String(30), nullable=False)
    """Ex: 'dht22', 'yl-69', 'bh1750'"""
    reference = Column(String(50), nullable=True)
    """Reference fabricant (ex: 'AM2302' pour le DHT22)"""

    # ─── Configuration broche ───
    gpio = Column(Integer, nullable=False)
    """Numero de broche GPIO sur l'ESP32"""
    protocole = Column(String(10), nullable=False, default="digital")
    """digital, analog, i2c (CHECK dans la BD)"""

    # ─── Etat ───
    etat = Column(String(15), nullable=False, default="actif")
    """actif, inactif, defaillant"""

    # ─── FK ───
    id_parcelle = Column(Integer, ForeignKey("parcelles.id"), nullable=False)

    # ─── Horodatage ───
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # ─── Relations ───
    parcelle = relationship("Parcelle", back_populates="capteurs")
    mesures = relationship("Mesure", back_populates="capteur", cascade="all, delete-orphan")

    # ─── Methodes ───
    def __repr__(self):
        return f"<Capteur(id={self.id}, nom='{self.nom}', gpio={self.gpio})>"

    def to_dict(self):
        return {
            "id": self.id,
            "nom": self.nom,
            "reference": self.reference,
            "gpio": self.gpio,
            "protocole": self.protocole,
            "etat": self.etat,
            "id_parcelle": self.id_parcelle,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def est_actif(self):
        """Retourne True si le capteur est actif."""
        return self.etat == "actif"
