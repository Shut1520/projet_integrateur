"""
Modele Seuil.

Represente une regle de configuration definissant
les valeurs limites pour l'automatisation.
Est compose par Parcelle et configure par Utilisateur.
"""

from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from database import Base


class Seuil(Base):
    __tablename__ = "seuils"

    # ─── Identite ───
    id = Column(Integer, primary_key=True)
    type_mesure = Column(String(20), nullable=False)
    """Ex: 'humidite_sol', 'temperature', 'co2', 'luminosite', 'niveau_eau'"""

    # ─── Valeurs ───
    valeur_min = Column(Float, nullable=False)
    """Seuil bas (ex: 30% pour l'humidite)"""
    valeur_max = Column(Float, nullable=False)
    """Seuil haut (ex: 50% pour l'humidite)"""
    unite = Column(String(10), nullable=False)
    """Unite : '%', '°C', 'ppm', 'lux'"""

    # ─── FK ───
    id_utilisateur = Column(Integer, ForeignKey("utilisateurs.id"), nullable=False)
    """Qui a configure ce seuil"""
    id_parcelle = Column(Integer, ForeignKey("parcelles.id"), nullable=False)
    """Pour quelle parcelle"""

    # ─── Horodatage ───
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # ─── Relations ───
    configurateur = relationship("Utilisateur", back_populates="seuils_configures")
    parcelle = relationship("Parcelle", back_populates="seuils")

    # ─── Methodes ───
    def __repr__(self):
        return f"<Seuil(id={self.id}, type='{self.type_mesure}', min={self.valeur_min}, max={self.valeur_max})>"

    def to_dict(self):
        return {
            "id": self.id,
            "type_mesure": self.type_mesure,
            "valeur_min": self.valeur_min,
            "valeur_max": self.valeur_max,
            "unite": self.unite,
            "id_utilisateur": self.id_utilisateur,
            "id_parcelle": self.id_parcelle,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def est_depasse(self, valeur):
        """
        Verifie si une valeur depasse l'intervalle [min, max].
        Retourne True si valeur < min OU valeur > max.
        """
        return valeur < self.valeur_min or valeur > self.valeur_max
