"""
conftest.py — Fixtures partagees pour tous les tests pytest.

Fournit :
- client : TestClient FastAPI
- db : session SQLAlchemy (test DB reelle)
- admin_token / agriculteur_token : JWT pre-genere
- create_* : helpers pour creer des donnees de test
"""

import os
import sys

# Ajoute le dossier backend au PYTHONPATH
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

# Neutralise le subscriber MQTT (thread de main.py) pendant les tests.
os.environ["SAI_MQTT_DISABLED"] = "1"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from database import Base, get_db
from main import app
from models.utilisateur import Utilisateur
from models.parcelle import Parcelle
from models.capteur import Capteur
from models.actionneur import Actionneur
from models.seuil import Seuil
from models.commande import Commande
from models.mesure import Mesure
from models.token import Token
from services.auth_service import creer_token, inscrire
from werkzeug.security import generate_password_hash

# ─── Configuration DB de test ───
# BD de test dediee (sai_test) : isolee de la BD de production sai_db,
# pour empecher que les tests ne polluent les donnees reelles.
DB_URL = "postgresql://sai_user:sai_password@localhost:5432/sai_test"
engine = create_engine(DB_URL)
TestSession = sessionmaker(bind=engine)


# ─── Fixtures ───
@pytest.fixture(scope="session", autouse=True)
def _desactiver_rate_limit():
    """
    Desactive le rate limiting (slowapi) pendant toute la suite.
    Evite les 429 flaky quand de nombreux tests frappent le meme endpoint
    (ex: POST /api/commandes, tous partagent la meme IP du TestClient).
    """
    from services.rate_limit import limiter

    limiter.enabled = False
    yield
    limiter.enabled = True


@pytest.fixture(scope="function")
def db():
    """Session DB isolee par test (commit + rollback)."""
    session = TestSession()
    try:
        yield session
    finally:
        session.rollback()
        session.close()


@pytest.fixture(scope="function")
def client(db):
    """TestClient avec override de la dependency DB."""
    def _override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app, raise_server_exceptions=False) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def admin(db):
    """Cree ou recupere l'admin de test et retourne l'objet + token."""
    email = "test_admin@sai.com"
    user = db.query(Utilisateur).filter(Utilisateur.email == email).first()
    if not user:
        user = Utilisateur(
            nom="Test Admin",
            email=email,
            password_hash=generate_password_hash("admin1234"),
            role="admin",
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    token = creer_token(user.id)
    return user, token


@pytest.fixture(scope="function")
def agriculteur(db):
    """Cree ou recupere l'agriculteur de test et retourne l'objet + token."""
    email = "test_agri@sai.com"
    user = db.query(Utilisateur).filter(Utilisateur.email == email).first()
    if not user:
        user = Utilisateur(
            nom="Test Agri",
            email=email,
            password_hash=generate_password_hash("agri1234"),
            role="agriculteur",
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    token = creer_token(user.id)
    return user, token


@pytest.fixture(scope="function")
def parcelle(db, agriculteur):
    """Cree une parcelle de test rattachee a l'agriculteur."""
    p = db.query(Parcelle).filter(Parcelle.nom == "Test Parcelle").first()
    if not p:
        p = Parcelle(
            nom="Test Parcelle",
            localisation="Localisation test",
            id_utilisateur=agriculteur[0].id,
        )
        db.add(p)
        db.commit()
        db.refresh(p)
    return p


@pytest.fixture(scope="function")
def capteur(db, parcelle):
    """Cree un capteur de test sur la parcelle."""
    c = db.query(Capteur).filter(Capteur.nom == "test_dht22").first()
    if not c:
        c = Capteur(
            nom="test_dht22",
            reference="AM2302",
            gpio=4,
            protocole="digital",
            etat="actif",
            id_parcelle=parcelle.id,
        )
        db.add(c)
        db.commit()
        db.refresh(c)
    return c


@pytest.fixture(scope="function")
def actionneur(db, parcelle):
    """Cree un actionneur de test sur la parcelle."""
    a = db.query(Actionneur).filter(Actionneur.nom == "test_pompe").first()
    if not a:
        a = Actionneur(
            nom="test_pompe",
            reference="Pompe 12V",
            gpio=26,
            etat="inactif",
            id_parcelle=parcelle.id,
        )
        db.add(a)
        db.commit()
        db.refresh(a)
    return a


@pytest.fixture(scope="function")
def cle_api(db, admin):
    """Cree (ou recupere) une cle API valide pour le client IoT (ESP32)."""
    from datetime import datetime, timedelta, timezone

    user, _ = admin
    token = db.query(Token).filter(Token.nom == "cle_iot_test").first()
    if not token:
        token = Token(
            cle_api="sk_sai_test_" + "a" * 64,
            nom="cle_iot_test",
            actif=True,
            expires_at=datetime.now(timezone.utc) + timedelta(days=365),
            id_utilisateur=user.id,
        )
        db.add(token)
        db.commit()
        db.refresh(token)
    return token


def cle_api_headers(cle_api: Token) -> dict:
    """Retourne le header X-API-Key pour le TestClient."""
    return {"X-API-Key": cle_api.cle_api}


# ─── Helpers ───
def auth_header(token: str) -> dict:
    """Retourne le header Authorization pour le TestClient."""
    return {"Authorization": f"Bearer {token}"}
