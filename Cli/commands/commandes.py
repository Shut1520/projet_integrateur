"""
Commande : commandes / commander — Liste et envoie des commandes.

Permet de :
- Lister les 20 dernières commandes envoyées aux actionneurs.
- Envoyer une nouvelle commande (on/off) à un actionneur spécifique,
  avec durée optionnelle.
"""

from client import APIClient


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


def envoyer(api: APIClient, actionneur_id: int, action: str, duree: int = None):
    """
    Envoie une commande à un actionneur.

    Args:
        api: Client API authentifié.
        actionneur_id: Identifiant de l'actionneur cible.
        action: Action à exécuter ('on' ou 'off').
        duree: Durée en secondes (optionnel, pour une temporisation).
    """
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
    except SystemExit:
        pass
