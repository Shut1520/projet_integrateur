"""
Tests pour les routes d'authentification.

- POST /api/auth/register
- POST /api/auth/login
- GET  /api/auth/me
"""

import pytest
import time


class TestRegister:
    def test_register_succes(self, client):
        email = f"nouveau_{int(time.time())}@test.com"
        r = client.post("/api/auth/register", json={
            "nom": "Nouveau User",
            "email": email,
            "password": "securepass123",
            "role": "agriculteur",
        })
        assert r.status_code == 201
        data = r.json()
        assert data["nom"] == "Nouveau User"
        assert data["email"] == email
        assert data["role"] == "agriculteur"
        assert "id" in data
        assert "password_hash" not in data

    def test_register_email_duplicata(self, client):
        client.post("/api/auth/register", json={
            "nom": "User1",
            "email": "dup@test.com",
            "password": "securepass123",
            "role": "agriculteur",
        })
        r = client.post("/api/auth/register", json={
            "nom": "User2",
            "email": "dup@test.com",
            "password": "securepass123",
            "role": "agriculteur",
        })
        assert r.status_code == 409

    def test_register_email_invalide(self, client):
        r = client.post("/api/auth/register", json={
            "nom": "User",
            "email": "pas-un-email",
            "password": "securepass123",
            "role": "agriculteur",
        })
        assert r.status_code == 422

    def test_register_mot_de_passe_trop_court(self, client):
        r = client.post("/api/auth/register", json={
            "nom": "User",
            "email": "court@test.com",
            "password": "123",
            "role": "agriculteur",
        })
        assert r.status_code == 422


class TestLogin:
    def test_login_succes(self, client):
        client.post("/api/auth/register", json={
            "nom": "Login User",
            "email": "login@test.com",
            "password": "securepass123",
            "role": "agriculteur",
        })
        r = client.post("/api/auth/login", json={
            "email": "login@test.com",
            "password": "securepass123",
        })
        assert r.status_code == 200
        data = r.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert "utilisateur" in data

    def test_login_mauvais_mdp(self, client):
        client.post("/api/auth/register", json={
            "nom": "Login User",
            "email": "login2@test.com",
            "password": "securepass123",
            "role": "agriculteur",
        })
        r = client.post("/api/auth/login", json={
            "email": "login2@test.com",
            "password": "mauvais_mdp",
        })
        assert r.status_code == 401

    def test_login_email_inexistant(self, client):
        r = client.post("/api/auth/login", json={
            "email": "inexistant@test.com",
            "password": "securepass123",
        })
        assert r.status_code == 401


class TestMe:
    def test_me_avec_token(self, client, admin):
        user, token = admin
        from tests.conftest import auth_header
        r = client.get("/api/auth/me", headers=auth_header(token))
        assert r.status_code == 200
        assert r.json()["email"] == user.email

    def test_me_sans_token(self, client):
        r = client.get("/api/auth/me")
        assert r.status_code == 401

    def test_me_token_invalide(self, client):
        r = client.get("/api/auth/me", headers={"Authorization": "Bearer invalid"})
        assert r.status_code == 401
