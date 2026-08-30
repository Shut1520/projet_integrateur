# Architecture Reseau — Mode Local (Developpement)

## Introduction

Ce document decrit l'**architecture reseau locale** utilisee pendant le developpement du projet SAI. Tous les composants communicent sur la meme machine (`localhost`) via des ports locaux.

> **Question repondue** : *Comment les composants du systeme communiquent-ils en mode developpement ?*

---

## Schema Reseau Local (Mermaid)

```mermaid
flowchart TB

    subgraph PC["PC Emmanuel — 127.0.0.1"]

        subgraph NAV_ZONE["Navigateur Web"]
            REACT["React App<br/>http://localhost:5173"]
        end

        subgraph BACKEND_ZONE["Backend Python"]
            FASTAPI["FastAPI (uvicorn)<br/>http://localhost:8000"]
            CLI["CLI Python<br/>argparse + requests"]
        end

        subgraph DB_ZONE["Base de Donnees"]
            PG[("PostgreSQL<br/>localhost:5432<br/>sai_user@sai_db")]
        end

        subgraph MQTT_ZONE["Broker MQTT"]
            BROKER["Mosquitto<br/>localhost:1883<br/>Sans TLS"]
        end

    end

    subgraph ESP_ZONE["ESP32 — Reseau Wi-Fi local"]
        FW["Firmware Arduino<br/>GPIO capteurs/actionneurs"]
    end

    REACT -->|"HTTP<br/>Proxy Vite"| FASTAPI
    CLI -->|"HTTP<br/>requests"| FASTAPI
    FASTAPI -->|"TCP<br/>SQLAlchemy"| PG
    FASTAPI -->|"MQTT<br/>publish / subscribe"| BROKER
    FW -->|"MQTT via Wi-Fi<br/>Port 1883"| BROKER
```

---

## Tableau des Adresses et Ports

| Composant | Adresse | Port | Protocole | Description |
|-----------|---------|------|-----------|-------------|
| **React App (Vite)** | `localhost` | 5173 | HTTP | Frontend en mode dev (HMR) |
| **FastAPI (uvicorn)** | `localhost` | 8000 | HTTP | Backend API REST |
| **PostgreSQL** | `localhost` | 5432 | TCP | Base de donnees `sai_db` |
| **Mosquitto** | `localhost` | 1883 | MQTT (clair) | Broker MQTT local |
| **ESP32** | `192.168.x.x` | — | Wi-Fi | Meme reseau que le PC |

> **Note** : En mode local, toutes les adresses sont `localhost` (127.0.0.1). L'ESP32 est le seul composant avec une IP reseau reelle (adresse Wi-Fi du reseau local).

---

## Flux de Donnees Detailles

### 1. Navigateur → Backend (API REST)

```
Navigateur (React)
    │
    ├── Requete: GET /api/capteurs
    │
    ├── Proxy Vite intercepte /api
    │   └── Redirige vers http://localhost:8000/api/capteurs
    │
    └── FastAPI repond avec les donnees JSON
```

| Parametre | Valeur |
|-----------|--------|
| URL source | `http://localhost:5173/api/capteurs` |
| URL reelle | `http://localhost:8000/api/capteurs` |
| Mecanisme | Proxy Vite (`vite.config.js`) |
| Securite | Aucune (HTTP local) |

### 2. Backend → Base de donnees

```
FastAPI (Python)
    │
    ├── SQLAlchemy engine
    │   └── postgresql://sai_user:sai_password@localhost:5432/sai_db
    │
    ├── Connection pool
    │   └── TCP direct, pas de SSL
    │
    └── PostgreSQL traite la requete SQL
```

| Parametre | Valeur |
|-----------|--------|
| Driver | `psycopg2` |
| URL | `postgresql://sai_user:***@localhost:5432/sai_db` |
| SSL | Desactive (mode local) |
| Timeout | 30 secondes (defaut) |

### 3. Backend → MQTT (Broker)

```
FastAPI (Python)
    │
    ├── Publish (envoyer commande)
    │   └── Topic: sai/commandes/{id}/executer
    │   └── Payload: {"action": "on", "duree": 60}
    │
    └── Subscribe (recevoir mesures)
        └── Topic: sai/capteurs/+/mesures
        └── Callback: traiter_mesure()
```

| Parametre | Valeur |
|-----------|--------|
| Broker | `localhost:1883` |
| Client ID | `sai_backend` |
| QoS | 1 (at least once) |
| TLS | Desactive (mode local) |
| Auth | Aucune (mode local) |

### 4. ESP32 → MQTT (Broker)

```
ESP32 (Arduino)
    │
    ├── Wi-Fi: connexion au reseau local
    │   └── SSID: "MonReseau" / MDP: "******"
    │
    ├── MQTT connect
    │   └── Broker: 192.168.x.x:1883 (IP du PC)
    │
    ├── Publish mesures (toutes les 5 min)
    │   └── Topic: sai/capteurs/{id}/mesures
    │   └── Payload: {"valeur": 25.3, "unite": "°C", "source": "dht22"}
    │
    └── Subscribe commandes
        └── Topic: sai/commandes/{id}/executer
        └── Action: activer GPIO (pompe, ventilation, eclairage)
```

| Parametre | Valeur |
|-----------|--------|
| Broker | `192.168.x.x:1883` (IP du PC sur le reseau local) |
| Client ID | `esp32_sai_{id}` |
| QoS | 1 |
| TLS | Desactive |
| Keepalive | 60 secondes |

---

## Configuration Proxy Vite

Dans `frontend/vite.config.js` :

```javascript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
```

**Effet** : Toute requete du frontend vers `/api/...` est automatiquement redirigee vers `http://localhost:8000/api/...`. Pas besoin de CORS en dev.

---

## Configuration Mosquitto Local

Fichier de configuration par defaut (`/etc/mosquitto/mosquitto.conf` ou `mosquitto.conf`) :

```
listener 1883
allow_anonymous true
```

**Pour lancer Mosquitto en local :**
```bash
# Linux/Mac
mosquitto -c mosquitto.conf

# Windows
mosquitto.exe -c mosquitto.conf
```

---

## Configuration ESP32 (en dur dans le firmware)

```cpp
// WiFi
const char* ssid = "MonReseau";
const char* password = "******";

// MQTT
const char* mqtt_server = "192.168.1.100";  // IP du PC
const int mqtt_port = 1883;
const char* mqtt_topic_mesures = "sai/capteurs/1/mesures";
const char* mqtt_topic_commandes = "sai/commandes/1/executer";
```

---

## Schema des Ports

```
PC Emmanuel (127.0.0.1)
┌─────────────────────────────────────────────────────┐
│                                                     │
│  Port 5173 ─── React (Vite Dev Server)              │
│      │                                               │
│      └── Proxy /api ──→ Port 8000                   │
│                             │                       │
│  Port 8000 ─── FastAPI (uvicorn)                    │
│      │                                               │
│      ├── TCP ──→ Port 5432 (PostgreSQL)             │
│      │                                               │
│      └── MQTT ──→ Port 1883 (Mosquitto)             │
│                                                     │
│  Port 5432 ─── PostgreSQL (sai_db)                  │
│                                                     │
│  Port 1883 ─── Mosquitto (Broker MQTT)              │
│      │                                               │
│      └── MQTT via Wi-Fi ← ESP32 (192.168.x.x)      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Securite en Mode Local

| Aspect | Etat | Risque |
|--------|------|--------|
| **HTTP (non securise)** | Frontend ↔ Backend | Aucun risque (localhost uniquement) |
| **MQTT (non securise)** | ESP32 ↔ Mosquitto | Faible risque (reseau local) |
| **PostgreSQL (pas de SSL)** | Backend ↔ BD | Faible risque (localhost) |
| **Pas de TLS** | Partout | Acceptable en dev, interdit en prod |
| **Pas d'auth MQTT** | ESP32 ↔ Mosquitto | Acceptable en dev |
| **Credentials en dur** | `database.py`, `init_db.py` | Acceptable en dev, a externaliser en prod |

> **Regle** : En mode local, la securite est volontairement relachee pour faciliter le developpement. En production, TOUT sera chiffre (TLS/SSL).

---

## Limitations du Mode Local

| Limite | Impact | Solution en production |
|--------|--------|------------------------|
| Pas de TLS | Donnees en clair | TLS 1.3 partout |
| Pas d'auth MQTT | N'importe qui peut publier | Username/password + TLS |
| Pas de CORS securise | Toutes les origines acceptees | Restreindre a `https://ton-app.vercel.app` |
| IP ESP32 variable | Changer l'IP a chaque reseau | DNS dynamique ou MQTT cloud |
| Pas de SSL PostgreSQL | Credentials en clair | `sslmode=require` |

---

*Architecture reseau locale — Projet SAI — Emmanuel Gilwandji — Aout 2026*
