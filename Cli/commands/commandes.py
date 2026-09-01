"""
Commande : commandes / commander — Liste et envoie des commandes.

Permet de :
- Lister les 20 dernières commandes envoyées aux actionneurs.
- Envoyer une nouvelle commande (on/off) à un actionneur spécifique,
  avec durée optionnelle.
- Vérifier le niveau du réservoir avant irrigation (CDC 6.2.1).
- Confirmer les actions critiques (CDC 6.3) et journaliser les exécutions.
"""

from client import APIClient
from logs import journal

ACTIONNEURS_CRITIQUES = {"pompe", "ventilation", "eclairage"}


def _trouver_actionneur(api: APIClient, actionneur_id: int):
    """Recupere un actionneur par son ID via l'API."""
    actionneurs = api.get("/api/actionneurs")
    for a in actionneurs:
        if int(a.get("id")) == int(actionneur_id):
            return a
    return None


def _dernier_niveau_eau(api: APIClient, parcelle_id: int):
    """Recupere la derniere mesure du capteur niveau_eau de la parcelle."""
    try:
        capteurs = api.get(f"/api/parcelles/{parcelle_id}/capteurs")
    except SystemExit:
        return None, None
    for c in capteurs:
        if c.get("nom") == "niveau_eau" and c.get("etat") == "actif":
            try:
                mesures = api.get(f"/api/mesures/dernieres/{c['id']}", params={"nb": 1})
            except SystemExit:
                return None, None
            if mesures:
                return mesures[0].get("valeur"), mesures[0].get("unite", "%")
    return None, None


def _verifier_reservoir(api: APIClient, actionneur: dict, oui: bool) -> bool:
    """
    CDC 6.2.1 — avant d'activer une pompe, verifier le niveau du reservoir.

    Args:
        api: Client API authentifie.
        actionneur: Dictionnaire de l'actionneur cible.
        oui: True si --oui (force sans confirmation).

    Retourne True si l'action peut continuer.
    """
    nom = (actionneur.get("nom") or "").lower()
    if nom != "pompe":
        return True  # pas une irrigation

    niveau, unite = _dernier_niveau_eau(api, actionneur.get("id_parcelle"))
    if niveau is None:
        print("[WARN] Niveau reservoir inconnu (aucune mesure niveau_eau).")
        print("       Poursuite quand meme. Utilisez --oui pour confirmer explicitement.")
        return True
    print(f"[INFO] Niveau reservoir : {niveau} {unite}")
    if float(niveau) < 15.0:
        print(f"[WARN] Niveau reservoir bas ({niveau} {unite} < 15%).")
        if oui:
            print("       --oui fourni, irrigation forcee.")
            return True
        print("       Irrigation annulee.")
        journal("commander", f"pompe #{actionneur['id']}: irrigation bloquee, niveau {niveau}{unite}", erreur=True)
        return False
    return True


def _confirmer_critique(api: APIClient, actionneur: dict, oui: bool) -> bool:
    """
    CDC 6.3 — demande confirmation avant une action critique.

    Args:
        api: Client API authentifie.
        actionneur: Dictionnaire de l'actionneur cible.
        oui: True si --oui (confirme sans demander).

    Retourne True si l'action est confirmee.
    """
    nom = (actionneur.get("nom") or "").lower()
    if oui or nom not in ACTIONNEURS_CRITIQUES:
        return True
    try:
        reponse = input(f"Confirmer l'action sur l'actionneur '{actionneur.get('nom')}' ? [o/N] ")
    except (EOFError, KeyboardInterrupt):
        return False
    return reponse.strip().lower() in ("o", "oui", "y", "yes", "1")


def lister(api: APIClient):
    """
    Liste les dernières commandes.

    Args:
        api: Client API authentifié.
    """
    commandes = api.get("/api/commandes")

    if not commandes:
        print("Aucune commande trouvee.")
        return

    print(f"Commandes recentes ({len(commandes)} trouves)")
    print("-" * 70)
    print(f"{'ID':<4} {'Type':<12} {'Source':<8} {'Statut':<12} {'Actionneur':<10} {'Date':<22}")
    print("-" * 70)

    # Limite l'affichage aux 20 dernières commandes pour la lisibilité
    for c in commandes[:20]:
        type_action = c.get("type_action", "?")
        source = c.get("source", "?")
        statut = c.get("statut", "?")
        id_actionneur = c.get("id_actionneur", "?")
        timestamp = c.get("timestamp", "?")

        # Troncature du timestamp pour un affichage plus compact
        if timestamp and len(str(timestamp)) > 19:
            timestamp = str(timestamp)[:19]

        print(f"{c['id']:<4} {type_action:<12} {source:<8} {statut:<12} {id_actionneur:<10} {str(timestamp):<22}")

    print("-" * 70)


def envoyer(api: APIClient, actionneur_id: int, action: str, duree: int = None, oui: bool = False):
    """
    Envoie une commande à un actionneur.

    Args:
        api: Client API authentifié.
        actionneur_id: Identifiant de l'actionneur cible.
        action: Action à exécuter ('on' ou 'off').
        duree: Durée en secondes (optionnel, pour une temporisation).
        oui: Confirmer sans demander (--oui), pour les actions critiques.
    """
    # Identification de l'actionneur (pour pompe/ventilation + confirmation)
    actionneur = _trouver_actionneur(api, actionneur_id)

    # CDC 6.2.1 : verifier le reservoir avant d'activer la pompe
    if action == "on":
        if actionneur and not _verifier_reservoir(api, actionneur, oui):
            return

    # CDC 6.3 : confirmation avant action critique
    if actionneur and not _confirmer_critique(api, actionneur, oui):
        print("[--] Action annulee.")
        journal("commander", f"actionneur #{actionneur_id}: {action} annulee par l'utilisateur")
        return

    # Construction du payload ; la source indique que la commande vient du CLI
    data = {
        "type_action": action,
        "source": "cli",
        "id_actionneur": actionneur_id,
    }

    if duree:
        data["valeur_parametre"] = str(duree)

    try:
        resultat = api.post("/api/commandes", data)
        print(f"[OK] Commande envoyee : {action} sur actionneur #{actionneur_id}")
        print(f"     ID commande : {resultat.get('id', '?')}")
        print(f"     Statut : {resultat.get('statut', '?')}")
        if duree:
            print(f"     Duree : {duree} secondes")
        journal("commander", f"actionneur #{actionneur_id}: {action} (duree={duree}) -> commande #{resultat.get('id')}")
    except SystemExit:
        journal("commander", f"actionneur #{actionneur_id}: {action} echec envoi", erreur=True)
        pass
