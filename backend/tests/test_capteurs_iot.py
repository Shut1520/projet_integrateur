"""
Tests de l'endpoint IoT GET /api/capteurs/iot?parcelle=<nom> (Phase 7).

Resolution des IDs capteurs pour le firmware : le firmware connait la parcelle
par NOM et a besoin du mapping type_mesure -> id_capteur (fallback HTTP mesures,
POST /api/mesures). Requiert une cle API.
"""

import pytest

from models.capteur import Capteur
from tests.conftest import cle_api_headers


@pytest.fixture(scope="function")
def parcelle_iot(db, parcelle):
    """Cree les capteurs mappes (dht22, bh1750) sur la parcelle de test.

    Les noms doivent correspondre precisement au mapping TYPE_A_CAPTEUR
    (dht22, bh1750...), sinon l'endpoint /iot ne les mappe pas.
    """
    if not db.query(Capteur).filter(
        Capteur.nom == "dht22", Capteur.id_parcelle == parcelle.id
    ).first():
        db.add(
            Capteur(
                nom="dht22",
                reference="AM2302",
                gpio=4,
                protocole="digital",
                etat="actif",
                id_parcelle=parcelle.id,
            )
        )
    if not db.query(Capteur).filter(
        Capteur.nom == "bh1750", Capteur.id_parcelle == parcelle.id
    ).first():
        db.add(
            Capteur(
                nom="bh1750",
                reference="BH1750",
                gpio=5,
                protocole="i2c",
                etat="actif",
                id_parcelle=parcelle.id,
            )
        )
    db.commit()
    return parcelle


def test_iot_resout_ids_capteurs(client, parcelle_iot, cle_api):
    """Le firmaware obtient le mapping type_mesure -> {id, nom, unite}."""
    r = client.get(
        f"/api/capteurs/iot?parcelle={parcelle_iot.nom}",
        headers=cle_api_headers(cle_api),
    )
    assert r.status_code == 200
    data = r.json()
    assert "temperature" in data
    assert "humidite_air" in data
    assert "luminosite" in data
    assert data["temperature"]["id"] > 0
    assert data["humidite_air"]["id"] > 0
    assert data["luminosite"]["unite"] == "%"


def test_iot_parcelle_inconnue_404(client, cle_api):
    """Une parcelle inconnue renvoie 404."""
    r = client.get(
        "/api/capteurs/iot?parcelle=aucune",
        headers=cle_api_headers(cle_api),
    )
    assert r.status_code == 404


def test_iot_necessite_cle(client, parcelle_iot, admin):
    """Sans cle API, l'acces a /iot est refuse."""
    _, token = admin
    r = client.get(
        f"/api/capteurs/iot?parcelle={parcelle_iot.nom}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 401
