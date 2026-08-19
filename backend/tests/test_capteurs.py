"""
Tests CRUD pour les capteurs.

- GET    /api/capteurs
- GET    /api/capteurs/{id}
- POST   /api/capteurs
- PUT    /api/capteurs/{id}
- DELETE /api/capteurs/{id}
"""

import pytest
from tests.conftest import auth_header


class TestListerCapteurs:
    def test_liste_vide(self, client, admin):
        _, token = admin
        r = client.get("/api/capteurs", headers=auth_header(token))
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_liste_avec_donnees(self, client, admin, capteur):
        _, token = admin
        r = client.get("/api/capteurs", headers=auth_header(token))
        assert r.status_code == 200
        assert len(r.json()) >= 1


class TestLireCapteur:
    def test_lire_ok(self, client, admin, capteur):
        _, token = admin
        r = client.get(f"/api/capteurs/{capteur.id}", headers=auth_header(token))
        assert r.status_code == 200
        assert r.json()["nom"] == "test_dht22"

    def test_capteur_inexistant(self, client, admin):
        _, token = admin
        r = client.get("/api/capteurs/9999", headers=auth_header(token))
        assert r.status_code == 404


class TestCreerCapteur:
    def test_creer_ok(self, client, admin, parcelle):
        _, token = admin
        r = client.post("/api/capteurs", headers=auth_header(token), json={
            "nom": "bh1750",
            "reference": "BH1750",
            "gpio": 21,
            "protocole": "i2c",
            "etat": "actif",
            "id_parcelle": parcelle.id,
        })
        assert r.status_code == 201
        assert r.json()["nom"] == "bh1750"

    def test_creer_sans_gpio(self, client, admin, parcelle):
        _, token = admin
        r = client.post("/api/capteurs", headers=auth_header(token), json={
            "nom": "test",
            "protocole": "digital",
            "id_parcelle": parcelle.id,
        })
        assert r.status_code == 422


class TestModifierCapteur:
    def test_modifier_ok(self, client, admin, capteur):
        _, token = admin
        r = client.put(f"/api/capteurs/{capteur.id}", headers=auth_header(token), json={
            "etat": "inactif",
        })
        assert r.status_code == 200
        assert r.json()["etat"] == "inactif"

    def test_modifier_inexistant(self, client, admin):
        _, token = admin
        r = client.put("/api/capteurs/9999", headers=auth_header(token), json={
            "etat": "inactif",
        })
        assert r.status_code == 404


class TestSupprimerCapteur:
    def test_supprimer_ok(self, client, admin, parcelle):
        _, token = admin
        r = client.post("/api/capteurs", headers=auth_header(token), json={
            "nom": "a_supprimer",
            "gpio": 29,
            "protocole": "digital",
            "id_parcelle": parcelle.id,
        })
        id_capteur = r.json()["id"]
        r = client.delete(f"/api/capteurs/{id_capteur}", headers=auth_header(token))
        assert r.status_code == 204

    def test_supprimer_inexistant(self, client, admin):
        _, token = admin
        r = client.delete("/api/capteurs/9999", headers=auth_header(token))
        assert r.status_code == 404
