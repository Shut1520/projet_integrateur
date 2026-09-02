"""
Tests du subscriber MQTT (services/mqtt_service.py).

Valident le parsing du payload spec multi-mesures et son insertion en base.
Pas de broker requis : on appelle directement le traitement du payload.
"""

import uuid

import pytest

import services.mqtt_service as mq
from models.parcelle import Parcelle
from models.capteur import Capteur
from models.mesure import Mesure
from models.utilisateur import Utilisateur
from werkzeug.security import generate_password_hash


@pytest.fixture(scope="function")
def mqtt_utilisateur(db):
    """Utilisateur de test avec email unique (evite la pollution croisee)."""
    email = f"mqtt_{uuid.uuid4().hex[:8]}@sai.com"
    u = Utilisateur(
        nom="MQTT Test",
        email=email,
        password_hash=generate_password_hash("mqtt1234"),
        role="agriculteur",
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    return u


@pytest.fixture(scope="function")
def mqtt_parcelle(db, mqtt_utilisateur):
    """Parcelle dediee (nom unique) + capteur 'dht22' actif."""
    nom = f"Parc MQTT {uuid.uuid4().hex[:6]}"
    p = Parcelle(
        nom=nom,
        localisation="MQTT test",
        id_utilisateur=mqtt_utilisateur.id,
    )
    db.add(p)
    db.commit()
    db.refresh(p)

    c = Capteur(
        nom="dht22",
        reference="AM2302",
        gpio=4,
        protocole="digital",
        etat="actif",
        id_parcelle=p.id,
    )
    db.add(c)
    db.commit()
    db.refresh(c)

    return {"parcelle": p, "capteur": c}


def test_resoudre_capteur_trouve(db, mqtt_parcelle):
    """Le mapping (type 'temperature' -> nom 'dht22') retrouve le capteur."""
    id_c = mq._resoudre_capteur(db, mqtt_parcelle["parcelle"].nom, "temperature")
    assert id_c == mqtt_parcelle["capteur"].id


def test_resoudre_capteur_type_inconnu(db, mqtt_parcelle):
    """Un type non mappe retourne None (rien a inserer)."""
    assert mq._resoudre_capteur(db, mqtt_parcelle["parcelle"].nom, "inconnu") is None


def test_resoudre_capteur_parcelle_inconnue(db, mqtt_parcelle):
    """Une parcelle inconnue retourne None."""
    assert mq._resoudre_capteur(db, "aucune_parcelle", "temperature") is None


def test_traiter_payload_insere_mesure(db, mqtt_parcelle):
    """Un payload spec multi-mesures insere une Mesure avec la bonne unite."""
    parcelle = mqtt_parcelle["parcelle"]
    capteur = mqtt_parcelle["capteur"]

    payload = {
        "device_id": "esp32_test",
        "parcelle": parcelle.nom,
        "timestamp": "2026-09-01T10:00:00Z",
        "temperature": 28.4,
    }
    nb = mq._traiter_mesures(db, parcelle.nom, payload)

    assert nb == 1
    m = (
        db.query(Mesure)
        .filter(Mesure.id_capteur == capteur.id)
        .order_by(Mesure.id.desc())
        .first()
    )
    assert m is not None
    assert m.valeur == 28.4
    assert m.unite == "°C"
    assert m.source == "esp32"


def test_traiter_payload_insere_humidite_air(db, mqtt_parcelle):
    """'humidite_air' est mappe sur le capteur dht22 avec l'unite % (Phase 7)."""
    parcelle = mqtt_parcelle["parcelle"]
    capteur = mqtt_parcelle["capteur"]

    payload = {
        "device_id": "esp32_test",
        "parcelle": parcelle.nom,
        "timestamp": "2026-09-01T10:00:00Z",
        "humidite_air": 61.5,
    }
    nb = mq._traiter_mesures(db, parcelle.nom, payload)

    assert nb == 1
    m = (
        db.query(Mesure)
        .filter(Mesure.id_capteur == capteur.id)
        .order_by(Mesure.id.desc())
        .first()
    )
    assert m is not None
    assert m.valeur == 61.5
    assert m.unite == "%"


def test_traiter_payload_ignore_cles_non_numeriques(db, mqtt_parcelle):
    """Les cles spec (device_id, parcelle, etc.) sont ignorees, pas inserees."""
    parcelle = mqtt_parcelle["parcelle"]
    avant = db.query(Mesure).count()
    payload = {
        "device_id": "esp32_test",
        "parcelle": parcelle.nom,
        "temperature": "abc",  # non numerique -> ignore
    }
    nb = mq._traiter_mesures(db, parcelle.nom, payload)
    assert nb == 0
    assert db.query(Mesure).count() == avant
