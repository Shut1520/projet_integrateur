"""
services/mqtt_service.py — Subscriber MQTT du backend SAI.

S'abonne au broker Mosquitto (TLS 8883) et insere en base les mesures
publiees par l'ESP32. Utilise paho-mqtt (API v2).

Flux :
    ESP32 --(MQTT)--> Mosquitto --(subscriber)--> mqtt_service -> PostgreSQL

Topics ecoutes (spec : sai/[parcelle]/[type]/[sous-type]) :
    - sai/+/capteurs/#   (mesures capteurs, payload multi-mesures JSON)
    - sai/+/alertes      (alertes ESP32 — journalisees)

Pas de BD de test dediee : ce module tourne dans le contexte de l'app (BD reelle).
"""

import json
import os
import time

import paho.mqtt.client as mqtt

from config import (
    MQTT_BROKER,
    MQTT_PORT,
    MQTT_TLS,
    MQTT_USER,
    MQTT_PASS,
    MQTT_CA_CERT,
    MQTT_TOPIC_MESURES,
    MQTT_TOPIC_ALERTES,
    MQTT_TOPIC_ACTIONNEURS,
)

# ─── Mapping type de mesure (cle du payload spec) -> nom du capteur en BD ───
TYPE_A_CAPTEUR = {
    "temperature": "dht22",
    "humidite_sol": "yl-69",
    "co2": "sen0159",
    "luminosite": "bh1750",
    "niveau_eau": "niveau_eau",
    "luminosite_lux": "bh1750",
}

# ─── Unite par defaut selon le type de mesure (surcharge par 'unite' du payload) ───
TYPE_A_UNITE = {
    "temperature": "°C",
    "humidite_sol": "%",
    "co2": "ppm",
    "luminosite": "lx",
    "luminosite_lux": "lx",
    "niveau_eau": "%",
}

# Champs du payload conformes a la spec (hors mesures)
_CHAMPS_RESERVES = {"device_id", "parcelle", "timestamp", "unite"}

_CLIENT = None
_PUB_CLIENT = None


def _client():
    """Retourne le client paho (singleton)."""
    global _CLIENT
    if _CLIENT is None:
        _CLIENT = mqtt.Client(
            callback_api_version=mqtt.CallbackAPIVersion.VERSION2,
            client_id="sai_backend_subscriber",
        )
    return _CLIENT


def _publisher_client():
    """Retourne le client paho dedie a la publication d'alertes (singleton).

    Connexion + boucle reseau lancees une seule fois ; paho se reconnecte
    automatiquement si le broker tombe. En cas d'echec initial (broker
    injoignable), on reinitialise pour retenter au prochain appel.
    """
    global _PUB_CLIENT
    if _PUB_CLIENT is None:
        client = mqtt.Client(
            callback_api_version=mqtt.CallbackAPIVersion.VERSION2,
            client_id="sai_backend_publisher",
        )
        _configurer_client(client)
        client.connect(MQTT_BROKER, MQTT_PORT, keepalive=30)
        client.loop_start()
        _PUB_CLIENT = client
    return _PUB_CLIENT


def publier_alerte(alerte, db) -> bool:
    """Publie une alerte sur MQTT `sai/<parcelle>/alertes` (best effort).

    Payload "client-friendly" consomme par le frontend (TopBar/Dashboard).
    L'echec de publication ne doit jamais faire echouer la requete HTTP :
    on journalise et on retourne False dans ce cas.
    """
    if os.getenv("SAI_MQTT_DISABLED", "") in ("1", "true", "True", "yes"):
        return False  # tests : MQTT neutralise

    try:
        from models.parcelle import Parcelle

        parcelle = db.get(Parcelle, alerte.id_parcelle)
        nom = parcelle.nom if parcelle else f"parcelle-{alerte.id_parcelle}"

        payload = {
            "id": alerte.id,
            "type_alerte": alerte.type_alerte,
            "type": alerte.type_alerte,
            "message": alerte.message,
            "severite": alerte.severite,
            "etat": alerte.etat,
            "valeur": alerte.valeur,
            "seuil": alerte.seuil,
            "id_parcelle": alerte.id_parcelle,
            "parcelle": nom,
            "date_debut": alerte.date_debut.isoformat() if alerte.date_debut else None,
        }
        _publisher_client().publish(
            f"sai/{nom}/alertes",
            json.dumps(payload, ensure_ascii=False),
            qos=1,
        )
        return True
    except Exception as e:
        print(f"[mqtt] Publication alerte impossible: {e}")
        return False


def _unite_du_type(type_mesure: str, payload: dict) -> str:
    """Retourne l'unite pour un type de mesure (payload prioritaire sinon defaut)."""
    return payload.get("unite") or TYPE_A_UNITE.get(type_mesure, "")


def _resoudre_capteur(db, nom_parcelle: str, type_mesure: str):
    """Resout le Capteur (id) correspondant a (nom_parcelle, type_mesure).

    Retourne l'id capteur ou None. Cherche une parcelle par nom puis un
    capteur actif dont le nom == type mappe. Les noms de parcelle ne sont pas
    necessairement uniques (BD de dev) : on prend la premiere parcelle active.
    """
    from models.parcelle import Parcelle
    from models.capteur import Capteur

    nom_capteur = TYPE_A_CAPTEUR.get(type_mesure)
    if not nom_capteur:
        return None

    # Recherche la parcelle par nom (premier 'actif' de reference)
    parcelle = (
        db.query(Parcelle)
        .filter(Parcelle.nom == nom_parcelle)
        .order_by(Parcelle.id)
        .first()
    )
    if not parcelle:
        return None

    capteur = (
        db.query(Capteur)
        .filter(
            Capteur.id_parcelle == parcelle.id,
            Capteur.nom == nom_capteur,
            Capteur.etat == "actif",
        )
        .order_by(Capteur.id)
        .first()
    )
    return capteur.id if capteur else None


def _traiter_mesures(db, nom_parcelle: str, payload: dict) -> int:
    """Insere une Mesure par cle de type du payload spec. Retourne le nb insere."""
    from models.mesure import Mesure

    inserees = 0
    for cle, valeur in payload.items():
        if cle in _CHAMPS_RESERVES:
            continue
        try:
            valeur = float(valeur)
        except (TypeError, ValueError):
            continue  # cle non numerique (ex. alerte info) -> ignoree ici

        id_capteur = _resoudre_capteur(db, nom_parcelle, cle)
        if id_capteur is None:
            continue

        mesure = Mesure(
            valeur=valeur,
            unite=_unite_du_type(cle, payload),
            source="esp32",
            id_capteur=id_capteur,
        )
        db.add(mesure)
        inserees += 1

    if inserees:
        db.commit()
    return inserees


def _traiter_payload(topic: str, payload_bytes: bytes) -> None:
    """Decode le JSON puis insere les mesures en base."""
    from database import SessionLocal

    # Topic attendu : sai/<parcelle>/capteurs/<sous-type>
    parties = topic.split("/")
    if len(parties) < 4 or parties[2] != "capteurs":
        return
    nom_parcelle = parties[1]

    try:
        payload = json.loads(payload_bytes.decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError) as e:
        print(f"[mqtt] Payload JSON invalide sur {topic}: {e}")
        return
    if not isinstance(payload, dict):
        print(f"[mqtt] Payload non-objet ignore ({topic})")
        return

    db = SessionLocal()
    try:
        nb = _traiter_mesures(db, nom_parcelle, payload)
        if nb:
            print(f"[mqtt] {nb} mesure(s) inseree(s) ({topic})")
    except Exception as e:
        db.rollback()
        print(f"[mqtt] Erreur insertion ({topic}): {e}")
    finally:
        db.close()


def _traiter_actionneurs(topic: str, payload_bytes: bytes) -> None:
    """Journalise un etat de commande d'actionneur recu sur sai/<parcelle>/actionneurs/#.

    Ne modifie pas la BD : l'etat source de verite des actionneurs reste la BD
    (ce topic sert au temps reel frontend). On loggue a des fins de diagnostic.
    """
    try:
        payload = json.loads(payload_bytes.decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError):
        return
    print(f"[mqtt] Etat actionneur ({topic}): {payload}")


def _on_connect(client, userdata, flags, reason_code, properties=None):
    if reason_code != 0:
        print(f"[mqtt] Connexion refusee (code {reason_code})")
        return
    print(f"[mqtt] Connecte au broker {MQTT_BROKER}:{MQTT_PORT}")
    client.subscribe(MQTT_TOPIC_MESURES, qos=1)
    client.subscribe(MQTT_TOPIC_ALERTES, qos=1)
    client.subscribe(MQTT_TOPIC_ACTIONNEURS, qos=1)


def _on_message(client, userdata, msg):
    try:
        topic = msg.topic
        if "/actionneurs/" in topic:
            _traiter_actionneurs(topic, msg.payload)
        else:
            _traiter_payload(topic, msg.payload)
    except Exception as e:
        print(f"[mqtt] Erreur traitement {msg.topic}: {e}")


def _configurer_client(client) -> None:
    """Applique TLS + authentification au client paho."""
    if MQTT_TLS:
        client.tls_set(ca_certs=MQTT_CA_CERT, tls_version=mqtt.ssl.PROTOCOL_TLS)
    if MQTT_USER:
        client.username_pw_set(MQTT_USER, MQTT_PASS)


def _boucle_subscriber() -> None:
    """Boucle principale du subscriber avec reconnexion (backoff)."""
    client = _client()
    _configurer_client(client)
    client.on_connect = _on_connect
    client.on_message = _on_message

    # Backoff exponentiel borné entre 2 et 60 s
    delai = 2
    while True:
        try:
            client.connect(MQTT_BROKER, MQTT_PORT, keepalive=60)
            delai = 2  # reinitialise apres une connexion reussie
            client.loop_forever()
        except Exception as e:
            print(f"[mqtt] Connexion impossible ({e}) — retente dans {delai}s")
            time.sleep(delai)
            delai = min(delai * 2, 60)
