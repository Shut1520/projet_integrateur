"""
Commande : statut — Tableau de bord récapitulatif du système.

Récupère depuis l'API les capteurs, actionneurs, alertes actives
et parcelles, puis affiche un résumé numérique du système.

Exemple :
    python cli.py statut
"""

from client import SAIClient


def run(client: SAIClient):
    """
    Récupère les statistiques du système et les affiche.

    Args:
        client: Instance de SAIClient connectée.
    """
    try:
        # Récupération de toutes les ressources en un seul appel
        capteurs = client.get("/api/capteurs")
        actionneurs = client.get("/api/actionneurs")
        alertes = client.get("/api/alertes", params={"etat": "active"})
        parcelles = client.get("/api/parcelles")

    except Exception as e:
        print(f"❌ Erreur lors de la recuperation des donnees : {e}")
        return

    # Calcul des statistiques par filtrage des états
    nb_capteurs_total = len(capteurs)
    nb_capteurs_actifs = sum(1 for c in capteurs if c["etat"] == "actif")
    nb_actionneurs_total = len(actionneurs)
    nb_actionneurs_actifs = sum(1 for a in actionneurs if a["etat"] == "actif")
    nb_alertes_actives = len(alertes)
    nb_parcelles = len(parcelles)

    # Afficher le tableau de bord
    print("\n" + "=" * 45)
    print("  🌿 TABLEAU DE BORD SAI - SYSTEME AGRICOLE INTELLIGENT")
    print("=" * 45)

    print(f"\n  📦 Parcelles      : {nb_parcelles}")
    print(f"  📡 Capteurs       : {nb_capteurs_actifs}/{nb_capteurs_total} actifs")
    print(f"  ⚙️  Actionneurs   : {nb_actionneurs_actifs}/{nb_actionneurs_total} actifs")
    print(f"  🔔 Alertes        : {nb_alertes_actives} non resolues")

    # Avertissement si des alertes actives
    if nb_alertes_actives > 0:
        print(f"\n  ⚠️  ATTENTION : {nb_alertes_actives} alerte(s) necessite(nt) votre attention !")
        print("     Utilisez 'python cli.py alertes --non-resolues' pour les voir.")

    print("\n" + "=" * 45)
