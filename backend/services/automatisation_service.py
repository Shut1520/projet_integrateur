"""
Service d'automatisation (UC6).

Logique metier :
- Lire les seuils configures pour chaque parcelle
- Comparer aux dernieres mesures de chaque capteur
- Declencher un actionneur OU generer une alerte
- Tourne toutes les X minutes (timer)
"""

from datetime import datetime, timezone

from sqlalchemy import desc
from sqlalchemy.orm import Session

from models.seuil import Seuil
from models.mesure import Mesure
from models.capteur import Capteur
from models.alerte import Alerte
from models.actionneur import Actionneur


# ─── Types de mesure → capteurs associes ───
TYPES_MESURE_CAPTEUR = {
    "humidite_sol": "yl-69",
    "temperature": "dht22",
    "co2": "sen0159",
    "luminosite": "bh1750",
    "niveau_eau": "niveau_eau",
}

# ─── Types de mesure → actionneurs a declencher ───
TYPES_MESURE_ACTIONNEUR = {
    "humidite_sol": "pompe",         # Si humidite basse → pompe ON
    "temperature": "ventilation",    # Si temperature haute → ventilation ON
    "luminosite": "eclairage",       # Si luminosite basse → eclairage ON
}


def _derniere_mesure(db: Session, capteur_id: int) -> Mesure | None:
    """Recupere la mesure la plus recente d'un capteur."""
    return (
        db.query(Mesure)
        .filter(Mesure.id_capteur == capteur_id)
        .order_by(desc(Mesure.timestamp))
        .first()
    )


def _capteur_par_type(db: Session, parcelle_id: int, type_mesure: str) -> Capteur | None:
    """Trouve le capteur correspondant a un type de mesure pour une parcelle."""
    nom_capteur = TYPES_MESURE_CAPTEUR.get(type_mesure)
    if not nom_capteur:
        return None
    return (
        db.query(Capteur)
        .filter(
            Capteur.id_parcelle == parcelle_id,
            Capteur.nom == nom_capteur,
        )
        .first()
    )


def _actionneur_par_type(db: Session, parcelle_id: int, type_mesure: str) -> Actionneur | None:
    """Trouve l'actionneur correspondant a un type de mesure pour une parcelle."""
    nom_actionneur = TYPES_MESURE_ACTIONNEUR.get(type_mesure)
    if not nom_actionneur:
        return None
    return (
        db.query(Actionneur)
        .filter(
            Actionneur.id_parcelle == parcelle_id,
            Actionneur.nom == nom_actionneur,
        )
        .first()
    )


def _alerte_deja_active(db: Session, type_alerte: str, parcelle_id: int) -> bool:
    """Verifie si une alerte du meme type est deja active pour cette parcelle."""
    return (
        db.query(Alerte)
        .filter(
            Alerte.type_alerte == type_alerte,
            Alerte.id_parcelle == parcelle_id,
            Alerte.etat == "active",
        )
        .first()
        is not None
    )


def _resoudre_alertes(db: Session, type_alerte: str, parcelle_id: int) -> int:
    """Resout toutes les alertes actives d'un type pour une parcelle. Retourne le nombre."""
    alertes = (
        db.query(Alerte)
        .filter(
            Alerte.type_alerte == type_alerte,
            Alerte.id_parcelle == parcelle_id,
            Alerte.etat == "active",
        )
        .all()
    )
    for a in alertes:
        a.resoudre()
    return len(alertes)


def _creer_alerte(
    db: Session,
    type_alerte: str,
    valeur: float,
    seuil: float,
    severite: str,
    message: str,
    id_parcelle: int,
    id_mesure: int | None = None,
) -> Alerte:
    """Cree et persiste une alerte."""
    alerte = Alerte(
        type_alerte=type_alerte,
        valeur=valeur,
        seuil=seuil,
        severite=severite,
        message=message,
        etat="active",
        id_parcelle=id_parcelle,
        id_mesure=id_mesure,
    )
    db.add(alerte)
    return alerte


def evaluer_parcelle(db: Session, parcelle_id: int) -> dict:
    """
    Evaluede tous les seuils d'une parcelle et prend des actions.

    Logique :
    - Seuil depasse → alerte (si pas de doublon active) + activer actionneur (via Commande)
    - Seuil normal  → resoudre les alertes actives + desactiver actionneur (via Commande)

    Retourne un dict avec :
    - alertes_creees: nombre d'alertes generees
    - alertes_resolues: nombre d'alertes resolues
    - actions_declenchees: nombre d'actionneurs actives
    - details: liste des decisions prises
    """
    seuils = db.query(Seuil).filter(Seuil.id_parcelle == parcelle_id).all()
    resultats = {
        "alertes_creees": 0,
        "alertes_resolues": 0,
        "actions_declenchees": 0,
        "details": [],
        "_alertes_obj": [],
    }

    for seuil in seuils:
        # Trouver le capteur correspondant
        capteur = _capteur_par_type(db, parcelle_id, seuil.type_mesure)
        if not capteur:
            continue

        # Recuperer la derniere mesure
        mesure = _derniere_mesure(db, capteur.id)
        if not mesure:
            continue

        # Determiner l'actionneur associe
        actionneur = _actionneur_par_type(db, parcelle_id, seuil.type_mesure)

        if seuil.est_depasse(mesure.valeur):
            # ─── Seuil depasse ───
            if mesure.valeur < seuil.valeur_min:
                ecart = seuil.valeur_min - mesure.valeur
                direction = "bas"
            else:
                ecart = mesure.valeur - seuil.valeur_max
                direction = "haut"

            type_alerte = f"{seuil.type_mesure}_{direction}"
            severite = "haute" if ecart < 10 else "critique"

            # Dedoublonnage : ne pas creer si une alerte active du meme type existe deja
            if not _alerte_deja_active(db, type_alerte, parcelle_id):
                message = f"{seuil.type_mesure} {direction} : {mesure.valeur}{seuil.unite} (seuil: {seuil.valeur_min}-{seuil.valeur_max}{seuil.unite})"
                alerte = _creer_alerte(
                    db=db,
                    type_alerte=type_alerte,
                    valeur=mesure.valeur,
                    seuil=seuil.valeur_max if direction == "haut" else seuil.valeur_min,
                    severite=severite,
                    message=message,
                    id_parcelle=parcelle_id,
                    id_mesure=mesure.id,
                )
                resultats["alertes_creees"] += 1
                resultats["_alertes_obj"].append(alerte)
                resultats["details"].append(f"Alerte: {message}")
            else:
                resultats["details"].append(f"Alerte {type_alerte} deja active, skip")

            # Activer l'actionneur via une commande (cohérence flux web/cli)
            if actionneur and actionneur.etat == "inactif":
                from services.commande_service import creer_commande
                try:
                    creer_commande(
                        db=db,
                        type_action="on",
                        source="auto",
                        id_actionneur=actionneur.id,
                        valeur_parametre=str(mesure.valeur),
                    )
                    resultats["actions_declenchees"] += 1
                    resultats["details"].append(f"Actionneur {actionneur.nom} active (commande auto)")
                except Exception:
                    resultats["details"].append(f"Echec activation {actionneur.nom}")

        else:
            # ─── Seuil normal : resoudre alertes + desactiver actionneur ───
            type_alerte_bas = f"{seuil.type_mesure}_bas"
            type_alerte_haut = f"{seuil.type_mesure}_haut"

            resolues = _resoudre_alertes(db, type_alerte_bas, parcelle_id)
            resolues += _resoudre_alertes(db, type_alerte_haut, parcelle_id)
            if resolues > 0:
                resultats["alertes_resolues"] += resolues
                resultats["details"].append(f"{resolues} alerte(s) resolue(s) pour {seuil.type_mesure}")

            # Desactiver l'actionneur si actif
            if actionneur and actionneur.etat == "actif":
                from services.commande_service import creer_commande
                try:
                    creer_commande(
                        db=db,
                        type_action="off",
                        source="auto",
                        id_actionneur=actionneur.id,
                    )
                    resultats["details"].append(f"Actionneur {actionneur.nom} desactive (commande auto)")
                except Exception:
                    resultats["details"].append(f"Echec desactivation {actionneur.nom}")

    return resultats


def executer_boucle(db: Session) -> dict:
    """
    Execute une boucle d'automatisation sur toutes les parcelles.
    Appele par un timer toutes les X minutes.
    """
    from models.parcelle import Parcelle

    parcelles = db.query(Parcelle).all()
    resultats_total = {
        "parcelles_evaluees": 0,
        "alertes_creees": 0,
        "alertes_resolues": 0,
        "actions_declenchees": 0,
    }
    alertes_crees = []

    for parcelle in parcelles:
        resultats = evaluer_parcelle(db, parcelle.id)
        resultats_total["parcelles_evaluees"] += 1
        resultats_total["alertes_creees"] += resultats["alertes_creees"]
        resultats_total["alertes_resolues"] += resultats.get("alertes_resolues", 0)
        resultats_total["actions_declenchees"] += resultats["actions_declenchees"]
        alertes_crees.extend(resultats.get("_alertes_obj", []))

    db.commit()

    # Temps reel : publie les alertes generees sur MQTT (best effort)
    if alertes_crees:
        from services.mqtt_service import publier_alerte

        for alerte in alertes_crees:
            publier_alerte(alerte, db)

    return resultats_total
