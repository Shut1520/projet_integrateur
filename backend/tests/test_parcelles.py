"""
Tests CRUD pour les parcelles.

- GET    /api/parcelles
- GET    /api/parcelles/{id}
- POST   /api/parcelles
- PUT    /api/parcelles/{id}
- DELETE /api/parcelles/{id}
- GET    /api/parcelles/{id}/capteurs
- GET    /api/parcelles/{id}/actionneurs
- GET    /api/parcelles/{id}/seuils
- GET    /api/parcelles/{id}/alertes
"""

import pytest
from tests.conftest import auth_header


class TestListerParcelles:
    def test_liste_vide(self, client, admin):
        _, token = admin
        r = client.get("/api/parcelles", headers=auth_header(token))
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_liste_avec_donnees(self, client, admin, parcelle):
        _, token = admin
        r = client.get("/api/parcelles", headers=auth_header(token))
        assert r.status_code == 200
        assert len(r.json()) >= 1

    def test_sans_auth(self, client):
        r = client.get("/api/parcelles")
        assert r.status_code == 401


class TestLireParcelle:
    def test_lire_parcelle_ok(self, client, admin, parcelle):
        _, token = admin
        r = client.get(f"/api/parcelles/{parcelle.id}", headers=auth_header(token))
        assert r.status_code == 200
        assert r.json()["nom"] == "Test Parcelle"

    def test_parcelle_inexistante(self, client, admin):
        _, token = admin
        r = client.get("/api/parcelles/9999", headers=auth_header(token))
        assert r.status_code == 404


class TestCreerParcelle:
    def test_creer_ok(self, client, admin, agriculteur):
        _, token = admin
        agri_user, _ = agriculteur
        r = client.post("/api/parcelles", headers=auth_header(token), json={
            "nom": "Nouvelle Serre",
            "localisation": "Zone B",
            "id_utilisateur": agri_user.id,
        })
        assert r.status_code == 201
        data = r.json()
        assert data["nom"] == "Nouvelle Serre"
        assert data["id_utilisateur"] == agri_user.id

    def test_creer_sans_nom(self, client, admin, agriculteur):
        _, token = admin
        agri_user, _ = agriculteur
        r = client.post("/api/parcelles", headers=auth_header(token), json={
            "localisation": "Zone B",
            "id_utilisateur": agri_user.id,
        })
        assert r.status_code == 422


class TestModifierParcelle:
    def test_modifier_ok(self, client, admin, parcelle):
        _, token = admin
        r = client.put(f"/api/parcelles/{parcelle.id}", headers=auth_header(token), json={
            "nom": "Serre Modifiee",
        })
        assert r.status_code == 200
        assert r.json()["nom"] == "Serre Modifiee"

    def test_modifier_partiel(self, client, admin, parcelle):
        _, token = admin
        r = client.put(f"/api/parcelles/{parcelle.id}", headers=auth_header(token), json={
            "localisation": "Nouvelle localisation",
        })
        assert r.status_code == 200
        assert r.json()["localisation"] == "Nouvelle localisation"
        assert r.json()["nom"] == "Test Parcelle"


class TestSupprimerParcelle:
    def test_supprimer_ok(self, client, admin, agriculteur):
        _, token = admin
        agri_user, _ = agriculteur
        # Creer une parcelle temporaire pour la supprimer
        r = client.post("/api/parcelles", headers=auth_header(token), json={
            "nom": "A Supprimer",
            "id_utilisateur": agri_user.id,
        })
        id_parcelle = r.json()["id"]
        r = client.delete(f"/api/parcelles/{id_parcelle}", headers=auth_header(token))
        assert r.status_code == 204

    def test_supprimer_inexistante(self, client, admin):
        _, token = admin
        r = client.delete("/api/parcelles/9999", headers=auth_header(token))
        assert r.status_code == 404


class TestParcelleSousRoutes:
    def test_capteurs_parcelle(self, client, admin, parcelle, capteur):
        _, token = admin
        r = client.get(f"/api/parcelles/{parcelle.id}/capteurs", headers=auth_header(token))
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_actionneurs_parcelle(self, client, admin, parcelle, actionneur):
        _, token = admin
        r = client.get(f"/api/parcelles/{parcelle.id}/actionneurs", headers=auth_header(token))
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_seuils_parcelle(self, client, admin, parcelle):
        _, token = admin
        r = client.get(f"/api/parcelles/{parcelle.id}/seuils", headers=auth_header(token))
        assert r.status_code == 200

    def test_alertes_parcelle(self, client, admin, parcelle):
        _, token = admin
        r = client.get(f"/api/parcelles/{parcelle.id}/alertes", headers=auth_header(token))
        assert r.status_code == 200
