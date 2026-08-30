"""
Tests CRUD pour les seuils.

- GET    /api/seuils
- GET    /api/seuils/{id}
- POST   /api/seuils
- PUT    /api/seuils/{id}
- DELETE /api/seuils/{id}
"""

import pytest
from tests.conftest import auth_header


class TestListerSeuils:
    def test_liste(self, client, admin):
        _, token = admin
        r = client.get("/api/seuils", headers=auth_header(token))
        assert r.status_code == 200
        assert isinstance(r.json(), list)


class TestCreerSeuil:
    def test_creer_ok(self, client, admin, parcelle):
        user, token = admin
        r = client.post("/api/seuils", headers=auth_header(token), json={
            "type_mesure": "temperature",
            "valeur_min": 15.0,
            "valeur_max": 35.0,
            "unite": "C",
            "id_utilisateur": user.id,
            "id_parcelle": parcelle.id,
        })
        assert r.status_code == 201
        assert r.json()["type_mesure"] == "temperature"

    def test_creer_manque_champ(self, client, admin, parcelle):
        user, token = admin
        r = client.post("/api/seuils", headers=auth_header(token), json={
            "type_mesure": "temperature",
            "unite": "C",
            "id_utilisateur": user.id,
            "id_parcelle": parcelle.id,
        })
        assert r.status_code == 422


class TestModifierSeuil:
    def test_modifier_ok(self, client, admin, parcelle):
        user, token = admin
        r = client.post("/api/seuils", headers=auth_header(token), json={
            "type_mesure": "humidite",
            "valeur_min": 30.0,
            "valeur_max": 70.0,
            "unite": "%",
            "id_utilisateur": user.id,
            "id_parcelle": parcelle.id,
        })
        seuil_id = r.json()["id"]
        r = client.put(f"/api/seuils/{seuil_id}", headers=auth_header(token), json={
            "valeur_max": 80.0,
        })
        assert r.status_code == 200
        assert r.json()["valeur_max"] == 80.0


class TestSupprimerSeuil:
    def test_supprimer_ok(self, client, admin, parcelle):
        user, token = admin
        r = client.post("/api/seuils", headers=auth_header(token), json={
            "type_mesure": "co2",
            "valeur_min": 400.0,
            "valeur_max": 1200.0,
            "unite": "ppm",
            "id_utilisateur": user.id,
            "id_parcelle": parcelle.id,
        })
        seuil_id = r.json()["id"]
        r = client.delete(f"/api/seuils/{seuil_id}", headers=auth_header(token))
        assert r.status_code == 204

    def test_supprimer_inexistant(self, client, admin):
        _, token = admin
        r = client.delete("/api/seuils/9999", headers=auth_header(token))
        assert r.status_code == 404
