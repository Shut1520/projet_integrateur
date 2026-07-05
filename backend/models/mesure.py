"""
Modele Mesure.

Represente une valeur lue par un capteur a un instant T.
Table a gros volume (~43 000 lignes/jour) : pas de created_at/updated_at.
"""

from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from database import Base


class Mesure(Base):
    __tablename__ = "mesures"

    # ─── Identite ───
    id = Column(Integer, primary_key=True)
    valeur = Column(Float, nullable=False)
    """Valeur mesuree (ex: 25.5, 68.2, 450)"""
    unite = Column(String(10), nullable=False)
    """Unite : '%', '°C', 'ppm', 'lux'"""
    source = Column(String(20), nullable=False, default="esp32")
    """Origine : 'esp32', 'manuel', 'simulation'"""

    # ─── Horodatage (pas de created_at, le timestamp suffit) ───
    timestamp = Column(DateTime, default=func.now())
    """Instant de la lecture"""

    # ─── FK ───
    id_capteur = Column(Integer, ForeignKey("capteurs.id"), nullable=False)

    # ─── Relations ───
    capteur = relationship("Capteur", back_populates="mesures")

    # ─── Methodes ───
    def __repr__(self):
        return f"<Mesure(id={self.id}, valeur={self.valeur}, unite='{self.unite}')>"

    def to_dict(self):
        return {
            "id": self.id,
            "valeur": self.valeur,
            "unite": self.unite,
            "source": self.source,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "id_capteur": self.id_capteur,
        }
