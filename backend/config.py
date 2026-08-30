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

# ─── PostgreSQL ───
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://sai_user:sai_password@localhost:5432/sai_db")
DB_SUPERUSER = os.getenv("DB_SUPERUSER", "postgres")
DB_SUPERPASS = os.getenv("DB_SUPERPASS", "")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "sai_db")
DB_USER = os.getenv("DB_USER", "sai_user")
DB_PASS = os.getenv("DB_PASS", "sai_password")
