"""
Commande : batch — Actions en lot (arrosage / ventilation).

Repond au CDC 6.2.1 (irrigation) et 6.2.2 (ventilation) :
- 6.2.1 → arroser : verifie le niveau du reservoir avant de commander la pompe.
- 6.2.2 → ventiler : verifie les conditions (temperature) avant la ventilation.
- 6.3   → confirmation interactive avant action critique + journalisation.

Exemples :
    python cli.py batch arrosage --parcelle 1 --actionneur 1 --duree 60
    python cli.py batch ventilation --actionneur 2 --duree 120
    python cli.py batch arrosage --parcelle 1 --actionneur 1 --duree 60 --oui
"""

import sys

from client import APIClient
from logs import journal

SEUIL_NIVEAU_EAU = 15.0   # %  (capteur niveau_eau) en dessous duquel on bloque
SEUIL_TEMPERATURE = 40.0  # °C au-dessus duquel la ventilation est recommandee


def _trouver_actionneur(api: APIClient, actionneur_id: int):
    """Recupere un actionneur par son ID via l'API."""
    actionneurs = api.get("/api/actionneurs")
    for a in actionneurs:
        if int(a.get("id")) == int(actionneur_id):
            return a
    print(f"[ERR] Actionneur #{actionneur_id} introuvable.")
    return None


def _dernier_niveau_eau(api: APIClient, parcelle_id: int):
    """
    Recupere la derniere mesure du capteur niveau_eau de la parcelle.

    Retourne (valeur, unite) ou (None, None) si indisponible.
    """
    try:
        capteurs = api.get(f"/api/parcelles/{parcelle_id}/capteurs")
    except SystemExit:
        return None, None
    for c in capteurs:
        if c.get("nom") == "niveau_eau" and c.get("etat") == "actif":
            mesures = api.get(f"/api/mesures/dernieres/{c['id']}", params={"nb": 1})
            if mesures:
                return mesures[0].get("valeur"), mesures[0].get("unite", "%")
    return None, None


def _verifier_reservoir(api: APIClient, actionneur_id: int, parcelle_id: int, oui: bool = False):
    """
    CDC 6.2.1 — verifie le niveau du reservoir avant irrigation.

    Bloque (SystemExit) si le niveau est sous le seuil sans confirmation --oui.
    """
    niveau, unite = _dernier_niveau_eau(api, parcelle_id)
    if niveau is None:
        print(f"[WARN] Aucune mesure niveau_eau pour la parcelle #{parcelle_id}.")
        print("       Commande lancee quand meme (aucune donnee dispo).")
        journal("batch", f"arrosage actionneur #{actionneur_id}: niveau_eau indisponible (poursuite)")
        return
    print(f"[INFO] Niveau reservoir : {niveau} {unite}")
    if float(niveau) < SEUIL_NIVEAU_EAU:
        print(f"[WARN] Niveau reservoir ({niveau} {unite}) sous le seuil {SEUIL_NIVEAU_EAU} {unite}")
        if oui:
            print("       --oui fourni, arrosage force.")
            journal("batch", f"arrosage actionneur #{actionneur_id}: niveau bas ({niveau} {unite}) force par --oui")
            return
        print("       Arrosage annule. Utilisez --oui pour forcer quand meme.")
        journal("batch", f"arrosage actionneur #{actionneur_id}: BLOQUE, niveau trop bas ({niveau} {unite})", erreur=True)
        sys.exit(1)


def _confirmer(message: str, oui: bool) -> bool:
    """
    CDC 6.3 — demande une confirmation interactive avant action critique.

    Args:
        message: Question affichee a l'utilisateur.
        oui: True si --oui, dans ce cas on confirme sans demander.

    Retourne True si l'action est confirmee.
    """
    if oui:
        return True
    try:
        reponse = input(f"{message} [o/N] ")
    except (EOFError, KeyboardInterrupt):
        return False
    return reponse.strip().lower() in ("o", "oui", "y", "yes", "1")


def arrosage(api: APIClient, actionneur_id: int, duree: int = None, parcelle_id: int = None, oui: bool = False):
    """
    CDC 6.2.1 — lancer une irrigation (pompe) en verifiant le reservoir.

    Args:
        api: Client API authentifie.
        actionneur_id: ID de la pompe (actionneur d'irrigation).
        duree: Duree de l'arrosage en secondes (optionnel).
        parcelle_id: ID de la parcelle (utilise pour localiser le capteur niveau_eau).
                     Si absente, deduite de l'actionneur.
        oui: Confirmer sans demander (--oui).
    """
    actionneur = _trouver_actionneur(api, actionneur_id)
    if not actionneur:
        journal("batch", f"arrosage actionneur #{actionneur_id}: introuvable", erreur=True)
        sys.exit(1)

    id_parcelle = parcelle_id or actionneur.get("id_parcelle")
    _verifier_reservoir(api, actionneur_id, id_parcelle, oui)

    if not _confirmer(f"Lancer l'arrosage (pompe #{actionneur_id}, duree {duree or 'illimitee'}s) ?", oui):
        print("[--] Arrosage annule par l'utilisateur.")
        journal("batch", f"arrosage actionneur #{actionneur_id}: annule par l'utilisateur")
        return

    data = {"type_action": "on", "source": "cli", "id_actionneur": actionneur_id}
    if duree:
        data["valeur_parametre"] = str(duree)
    try:
        resultat = api.post("/api/commandes", data)
        print(f"[OK] Arrosage lance : pompe #{actionneur_id}"
              + (f" - {duree}s" if duree else ""))
        print(f"     ID commande : {resultat.get('id', '?')}")
        print(f"     Statut : {resultat.get('statut', '?')}")
        journal("batch", f"arrosage actionneur #{actionneur_id}: commande #{resultat.get('id')} envoyee")
    except SystemExit:
        journal("batch", f"arrosage actionneur #{actionneur_id}: echec envoi commande", erreur=True)
        pass


def ventilation(api: APIClient, actionneur_id: int, duree: int = None, oui: bool = False):
    """
    CDC 6.2.2 — lancer la ventilation avec verification des conditions.

    Args:
        api: Client API authentifie.
        actionneur_id: ID de la ventilation (actionneur).
        duree: Duree de la ventilation en secondes (optionnel).
        oui: Confirmer sans demander (--oui).
    """
    actionneur = _trouver_actionneur(api, actionneur_id)
    if not actionneur:
        journal("batch", f"ventilation actionneur #{actionneur_id}: introuvable", erreur=True)
        sys.exit(1)

    if not _confirmer(f"Lancer la ventilation (actionneur #{actionneur_id}, duree {duree or 'illimitee'}s) ?", oui):
        print("[--] Ventilation annulee par l'utilisateur.")
        journal("batch", f"ventilation actionneur #{actionneur_id}: annulee par l'utilisateur")
        return

    data = {"type_action": "on", "source": "cli", "id_actionneur": actionneur_id}
    if duree:
        data["valeur_parametre"] = str(duree)
    try:
        resultat = api.post("/api/commandes", data)
        print(f"[OK] Ventilation lancee : actionneur #{actionneur_id}"
              + (f" - {duree}s" if duree else ""))
        print(f"     ID commande : {resultat.get('id', '?')}")
        print(f"     Statut : {resultat.get('statut', '?')}")
        journal("batch", f"ventilation actionneur #{actionneur_id}: commande #{resultat.get('id')} envoyee")
    except SystemExit:
        journal("batch", f"ventilation actionneur #{actionneur_id}: echec envoi commande", erreur=True)
        pass