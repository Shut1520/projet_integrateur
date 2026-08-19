# Explication de l'Architecture Reseau — SAI

## Introduction

Ce document justifie les choix techniques de l'architecture reseau du projet SAI, tant pour le mode local que pour la production.

---

## Pourquoi deux architectures ?

Le projet SAI fonctionne dans **deux environnements distincts** :

| Environnement | Objectif | Securite |
|---------------|----------|----------|
| **Local** | Developpement et test | Relachee (pas de TLS) |
| **Production** | Deploiement utilisateurs | Stricte (TLS partout) |

Cette separation est **intentionnelle** :
- En dev, on veut de la **rapidite** et de la **simplicite** (pas de certificates a configurer)
- En prod, on veut de la **securite** et de la **disponibilite** (24h/24, 7j/7)

---

## Choix des protocoles

### 1. HTTP / HTTPS (Frontend ↔ Backend)

| Choix | Justification |
|-------|---------------|
| **HTTP en local** | Pas de certificat a configurer, latence minimale |
| **HTTPS en prod** | Chiffrement TLS 1.3, certificat auto fourni par Vercel/Render |
| **Port 443** | Standard HTTPS, pas de pare-feu a configurer |

**Pourquoi pas de WebSocket ?**
Le SAI n'a pas besoin de communication temps reel bidirectionnelle. Les mesures sont publiees toutes les 5 minutes (MQTT), pas en continu. HTTP REST suffit.

### 2. MQTT (ESP32 ↔ Backend)

| Choix | Justification |
|-------|---------------|
| **MQTT** | Protocole leger, ideal pour les capteurs (faible bande passante) |
| **Mosquitto** | Broker MQTT open-source, reference industrielle |
| **QoS 1** | Garantie de livraison (pas de perte de messages) |
| **Port 1883 (dev)** | MQTT clair, pas de TLS (reseau local) |
| **Port 8883 (prod)** | MQTT over TLS, chiffrement obligatoire |

**Pourquoi pas de HTTP pour l'ESP32 ?**
HTTP est un protocole « request/response » : l'ESP32 devrait demander au serveur s'il y a des commandes. MQTT est « publish/subscribe » : l'ESP32 s'abonne aux commandes et les recoit automatiquement. C'est plus efficace pour un microcontroleur.

### 3. TCP (Backend ↔ PostgreSQL)

| Choix | Justification |
|-------|---------------|
| **TCP** | Protocole natif de PostgreSQL |
| **Port 5432** | Standard PostgreSQL |
| **SSL en prod** | Chiffrement de la connexion |
| **Pas de SSL en dev** | Simplicite, pas de latence |

---

## Choix des ports

### Mode Local

| Port | Service | Pourquoi ce port ? |
|------|---------|---------------------|
| **5173** | Vite Dev Server | Port par defaut de Vite |
| **8000** | FastAPI (uvicorn) | Port par defaut de uvicorn |
| **5432** | PostgreSQL | Port par defaut de PostgreSQL |
| **1883** | Mosquitto | Port par defaut de MQTT (non securise) |

### Mode Production

| Port | Service | Pourquoi ce port ? |
|------|---------|---------------------|
| **443** | Vercel (HTTPS) | Standard HTTPS, pas de pare-feu |
| **443** | Render (HTTPS) | Standard HTTPS |
| **5432** | PostgreSQL (SSL) | Standard PostgreSQL + SSL |
| **8883** | Mosquitto (TLS) | Standard MQTT securise |

---

## Securite reseau

### TLS (Transport Layer Security)

| Composant | TLS en dev | TLS en prod | Justification |
|-----------|------------|-------------|---------------|
| **Frontend → Backend** | Non | Oui (1.3) | Donnees utilisateur sensibles |
| **Backend → PostgreSQL** | Non | Oui (SSL) | Donnees de la base |
| **ESP32 → Mosquitto** | Non | Oui (1.3) | Commandes actionneurs |
| **CLI → Backend** | Non | Oui (JWT) | Authentification |

### CORS (Cross-Origin Resource Sharing)

**En local** : Pas de CORS necessaire (Vite proxy redirige `/api` vers le backend).

**En production** :
```python
allow_origins=["https://xxx.vercel.app"]
```

Seul le frontend Vercel peut appeler l'API. Toute autre origine est bloquee.

### Authentification

| Composant | Methode | Details |
|-----------|---------|---------|
| **Frontend** | JWT (Bearer token) | Login → token stocke dans localStorage |
| **CLI** | JWT (Bearer token) | Login → token stocke dans config.json |
| **ESP32** | MQTT Auth | Username + password dans le firmware |
| **Backend** | JWT validation | `Depends(get_utilisateur_connecte)` sur les routes protegees |

---

## Gestion des secrets

### En local

Les credentials sont en dur dans le code (acceptable en dev) :
- `backend/database.py` : `sai_user:sai_password@localhost:5432/sai_db`
- `backend/init_db.py` : superuser `postgres`
- `mosquitto.conf` : pas d'auth

### En production

Les credentials sont dans les **variables d'environnement** (Render Dashboard) :
```
DATABASE_URL=postgresql://sai_user:xxx@xxx.render.com:5432/sai_db
MQTT_BROKER=xxx.sensordata.com
MQTT_PORT=8883
MQTT_USERNAME=sai_user
MQTT_PASSWORD=xxx
JWT_SECRET=xxx
```

**Regle** : Jamais de credentials dans le code en production.

---

## Reseau ESP32

### En local

```
ESP32 ──Wi-Fi──→ Routeur local ──→ PC (Mosquitto)
```

L'ESP32 doit etre sur le **meme reseau Wi-Fi** que le PC. L'IP du PC change selon le reseau (192.168.1.x, 192.168.0.x, etc.).

### En production

```
ESP32 ──Wi-Fi──→ Routeur campagne ──→ Internet ──→ Mosquitto Cloud
```

L'ESP32 peut etre **n'importe ou** dans le monde, tant qu'il a une connexion Wi-Fi. Il se connecte au broker MQTT cloud (pas au PC).

**Avantage** : Pas besoin de port forwarding, pas de firewall a configurer, pas de DNS dynamique.

---

## Performance et fiabilite

### Latence

| Route | Latence locale | Latence production |
|-------|----------------|---------------------|
| Navigateur → Backend | ~1ms | ~50-200ms (CDN + cloud) |
| Backend → PostgreSQL | ~1ms | ~10-50ms (meme datacenter) |
| ESP32 → Mosquitto | ~5-20ms (Wi-Fi) | ~100-500ms (Internet) |

### Disponibilite

| Composant | Local | Production |
|-----------|-------|------------|
| **Frontend** | PC allume | 99.9% (Vercel) |
| **Backend** | PC allume | 99.9% (Render) |
| **PostgreSQL** | PC allume | 99.9% (Render) |
| **Mosquitto** | PC allume | 99.9% (cloud) |
| **ESP32** | Wi-Fi local | Wi-Fi campagne |

---

## Limitations connues

| Limite | Impact | Solution possible |
|--------|--------|-------------------|
| **MQTT sans auth en dev** | N'importe qui peut publier | Ajouter auth Mosquitto en dev |
| **Pas de rate limiting** | Attaques par force brute | Ajouter middleware FastAPI |
| **JWT sans refresh** | Token expire apres 24h | Ajouter refresh token |
| **Pas de monitoring** | Pas de metriques de performance | Ajouter Prometheus/Grafana |
| **ESP32 sans watchdog** | Bloque si Wi-Fi coupe | Ajouter timer de reconnexion |

---

*Explication architecture reseau — Projet SAI — Emmanuel Gilwandji — Aout 2026*
