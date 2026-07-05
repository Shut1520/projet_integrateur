"""
Modele Parcelle.

Represente une zone de culture (serre, champ, etc.)
appartenant a un utilisateur.
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from database import Base


class Parcelle(Base):
    __tablename__ = "parcelles"

    # ─── Identite ───
    id = Column(Integer, primary_key=True)
    """Identifiant unique (PK auto-increment)"""

    nom = Column(String(100), nullable=False)
    """Nom de la parcelle (ex: 'Serre A', 'Champ Nord')"""

    localisation = Column(String(255), nullable=True)
    """Description de l'emplacement (optionnel)"""

    # ─── Cles etrangeres ───
    id_utilisateur = Column(Integer, ForeignKey("utilisateurs.id"), nullable=False)
    """FK vers l'utilisateur qui gere cette parcelle"""

    # ─── Horodatage ───
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # ─── Relations ORM ───
    proprietaire = relationship("Utilisateur", back_populates="parcelles")
    """
    Lien vers l'utilisateur proprietaire.
    Permet de faire : parcelle.proprietaire.nom → "Jean"
    """

    capteurs = relationship("Capteur", back_populates="parcelle", cascade="all, delete-orphan")
    """
    Liste des capteurs de cette parcelle.
    cascade='all, delete-orphan' = si on supprime la parcelle,
    tous ses capteurs sont supprimes aussi (COMPOSITION).
    """

    actionneurs = relationship("Actionneur", back_populates="parcelle", cascade="all, delete-orphan")
    """
    Liste des actionneurs de cette parcelle.
    Meme comportement de cascade (COMPOSITION).
    """

    seuils = relationship("Seuil", back_populates="parcelle", cascade="all, delete-orphan")
    """
    Liste des seuils definis pour cette parcelle (COMPOSITION).
    """

    # ─── Methodes ───
    def __repr__(self):
        return f"<Parcelle(id={self.id}, nom='{self.nom}')>"

    def to_dict(self):
        return {
            "id": self.id,
            "nom": self.nom,
            "localisation": self.localisation,
            "id_utilisateur": self.id_utilisateur,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def obtenir_nombre_capteurs_actifs(self):
        """Compte les capteurs actifs de cette parcelle."""
        return sum(1 for capteur in self.capteurs if capteur.etat == "actif")
