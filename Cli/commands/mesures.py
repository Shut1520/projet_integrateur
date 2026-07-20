"""
Commande : mesures — Dernieres mesures d'un capteur.
"""

from datetime import datetime
from client import APIClient


def lister(api: APIClient, capteur_id: int, nb: int = 10):
    """Affiche les N dernieres mesures d'un capteur."""
    mesures = api.get(f"/api/mesures/dernieres/{capteur_id}", params={"nb": nb})

    if not mesures:
        print(f"Aucune mesure trouvee pour le capteur #{capteur_id}.")
        return

    print(f"Dernieres {len(mesures)} mesures du capteur #{capteur_id}")
    print("-" * 60)
    print(f"{'ID':<6} {'Valeur':<12} {'Unite':<8} {'Source':<12} {'Date':<22}")
    print("-" * 60)

    for m in mesures:
        valeur = m.get("valeur", "?")
        unite = m.get("unite", "?")
        source = m.get("source", "?")
        timestamp = m.get("timestamp", "?")

        if timestamp and timestamp != "?":
            try:
                dt = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
                timestamp_aff = dt.strftime("%Y-%m-%d %H:%M:%S")
            except (ValueError, AttributeError):
                timestamp_aff = str(timestamp)
        else:
            timestamp_aff = "?"

        print(f"{m['id']:<6} {valeur:<12} {unite:<8} {source:<12} {timestamp_aff:<22}")

    print("-" * 60)
