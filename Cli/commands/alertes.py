"""
Commande : alertes — Liste, reconnaît ou résout les alertes.

Permet de :
- Lister les alertes avec filtres optionnels (état, parcelle).
- Marquer une alerte comme « reconnue » (prise en charge).
- Marquer une alerte comme « résolue » (problème corrigé).
"""

from datetime import datetime
from client import APIClient


def lister(api: APIClient, etat: str = None, parcelle_id: int = None):
    """
    Liste les alertes avec filtres optionnels.

    Args:
        api: Client API authentifie.
        etat: Filtre par etat ('active', 'reconnue', 'resolue').
        parcelle_id: Filtre par ID de parcelle.
    """
    # Construction dynamique des paramètres de requête
    params = {}
    if etat:
        params["etat"] = etat
    if parcelle_id:
        params["parcelle_id"] = parcelle_id

    alertes = api.get("/api/alertes", params=params if params else None)

    if not alertes:
        print("Aucune alerte trouvee.")
        return

    # En-tête du tableau d'affichage
    print(f"Alertes ({len(alertes)} trouvees)")
    print("-" * 75)
    print(f"{'ID':<4} {'Type':<20} {'Severite':<10} {'Etat':<12} {'Parcelle':<9} {'Date':<16}")
    print("-" * 75)

    for a in alertes:
        type_alerte = a.get("type_alerte", a.get("type", "?"))
        severite = a.get("severite", "?")
        etat_alerte = a.get("etat", "?")
        id_parcelle = a.get("id_parcelle", "?")
        date_debut = a.get("date_debut", "?")

        message = a.get("message", "")

        # Conversion du timestamp ISO en format lisible (YYYY-MM-DD HH:MM)
        if date_debut and date_debut != "?":
            try:
                dt = datetime.fromisoformat(date_debut.replace("Z", "+00:00"))
                date_aff = dt.strftime("%Y-%m-%d %H:%M")
            except (ValueError, AttributeError):
                date_aff = str(date_debut)[:16]
        else:
            date_aff = "?"

        print(f"{a['id']:<4} {str(type_alerte):<20} {severite:<10} {etat_alerte:<12} {id_parcelle:<9} {date_aff:<16}")
        if message:
            print(f"     `-- {message}")

    print("-" * 75)


def reconnaitre(api: APIClient, alerte_id: int):
    """
    Marque une alerte comme reconnue.

    Transmet au serveur que l'operateur a pris connaissance de l'alerte.

    Args:
        api: Client API authentifie.
        alerte_id: Identifiant de l'alerte a acquitter.
    """
    try:
        api.put(f"/api/alertes/{alerte_id}/reconnaitre")
        print(f"[OK] Alerte #{alerte_id} marquee comme reconnue.")
    except SystemExit:
        pass


def resoudre(api: APIClient, alerte_id: int):
    """
    Marque une alerte comme resolue.

    Indique au serveur que le probleme a l'origine de l'alerte a ete corrige.

    Args:
        api: Client API authentifie.
        alerte_id: Identifiant de l'alerte a resoudre.
    """
    try:
        api.put(f"/api/alertes/{alerte_id}/resoudre")
        print(f"[OK] Alerte #{alerte_id} resolue.")
    except SystemExit:
        pass
