"""
Commande : capteurs — Liste les capteurs.
"""

from client import APIClient


def lister(api: APIClient):
    """Liste tous les capteurs du systeme."""
    capteurs = api.get("/api/capteurs")

    if not capteurs:
        print("Aucun capteur trouve.")
        return

    print(f"Capteurs ({len(capteurs)} trouves)")
    print("-" * 65)
    print(f"{'ID':<4} {'Nom':<12} {'GPIO':<6} {'Etat':<12} {'Parcelle':<10} {'Protocole':<10}")
    print("-" * 65)

    for c in capteurs:
        nom = c.get("nom", "?")
        gpio = c.get("gpio", "?")
        etat = c.get("etat", "?")
        id_parcelle = c.get("id_parcelle", "?")
        protocole = c.get("protocole", "?")

        print(f"{c['id']:<4} {nom:<12} {gpio:<6} {etat:<12} {id_parcelle:<10} {protocole:<10}")

    print("-" * 65)
