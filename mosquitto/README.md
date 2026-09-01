# Broker Mosquitto SAI

Configuration versionnee du broker MQTT utilise par le projet SAI (Phase 1 de la
preparation IoT). Deux listeners sont prevus, mais sur **cette** machine seul
le port **8883 (TLS)** est expose.

## Ports

| Port | Statut | Usage |
|------|--------|-------|
| **8883** | **Expose (TLS + auth + ACL)** | Broker SAI (notre config ci-dessous) |
| 1883 | Occupé par le service Windows Mosquitto (config par défaut, **inutilisé par SAI**) | — |

Le bloc `listener 1883` est present dans `mosquitto.conf` mais **commenté** : il
peut être réactivé si le service Windows libère le port (accès local non chiffré,
pratique pour déboguer).

## Fichiers

- `mosquitto.conf` — configuration du broker (auth + ACL + TLS).
- `acl` — contrôle d'accès par topic (`sai_backend`, `sai_esp32`).
- `passwd` — mots de passe (hashés, **gitignoré**, régénéré par `setup_broker.ps1`).
- `certs/` — PKI TLS autosignée (CA + serveur). Clés privées **gitignorées**.
- `data/` — persistance du broker (gitignoré).

## Utilisateurs MQTT

| Utilisateur | Rôle | Portée ACL |
|-------------|------|------------|
| `sai_backend` | subscriber backend | read `sai/#`, write `sai/+/actionneurs/#` |
| `sai_esp32` | publisher ESP32 | write `sai/+/capteurs/#`, write `sai/+/alertes`, read `sai/+/commandes` |

## Prérequis (une seule fois)

- Mosquitto installé (winget : `EclipseFoundation.Mosquitto`, v2.1.2).
- OpenSSL (utilisé celui embarqué par Git : `C:\Program Files\Git\mingw64\bin\openssl.exe`).

## Setup & démarrage

Depuis le dossier `mosquitto/` :

```powershell
# 1. Génère la PKI + crée le passwd (une seule fois)
powershell -ExecutionPolicy Bypass -File scripts\setup_broker.ps1

# 2. Démarre le broker (en avant-plan, Ctrl+C pour arrêter)
powershell -ExecutionPolicy Bypass -File scripts\start_broker.ps1

# 3. Arrête proprement (si lancé en arrière-plan)
powershell -ExecutionPolicy Bypass -File scripts\stop_broker.ps1
```

Scripts : `scripts/gen_certs.ps1`, `scripts/setup_broker.ps1`, `scripts/start_broker.ps1`, `scripts/stop_broker.ps1`.

## Connecter un client (ex. subscriber backend)

```bash
mosquitto_sub -h localhost -p 8883 --cafile certs/mosquitto_ca.crt \
  -u sai_backend -P sai_backend_pass -t 'sai/#' -v
```

> En dev, le backend se connecte via `paho-mqtt` avec les réglages de
> `backend/config.py` / `backend/.env` (voir Phase 2 du subscriber).
