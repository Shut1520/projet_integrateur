"""
config.py — Configuration centralisee via variables d'environnement.

Charge le fichier .env et expose toutes les constantes
utilisees par le backend (JWT, PostgreSQL, etc.).
"""

import os
from dotenv import load_dotenv

# Charge le fichier .env situe a la racine du backend
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

# ─── JWT ───
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "fallback_changez_en_production")

# ─── Rate limiting (slowapi) ───
# Limite par defaut appliquee a toutes les routes (par IP).
RATE_LIMIT_DEFAULT = os.getenv("RATE_LIMIT_DEFAULT", "120/minute")
# Limite specifique pour l'ingestion de mesures (POST /api/mesures) :
# l'ESP32 pousse normalement ~1 mesure/30 s par capteur → 60/min suffit.
RATE_LIMIT_MESURES = os.getenv("RATE_LIMIT_MESURES", "60/minute")
# Limite pour les routes d'ecriture sensibles (commandes, tokens, login...).
RATE_LIMIT_ECRITURES = os.getenv("RATE_LIMIT_ECRITURES", "20/minute")

# ─── PostgreSQL ───
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://sai_user:sai_password@localhost:5432/sai_db")
DB_SUPERUSER = os.getenv("DB_SUPERUSER", "postgres")
DB_SUPERPASS = os.getenv("DB_SUPERPASS", "")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "sai_db")
DB_USER = os.getenv("DB_USER", "sai_user")
DB_PASS = os.getenv("DB_PASS", "sai_password")
