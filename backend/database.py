"""
database.py — Configuration de la base de donnees PostgreSQL.

Ce fichier contient :
- La classe Base (mere de tous les modeles SQLAlchemy)
- La configuration de connexion a PostgreSQL
- La session de travail
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

# ─── URL de connexion a PostgreSQL ───
from config import DATABASE_URL

# ─── Moteur de connexion ───
engine = create_engine(DATABASE_URL)


# ─── Session de travail pour la conversion avec la BD ───
# Chaque requete a la BD se fait via une session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ─── Classe mere de TOUS les modeles ───
# Toutes nos classes (Utilisateur, Capteur, etc.) vont heriter de Base et des propriete SQL
class Base(DeclarativeBase):
    pass


# ─── Fonction utilitaire pour obtenir une session ───
def get_db():
    #get_db: c'est un générateur qui s'utilise avec `with` ou comme dépendance FastAPI
    """Genere une session de BD et la ferme automatiquement apres usage."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
