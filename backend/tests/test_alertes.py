"""
Tests CRUD pour les alertes.

- GET    /api/alertes
- GET    /api/alertes/{id}
- POST   /api/alertes
- PUT    /api/alertes/{id}
- DELETE /api/alertes/{id}
"""

import pytest
from tests.conftest import auth_header


class TestListerAlertes:
    def test_liste(self, client, admin):
        _, token = admin
        r = client.get("/api/alertes", headers=auth_header(token))
        assert r.status_code == 200
        assert isinstance(r.json(), list)


class TestCreerAlerte:
    def test_creer_ok(self, client, admin, parcelle):
        _, token = admin
        r = client.post("/api/alertes", headers=auth_header(token), json={
            "type": "co2_eleve",
            "valeur": 1100.0,
            "seuil": 1000.0,
            "severite": "haute",
            "message": "CO2 depasse le seuil",
            "etat": "active",
            "id_parcelle": parcelle.id,
        })
        assert r.status_code == 201
        assert r.json()["type"] == "co2_eleve"

    def test_creer_manque_message(self, client, admin, parcelle):
        _, token = admin
        r = client.post("/api/alertes", headers=auth_header(token), json={
            "type": "temp_haute",
            "severite": "critique",
            "id_parcelle": parcelle.id,
        })
        assert r.status_code == 422


class TestModifierAlerte:
    def test_modifier_ok(self, client, admin, parcelle):
        _, token = admin
        r = client.post("/api/alertes", headers=auth_header(token), json={
            "type": "test_modif",
            "severite": "basse",
            "message": "Test",
            "id_parcelle": parcelle.id,
        })
        alerte_id = r.json()["id"]
        r = client.put(f"/api/alertes/{alerte_id}", headers=auth_header(token), json={
            "etat": "reconnue",
        })
        assert r.status_code == 200
        assert r.json()["etat"] == "reconnue"


class TestSupprimerAlerte:
    def test_supprimer_inexistant(self, client, admin):
        _, token = admin
        r = client.delete("/api/alertes/9999", headers=auth_header(token))
        assert r.status_code == 405
