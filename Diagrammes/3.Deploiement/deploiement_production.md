# Diagramme de Deploiement — Mode Production

## Introduction

Ce diagramme represente l'**etat cible** du projet SAI : chaque composant est deploie sur un service cloud dedie. Le systeme devient accessible depuis n'importe quel appareil connecte a Internet.

> **Question repondue** : *Comment le systeme sera-t-il deploie pour etre accessible aux utilisateurs finaux ?*

---

## Diagramme UML de Deploiement (Mermaid)

```mermaid
flowchart TB

    subgraph CLIENT["Client"]
        subgraph NAV_USER["Navigateur Web"]
            NAV_APP["React App<br/>(Chrome, Firefox, Safari)<br/>HTTPS"]
        end
        subgraph CLI_TERM["CLI Python"]
            CLI_APP["argparse + requests<br/>Token API dans config.json"]
        end
    end

    subgraph CLOUD["Services Cloud"]

        subgraph VERCEL["Vercel"]
            REACT_PROD["React App (dist/)<br/>CDN global<br/>Build optimise (Vite)"]
        end

        subgraph RENDER["Render"]
            FASTAPI_PROD["FastAPI (Docker)<br/>Port 443<br/>Uvicorn workers"]
        end

        subgraph DB_CLOUD["PostgreSQL"]
            PG[("sai_db<br/>10 tables<br/>Host: Render<br/>Port 5432")]
        end

        subgraph MQTT_CLOUD["Mosquitto Cloud"]
            BROKER_PROD["Broker MQTT (TLS)<br/>Port 8883<br/>TLS 1.3 + QoS 1"]
        end

    end

    subgraph ESP32_DEVICE["ESP32"]
        FW_PROD["Firmware Arduino<br/>GPIO capteurs/actionneurs<br/>Wi-Fi + MQTT TLS"]
    end

    NAV_APP -->|"HTTPS :443"| REACT_PROD
    REACT_PROD -->|"HTTPS :443<br/>API REST"| FASTAPI_PROD
    CLI_APP -->|"HTTPS :443<br/>requests"| FASTAPI_PROD
    FASTAPI_PROD -->|"TCP :5432<br/>SQLAlchemy"| PG
    FASTAPI_PROD -->|"MQTT/TLS :8883<br/>subscribe"| BROKER_PROD
    FW_PROD -->|"MQTT/TLS :8883<br/>Wi-Fi"| BROKER_PROD
```

---

## Description des Nœuds

| Noeud | Type UML | Fournisseur | Description |
|-------|----------|-------------|-------------|
| **Client** | `<<device>>` | — | Appareil de l'utilisateur (PC, mobile, tablette) |
| **Navigateur Web** | `<<executionEnvironment>>` | — | Application React geree par Vercel CDN |
| **CLI Python** | `<<executionEnvironment>>` | — | Interface terminal avec token API |
| **Vercel** | `<<device>>` | Vercel | Hebergement frontend statique + CDN global |
| **Render** | `<<device>>` | Render | Hebergement backend Docker + API REST |
| **PostgreSQL** | `<<executionEnvironment>>` | Render | Base de donnees managed (pas de maintenance) |
| **Mosquitto Cloud** | `<<device>>` | Calcul Things / HiveMQ | Broker MQTT securise avec TLS |
| **ESP32** | `<<device>>` | — | Microcontroleur physique en campagne |

---

## Flux de Donnees

| Source | Destination | Protocole | Port | Securite | Description |
|--------|-------------|-----------|------|----------|-------------|
| Navigateur | Vercel | HTTPS | 443 | TLS 1.3 | Chargement de l'app React (fichiers statiques) |
| CLI | Render | HTTPS | 443 | JWT Bearer | Appels API REST depuis le terminal |
| Vercel | Render | HTTPS | 443 | TLS 1.3 | Appels API (`/api/*`) rediriges vers le backend |
| Render | PostgreSQL | TCP | 5432 | SSL | SQLAlchemy connecte a la base managed |
| Render | Mosquitto | MQTT/TLS | 8883 | TLS + Auth | Subscribe aux topics commandes |
| ESP32 | Mosquitto | MQTT/TLS | 8883 | TLS + Auth | Publish mesures, subscribe commandes |

---

## Comparaison : Local vs Production

| Aspect | Mode Local | Mode Production |
|--------|------------|-----------------|
| **Frontend** | Vite dev server (port 5173) | Vercel (CDN, port 443) |
| **Backend** | uvicorn local (port 8000) | Render Docker (port 443) |
| **Base de donnees** | PostgreSQL local (port 5432) | Render PostgreSQL (port 5432) |
| **MQTT** | Mosquitto local (port 1883) | Mosquitto cloud (port 8883) |
| **Securite** | Aucune (HTTP, MQTT clair) | TLS 1.3 partout |
| **Disponibilite** | PC allume = accessible | 24h/24, 7j/7 |
| **Scalabilite** | 1 utilisateur | Multi-utilisateurs |
| **Accessibilite** | Reseau local uniquement | Internet mondial |
| **Cout** | Gratuit | ~5-15 EUR/mois (Render + Vercel free tier) |

---

## Configuration de Production

### Vercel (Frontend)

```bash
# Depuis frontend/
npm run build          # Genere dist/
vercel deploy          # Deploie sur Vercel
```

**Variables d'environnement Vercel :**
```
VITE_API_URL=https://ton-backend.onrender.com
```

### Render (Backend)

```dockerfile
# Dockerfile (backend/)
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Variables d'environnement Render :**
```
DATABASE_URL=postgresql://sai_user:xxx@xxx.render.com:5432/sai_db
MQTT_BROKER=xxx.sensordata.com
MQTT_PORT=8883
MQTT_USERNAME=sai_user
MQTT_PASSWORD=xxx
JWT_SECRET=xxx
```

### PostgreSQL (Render)

```
Host: xxx.render.com
Port: 5432
Database: sai_db
User: sai_user
Password: (genere par Render)
SSL: require
```

### Mosquitto Cloud

```
Broker: xxx.sensordata.com (ou Calcul Things)
Port: 8883 (TLS)
Auth: username/password
Topics:
  sai/capteurs/{id}/mesures    → ESP32 publish
  sai/commandes/{id}/executer  → Backend publish, ESP32 subscribe
  sai/commandes/{id}/statut    → ESP32 publish, Backend subscribe
  sai/alertes/{id}             → Backend publish
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
| **CORS** | Restrictif | Autoriser uniquement `https://ton-app.vercel.app` |

---

## Traçabilite UC ↔ Deploiement Production

| UC | Composants cloud | Noeuds |
|----|------------------|--------|
| UC1 S'authentifier | Vercel + Render + PostgreSQL | Navigateur + Vercel + Render + PostgreSQL |
| UC2 Tableau de bord | Vercel + Render + PostgreSQL | Navigateur + Vercel + Render + PostgreSQL |
| UC3 Historique | Vercel + Render + PostgreSQL | Navigateur + Vercel + Render + PostgreSQL |
| UC4 Commande Web | Vercel + Render + Mosquitto | Navigateur + Vercel + Render + Mosquitto |
| UC5 Commande CLI | CLI + Render + Mosquitto | CLI + Render + Mosquitto |
| UC6 Automatisation | Render (timer) + Mosquitto + PostgreSQL | Render + Mosquitto + PostgreSQL |
| UC7 Config seuils | Vercel + Render + PostgreSQL | Navigateur + Vercel + Render + PostgreSQL |
| UC8 Gerer users | Vercel + Render + PostgreSQL | Navigateur + Vercel + Render + PostgreSQL |
| UC9 Collecte ESP32 | ESP32 + Mosquitto + Render | ESP32 + Mosquitto + Render |
| UC10 Recevoir commande | ESP32 + Mosquitto | ESP32 + Mosquitto |
| UC11 Gestion reseau | ESP32 (Wi-Fi) | ESP32 |

---

## Etapes de Deploiement

| Etape | Action | Outil |
|-------|--------|-------|
| 1 | Creer un compte Render + Vercel | Navigateur |
| 2 | Push le code sur GitHub | Git |
| 3 | Deploier le backend sur Render | Render Dashboard |
| 4 | Configurer les variables d'environnement Render | Render Dashboard |
| 5 | Deploier le frontend sur Vercel | Vercel Dashboard |
| 6 | Configurer VITE_API_URL sur Vercel | Vercel Dashboard |
| 7 | Creer la base PostgreSQL sur Render | Render Dashboard |
| 8 | Executer init_db.py sur Render | Render Shell |
| 9 | Configurer le broker MQTT | Calcul Things / HiveMQ |
| 10 | Configurer l'ESP32 avec les bons topic/broker | Arduino IDE |

---

*Mode production — Projet SAI — Emmanuel Gilwandji — Aout 2026*
