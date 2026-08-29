"""
Modele Utilisateur.

Represente un agriculteur ou un administrateur du systeme.
Herite de Base pour etre persiste en base de donnees.
"""

from sqlalchemy import Boolean, Column, Integer, String, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from database import Base


class Utilisateur(Base):
    __tablename__ = "utilisateurs"

    # ─── Identite ───
    id = Column(Integer, primary_key=True)
    """Identifiant unique (SERIAL → Integer + primary_key)"""

    nom = Column(String(100), nullable=False)
    """Nom complet de l'utilisateur (VARCHAR(100) NOT NULL)"""

    email = Column(String(150), unique=True, nullable=False)
    """Email de connexion (UNIQUE NOT NULL)"""

    password_hash = Column(String(255), nullable=False)
    """Mot de passe hashé avec bcrypt (jamais expose dans l'API)"""

    # ─── Role ───
    role = Column(String(20), nullable=False, default="agriculteur")
    """Role : 'agriculteur' ou 'admin' (la contrainte CHECK sera dans la BD)"""

    # ─── Etat du compte ───
    actif = Column(Boolean, nullable=False, default=True)
    """True = actif, False = desactive (ne peut plus se connecter)"""

    # ─── Horodatage ───
    created_at = Column(DateTime, default=func.now())
    """Date de creation du compte (DEFAULT NOW())"""

    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    """Date de derniere modification (se met a jour automatiquement)"""

    # ─── Relations ORM ───
    parcelles = relationship("Parcelle", back_populates="proprietaire", cascade="all, delete-orphan")
    """Parcelles gerees par cet utilisateur"""

    commandes = relationship("Commande", back_populates="emetteur", cascade="all, delete-orphan")
    """Commandes soumises par cet utilisateur"""

    tokens = relationship("Token", back_populates="proprietaire", cascade="all, delete-orphan")
    """Cles API possedees par cet utilisateur (COMPOSITION)"""

    seuils_configures = relationship("Seuil", back_populates="configurateur", cascade="all, delete-orphan")
    """Seuils configures par cet utilisateur"""

    # ─── Methodes ───
    def __repr__(self):
        """Representation lisible pour le debogage."""
        return f"<Utilisateur(id={self.id}, nom='{self.nom}', email='{self.email}')>"

    def to_dict(self):
        """Convertit en dictionnaire JSON pour l'API REST."""
        return {
            "id": self.id,
            "nom": self.nom,
            "email": self.email,
            "role": self.role,
            "actif": self.actif,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def verifier_mot_de_passe(self, mot_de_passe: str) -> bool:
        """Compare un mot de passe avec le hash stocké (via bcrypt)."""
        from werkzeug.security import check_password_hash  # ou bcrypt
        return check_password_hash(self.password_hash, mot_de_passe)

    def est_admin(self) -> bool:
        """Retourne True si l'utilisateur est administrateur."""
        return self.role == "admin"
