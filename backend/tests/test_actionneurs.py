"""
Tests CRUD pour les actionneurs.

- GET    /api/actionneurs
- GET    /api/actionneurs/{id}
- POST   /api/actionneurs
- PUT    /api/actionneurs/{id}
- DELETE /api/actionneurs/{id}
"""

import pytest
from tests.conftest import auth_header


class TestListerActionneurs:
    def test_liste_vide(self, client, admin):
        _, token = admin
        r = client.get("/api/actionneurs", headers=auth_header(token))
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_liste_avec_donnees(self, client, admin, actionneur):
        _, token = admin
        r = client.get("/api/actionneurs", headers=auth_header(token))
        assert r.status_code == 200
        assert len(r.json()) >= 1


class TestLireActionneur:
    def test_lire_ok(self, client, admin, actionneur):
        _, token = admin
        r = client.get(f"/api/actionneurs/{actionneur.id}", headers=auth_header(token))
        assert r.status_code == 200
        assert r.json()["nom"] == "test_pompe"

    def test_actionneur_inexistant(self, client, admin):
        _, token = admin
        r = client.get("/api/actionneurs/9999", headers=auth_header(token))
        assert r.status_code == 404


class TestCreerActionneur:
    def test_creer_ok(self, client, admin, parcelle):
        _, token = admin
        r = client.post("/api/actionneurs", headers=auth_header(token), json={
            "nom": "ventilation",
            "reference": "Ventilateur 120mm",
            "gpio": 27,
            "etat": "inactif",
            "id_parcelle": parcelle.id,
        })
        assert r.status_code == 201
        assert r.json()["nom"] == "ventilation"

    def test_creer_sans_nom(self, client, admin, parcelle):
        _, token = admin
        r = client.post("/api/actionneurs", headers=auth_header(token), json={
            "gpio": 27,
            "id_parcelle": parcelle.id,
        })
        assert r.status_code == 422


class TestModifierActionneur:
    def test_modifier_ok(self, client, admin, actionneur):
        _, token = admin
        r = client.put(f"/api/actionneurs/{actionneur.id}", headers=auth_header(token), json={
            "etat": "actif",
        })
        assert r.status_code == 200
        assert r.json()["etat"] == "actif"

    def test_modifier_inexistant(self, client, admin):
        _, token = admin
        r = client.put("/api/actionneurs/9999", headers=auth_header(token), json={
            "etat": "actif",
        })
        assert r.status_code == 404


class TestSupprimerActionneur:
    def test_supprimer_ok(self, client, admin, parcelle):
        _, token = admin
        r = client.post("/api/actionneurs", headers=auth_header(token), json={
            "nom": "a_supprimer",
            "gpio": 28,
            "id_parcelle": parcelle.id,
        })
        id_actionneur = r.json()["id"]
        r = client.delete(f"/api/actionneurs/{id_actionneur}", headers=auth_header(token))
        assert r.status_code == 204

    def test_supprimer_inexistant(self, client, admin):
        _, token = admin
        r = client.delete("/api/actionneurs/9999", headers=auth_header(token))
        assert r.status_code == 404
