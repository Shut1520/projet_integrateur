"""
Modele Token.

Represente une cle API pour l'authentification du CLI.
Chaque token appartient a un utilisateur.
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from datetime import datetime

from database import Base


class Token(Base):
    __tablename__ = "tokens"

    # ─── Identite ───
    id = Column(Integer, primary_key=True)
    cle_api = Column(String(255), unique=True, nullable=False)
    """Cle API (ex: 'sk_sai_abc123...')"""
    nom = Column(String(50), nullable=False)
    """Nom pour identifier la cle ('Ma cle PC', 'Script prod')"""

    # ─── Actif ? ───
    actif = Column(Boolean, nullable=False, default=True)
    """False = cle revoquee"""

    # ─── Dates ───
    created_at = Column(DateTime, default=func.now())
    expires_at = Column(DateTime, nullable=True)
    """Date d'expiration (NULL = pas d'expiration)"""
    last_used_at = Column(DateTime, nullable=True)
    """Derniere utilisation"""

    # ─── FK ───
    id_utilisateur = Column(Integer, ForeignKey("utilisateurs.id"), nullable=False)

    # ─── Relations ───
    proprietaire = relationship("Utilisateur", back_populates="tokens")

    # ─── Methodes ───
    def __repr__(self):
        return f"<Token(id={self.id}, nom='{self.nom}', actif={self.actif})>"

    def to_dict(self):
        return {
            "id": self.id,
            "cle_api": self.cle_api,
            "nom": self.nom,
            "actif": self.actif,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "last_used_at": self.last_used_at.isoformat() if self.last_used_at else None,
            "id_utilisateur": self.id_utilisateur,
        }

    def est_expire(self):
        """Verifie si le token a expire."""
        if self.expires_at is None:
            return False  # Pas de date d'expiration = jamais expire
        return datetime.utcnow() > self.expires_at

    def est_utilisable(self):
        """Retourne True si le token est actif ET non expire."""
        return self.actif and not self.est_expire()
