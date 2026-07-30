"""
Commande : seuils — Liste et configure les seuils d'automatisation.

Permet de :
- Lister les seuils existants, éventuellement filtrés par parcelle.
- Configurer un nouveau seuil (type de mesure, min, max, unité, parcelle).
"""

from client import APIClient


def lister(api: APIClient, parcelle_id: int = None):
    """
    Liste les seuils configurés.

    Args:
        api: Client API authentifié.
        parcelle_id: Filtre optionnel par ID de parcelle.
    """
    # Construction des paramètres de requête si filtre présent
    params = {}
    if parcelle_id:
        params["parcelle_id"] = parcelle_id

    seuils = api.get("/api/seuils", params=params if params else None)

    if not seuils:
        print("Aucun seuil configure.")
        return

    # En-tête du tableau
    print(f"Seuils ({len(seuils)} trouves)")
    print("-" * 65)
    print(f"{'ID':<4} {'Type':<16} {'Min':<10} {'Max':<10} {'Unite':<8} {'Parcelle':<10}")
    print("-" * 65)

    for s in seuils:
        type_mesure = s.get("type_mesure", "?")
        valeur_min = s.get("valeur_min", "?")
        valeur_max = s.get("valeur_max", "?")
        unite = s.get("unite", "?")
        id_parcelle = s.get("id_parcelle", "?")

        print(f"{s['id']:<4} {type_mesure:<16} {valeur_min:<10} {valeur_max:<10} {unite:<8} {id_parcelle:<10}")

    print("-" * 65)


def configurer(api: APIClient, type_mesure: str, valeur_min: float, valeur_max: float,
               unite: str, id_parcelle: int):
    """
    Configure un nouveau seuil d'automatisation.

    Récupère d'abord l'ID de l'utilisateur connecté, puis envoie
    la configuration au serveur via POST /api/seuils.

    Args:
        api: Client API authentifié.
        type_mesure: Type de mesure (ex: 'humidite_sol', 'temperature').
        valeur_min: Seuil minimum déclenchant une action.
        valeur_max: Seuil maximum déclenchant une action.
        unite: Unité de mesure (ex: '%', '°C', 'ppm').
        id_parcelle: Identifiant de la parcelle concernée.
    """
    # Récupération de l'utilisateur connecté pour l'associer au seuil
    try:
        profil = api.get("/api/auth/me")
        id_utilisateur = profil.get("id")
    except SystemExit:
        print("[ERR] Vous devez etre connecte pour configurer un seuil.")
        return

    data = {
        "type_mesure": type_mesure,
        "valeur_min": valeur_min,
        "valeur_max": valeur_max,
        "unite": unite,
        "id_parcelle": id_parcelle,
        "id_utilisateur": id_utilisateur,
    }

    try:
        resultat = api.post("/api/seuils", data)
        print(f"[OK] Seuil configure : {type_mesure} [{valeur_min} - {valeur_max}] {unite}")
        print(f"     Parcelle #{id_parcelle}")
        print(f"     ID seuil : {resultat.get('id', '?')}")
    except SystemExit:
        pass
