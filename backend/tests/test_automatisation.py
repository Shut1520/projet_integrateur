"""
Tests du service d'automatisation (UC6).

Couvre :
- Dedoublonnage alertes (_alerte_deja_active)
- Resolution auto alertes (_resoudre_alertes)
- Evaluation parcelle (seuil depasse / normal)
- Boucle d'automatisation (executer_boucle)
"""

import pytest
from datetime import datetime, timezone

from models.parcelle import Parcelle
from models.capteur import Capteur
from models.actionneur import Actionneur
from models.seuil import Seuil
from models.mesure import Mesure
from models.alerte import Alerte
from models.commande import Commande
from models.historique import HistoriqueAction
from models.action import Action
from services.automatisation_service import (
    _alerte_deja_active,
    _resoudre_alertes,
    evaluer_parcelle,
    executer_boucle,
)


@pytest.fixture(autouse=True)
def _clean_automatisation_tables(db):
    """Nettoie les tables avant/apres chaque test pour eviter les fuites de donnees."""
    from sqlalchemy import text

    def _clean():
        for table in [
            "historique_actions", "actions", "commandes", "alertes",
            "mesures", "seuils", "actionneurs", "capteurs", "parcelles",
        ]:
            db.execute(text(f"TRUNCATE TABLE {table} CASCADE"))
        db.commit()

    _clean()
    yield
    try:
        _clean()
    except Exception:
        db.rollback()


# ─── Fixtures specifiques ───
@pytest.fixture
def capteur_temperature(db, parcelle):
    """Capteur dht22 pour temperature sur la parcelle."""
    c = db.query(Capteur).filter(
        Capteur.nom == "dht22",
        Capteur.id_parcelle == parcelle.id,
    ).first()
    if not c:
        c = Capteur(
            nom="dht22",
            reference="DHT22",
            gpio=4,
            protocole="digital",
            etat="actif",
            id_parcelle=parcelle.id,
        )
        db.add(c)
        db.commit()
        db.refresh(c)
    return c


@pytest.fixture
def capteur_sol(db, parcelle):
    """Capteur yl-69 pour humidite_sol sur la parcelle."""
    c = db.query(Capteur).filter(
        Capteur.nom == "yl-69",
        Capteur.id_parcelle == parcelle.id,
    ).first()
    if not c:
        c = Capteur(
            nom="yl-69",
            reference="YL-69",
            gpio=34,
            protocole="analog",
            etat="actif",
            id_parcelle=parcelle.id,
        )
        db.add(c)
        db.commit()
        db.refresh(c)
    return c


@pytest.fixture
def capteur_bh1750(db, parcelle):
    """Capteur bh1750 pour luminosite sur la parcelle."""
    c = db.query(Capteur).filter(
        Capteur.nom == "bh1750",
        Capteur.id_parcelle == parcelle.id,
    ).first()
    if not c:
        c = Capteur(
            nom="bh1750",
            reference="BH1750",
            gpio=21,
            protocole="i2c",
            etat="actif",
            id_parcelle=parcelle.id,
        )
        db.add(c)
        db.commit()
        db.refresh(c)
    return c


@pytest.fixture
def actionneur_ventilation(db, parcelle):
    """Actionneur ventilation sur la parcelle."""
    a = db.query(Actionneur).filter(
        Actionneur.nom == "ventilation",
        Actionneur.id_parcelle == parcelle.id,
    ).first()
    if not a:
        a = Actionneur(
            nom="ventilation",
            reference="Ventilateur 12V",
            gpio=27,
            etat="inactif",
            id_parcelle=parcelle.id,
        )
        db.add(a)
        db.commit()
        db.refresh(a)
    return a


@pytest.fixture
def actionneur_pompe(db, parcelle):
    """Actionneur pompe sur la parcelle."""
    a = db.query(Actionneur).filter(
        Actionneur.nom == "pompe",
        Actionneur.id_parcelle == parcelle.id,
    ).first()
    if not a:
        a = Actionneur(
            nom="pompe",
            reference="Pompe 12V",
            gpio=26,
            etat="inactif",
            id_parcelle=parcelle.id,
        )
        db.add(a)
        db.commit()
        db.refresh(a)
    return a


@pytest.fixture
def seuil_temperature(db, parcelle, agriculteur):
    """Seuil temperature [15, 30] pour la parcelle."""
    s = db.query(Seuil).filter(
        Seuil.type_mesure == "temperature",
        Seuil.id_parcelle == parcelle.id,
    ).first()
    if not s:
        s = Seuil(
            type_mesure="temperature",
            valeur_min=15.0,
            valeur_max=30.0,
            unite="°C",
            id_utilisateur=agriculteur[0].id,
            id_parcelle=parcelle.id,
        )
        db.add(s)
        db.commit()
        db.refresh(s)
    return s


@pytest.fixture
def seuil_humidite(db, parcelle, agriculteur):
    """Seuil humidite_sol [30, 80] pour la parcelle."""
    s = db.query(Seuil).filter(
        Seuil.type_mesure == "humidite_sol",
        Seuil.id_parcelle == parcelle.id,
    ).first()
    if not s:
        s = Seuil(
            type_mesure="humidite_sol",
            valeur_min=30.0,
            valeur_max=80.0,
            unite="%",
            id_utilisateur=agriculteur[0].id,
            id_parcelle=parcelle.id,
        )
        db.add(s)
        db.commit()
        db.refresh(s)
    return s


# ─── Tests _alerte_deja_active ───
class TestAlerteDejaActive:
    def test_pas_dalerte_active(self, db, parcelle):
        """Aucune alerte active → retourne False."""
        assert _alerte_deja_active(db, "temperature_haute", parcelle.id) is False

    def test_alerte_active_existe(self, db, parcelle):
        """Alerte active du meme type → retourne True."""
        alerte = Alerte(
            type_alerte="temperature_haute",
            valeur=35.0,
            seuil=30.0,
            severite="haute",
            message="Test",
            etat="active",
            id_parcelle=parcelle.id,
        )
        db.add(alerte)
        db.commit()

        assert _alerte_deja_active(db, "temperature_haute", parcelle.id) is True

    def test_alerte_resolue_ignoree(self, db, parcelle):
        """Alerte resolue du meme type → retourne False (pas de doublon)."""
        alerte = Alerte(
            type_alerte="temperature_haute",
            valeur=35.0,
            seuil=30.0,
            severite="haute",
            message="Test",
            etat="resolue",
            id_parcelle=parcelle.id,
        )
        db.add(alerte)
        db.commit()

        assert _alerte_deja_active(db, "temperature_haute", parcelle.id) is False

    def test_autre_type_ignore(self, db, parcelle):
        """Alerte d'un type different → retourne False."""
        alerte = Alerte(
            type_alerte="humidite_sol_bas",
            valeur=20.0,
            seuil=30.0,
            severite="haute",
            message="Test",
            etat="active",
            id_parcelle=parcelle.id,
        )
        db.add(alerte)
        db.commit()

        assert _alerte_deja_active(db, "temperature_haute", parcelle.id) is False


# ─── Tests _resoudre_alertes ───
class TestResoudreAlertes:
    def test_resoudre_aucune(self, db, parcelle):
        """Aucune alerte active → retourne 0."""
        assert _resoudre_alertes(db, "temperature_haute", parcelle.id) == 0

    def test_resoudre_une(self, db, parcelle):
        """Une alerte active → resolue, retourne 1."""
        alerte = Alerte(
            type_alerte="temperature_haute",
            valeur=35.0,
            seuil=30.0,
            severite="haute",
            message="Test",
            etat="active",
            id_parcelle=parcelle.id,
        )
        db.add(alerte)
        db.commit()

        count = _resoudre_alertes(db, "temperature_haute", parcelle.id)
        assert count == 1
        # Verifie en memoire (pas de commit ici)
        assert alerte.etat == "resolue"
        assert alerte.date_fin is not None

    def test_resoudre_plusieurs(self, db, parcelle):
        """Plusieurs alertes actives → toutes resolues."""
        for i in range(3):
            alerte = Alerte(
                type_alerte="temperature_haute",
                valeur=35.0 + i,
                seuil=30.0,
                severite="haute",
                message=f"Test {i}",
                etat="active",
                id_parcelle=parcelle.id,
            )
            db.add(alerte)
        db.commit()

        count = _resoudre_alertes(db, "temperature_haute", parcelle.id)
        assert count == 3

    def test_ignore_resolues(self, db, parcelle):
        """Alerte deja resolue → ignoree, retourne 0."""
        alerte = Alerte(
            type_alerte="temperature_haute",
            valeur=35.0,
            seuil=30.0,
            severite="haute",
            message="Test",
            etat="resolue",
            id_parcelle=parcelle.id,
        )
        db.add(alerte)
        db.commit()

        count = _resoudre_alertes(db, "temperature_haute", parcelle.id)
        assert count == 0


# ─── Tests evaluer_parcelle ───
class TestEvaluerParcelle:
    def test_seuil_depasse_cree_alerte(
        self, db, parcelle, capteur_temperature, actionneur_ventilation, seuil_temperature
    ):
        """Mesure hors seuil → alerte creee + commande auto generee."""
        mesure = Mesure(
            valeur=35.0,
            unite="°C",
            source="esp32",
            timestamp=datetime.now(timezone.utc),
            id_capteur=capteur_temperature.id,
        )
        db.add(mesure)
        db.commit()

        resultats = evaluer_parcelle(db, parcelle.id)

        assert resultats["alertes_creees"] >= 1
        # Verifier que l'alerte est bien en BD
        alerte = db.query(Alerte).filter(
            Alerte.id_parcelle == parcelle.id,
            Alerte.etat == "active",
        ).first()
        assert alerte is not None
        assert alerte.type_alerte == "temperature_haut"

    def test_dedoublon_alerte(self, db, parcelle, capteur_temperature, actionneur_ventilation, seuil_temperature):
        """Deux evaluations consecutives avec meme depassement → 1 seule alerte."""
        # Pre-creer une alerte active (type = {type_mesure}_{direction})
        alerte = Alerte(
            type_alerte="temperature_haut",
            valeur=35.0,
            seuil=30.0,
            severite="haute",
            message="Deja active",
            etat="active",
            id_parcelle=parcelle.id,
        )
        db.add(alerte)
        db.commit()

        # Mesure hors seuil
        mesure = Mesure(
            valeur=35.0,
            unite="°C",
            source="esp32",
            timestamp=datetime.now(timezone.utc),
            id_capteur=capteur_temperature.id,
        )
        db.add(mesure)
        db.commit()

        resultats = evaluer_parcelle(db, parcelle.id)

        # Pas de nouvelle alerte creee (doublon detecte)
        assert resultats["alertes_creees"] == 0
        assert any("deja active" in d for d in resultats["details"])

    def test_seuil_normal_resout_alertes(
        self, db, parcelle, capteur_temperature, actionneur_ventilation, seuil_temperature
    ):
        """Mesure dans seuil → alertes actives resolues."""
        # Pre-creer une alerte active (type = {type_mesure}_{direction})
        alerte = Alerte(
            type_alerte="temperature_haut",
            valeur=35.0,
            seuil=30.0,
            severite="haute",
            message="A resoudre",
            etat="active",
            id_parcelle=parcelle.id,
        )
        db.add(alerte)
        db.commit()

        # Mesure dans les seuils
        mesure = Mesure(
            valeur=25.0,
            unite="°C",
            source="esp32",
            timestamp=datetime.now(timezone.utc),
            id_capteur=capteur_temperature.id,
        )
        db.add(mesure)
        db.commit()

        resultats = evaluer_parcelle(db, parcelle.id)

        assert resultats["alertes_resolues"] >= 1
        # Verifie en memoire (pas de commit ici)
        assert alerte.etat == "resolue"

    def test_aucun_capteur(self, db, parcelle, seuil_temperature):
        """Pas de capteur对应 → skip sans erreur."""
        # Pas de capteur dht22 cree → evaluer passe sans erreur
        resultats = evaluer_parcelle(db, parcelle.id)
        assert resultats["alertes_creees"] == 0
        assert resultats["alertes_resolues"] == 0

    def test_aucune_mesure(self, db, parcelle, capteur_temperature, seuil_temperature):
        """Pas de mesure → skip sans erreur."""
        resultats = evaluer_parcelle(db, parcelle.id)
        assert resultats["alertes_creees"] == 0


# ─── Tests executer_boucle ───
class TestExecuterBoucle:
    def test_boucle_une_parcelle(
        self, db, parcelle, capteur_temperature, actionneur_ventilation, seuil_temperature
    ):
        """Boucle sur 1 parcelle avec depassement → alerte creee."""
        mesure = Mesure(
            valeur=35.0,
            unite="°C",
            source="esp32",
            timestamp=datetime.now(timezone.utc),
            id_capteur=capteur_temperature.id,
        )
        db.add(mesure)
        db.commit()

        resultats = executer_boucle(db)

        assert resultats["parcelles_evaluees"] >= 1
        assert resultats["alertes_creees"] >= 1

    def test_boucle_pas_de_parcelle(self, db):
        """Aucune parcelle → 0 evaluations."""
        resultats = executer_boucle(db)
        assert resultats["parcelles_evaluees"] == 0
