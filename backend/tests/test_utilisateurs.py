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


class TestControleRole:
    """Verifie que les routes utilisateurs sont reservees aux admins (0.2)."""
    # NOTE: on cree un agriculteur dedie a email unique pour eviter la
    # pollution inter-tests (le fixture `agriculteur` partage test_agri@sai.com
    # qui peut etre promu admin par test_modifier_role).

    @pytest.fixture
    def agri_fresh(self, client, admin):
        import uuid
        _, admin_token = admin
        email = f"agri_controle_{uuid.uuid4().hex[:12]}@test.com"
        r = client.post("/api/utilisateurs", headers=auth_header(admin_token), json={
            "nom": "Agri Fraiche",
            "email": email,
            "password": "securepass123",
            "role": "agriculteur",
        })
        assert r.status_code == 201, r.text
        agri = r.json()
        login = client.post("/api/auth/login", json={
            "email": agri["email"],
            "password": "securepass123",
        })
        assert login.status_code == 200, login.text
        return agri, login.json()["access_token"]

    def test_agriculteur_liste_refuse(self, client, agri_fresh):
        _, token = agri_fresh
        r = client.get("/api/utilisateurs", headers=auth_header(token))
        assert r.status_code == 403

    def test_agriculteur_creer_refuse(self, client, agri_fresh):
        _, token = agri_fresh
        r = client.post("/api/utilisateurs", headers=auth_header(token), json={
            "nom": "Agri Fraude",
            "email": "agri_fraude@test.com",
            "password": "securepass123",
            "role": "admin",
        })
        assert r.status_code == 403

    def test_agriculteur_supprimer_refuse(self, client, agri_fresh):
        agri, token = agri_fresh
        r = client.delete(f"/api/utilisateurs/{agri['id']}", headers=auth_header(token))
        assert r.status_code == 403
