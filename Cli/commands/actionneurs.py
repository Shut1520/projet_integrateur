"""
Commande : actionneurs — Liste les actionneurs du système.

Récupère la liste complète des actionneurs via l'API et l'affiche
sous forme de tableau dans le terminal.
"""

from client import APIClient


def lister(api: APIClient):
    """
    Liste tous les actionneurs du système.

    Args:
        api: Client API authentifié.
    """
    actionneurs = api.get("/api/actionneurs")

    if not actionneurs:
        print("Aucun actionneur trouve.")
        return

    print(f"Actionneurs ({len(actionneurs)} trouves)")
    print("-" * 50)
    print(f"{'ID':<4} {'Nom':<14} {'GPIO':<6} {'Etat':<12} {'Parcelle':<10}")
    print("-" * 50)

    # Construction d'un tableau aligné avec les colonnes ID, Nom, GPIO, Etat, Parcelle
    for a in actionneurs:
        nom = a.get("nom", "?")
        gpio = a.get("gpio", "?")
        etat = a.get("etat", "?")
        id_parcelle = a.get("id_parcelle", "?")

        print(f"{a['id']:<4} {nom:<14} {gpio:<6} {etat:<12} {id_parcelle:<10}")

    print("-" * 50)
