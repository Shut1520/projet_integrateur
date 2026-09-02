"""
scripts/mqtt_simulateur.py — Simulateur ESP32 (publication MQTT).

Publie des mesures multi-capteurs sur `sai/<parcelle>/capteurs/<type>` et une
alerte periodique sur `sai/<parcelle>/alertes`, exactement comme le ferait le
firmware ESP32 (voir Iot/INTERFACE.md). Utile pour valider le temps reel frontend
(Phase 4) sans materiel.

Usage (depuis backend/, venv active) :
    python scripts/mqtt_simulateur.py [--parcelle serre-a] [--interval 5] [--alertes 60]
    [--user sai_esp32] [--pass sai_esp32_pass]

Connexion : broker TLS 8883, utilisateur `sai_esp32` par defaut (ACL : write
capteurs + alertes). Ctrl+C pour arreter.
"""

import argparse
import json
import os
import random
import sys
import time

# Ajoute le dossier backend au PYTHONPATH pour importer config
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import paho.mqtt.client as mqtt

from config import MQTT_BROKER, MQTT_PORT, MQTT_TLS, MQTT_CA_CERT

# Valeurs nominales par type de mesure (le simulateur fait varier autour de la cible)
NOMINAUX = {
    "temperature": 24.0,
    "humidite_sol": 45.0,
    "co2": 600.0,
    "luminosite": 60.0,   # % (firmware LDR), aligne sur seuils 20-80 %
    "niveau_eau": 80.0,
}


def _payload_aleatoire():
    """Construit un payload multi-mesures (spec 3.3)."""
    return {
        "device_id": "esp32_sim",
        "parcelle": None,  # rempli par l'appelant
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "temperature": round(NOMINAUX["temperature"] + random.uniform(-3, 3), 1),
        "humidite_sol": round(NOMINAUX["humidite_sol"] + random.uniform(-10, 10), 1),
        "co2": round(NOMINAUX["co2"] + random.uniform(-80, 80), 0),
        "luminosite": round(NOMINAUX["luminosite"] + random.uniform(-10, 10), 0),
        "niveau_eau": round(NOMINAUX["niveau_eau"] + random.uniform(-8, 8), 1),
    }


def _payload_alerte(parcelle: str, i: int):
    """Construit une alerte periodique (format consomme par le frontend)."""
    return {
        "id": i,
        "type_alerte": "simulation_test",
        "type": "simulation_test",
        "message": f"Alerte simulateur #{i} sur '{parcelle}' (seuil depasse)",
        "severite": random.choice(["haute", "critique"]),
        "etat": "active",
        "valeur": 42.0,
        "seuil": 30.0,
        "id_parcelle": 1,
        "parcelle": parcelle,
        "date_debut": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }


def main():
    parser = argparse.ArgumentParser(description="Simulateur ESP32 (MQTT)")
    parser.add_argument("--parcelle", default="serre-a", help="Nom de parcelle dans les topics")
    parser.add_argument("--interval", type=int, default=5, help="Intervalle (s) entre deux publications")
    parser.add_argument("--alertes", type=int, default=60, help="Publier une alerte toutes les N secondes")
    parser.add_argument("--user", default="sai_esp32", help="Utilisateur MQTT (ACL : write capteurs + alertes)")
    parser.add_argument("--pass", dest="password", default="sai_esp32_pass", help="Mot de passe MQTT")
    args = parser.parse_args()

    client = mqtt.Client(
        callback_api_version=mqtt.CallbackAPIVersion.VERSION2,
        client_id="esp32_simulateur",
    )
    if MQTT_TLS:
        client.tls_set(ca_certs=MQTT_CA_CERT, tls_version=mqtt.ssl.PROTOCOL_TLS)
    client.username_pw_set(args.user, args.password)

    print(f"Connecting: {MQTT_BROKER}:{MQTT_PORT} (TLS={MQTT_TLS}) as {args.user}")
    client.connect(MQTT_BROKER, MQTT_PORT, keepalive=30)
    client.loop_start()

    topic_mesures = f"sai/{args.parcelle}/capteurs/telemetrie"
    topic_alertes = f"sai/{args.parcelle}/alertes"
    print(f"Publication mesures -> {topic_mesures} (toutes les {args.interval}s)")
    print(f"Publication alertes  -> {topic_alertes} (toutes les {args.alertes}s)")
    print("Ctrl+C pour arreter.")

    dernier_compteur = 0
    demarrage = time.time()
    try:
        while True:
            payload = _payload_aleatoire()
            payload["parcelle"] = args.parcelle
            client.publish(topic_mesures, json.dumps(payload), qos=1)
            print(f"  + mesures {time.strftime('%H:%M:%S')}")

            if int(time.time() - demarrage) >= dernier_compteur + args.alertes:
                dernier_compteur = int(time.time() - demarrage)
                client.publish(topic_alertes, json.dumps(_payload_alerte(args.parcelle, dernier_compteur)), qos=1)
                print(f"  ! alerte publiee #{dernier_compteur}")

            time.sleep(args.interval)
    except KeyboardInterrupt:
        print("\nArret du simulateur.")
    finally:
        client.disconnect()
        client.loop_stop()


if __name__ == "__main__":
    main()