"""
Tests pour les mesures.

- GET  /api/mesures
- POST /api/mesures  (route publique pour ESP32)
"""

import pytest
from tests.conftest import auth_header


class TestListerMesures:
    def test_liste(self, client, admin):
        _, token = admin
        r = client.get("/api/mesures", headers=auth_header(token))
        assert r.status_code == 200
        assert isinstance(r.json(), list)


class TestCreerMesure:
    def test_creer_publique_ok(self, client, capteur):
        """POST /api/mesures est public (ESP32 push)."""
        r = client.post("/api/mesures", json={
            "valeur": 25.5,
            "unite": "C",
            "source": "esp32",
            "id_capteur": capteur.id,
        })
        assert r.status_code == 201
        data = r.json()
        assert data["valeur"] == 25.5
        assert data["unite"] == "C"

    def test_creer_manque_valeur(self, client, capteur):
        r = client.post("/api/mesures", json={
            "unite": "C",
            "source": "esp32",
            "id_capteur": capteur.id,
        })
        assert r.status_code == 422

    def test_creer_manque_capteur(self, client):
        r = client.post("/api/mesures", json={
            "valeur": 25.5,
            "unite": "C",
            "source": "esp32",
        })
        assert r.status_code == 422
