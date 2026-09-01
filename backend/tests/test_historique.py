"""
Tests pour l'historique des actions (audit logging).

- GET /api/historique            → liste (plus recentes en premier)
- GET /api/historique?entite=    → filtre par entite
- GET /api/historique?type_action= → filtre par type
- GET /api/historique?entite_id= → filtre par id d'entite
- GET /api/historique?limit=     → borne du nombre de resultats
"""

from tests.conftest import auth_header


class TestListerHistorique:
    def test_liste(self, client, admin):
        _, token = admin
        r = client.get("/api/historique", headers=auth_header(token))
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_liste_avec_enrichissement_nom(self, client, admin, parcelle):
        user, token = admin
        # Creer un capteur pour generer une entree dans l'historique (creation)
        r = client.post("/api/capteurs", headers=auth_header(token), json={
            "nom": "histo_dht22",
            "gpio": 5,
            "protocole": "digital",
            "id_parcelle": parcelle.id,
        })
        assert r.status_code == 201
        r = client.get("/api/historique", headers=auth_header(token))
        data = r.json()
        assert len(data) >= 1
        entree = data[0]
        assert "utilisateur_nom" in entree
        assert entree["id_utilisateur"] == user.id


class TestFiltresHistorique:
    def test_filtrer_par_entite(self, client, admin, parcelle):
        _, token = admin
        client.post("/api/capteurs", headers=auth_header(token), json={
            "nom": "filtre_capt", "gpio": 6, "id_parcelle": parcelle.id,
        })
        r = client.get("/api/historique", headers=auth_header(token), params={"entite": "capteur"})
        assert r.status_code == 200
        assert isinstance(r.json(), list)
        assert all(e["entite"] == "capteur" for e in r.json())

    def test_filtrer_par_type(self, client, admin, parcelle):
        _, token = admin
        client.post("/api/capteurs", headers=auth_header(token), json={
            "nom": "type_capt", "gpio": 7, "id_parcelle": parcelle.id,
        })
        r = client.get("/api/historique", headers=auth_header(token), params={"type_action": "creation"})
        assert r.status_code == 200
        assert all(e["type_action"] == "creation" for e in r.json())

    def test_filtrer_par_id_entite(self, client, admin, parcelle):
        _, token = admin
        r = client.post("/api/capteurs", headers=auth_header(token), json={
            "nom": "idfiltre_capt", "gpio": 8, "id_parcelle": parcelle.id,
        })
        capteur_id = r.json()["id"]
        r = client.get("/api/historique", headers=auth_header(token), params={"entite_id": capteur_id})
        assert r.status_code == 200
        assert all(e["entite_id"] == capteur_id for e in r.json())

    def test_limite_max_500(self, client, admin):
        _, token = admin
        r = client.get("/api/historique", headers=auth_header(token), params={"limit": 501})
        assert r.status_code == 422