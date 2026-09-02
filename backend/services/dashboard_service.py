"""
services/dashboard_service.py — Agrégats pour le tableau de bord.

Regroupe en une seule requete les donnees consommees par le frontend
(Dashboard.jsx) : capteurs, actionneurs, alertes actives, parcelles et
derniere mesure de chaque capteur. Evite les 5 appels API paralleles.
"""

from sqlalchemy import desc
from sqlalchemy.orm import Session

from models.capteur import Capteur
from models.actionneur import Actionneur
from models.alerte import Alerte
from models.parcelle import Parcelle
from models.mesure import Mesure


def _dernieres_mesures(db: Session) -> dict[int, dict]:
    """Retourne {id_capteur: derniere_mesure} pour tous les capteurs.

    Utilise une sous-requete pour ne lire qu'une ligne par capteur
    (la plus recente), indispensable sur la table mesures a gros volume.
    """
    sous_query = (
        db.query(Mesure.id_capteur, Mesure.timestamp)
        .distinct(Mesure.id_capteur)
        .order_by(Mesure.id_capteur, desc(Mesure.timestamp))
        .subquery()
    )
    q = (
        db.query(Mesure)
        .join(
            sous_query,
            (Mesure.id_capteur == sous_query.c.id_capteur)
            & (Mesure.timestamp == sous_query.c.timestamp),
        )
        .all()
    )
    resultats = {}
    for mesure in q:
        resultats[mesure.id_capteur] = mesure.to_dict()
    return resultats


def aggregat_dashboard(db: Session) -> dict:
    """Construit le payload complet du tableau de bord."""
    capteurs = db.query(Capteur).order_by(Capteur.id).all()
    actionneurs = db.query(Actionneur).order_by(Actionneur.id).all()
    parcelles = db.query(Parcelle).order_by(Parcelle.id).all()
    alertes = (
        db.query(Alerte)
        .filter(Alerte.etat != "resolue")
        .order_by(desc(Alerte.date_debut))
        .all()
    )

    dernieres = _dernieres_mesures(db)

    return {
        "capteurs": [c.to_dict() for c in capteurs],
        "actionneurs": [a.to_dict() for a in actionneurs],
        "parcelles": [p.to_dict() for p in parcelles],
        "alertes": [a.to_dict() for a in alertes],
        # Map id_capteur -> derniere mesure (plus pratique pour le frontend)
        "dernieres_mesures": dernieres,
    }