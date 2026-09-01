"""
Tests CRUD pour les actions + logique de duree.

- GET    /api/actions
- GET    /api/actions/{id}
- POST   /api/actions   (action liee a une commande existante)
- PUT    /api/actions/{id}  (fin d'execution : date_fin, duree, statut)
"""

from tests.conftest import auth_header


def _creer_commande(client, user, token, actionneur):
    """Cree une commande web de test et retourne son id."""
    r = client.post("/api/commandes", headers=auth_header(token), json={
        "type_action": "on",
        "source": "web",
        "id_actionneur": actionneur.id,
        "id_utilisateur": user.id,
    })
    assert r.status_code == 201
    return r.json()["id"]


def _creer_action(client, token, commande_id, **extra):
    """Cree une action de test et retourne la reponse HTTP."""
    payload = {"id_commande": commande_id}
    payload.update(extra)
    return client.post("/api/actions", headers=auth_header(token), json=payload)


class TestListerActions:
    def test_liste(self, client, admin):
        _, token = admin
        r = client.get("/api/actions", headers=auth_header(token))
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_filtrer_par_commande(self, client, admin, actionneur):
        user, token = admin
        cmd_id = _creer_commande(client, user, token, actionneur)
        _creer_action(client, token, cmd_id)
        r = client.get("/api/actions", headers=auth_header(token), params={"commande_id": cmd_id})
        assert r.status_code == 200
        actions = r.json()
        assert len(actions) >= 1
        assert all(a["id_commande"] == cmd_id for a in actions)


class TestCreerAction:
    def test_creer_ok(self, client, admin, actionneur):
        user, token = admin
        cmd_id = _creer_commande(client, user, token, actionneur)
        r = _creer_action(client, token, cmd_id)
        assert r.status_code == 201
        data = r.json()
        assert data["id_commande"] == cmd_id
        assert data["statut"] == "en_cours"

    def test_creer_sans_commande_echoue(self, client, admin):
        _, token = admin
        r = client.post("/api/actions", headers=auth_header(token), json={})
        assert r.status_code == 422

    def test_creer_commande_inexistante(self, client, admin):
        _, token = admin
        r = _creer_action(client, token, commande_id=9999)
        assert r.status_code == 500  # FK non respectee

    def test_creer_statut_invalide(self, client, admin, actionneur):
        user, token = admin
        cmd_id = _creer_commande(client, user, token, actionneur)
        r = _creer_action(client, token, cmd_id, statut="inconnu")
        assert r.status_code == 422


class TestLireAction:
    def test_lire_ok(self, client, admin, actionneur):
        user, token = admin
        cmd_id = _creer_commande(client, user, token, actionneur)
        action_id = _creer_action(client, token, cmd_id).json()["id"]
        r = client.get(f"/api/actions/{action_id}", headers=auth_header(token))
        assert r.status_code == 200
        assert r.json()["id"] == action_id

    def test_action_inexistante(self, client, admin):
        _, token = admin
        r = client.get("/api/actions/9999", headers=auth_header(token))
        assert r.status_code == 404


class TestModifierAction:
    def test_terminer_action(self, client, admin, actionneur):
        import datetime
        user, token = admin
        cmd_id = _creer_commande(client, user, token, actionneur)
        action_id = _creer_action(client, token, cmd_id).json()["id"]

        debut = datetime.datetime.now()
        fin = debut + datetime.timedelta(seconds=10)
        r = client.put(f"/api/actions/{action_id}", headers=auth_header(token), json={
            "date_fin": fin.isoformat(),
            "resultat": "ok",
            "statut": "termine",
        })
        assert r.status_code == 200
        data = r.json()
        assert data["statut"] == "termine"
        assert data["resultat"] == "ok"
        assert data["duree"] is not None

    def test_statut_invalide(self, client, admin, actionneur):
        user, token = admin
        cmd_id = _creer_commande(client, user, token, actionneur)
        action_id = _creer_action(client, token, cmd_id).json()["id"]
        r = client.put(f"/api/actions/{action_id}", headers=auth_header(token), json={
            "statut": "bogus",
        })
        assert r.status_code == 422

    def test_action_inexistante(self, client, admin):
        _, token = admin
        r = client.put("/api/actions/9999", headers=auth_header(token), json={"statut": "termine"})
        assert r.status_code == 404