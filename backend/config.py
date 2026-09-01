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

# ─── MQTT (broker Mosquitto, Phase 1) ───
# Le backend est subscriber : il recoit les mesures publiees par l'ESP32.
# Port 8883 = listener TLS du broker SAI (mosquitto/mosquitto.conf).
MQTT_BROKER = os.getenv("MQTT_BROKER", "localhost")
MQTT_PORT = int(os.getenv("MQTT_PORT", "8883"))
MQTT_TLS = os.getenv("MQTT_TLS", "true").lower() in ("1", "true", "yes", "on")
MQTT_USER = os.getenv("MQTT_USER", "sai_backend")
MQTT_PASS = os.getenv("MQTT_PASS", "sai_backend_pass")

# Chemin du certificat CA pour valider le broker TLS. Resolu en relatif par
# rapport a ce fichier (../mosquitto/certs/mosquitto_ca.crt), surchargeable.
_default_ca = os.path.normpath(
    os.path.join(os.path.dirname(__file__), "..", "mosquitto", "certs", "mosquitto_ca.crt")
)
MQTT_CA_CERT = os.getenv("MQTT_CA_CERT", _default_ca)

# ─── Topics MQTT (spec : sai/<parcelle>/...) ───
MQTT_TOPIC_MESURES = os.getenv("MQTT_TOPIC_MESURES", "sai/+/capteurs/#")
MQTT_TOPIC_ACTIONNEURS = os.getenv("MQTT_TOPIC_ACTIONNEURS", "sai/+/actionneurs/#")
MQTT_TOPIC_ALERTES = os.getenv("MQTT_TOPIC_ALERTES", "sai/+/alertes")
