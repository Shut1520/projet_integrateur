"""
Tests CRUD pour les commandes + logique metier.

- GET    /api/commandes
- GET    /api/commandes/{id}
- POST   /api/commandes
- PUT    /api/commandes/{id}  (statut transitions)
- DELETE /api/commandes/{id}
"""

import pytest
from tests.conftest import auth_header


class TestListerCommandes:
    def test_liste_vide(self, client, admin):
        _, token = admin
        r = client.get("/api/commandes", headers=auth_header(token))
        assert r.status_code == 200
        assert isinstance(r.json(), list)


class TestCreerCommande:
    def test_creer_depuis_web(self, client, admin, actionneur):
        user, token = admin
        r = client.post("/api/commandes", headers=auth_header(token), json={
            "type_action": "on",
            "source": "web",
            "id_actionneur": actionneur.id,
            "id_utilisateur": user.id,
        })
        assert r.status_code == 201
        data = r.json()
        assert data["type_action"] == "on"
        assert data["source"] == "web"
        assert data["statut"] == "envoyee"

    def test_creer_auto_sans_user(self, client, admin, actionneur):
        _, token = admin
        r = client.post("/api/commandes", headers=auth_header(token), json={
            "type_action": "on",
            "source": "auto",
            "id_actionneur": actionneur.id,
        })
        assert r.status_code == 201
        assert r.json()["id_utilisateur"] is None

    def test_creer_auto_avec_user_echoue(self, client, admin, actionneur):
        user, token = admin
        r = client.post("/api/commandes", headers=auth_header(token), json={
            "type_action": "on",
            "source": "auto",
            "id_actionneur": actionneur.id,
            "id_utilisateur": user.id,
        })
        assert r.status_code == 400

    def test_creer_web_sans_user_echoue(self, client, admin, actionneur):
        _, token = admin
        r = client.post("/api/commandes", headers=auth_header(token), json={
            "type_action": "on",
            "source": "web",
            "id_actionneur": actionneur.id,
        })
        assert r.status_code == 400

    def test_creer_actionneur_inexistant(self, client, admin):
        user, token = admin
        r = client.post("/api/commandes", headers=auth_header(token), json={
            "type_action": "on",
            "source": "web",
            "id_actionneur": 9999,
            "id_utilisateur": user.id,
        })
        assert r.status_code == 404


class TestTransitionsStatut:
    def _creer_commande(self, client, admin, actionneur):
        user, token = admin
        r = client.post("/api/commandes", headers=auth_header(token), json={
            "type_action": "on",
            "source": "web",
            "id_actionneur": actionneur.id,
            "id_utilisateur": user.id,
        })
        return r.json()["id"], token

    def test_envoyee_vers_recue(self, client, admin, actionneur):
        _, token = admin
        cmd_id, _ = self._creer_commande(client, admin, actionneur)
        r = client.put(f"/api/commandes/{cmd_id}", headers=auth_header(token), json={
            "statut": "recue",
        })
        assert r.status_code == 200
        assert r.json()["statut"] == "recue"

    def test_recue_vers_executee(self, client, admin, actionneur):
        _, token = admin
        cmd_id, _ = self._creer_commande(client, admin, actionneur)
        client.put(f"/api/commandes/{cmd_id}", headers=auth_header(token), json={"statut": "recue"})
        r = client.put(f"/api/commandes/{cmd_id}", headers=auth_header(token), json={"statut": "executee"})
        assert r.status_code == 200
        assert r.json()["statut"] == "executee"

    def test_recue_vers_echouee(self, client, admin, actionneur):
        _, token = admin
        cmd_id, _ = self._creer_commande(client, admin, actionneur)
        client.put(f"/api/commandes/{cmd_id}", headers=auth_header(token), json={"statut": "recue"})
        r = client.put(f"/api/commandes/{cmd_id}", headers=auth_header(token), json={"statut": "echouee"})
        assert r.status_code == 200
        assert r.json()["statut"] == "echouee"

    def test_envoyee_vers_executee_invalide(self, client, admin, actionneur):
        _, token = admin
        cmd_id, _ = self._creer_commande(client, admin, actionneur)
        r = client.put(f"/api/commandes/{cmd_id}", headers=auth_header(token), json={
            "statut": "executee",
        })
        assert r.status_code == 400

    def test_commande_inexistante(self, client, admin):
        _, token = admin
        r = client.put("/api/commandes/9999", headers=auth_header(token), json={"statut": "recue"})
        assert r.status_code == 404


class TestLireCommande:
    def test_lire_ok(self, client, admin, actionneur):
        user, token = admin
        r = client.post("/api/commandes", headers=auth_header(token), json={
            "type_action": "off",
            "source": "cli",
            "id_actionneur": actionneur.id,
            "id_utilisateur": user.id,
        })
        cmd_id = r.json()["id"]
        r = client.get(f"/api/commandes/{cmd_id}", headers=auth_header(token))
        assert r.status_code == 200
        assert r.json()["type_action"] == "off"

    def test_commande_inexistante(self, client, admin):
        _, token = admin
        r = client.get("/api/commandes/9999", headers=auth_header(token))
        assert r.status_code == 404


class TestSupprimerCommande:
    def test_supprimer_ok(self, client, admin, actionneur):
        user, token = admin
        r = client.post("/api/commandes", headers=auth_header(token), json={
            "type_action": "on",
            "source": "web",
            "id_actionneur": actionneur.id,
            "id_utilisateur": user.id,
        })
        cmd_id = r.json()["id"]
        r = client.delete(f"/api/commandes/{cmd_id}", headers=auth_header(token))
        assert r.status_code == 204
