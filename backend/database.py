"""
database.py — Configuration de la base de donnees PostgreSQL.

Ce fichier contient :
- La classe Base (mere de tous les modeles SQLAlchemy)
- La configuration de connexion a PostgreSQL
- La session de travail
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# ─── URL de connexion a PostgreSQL ───
# Format : postgresql://utilisateur:mot_de_passe@hote:port/nom_base
# A modifier selon votre environnement
DATABASE_URL = "postgresql://sai_user:sai_password@localhost:5432/sai_db"

# ─── Moteur de connexion ───
# la connexion avc PostgreSQL
engine = create_engine(DATABASE_URL)


# ─── Session de travail pour la conversion avec la BD ───
# Chaque requete a la BD se fait via une session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ─── Classe mere de TOUS les modeles ───
# Toutes nos classes (Utilisateur, Capteur, etc.) vont heriter de Base et des propriété SQL
Base = declarative_base()


# ─── Fonction utilitaire pour obtenir une session ───
def get_db():
    #get_db: c'est un générateur qui s'utilise avec `with` ou comme dépendance FastAPI
    """Genere une session de BD et la ferme automatiquement apres usage."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
