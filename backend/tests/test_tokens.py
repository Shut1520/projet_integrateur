"""
Tests CRUD pour les tokens API.

- GET    /api/tokens
- GET    /api/tokens/{id}
- POST   /api/tokens
- PUT    /api/tokens/{id}
- DELETE /api/tokens/{id}
"""

import pytest
from tests.conftest import auth_header


class TestListerTokens:
    def test_liste(self, client, admin):
        _, token = admin
        r = client.get("/api/tokens", headers=auth_header(token))
        assert r.status_code == 200
        assert isinstance(r.json(), list)


class TestCreerToken:
    def test_creer_ok(self, client, admin):
        user, token = admin
        r = client.post("/api/tokens", headers=auth_header(token), json={
            "nom": "Token Test",
            "id_utilisateur": user.id,
        })
        assert r.status_code == 201
        assert r.json()["nom"] == "Token Test"
        assert "cle_api" in r.json()

    def test_creer_manque_nom(self, client, admin):
        user, token = admin
        r = client.post("/api/tokens", headers=auth_header(token), json={
            "id_utilisateur": user.id,
        })
        assert r.status_code == 422


class TestModifierToken:
    def test_modifier_ok(self, client, admin):
        user, token = admin
        r = client.post("/api/tokens", headers=auth_header(token), json={
            "nom": "A Modifier",
            "id_utilisateur": user.id,
        })
        token_id = r.json()["id"]
        r = client.put(f"/api/tokens/{token_id}", headers=auth_header(token), json={
            "actif": False,
        })
        assert r.status_code == 200
        assert r.json()["actif"] is False


class TestSupprimerToken:
    def test_supprimer_ok(self, client, admin):
        user, token = admin
        r = client.post("/api/tokens", headers=auth_header(token), json={
            "nom": "A Supprimer",
            "id_utilisateur": user.id,
        })
        token_id = r.json()["id"]
        r = client.delete(f"/api/tokens/{token_id}", headers=auth_header(token))
        assert r.status_code == 204
