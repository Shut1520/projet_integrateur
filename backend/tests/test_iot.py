"""
Tests de la Phase 3 — Authentification ESP32 par cle API.

Couverture :
- get_client_cle_api : cle valide / invalide / expiree / revoquee
- POST /api/mesures (cle API requise)
- GET /api/commandes/attente (pull des commandes 'envoyee')
- PUT /api/commandes/{id} (confirmation recue/executee par cle API)
- POST /api/actions + PUT /api/actions/{id} (par cle API)

Flux simulateur « ESP32 virtuel » :
    commande web -> attente -> recue -> action en_cours -> executee -> action terminee
"""

import pytest
from tests.conftest import cle_api_headers, auth_header


def _creer_commande_web(client, admin, actionneur, statut="envoyee"):
    """Cree une commande via le web (JWT), renvoie la commande creee."""
    _, token = admin
    r = client.post(
        "/api/commandes",
        headers=auth_header(token),
        json={
            "type_action": "on",
            "source": "web",
            "id_actionneur": actionneur.id,
            "valeur_parametre": "30",
        },
    )
    assert r.status_code == 201
    return r.json()


class TestCleApiAuth:
    def test_cle_valide(self, client, capteur, cle_api):
        r = client.post(
            "/api/mesures",
            headers=cle_api_headers(cle_api),
            json={"valeur": 22.0, "unite": "C", "source": "esp32", "id_capteur": capteur.id},
        )
        assert r.status_code == 201

    def test_cle_invalide(self, client, capteur):
        r = client.post(
            "/api/mesures",
            headers={"X-API-Key": "sk_sai_invalide"},
            json={"valeur": 22.0, "unite": "C", "source": "esp32", "id_capteur": capteur.id},
        )
        assert r.status_code == 401

    def test_cle_manquante(self, client, capteur):
        r = client.post(
            "/api/mesures",
            json={"valeur": 22.0, "unite": "C", "source": "esp32", "id_capteur": capteur.id},
        )
        assert r.status_code == 401

    def test_cle_revoquee(self, client, db, capteur, admin):
        """Une cle desactivee (actif=False) est refusee."""
        import secrets
        from models.token import Token

        user, _ = admin
        cle = "sk_sai_" + secrets.token_hex(16)
        token = Token(
            cle_api=cle,
            nom="cle_revoquee",
            actif=False,
            id_utilisateur=user.id,
        )
        db.add(token)
        db.commit()
        r = client.post(
            "/api/mesures",
            headers={"X-API-Key": cle},
            json={"valeur": 22.0, "unite": "C", "source": "esp32", "id_capteur": capteur.id},
        )
        assert r.status_code == 401


class TestCommandesAttente:
    def test_attente_ne_rend_que_envoyee(self, client, admin, actionneur, cle_api):
        """Pull : seules les commandes 'envoyee' reviennent, en FIFO."""
        c1 = _creer_commande_web(client, admin, actionneur)
        _creer_commande_web(client, admin, actionneur)

        r = client.get("/api/commandes/attente", headers=cle_api_headers(cle_api))
        assert r.status_code == 200
        ids = [c["id"] for c in r.json()]
        assert c1["id"] in ids
        # l'ordre FIFO = id croissant
        assert ids[0] < ids[1]

    def test_attente_necessite_cle(self, client, admin):
        """Sans cle API, l'acces aux commandes en attente est refuse."""
        _, token = admin
        r = client.get("/api/commandes/attente", headers=auth_header(token))
        assert r.status_code == 401

    def test_attente_renvoie_nom_actionneur(self, client, admin, actionneur, cle_api):
        """Le pull expose le nom de l'actionneur commande (firmware pilote par nom)."""
        commande = _creer_commande_web(client, admin, actionneur)

        r = client.get("/api/commandes/attente", headers=cle_api_headers(cle_api))
        assert r.status_code == 200
        entree = next(c for c in r.json() if c["id"] == commande["id"])
        assert entree["nom_actionneur"] == actionneur.nom


class TestFluxComplet:
    def test_flux_commandes_actions(self, client, admin, actionneur, cle_api):
        """Une commande creee sur le web est executee par l'ESP32 via cle API."""
        commande = _creer_commande_web(client, admin, actionneur)
        cid = commande["id"]

        # 1. L'ESP32 recupere la commande en attente
        r = client.get("/api/commandes/attente", headers=cle_api_headers(cle_api))
        assert cid in [c["id"] for c in r.json()]

        # 2. L'ESP32 confirme qu'il a recu la commande
        r = client.put(
            f"/api/commandes/{cid}",
            headers=cle_api_headers(cle_api),
            json={"statut": "recue"},
        )
        assert r.status_code == 200
        assert r.json()["statut"] == "recue"

        # 3. L'ESP32 commence une action (cree l'action associee)
        r = client.post(
            "/api/actions",
            headers=cle_api_headers(cle_api),
            json={"id_commande": cid, "statut": "en_cours"},
        )
        assert r.status_code == 201
        action_id = r.json()["id"]

        # 4. L'ESP32 signale l'execution terminee + met a jour l'action
        r = client.put(
            f"/api/actions/{action_id}",
            headers=cle_api_headers(cle_api),
            json={"statut": "termine", "resultat": "ok"},
        )
        assert r.status_code == 200
        assert r.json()["statut"] == "termine"

        # 5. L'ESP32 confirme que la commande est executee
        r = client.put(
            f"/api/commandes/{cid}",
            headers=cle_api_headers(cle_api),
            json={"statut": "executee"},
        )
        assert r.status_code == 200
        assert r.json()["statut"] == "executee"

        # 6. La commande n'est plus en attente
        r = client.get("/api/commandes/attente", headers=cle_api_headers(cle_api))
        assert cid not in [c["id"] for c in r.json()]

    def test_commandes_acceptent_jwt_aussi(self, client, admin, actionneur):
        """PUT /api/commandes/{id} accepte aussi le JWT (web/CLI)."""
        commande = _creer_commande_web(client, admin, actionneur)
        _, token = admin
        r = client.put(
            f"/api/commandes/{commande['id']}",
            headers=auth_header(token),
            json={"statut": "recue"},
        )
        assert r.status_code == 200
        assert r.json()["statut"] == "recue"
