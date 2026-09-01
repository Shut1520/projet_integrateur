"""
Tests pour les mesures.

- GET  /api/mesures
- POST /api/mesures  (require une cle API)
"""

import pytest
from tests.conftest import auth_header, cle_api_headers


class TestListerMesures:
    def test_liste(self, client, admin):
        _, token = admin
        r = client.get("/api/mesures", headers=auth_header(token))
        assert r.status_code == 200
        assert isinstance(r.json(), list)


class TestCreerMesure:
    def test_creer_cle_api_ok(self, client, capteur, cle_api):
        """POST /api/mesures require une cle API (ESP32 push)."""
        r = client.post("/api/mesures", headers=cle_api_headers(cle_api), json={
            "valeur": 25.5,
            "unite": "C",
            "source": "esp32",
            "id_capteur": capteur.id,
        })
        assert r.status_code == 201
        data = r.json()
        assert data["valeur"] == 25.5
        assert data["unite"] == "C"

    def test_creer_sans_cle_refuse(self, client, capteur):
        """Sans cle API, la creation est refusee (401)."""
        r = client.post("/api/mesures", json={
            "valeur": 25.5,
            "unite": "C",
            "source": "esp32",
            "id_capteur": capteur.id,
        })
        assert r.status_code == 401

    def test_creer_manque_valeur(self, client, capteur, cle_api):
        r = client.post("/api/mesures", headers=cle_api_headers(cle_api), json={
            "unite": "C",
            "source": "esp32",
            "id_capteur": capteur.id,
        })
        assert r.status_code == 422

    def test_creer_manque_capteur(self, client, cle_api):
        r = client.post("/api/mesures", headers=cle_api_headers(cle_api), json={
            "valeur": 25.5,
            "unite": "C",
            "source": "esp32",
        })
        assert r.status_code == 422
