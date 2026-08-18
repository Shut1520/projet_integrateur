# Architecture Reseau — Mode Production

## Introduction

Ce document decrit l'**architecture reseau de production** du projet SAI. Chaque composant est deploie sur un service cloud securise avec TLS. Le systeme est accessible depuis n'importe quel appareil connecte a Internet.

> **Question repondue** : *Comment les composants du systeme communiquent-ils en production ?*

---

## Schema Reseau Production (Mermaid)

```mermaid
flowchart TB

    subgraph INTERNET["Internet — Utilisateurs"]
        NAV["Navigateur Web<br/>Chrome / Firefox / Safari"]
        CLI["CLI Python<br/>argparse + requests"]
        ESP["ESP32<br/>Firmware Arduino<br/>Wi-Fi campagne"]
    end

    subgraph VERCEL["Vercel — Frontend"]
        REACT["React App (dist/)<br/>CDN global<br/>HTTPS :443"]
    end

    subgraph RENDER["Render — Backend"]
        FASTAPI["FastAPI (Docker)<br/>HTTPS :443<br/>Uvicorn workers"]
    end

    subgraph DB_CLOUD["Render — PostgreSQL"]
        PG[("sai_db<br/>Host: xxx.render.com<br/>Port 5432<br/>SSL: require")]
    end

    subgraph MQTT_CLOUD["Broker MQTT Cloud"]
        BROKER["Mosquitto Cloud<br/>xxx.sensordata.com<br/>Port 8883 (TLS)"]
    end

    NAV -->|"HTTPS :443"| REACT
    CLI -->|"HTTPS :443<br/>JWT Bearer"| FASTAPI
    REACT -->|"HTTPS :443<br/>API REST /api/*"| FASTAPI
    FASTAPI -->|"TCP :5432<br/>SSL<br/>SQLAlchemy"| PG
    FASTAPI -->|"MQTT/TLS :8883<br/>subscribe"| BROKER
    ESP -->|"MQTT/TLS :8883<br/>Wi-Fi"| BROKER
```

---

## Tableau des Adresses et Ports

| Composant | Adresse | Port | Protocole | Securite |
|-----------| `xxx.vercel.app` | 443 | HTTPS | TLS 1.3 (auto) |
| **FastAPI (Render)** | `xxx.onrender.com` | 443 | HTTPS | TLS 1.3 (auto) |
| **PostgreSQL (Render)** | `xxx.render.com` | 5432 | TCP | SSL (`sslmode=require`) |
| **Mosquitto Cloud** | `xxx.sensordata.com` | 8883 | MQTT | TLS 1.3 + Auth |
| **ESP32** | `192.168.x.x` (campagne) | — | Wi-Fi | MQTT/TLS |

---

## Flux de Donnees Detailles

### 1. Navigateur → Vercel (Frontend)

```
Navigateur (Chrome)
    │
    ├── DNS: xxx.vercel.app → IP Vercel (CDN)
    │
    ├── HTTPS GET /
    │   └── Vercel sert les fichiers statiques (React build)
    │
    └── Cache: CDN global (fichiers statiques)
```

| Parametre | Valeur |
|-----------|--------|
| URL | `https://xxx.vercel.app` |
| Port | 443 (HTTPS) |
| TLS | 1.3 (certificat auto Vercel) |
| Cache | CDN global, headers `Cache-Control` |

### 2. Vercel → Render (API REST)

```
React App (dans le navigateur)
    │
    ├── Requete: GET /api/capteurs
    │
    ├── Vite proxy (en dev) ou CORS (en prod)
    │   └── Redirige vers https://xxx.onrender.com/api/capteurs
    │
    └── FastAPI repond avec les donnees JSON
```

| Parametre | Valeur |
|-----------|--------|
| URL source | `https://xxx.vercel.app/api/capteurs` |
| URL reelle | `https://xxx.onrender.com/api/capteurs` |
| Mecanisme | CORS (Origin: `https://xxx.vercel.app`) |
| Headers | `Authorization: Bearer <jwt_token>` |

### 3. Render → PostgreSQL (Base de donnees)

```
FastAPI (Docker sur Render)
    │
    ├── SQLAlchemy engine
    │   └── postgresql://sai_user:***@xxx.render.com:5432/sai_db
    │
    ├── SSL: require
    │   └── Connexion chiffree (TLS)
    │
    └── PostgreSQL traite la requete SQL
```

| Parametre | Valeur |
|-----------|--------|
| Driver | `psycopg2` |
| URL | `postgresql://sai_user:***@xxx.render.com:5432/sai_db` |
| SSL | `sslmode=require` (obliger SSL) |
| Timeout | 30 secondes |
| Max connections | 20 (defaut Render) |

### 4. Render → Mosquitto Cloud (MQTT)

```
FastAPI (Docker sur Render)
    │
    ├── MQTT Client connect
    │   └── Broker: xxx.sensordata.com:8883
    │   └── TLS: certificat CA racine
    │   └── Auth: username + password
    │
    ├── Subscribe (recevoir mesures ESP32)
    │   └── Topic: sai/capteurs/+/mesures
    │   └── Callback: traiter_mesure()
    │
    └── Publish (envoyer commandes)
        └── Topic: sai/commandes/{id}/executer
        └── Payload: {"action": "on", "duree": 60}
```

| Parametre | Valeur |
|-----------|--------|
| Broker | `xxx.sensordata.com:8883` |
| TLS | 1.3 (certificat CA racine) |
| Auth | Username + password (Render env vars) |
| Client ID | `sai_backend_prod` |
| QoS | 1 (at least once) |
| Keepalive | 60 secondes |

### 5. ESP32 → Mosquitto Cloud (MQTT)

```
ESP32 (Arduino, en campagne)
    │
    ├── Wi-Fi: connexion au reseau local
    │   └── SSID: "Wifi_Campagne" / MDP: "******"
    │
    ├── MQTT connect
    │   └── Broker: xxx.sensordata.com:8883
    │   └── TLS: certificat CA racine
    │   └── Auth: username + password
    │
    ├── Publish mesures (toutes les 5 min)
    │   └── Topic: sai/capteurs/{id}/mesures
    │   └── Payload: {"valeur": 25.3, "unite": "C", "source": "dht22"}
    │
    └── Subscribe commandes
        └── Topic: sai/commandes/{id}/executer
        └── Action: activer GPIO (pompe, ventilation, eclairage)
```

| Parametre | Valeur |
|-----------|--------|
| Broker | `xxx.sensordata.com:8883` |
| TLS | 1.3 (certificat CA) |
| Auth | Username + password |
| Client ID | `esp32_sai_{id}` |
| QoS | 1 |
| Keepalive | 60 secondes |
| Reconnexion | Auto (toutes les 5 secondes) |

---

## Configuration CORS (Backend)

Dans `backend/main.py` :

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://xxx.vercel.app"],  # Uniquement le frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Regle** : Seul `https://xxx.vercel.app` peut appeler l'API. Toute autre origine est refusee.

---

## Configuration Render (Backend)

**Variables d'environnement** (dans le Dashboard Render) :

```
DATABASE_URL=postgresql://sai_user:xxx@xxx.render.com:5432/sai_db
MQTT_BROKER=xxx.sensordata.com
MQTT_PORT=8883
MQTT_USERNAME=sai_user
MQTT_PASSWORD=xxx
JWT_SECRET=xxx
CORS_ORIGINS=https://xxx.vercel.app
```

**Dockerfile** :
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## Configuration PostgreSQL (Render)

```
Host: xxx.render.com
Port: 5432
Database: sai_db
User: sai_user
Password: (genere par Render)
SSL: require
```

**URL de connexion** :
```
postgresql://sai_user:xxx@xxx.render.com:5432/sai_db?sslmode=require
```

---

## Configuration Mosquitto Cloud

```
Broker: xxx.sensordata.com
Port: 8883 (TLS)
Auth: username + password
```

**Topics SAI** :

| Topic | Direction | Description |
|-------|-----------|-------------|
| `sai/capteurs/{id}/mesures` | ESP32 → Broker → Backend | Mesures capteurs (temperature, humidite, etc.) |
| `sai/commandes/{id}/executer` | Backend → Broker → ESP32 | Commande actionneur (on/off, duree) |
| `sai/commandes/{id}/statut` | ESP32 → Broker → Backend | Statut d'execution de la commande |
| `sai/alertes/{id}` | Backend → Broker | Alertes critiques (seuil depasse) |

---

## Schema des Flux Reseau

```
                    ┌─────────────────────────────────────────┐
                    │              INTERNET                    │
                    │                                         │
                    │  Navigateur ──HTTPS:443──→ Vercel       │
                    │  CLI ────────HTTPS:443──→ Render        │
                    │  ESP32 ──────MQTT/TLS:8883──→ Mosquitto │
                    │                                         │
                    └──────────────────┬──────────────────────┘
                                       │
                    ┌──────────────────┼──────────────────────┐
                    │                  │                       │
                    ▼                  ▼                       ▼
            ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐
            │   Vercel     │  │   Render     │  │ Mosquitto Cloud  │
            │  (Frontend)  │  │  (Backend)   │  │    (Broker)      │
            │  CDN global  │  │  Docker      │  │  TLS 8883        │
            └──────────────┘  └──────┬───────┘  └──────────────────┘
                                     │
                                     │ TCP:5432 (SSL)
                                     ▼
                              ┌──────────────┐
                              │  PostgreSQL  │
                              │  (Render)    │
                              │  10 tables   │
                              └──────────────┘
```

---

## Securite en Production

| Composant | Mesure | Details |
|-----------|--------|---------|
| **Frontend → Backend** | HTTPS (TLS 1.3) | Vercel et Render supportent HTTPS nativement |
| **Backend → PostgreSQL** | SSL | `sslmode=require` dans l'URL de connexion |
| **ESP32 → Mosquitto** | MQTT over TLS | Port 8883, certificat CA racine |
| **Authentification** | JWT + Bearer | Token expire apres 24h, refresh cote frontend |
| **Variables d'env** | Secrets Render | Pas de credentials dans le code |
| **CORS** | Restrictif | Autoriser uniquement `https://xxx.vercel.app` |
| **MQTT Auth** | Username + password | Chaque client s'authentifie aupres du broker |

---

## Comparaison : Local vs Production

| Aspect | Mode Local | Mode Production |
|--------|------------|-----------------|
| **Adresses** | `localhost` (127.0.0.1) | Noms de domaine (xxx.vercel.app, etc.) |
| **Ports** | 5173, 8000, 5432, 1883 | 443 (HTTPS), 8883 (MQTT/TLS), 5432 (SSL) |
| **Protocoles** | HTTP, MQTT clair, TCP | HTTPS, MQTT/TLS, TCP/SSL |
| **TLS** | Desactive | Obligatoire partout |
| **Auth MQTT** | Aucune | Username + password |
| **CORS** | Toutes origines | Restrictif (1 seule origine) |
| **Credentials** | En dur dans le code | Variables d'environnement |
| **SSL PostgreSQL** | Desactive | `sslmode=require` |

---

*Architecture reseau production — Projet SAI — Emmanuel Gilwandji — Aout 2026*
