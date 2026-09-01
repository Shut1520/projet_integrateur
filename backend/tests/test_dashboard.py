"""
Tests du dashboard agrège — GET /api/dashboard (0.5 / 6.1).

Couverture :
- Payload complet {capteurs, actionneurs, parcelles, alertes, dernieres_mesures}
- Une seule mesure (la plus recente) est retournee par capteur
- Les alertes 'resolue' sont exclues
- 401 sans token
"""

from datetime import datetime, timedelta

from models.alerte import Alerte
from models.mesure import Mesure
from tests.conftest import auth_header


class TestDashboard:
    def test_payload_complet(self, client, admin, capteur, actionneur, parcelle):
        _, token = admin
        r = client.get("/api/dashboard", headers=auth_header(token))
        assert r.status_code == 200
        data = r.json()
        assert set(data) == {
            "capteurs",
            "actionneurs",
            "parcelles",
            "alertes",
            "dernieres_mesures",
        }
        assert any(c["id"] == capteur.id for c in data["capteurs"])
        assert any(a["id"] == actionneur.id for a in data["actionneurs"])
        assert any(p["id"] == parcelle.id for p in data["parcelles"])

    def test_une_seule_mesure_la_plus_recente_par_capteur(
        self, client, db, admin, capteur
    ):
        _, token = admin
        plus_ancienne = Mesure(
            valeur=10.0,
            unite="C",
            source="simulation",
            timestamp=datetime.now() + timedelta(minutes=1),
            id_capteur=capteur.id,
        )
        plus_recente = Mesure(
            valeur=25.0,
            unite="C",
            source="esp32",
            timestamp=datetime.now() + timedelta(minutes=5),
            id_capteur=capteur.id,
        )
        db.add_all([plus_ancienne, plus_recente])
        db.commit()

        r = client.get("/api/dashboard", headers=auth_header(token))
        dernieres = r.json()["dernieres_mesures"]
        # Les cles du JSON sont des chaines
        assert str(capteur.id) in dernieres
        assert dernieres[str(capteur.id)]["valeur"] == 25.0

    def test_alertes_exclut_resolues(self, client, db, admin, parcelle):
        _, token = admin
        active = Alerte(
            type_alerte="co2_eleve",
            severite="haute",
            message="CO2 eleve",
            etat="active",
            id_parcelle=parcelle.id,
        )
        resolue = Alerte(
            type_alerte="temp_haute",
            severite="critique",
            message="Temperature haute",
            etat="resolue",
            id_parcelle=parcelle.id,
        )
        db.add_all([active, resolue])
        db.commit()

        r = client.get("/api/dashboard", headers=auth_header(token))
        alertes = r.json()["alertes"]
        ids = [a["id"] for a in alertes]
        assert active.id in ids
        assert resolue.id not in ids
        assert all(a["etat"] != "resolue" for a in alertes)

    def test_sans_token(self, client):
        r = client.get("/api/dashboard")
        assert r.status_code == 401