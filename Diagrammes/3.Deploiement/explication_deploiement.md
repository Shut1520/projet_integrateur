# Explication du Diagramme de Deploiement — SAI

## Pourquoi deux diagrammes ?

Le projet SAI a ete concu pour fonctionner dans **deux environnements distincts** :

1. **Mode Local (Developpement)** : tout tourne sur le PC du developpeur
2. **Mode Production (Deploiement)** : chaque composant est sur un service cloud

Cette separation est **intentionnelle** et suit les bonnes pratiques de developpement logiciel :
- On developpe et on teste en local
- On deploie en production uniquement quand tout est fonctionnel

---

## Choix technologiques pour la production

### 1. Pourquoi Vercel pour le frontend ?

| Critere | Justification |
|---------|---------------|
| **Gratuit** | Le plan Vercel est gratuit pour les projets open-source et academiques |
| **CDN global** | Les fichiers statiques (React build) sont caches partout dans le monde |
| **Deploiement automatique** | Chaque push sur GitHub deploie automatiquement |
| **HTTPS natif** | Certificat SSL automatique, pas de configuration |
| **Integrite** | Vite est optimise pour Vercel (meme createur) |

### 2. Pourquoi Render pour le backend ?

| Critere | Justification |
|---------|---------------|
| **Docker natif** | Render supporte les Dockerfiles, pas de config supplementaire |
| **PostgreSQL managed** | La base de donnees est hebergee sur le meme service |
| **Variables d'env** | Secrets proteges, pas de `.env` dans le code |
| **Gratuit (free tier)** | Le plan gratuit suffit pour un projet academique |
| **Logs** | Logs en temps reel pour debugger |

### 3. Pourquoi MQTT (Mosquitto) pour l'IoT ?

| Critere | Justification |
|---------|---------------|
| **Leger** | Moins de bande passante que HTTP (ideal pour les capteurs) |
| **Publish/Subscribe** | Mode asynchrone : l'ESP32 publie sans attendre de reponse |
| **QoS 1** | Garantie de livraison (pas de perte de messages) |
| **Standard IoT** | Protocole industriels (pas un format proprietaire) |
| **TLS 8883** | Chiffrement pour la securite en production |

---

## Pourquoi pas d'autres choix ?

### Pourquoi pas Heroku pour le backend ?
Heroku a supprime son free tier en 2022. Render est l'equivalent gratuit actuel.

### Pourquoi pas Firebase pour la base de donnees ?
Firebase est NoSQL (Firestore). Notre projet utilise PostgreSQL (relationnel, SQL, Merise). On reste sur du SQL pour la coherence avec la conception.

### Pourquoi pas MQTT sans TLS en production ?
Le MQTT sans TLS (port 1883) envoie les donnees en clair. En production, les donnees capteurs et les commandes actionneurs doivent etre chiffrees pour eviter l'interception.

---

## Architecture reseau en production

```
Utilisateur (Navigateur/CLI)
    │
    ├─── HTTPS :443 ──→ Vercel (Frontend React)
    │                       │
    │                       ├─── HTTPS :443 ──→ Render (Backend FastAPI)
    │                                               │
    │                                               ├─── TCP :5432 ──→ PostgreSQL (Render)
    │                                               │
    │                                               └─── MQTT/TLS :8883 ──→ Mosquitto (Cloud)
    │
    └─── HTTPS :443 ──→ Render (Backend FastAPI, pour CLI)

ESP32 (Campagne)
    │
    └─── MQTT/TLS :8883 ──→ Mosquitto (Cloud)
                                │
                                └─── (Backend subscribe)
```

### Flux de donnees d'une mesure capteur

```
ESP32 → (GPIO lecture) → (MQTT publish) → Mosquitto → (MQTT subscribe) → FastAPI → (SQLAlchemy) → PostgreSQL
```

### Flux de donnees d'une commande actionneur

```
Navigateur → (React) → (API REST) → FastAPI → (MQTT publish) → Mosquitto → (MQTT subscribe) → ESP32 → (GPIO ecriture) → Pompe/Ventilation/Eclairage
```

---

## Notation UML utilisee

| Element | Stereotype | Signification |
|---------|------------|---------------|
| PC Emmanuel | `<<device>>` | Machine physique (ordinateur) |
| Navigateur | `<<executionEnvironment>>` | Environnement d'execution (processus) |
| Python Runtime | `<<executionEnvironment>>` | Interpreteur Python qui execute FastAPI |
| PostgreSQL | `<<executionEnvironment>>` | Service de base de donnees |
| Mosquitto | `<<device>>` ou `<<executionEnvironment>>` | Serveur de messagerie MQTT |
| Vercel | `<<device>>` | Serveur cloud (CDN + Edge) |
| Render | `<<device>>` | Serveur cloud (Docker + PostgreSQL) |
| ESP32 | `<<device>>` | Microcontroleur physique |

---

## Conventions du projet respectees

1. **Dossier** : `Diagrammes/3.Deploiement/` (apres `1.UML` et `2.Merise_&_classe`)
2. **Format** : Code Mermaid + explication dans le meme fichier `.md`
3. **Langue** : Francais pour les explications
4. **Traçabilite** : Chaque UC est lie aux composants de deploiement
5. **Coherence** : Les noms de composants correspondent au `AGENTS.md` et au `memoire.md`

---

## Prochaines etapes

Le diagramme de deploiement est **conceptuel** (il decrit l'architecture). Pour le passer a l'execution, il faudra :

1. **Dockeriser le backend** : creer un `Dockerfile` dans `backend/`
2. **Configurer Render** : variables d'env, branche Git, build automatique
3. **Configurer Vercel** : lien GitHub, `VITE_API_URL`
4. **Creer la base PostgreSQL** sur Render + executer `init_db.py`
5. **Configurer le broker MQTT** (Calcul Things, HiveMQ, ou Mosquitto cloud)
6. **Programmer l'ESP32** avec les bons topics et broker

---

*Explication deploiement — Projet SAI — Emmanuel Gilwandji — Aout 2026*
