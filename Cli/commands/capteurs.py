"""
Commande : capteurs — Liste les capteurs du système.

Récupère la liste des capteurs via l'API et l'affiche dans un tableau
avec leurs informations : ID, nom, broche GPIO, état, parcelle et protocole.
"""

from client import APIClient


def lister(api: APIClient):
    """
    Liste tous les capteurs du système.

    Args:
        api: Client API authentifié.
    """
    capteurs = api.get("/api/capteurs")

    if not capteurs:
        print("Aucun capteur trouve.")
        return

    # En-tête du tableau avec colonnes alignées
    print(f"Capteurs ({len(capteurs)} trouves)")
    print("-" * 65)
    print(f"{'ID':<4} {'Nom':<12} {'GPIO':<6} {'Etat':<12} {'Parcelle':<10} {'Protocole':<10}")
    print("-" * 65)

    # Itération sur chaque capteur pour afficher ses propriétés
    for c in capteurs:
        nom = c.get("nom", "?")
        gpio = c.get("gpio", "?")
        etat = c.get("etat", "?")
        id_parcelle = c.get("id_parcelle", "?")
        protocole = c.get("protocole", "?")

        print(f"{c['id']:<4} {nom:<12} {gpio:<6} {etat:<12} {id_parcelle:<10} {protocole:<10}")

    print("-" * 65)
