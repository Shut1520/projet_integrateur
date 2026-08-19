"""
Tests CRUD pour les utilisateurs.

- GET    /api/utilisateurs
- GET    /api/utilisateurs/{id}
- POST   /api/utilisateurs
- PUT    /api/utilisateurs/{id}
- DELETE /api/utilisateurs/{id}
"""

import pytest
import time
from tests.conftest import auth_header


class TestListerUtilisateurs:
    def test_liste(self, client, admin):
        _, token = admin
        r = client.get("/api/utilisateurs", headers=auth_header(token))
        assert r.status_code == 200
        assert isinstance(r.json(), list)
        assert len(r.json()) >= 1


class TestLireUtilisateur:
    def test_lire_ok(self, client, admin):
        user, token = admin
        r = client.get(f"/api/utilisateurs/{user.id}", headers=auth_header(token))
        assert r.status_code == 200
        assert r.json()["email"] == user.email

    def test_utilisateur_inexistant(self, client, admin):
        _, token = admin
        r = client.get("/api/utilisateurs/9999", headers=auth_header(token))
        assert r.status_code == 404


class TestCreerUtilisateur:
    def test_creer_ok(self, client, admin):
        _, token = admin
        r = client.post("/api/utilisateurs", headers=auth_header(token), json={
            "nom": "Nouvel Utilisateur",
            "email": f"nouveau_create_{int(time.time())}@test.com",
            "password": "securepass123",
            "role": "agriculteur",
        })
        assert r.status_code == 201
        assert r.json()["nom"] == "Nouvel Utilisateur"

    def test_creer_admin(self, client, admin):
        _, token = admin
        r = client.post("/api/utilisateurs", headers=auth_header(token), json={
            "nom": "Nouvel Admin",
            "email": f"nouveau_admin_{int(time.time())}@test.com",
            "password": "securepass123",
            "role": "admin",
        })
        assert r.status_code == 201
        assert r.json()["role"] == "admin"


class TestModifierUtilisateur:
    def test_modifier_ok(self, client, admin):
        user, token = admin
        r = client.put(f"/api/utilisateurs/{user.id}", headers=auth_header(token), json={
            "nom": "Admin Modifie",
        })
        assert r.status_code == 200
        assert r.json()["nom"] == "Admin Modifie"

    def test_modifier_role(self, client, admin, agriculteur):
        _, token = admin
        agri_user, _ = agriculteur
        r = client.put(f"/api/utilisateurs/{agri_user.id}", headers=auth_header(token), json={
            "role": "admin",
        })
        assert r.status_code == 200
        assert r.json()["role"] == "admin"


class TestSupprimerUtilisateur:
    def test_supprimer_ok(self, client, admin):
        _, token = admin
        r = client.post("/api/utilisateurs", headers=auth_header(token), json={
            "nom": "A Supprimer",
            "email": "supprimer@test.com",
            "password": "securepass123",
            "role": "agriculteur",
        })
        user_id = r.json()["id"]
        r = client.delete(f"/api/utilisateurs/{user_id}", headers=auth_header(token))
        assert r.status_code == 204

    def test_supprimer_inexistant(self, client, admin):
        _, token = admin
        r = client.delete("/api/utilisateurs/9999", headers=auth_header(token))
        assert r.status_code == 404
