# Code Complet du Projet SAI (Système Agricole Intelligent)

## Table des matières
1. [Vue d'ensemble de l'architecture](#1-vue-densemble-de-larchitecture)
2. [Backend FastAPI](#2-backend-fastapi)
3. [Frontend React](#3-frontend-react)
4. [CLI Python](#4-cli-python)
5. [Firmware ESP32 (IoT)](#5-firmware-esp32-iot)
6. [Broker Mosquitto (MQTT)](#6-broker-mosquitto-mqtt)
7. [Base de données PostgreSQL](#7-base-de-données-postgresql)
8. [Flux de données complet](#8-flux-de-données-complet)
9. [Sécurité et authentification](#9-sécurité-et-authentification)
10. [Automatisation et règles métier](#10-automatisation-et-règles-métier)
11. [Tests et validation](#11-tests-et-validation)
12. [Déploiement et configuration](#12-déploiement-et-configuration)

---

# 1. Vue d'ensemble de l'architecture

## 1.1 Le problème que résout ce projet

Le Système Agricole Intelligent (SAI) résout un problème concret : **comment automatiser et surveiller des exploitations agricoles en temps réel** ?

Avant ce système, les agriculteurs devaient :
- Vérifier manuellement l'humidité du sol, la température, le CO₂
- Arroser à la main ou avec des systèmes basiques
- Être physiquement présents pour contrôler les équipements
- Subir des pertes en cas d'anomalie non détectée

**La solution** : Un système connecté qui :
1. Mesure en continu les conditions environnementales (capteurs IoT)
2. Analyse les données et déclenche des actions automatiques (automatisation)
3. Permet le contrôle à distance via une application web
4. Notifie en temps réel les anomalies (alertes)

## 1.2 Architecture technique en 3 couches

```
┌─────────────────────────────────────────────────────────────────┐
│                    COUCHE PRÉSENTATION                          │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │   Frontend React │  │   CLI Python     │  │  ESP32/IoT   │  │
│  │   (Interface Web)│  │   (Ligne commande)│  │  (Capteurs)  │  │
│  └────────┬─────────┘  └────────┬─────────┘  └──────┬───────┘  │
│           │                      │                    │          │
└───────────┼──────────────────────┼────────────────────┼──────────┘
            │                      │                    │
            ▼                      ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    COUCHE MÉTIER (Backend)                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    FastAPI (Python)                      │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌───────────┐  │  │
│  │  │ Routes  │  │Services │  │  Auth   │  │  MQTT     │  │  │
│  │  │ (API)   │  │ (Logique│  │ (JWT +  │  │ (Broker)  │  │  │
│  │  │         │  │  métier)│  │ API Key)│  │           │  │  │
│  │  └─────────┘  └─────────┘  └─────────┘  └───────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    COUCHE DONNÉES                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   PostgreSQL                             │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐  │  │
│  │  │Utilisat. │  │ Capteurs │  │ Mesures  │  │ Commandes│  │  │
│  │  │Parcelles │  │Actionneur│  │ Alertes  │  │ Actions  │  │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └─────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## 1.3 Pourquoi cette architecture ?

**Choix des technologies :**
- **FastAPI** : Framework Python rapide, auto-documenté (Swagger), typé (Pydantic)
- **React** : Bibliothèque JavaScript populaire, composants réutilisables, écosystème riche
- **PostgreSQL** : Base de données fiable, supporte les données temporelles, gratuit
- **MQTT** : Protocole léger pour l'IoT, fonctionne même avec une mauvaise connexion
- **ESP32** : Microcontrôleur Wi-Fi/Bluetooth, puissant et économique

**Pourquoi pas d'autres choix ?**
- **Node.js** au lieu de Python : Python est plus simple pour l'IoT et les calculs scientifiques
- **Firebase** au lieu de PostgreSQL : PostgreSQL est gratuit, plus flexible, et fonctionne en local
- **HTTP** au lieu de MQTT : MQTT est 10x plus léger pour les capteurs à faible consommation

---

# 2. Backend FastAPI

## 2.1 Structure du projet backend

```
backend/
├── main.py                 # Point d'entrée de l'application
├── config.py               # Configuration centralisée
├── database.py             # Connexion à PostgreSQL
├── auth.py                 # Système d'authentification
├── models/                 # Modèles de données (11 fichiers)
│   ├── __init__.py         # Import de tous les modèles
│   ├── utilisateur.py      # Table utilisateurs
│   ├── parcelle.py         # Table parcelles
│   ├── capteur.py          # Table capteurs
│   ├── mesure.py           # Table mesures (haute volumétrie)
│   ├── actionneur.py       # Table actionneurs
│   ├── commande.py         # Table commandes
│   ├── action.py           # Table actions
│   ├── alerte.py           # Table alertes
│   ├── seuil.py            # Table seuils
│   ├── token.py            # Table tokens (clés API)
│   └── historique.py       # Table historique_actions
├── routes/                 # Routes API (13 fichiers)
│   ├── auth.py             # /api/auth
│   ├── utilisateurs.py     # /api/utilisateurs
│   ├── parcelles.py        # /api/parcelles
│   ├── capteurs.py         # /api/capteurs
│   ├── mesures.py          # /api/mesures
│   ├── actionneurs.py      # /api/actionneurs
│   ├── commandes.py        # /api/commandes
│   ├── actions.py          # /api/actions
│   ├── alertes.py          # /api/alertes
│   ├── seuils.py           # /api/seuils
│   ├── tokens.py           # /api/tokens
│   ├── historique.py       # /api/historique
│   └── dashboard.py        # /api/dashboard
├── schemas/                # Schémas de validation (12 fichiers)
├── services/               # Logique métier (7 fichiers)
│   ├── auth_service.py     # Inscription, connexion, JWT
│   ├── commande_service.py # Gestion des commandes
│   ├── automatisation_service.py # Boucle d'automatisation
│   ├── mqtt_service.py     # Subscriber/Publisher MQTT
│   ├── dashboard_service.py # Agrégation pour le dashboard
│   ├── historique_service.py # Journalisation des actions
│   └── rate_limit.py       # Limitation du débit
├── alembic/                # Migrations de la base de données
├── scripts/
│   └── mqtt_simulateur.py  # Simulateur ESP32
├── tests/                  # Tests unitaires (15 fichiers)
├── requirements.txt        # Dépendances Python
└── .env                    # Variables d'environnement (gitignoré)
```

## 2.2 main.py - Point d'entrée

**Pourquoi ce fichier ?** C'est le fichier que l'on lance pour démarrer le serveur. Il configure l'application, branche les routes et démarre les threads en arrière-plan.

```python
# Création de l'application FastAPI
app = FastAPI(
    title="SAI - Système Agricole Intelligent",
    description="API REST de gestion des parcelles, capteurs, actionneurs et automatisation",
    version="1.0.0",
)
```

**Ce qui se passe au démarrage :**

1. **Configuration CORS** : Autorise le frontend React (localhost:5173) à communiquer
2. **Montage des 13 routes** : Chaque ressource a son préfixe `/api`
3. **Démarrage de 2 threads en arrière-plan** :
   - Thread 1 : Boucle d'automatisation (toutes les 5 minutes)
   - Thread 2 : Subscriber MQTT (écoute les capteurs)

**Pourquoi 2 threads ?**
- La boucle d'automatisation doit tourner en continu sans bloquer l'API
- Le subscriber MQTT doit écouter en permanence les messages des capteurs

## 2.3 config.py - Configuration centralisée

**Pourquoi un fichier dédié ?** Pour éviter de chercher `os.getenv()` partout. Toute la configuration est en un seul endroit.

**Variables principales :**
- `DATABASE_URL` : Connexion à PostgreSQL
- `JWT_SECRET_KEY` : Clé secrète pour signer les tokens JWT
- `MQTT_BROKER` : Adresse du broker Mosquitto
- `RATE_LIMIT_DEFAULT` : 120 requêtes par minute par défaut

**Pourquoi un fichier .env ?** Pour ne jamais commiter de mots de passe dans Git. Le fichier .env est dans .gitignore.

## 2.4 database.py - Connexion à PostgreSQL

**Pourquoi SQLAlchemy ?** C'est un ORM (Object-Relational Mapping) qui permet d'écrire du Python au lieu du SQL. Plus simple, plus sécurisé, moins d'erreurs.

```python
# Création du moteur SQLAlchemy
engine = create_engine(DATABASE_URL)

# Fabrique de sessions (une par requête HTTP)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base déclarative pour tous les modèles
class Base(DeclarativeBase):
    pass

# Dépendance FastAPI pour injecter la session
def get_db():
    db = SessionLocal()
    try:
        yield db  # La session est disponible dans la route
    finally:
        db.close()  # Fermeture automatique
```

**Pourquoi une session par requête ?** Pour garantir que chaque requête HTTP a sa propre connexion à la base, sans conflit.

## 2.5 auth.py - Système d'authentification

**3 modes d'authentification :**

| Mode | Utilisé par | Mécanisme |
|------|-------------|-----------|
| JWT Bearer | Frontend Web, CLI | Token signé avec HS256, expire en 24h |
| API Key | ESP32/IoT | Clé `sk_sai_...` dans le header `X-API-Key` |
| Hybride | Endpoints partagés | Accepte JWT OU API Key |

**Pourquoi 3 modes ?**
- Le frontend a besoin de sessions utilisateur (JWT)
- L'ESP32 n'a pas d'interface pour entrer un mot de passe (API Key)
- Certains endpoints sont utilisés par les deux (hybride)

**Comment ça marche JWT ?**
```
1. Utilisateur envoie POST /api/auth/login avec email + mot de passe
2. Backend vérifie le hash bcrypt du mot de passe
3. Backend crée un JWT : {"sub": "123", "exp": "2026-09-11", "iat": "2026-09-10"}
4. Backend signe le JWT avec JWT_SECRET_KEY
5. Frontend stocke le JWT dans localStorage
6. À chaque requête, frontend envoie : Authorization: Bearer <token>
7. Backend décode le JWT et récupère l'ID utilisateur
```

## 2.6 models/ - Les 11 modèles de données

**Pourquoi un modèle par fichier ?** Pour la lisibilité et la maintenabilité. Chaque fichier définit une table SQL.

### 2.6.1 Utilisateur (models/utilisateur.py)

**Rôle** : Représente un utilisateur du système (agriculteur ou admin).

**Champs :**
- `id` : Identifiant unique (clé primaire)
- `nom` : Nom complet (100 caractères max)
- `email` : Email unique (150 caractères max)
- `password_hash` : Mot de passe chiffré en bcrypt (jamais en clair !)
- `role` : "agriculteur" ou "admin"
- `actif` : Compte activé ou non (permet de désactiver un utilisateur)
- `created_at` / `updated_at` : Horodatages automatiques

**Relations :**
- Un utilisateur possède plusieurs parcelles (1:N)
- Un utilisateur peut créer plusieurs commandes (1:N)
- Un utilisateur peut avoir plusieurs tokens API (1:N)

**Pourquoi `actif` ?** Pour désactiver un utilisateur sans le supprimer (conserve l'historique).

### 2.6.2 Parcelle (models/parcelle.py)

**Rôle** : Une zone agricole (serre, champ, etc.).

**Champs :**
- `id` : Identifiant unique
- `nom` : Nom de la parcelle (ex: "Serre A")
- `localisation` : Adresse ou description (optionnel)
- `id_utilisateur` : Propriétaire (clé étrangère vers utilisateurs)

**Relations :**
- Une parcelle contient plusieurs capteurs (1:N)
- Une parcelle contient plusieurs actionneurs (1:N)
- Une parcelle a plusieurs seuils de configuration (1:N)
- Une parcelle peut avoir plusieurs alertes (1:N)

### 2.6.3 Capteur (models/capteur.py)

**Rôle** : Un capteur physique connecté à l'ESP32.

**Champs :**
- `id` : Identifiant unique
- `nom` : Type de capteur (dht22, yl-69, bh1750, sen0159, niveau_eau)
- `reference` : Référence technique (optionnel)
- `gpio` : Numéro de broche ESP32 (0-39)
- `protocole` : "digital", "analog" ou "i2c"
- `etat` : "actif", "inactif" ou "defaillant"
- `id_parcelle` : Parcelle associée (clé étrangère)

**Pourquoi un champ `gpio` ?** Pour savoir quelle broche physique de l'ESP32 est connectée au capteur.

### 2.6.4 Mesure (models/mesure.py)

**Rôle** : Une lecture de capteur (haute volumétrie).

**Champs :**
- `id` : Identifiant unique
- `valeur` : Valeur mesurée (décimal)
- `unite` : Unité de mesure (%, °C, ppm, etc.)
- `source` : "esp32", "manuel" ou "simulation"
- `timestamp` : Date/heure de la mesure
- `id_capteur` : Capteur ayant pris la mesure

**Pourquoi pas de `created_at`/`updated_at` ?** Cette table est à haute volumétrie (des milliers de lignes par jour). On ne met à jour que les nouvelles insertions.

**ATTENTION** : C'est la plus grande table du système. Il faut des index pour les performances.

### 2.6.5 Actionneur (models/actionneur.py)

**Rôle** : Un équipement contrôlable (pompe, ventilation, éclairage).

**Champs :**
- `id` : Identifiant unique
- `nom` : Type d'actionneur (pompe, ventilation, eclairage)
- `reference` : Référence technique (optionnel)
- `gpio` : Numéro de broche ESP32
- `etat` : "actif" ou "inactif"
- `id_parcelle` : Parcelle associée

**Méthodes utiles :**
- `activer()` : Passe l'état à "actif"
- `desactiver()` : Passe l'état à "inactif"
- `est_actif()` : Vérifie si l'actionneur est en marche

### 2.6.6 Commande (models/commande.py)

**Rôle** : Un ordre donné à un actionneur.

**Champs :**
- `id` : Identifiant unique
- `type_action` : "on", "off" ou "programmer"
- `valeur_parametre` : Paramètre optionnel (ex: durée en secondes)
- `source` : "web", "cli" ou "auto" (automatisation)
- `timestamp` : Date/heure de la commande
- `statut` : "envoyee", "recue", "executee" ou "echouee"
- `id_utilisateur` : Celui qui a donné l'ordre (NULL si automatisé)
- `id_actionneur` : L'actionneur ciblé

**Pourquoi `id_utilisateur` est nullable ?** Quand l'automatisation déclenche une commande, il n'y a pas d'humain derrière.

**Machine à états (FSM) :**
```
envoyee → recue → executee
                   → echouee
```

### 2.6.7 Action (models/action.py)

**Rôle** : L'exécution physique d'une commande.

**Champs :**
- `id` : Identifiant unique
- `date_debut` : Début de l'exécution
- `date_fin` : Fin de l'exécution (nullable)
- `duree` : Durée en secondes (calculée)
- `resultat` : Résultat de l'action (texte)
- `details` : Détails supplémentaires
- `statut` : "en_cours", "termine" ou "echouee"
- `id_commande` : Commande associée (UNIQUE : 1 commande = 1 action)

**Pourquoi 1:1 avec Commande ?** Pour tracer précisément chaque exécution physique.

### 2.6.8 Alerte (models/alerte.py)

**Rôle** : Notification d'anomalie.

**Champs :**
- `id` : Identifiant unique
- `type` : Type d'alerte (humidite_sol, temperature, co2, etc.)
- `valeur` : Valeur mesurée déclenchant l'alerte
- `seuil` : Seuil dépassé
- `severite` : "basse", "haute" ou "critique"
- `message` : Description de l'alerte
- `etat` : "active", "reconnue" ou "resolue"
- `date_debut` / `date_fin` : Période d'activité
- `id_parcelle` : Parcelle concernée
- `id_mesure` : Mesure ayant déclenché l'alerte (nullable)
- `id_action` : Action associée (nullable)

**Pourquoi deux clés étrangères nullable ?** Une alerte peut être déclenchée par une mesure OU par une action, pas nécessairement les deux.

### 2.6.9 Seuil (models/seuil.py)

**Rôle** : Règle d'automatisation (seuil min/max par type de mesure).

**Champs :**
- `id` : Identifiant unique
- `type_mesure` : Type de mesure (humidite_sol, temperature, etc.)
- `valeur_min` : Seuil minimum
- `valeur_max` : Seuil maximum
- `unite` : Unité de mesure
- `id_utilisateur` : Celui qui a configuré le seuil
- `id_parcelle` : Parcelle concernée

**Méthode `est_depasse(valeur)` :** Retourne True si la valeur est hors limites.

### 2.6.10 Token (models/token.py)

**Rôle** : Clé API pour l'authentification IoT.

**Champs :**
- `id` : Identifiant unique
- `cle_api` : La clé (format `sk_sai_...`)
- `nom` : Description de la clé
- `actif` : Clé activée ou non
- `created_at` : Date de création
- `expires_at` : Date d'expiration (nullable)
- `last_used_at` : Dernière utilisation
- `id_utilisateur` : Propriétaire de la clé

**Pourquoi `last_used_at` ?** Pour tracer quand la clé a été utilisée dernière fois (sécurité).

### 2.6.11 HistoriqueAction (models/historique.py)

**Rôle** : Journal d'audit (qui a fait quoi, quand).

**Champs :**
- `id` : Identifiant unique
- `type_action` : Type d'action (create, update, delete)
- `entite` : Entité concernée (utilisateur, parcelle, etc.)
- `entite_id` : ID de l'entité
- `details` : Description détaillée
- `id_utilisateur` : Celui qui a fait l'action (nullable)
- `created_at` : Date/heure de l'action

**Pourquoi cette table ?** Pour la traçabilité et le débogage. On peut voir qui a modifié quoi et quand.

## 2.7 routes/ - Les 13 routes API

**Pourquoi des routes séparées ?** Pour l'organisation. Chaque ressource a son fichier.

**Toutes les routes sont préfixées par `/api`** : C'est une convention pour séparer l'API du reste.

### 2.7.1 Auth (routes/auth.py) - `/api/auth`

| Méthode | Chemin | Auth | Description |
|---------|--------|------|-------------|
| POST | `/register` | Public | Créer un compte (force role=agriculteur) |
| POST | `/login` | Public | Connexion, retourne JWT |
| GET | `/me` | JWT | Profil utilisateur courant |

**Pourquoi register force `role=agriculteur` ?** Sécurité : seul un admin peut créer un admin.

### 2.7.2 Utilisateurs (routes/utilisateurs.py) - `/api/utilisateurs`

| Méthode | Chemin | Auth | Description |
|---------|--------|------|-------------|
| GET | `""` | Admin | Lister tous les utilisateurs |
| GET | `/{id}` | Admin | Détail d'un utilisateur |
| POST | `""` | Admin | Créer un utilisateur (peut définir le rôle) |
| PUT | `/{id}` | Admin | Modifier un utilisateur |
| PUT | `/{id}/activer` | Admin | Activer/Désactiver |
| DELETE | `/{id}` | Admin | Supprimer (cascade) |

### 2.7.3 Parcelles (routes/parcelles.py) - `/api/parcelles`

| Méthode | Chemin | Auth | Description |
|---------|--------|------|-------------|
| GET | `""` | JWT | Lister mes parcelles |
| GET | `/{id}` | JWT | Détail d'une parcelle |
| POST | `""` | JWT | Créer une parcelle |
| PUT | `/{id}` | JWT | Modifier une parcelle |
| DELETE | `/{id}` | JWT | Supprimer (cascade) |
| GET | `/{id}/capteurs` | JWT | Sous-ressource : capteurs |
| GET | `/{id}/actionneurs` | JWT | Sous-ressource : actionneurs |
| GET | `/{id}/alertes` | JWT | Sous-ressource : alertes |
| GET | `/{id}/seuils` | JWT | Sous-ressource : seuils |

### 2.7.4 Capteurs (routes/capteurs.py) - `/api/capteurs`

| Méthode | Chemin | Auth | Description |
|---------|--------|------|-------------|
| GET | `""` | Admin | Lister tous les capteurs |
| GET | `/iot` | API Key | Résolution IoT (parcelle → capteurs) |
| GET | `/{id}` | Admin | Détail d'un capteur |
| POST | `""` | Admin | Créer un capteur |
| PUT | `/{id}` | Admin | Modifier un capteur |
| DELETE | `/{id}` | Admin | Supprimer (cascade) |

**Pourquoi `/iot` ?** L'ESP32 a besoin de savoir quel ID a chaque capteur dans la base. Cette route résout le nom de la parcelle en IDs.

### 2.7.5 Mesures (routes/mesures.py) - `/api/mesures`

| Méthode | Chemin | Auth | Rate Limit | Description |
|---------|--------|------|------------|-------------|
| GET | `""` | JWT | - | Lister avec filtres |
| GET | `/{id}` | JWT | - | Détail d'une mesure |
| GET | `/dernieres/{capteur_id}` | JWT | - | Dernières N mesures |
| POST | `""` | API Key | 60/min | Créer une mesure (ESP32) |

**Pourquoi un rate limit sur POST ?** Pour éviter que l'ESP32 ne noie le serveur de mesures.

### 2.7.6 Commandes (routes/commandes.py) - `/api/commandes`

| Méthode | Chemin | Auth | Rate Limit | Description |
|---------|--------|------|------------|-------------|
| GET | `""` | JWT | - | Lister les commandes |
| GET | `/attente` | API Key | 60/min | Commandes en attente (ESP32 pull) |
| GET | `/{id}` | JWT | - | Détail d'une commande |
| POST | `""` | JWT | 20/min | Créer une commande |
| PUT | `/{id}` | JWT/API | 20/min | Mettre à jour le statut |
| DELETE | `/{id}` | JWT | 20/min | Supprimer (cascade) |

**Le pattern "Pull" de l'ESP32 :**
```
1. Frontend/CLI crée une commande (statut=envoyee)
2. ESP32 poll : GET /api/commandes/attente
3. ESP32 reçoit la commande
4. ESP32 exécute physiquement
5. ESP32 confirme : PUT /api/commandes/{id} (statut=executee)
```

### 2.7.7 Actions (routes/actions.py) - `/api/actions`

| Méthode | Chemin | Auth | Description |
|---------|--------|------|-------------|
| GET | `""` | JWT | Lister les actions |
| GET | `/{id}` | JWT | Détail d'une action |
| POST | `""` | JWT/API | Créer une action (début d'exécution) |
| PUT | `/{id}` | JWT/API | Mettre à jour (fin d'exécution, durée calculée) |

### 2.7.8 Alertes (routes/alertes.py) - `/api/alertes`

| Méthode | Chemin | Auth | Description |
|---------|--------|------|-------------|
| GET | `""` | JWT | Lister avec filtres |
| GET | `/{id}` | JWT | Détail |
| POST | `""` | JWT | Créer + publier MQTT |
| PUT | `/{id}` | JWT | Modifier |
| PUT | `/{id}/reconnaitre` | JWT | Marquer comme reconnue |
| PUT | `/{id}/resoudre` | JWT | Marquer comme résolue |

### 2.7.9 Dashboard (routes/dashboard.py) - `/api/dashboard`

| Méthode | Chemin | Auth | Description |
|---------|--------|------|-------------|
| GET | `""` | JWT | Payload agrégé pour le dashboard |

**Retourne :**
```json
{
  "capteurs": [...],
  "actionneurs": [...],
  "parcelles": [...],
  "alertes": [...],           // etat != "resolue"
  "dernieres_mesures": {      // map: id_capteur -> dernière mesure
    "1": {"valeur": 25.5, "unite": "°C", ...},
    "3": {"valeur": 45, "unite": "%", ...}
  }
}
```

**Pourquoi un endpoint dédié ?** Pour réduire le nombre de requêtes du frontend. Une seule requête au lieu de 5.

## 2.8 services/ - Logique métier

### 2.8.1 auth_service.py

**`creer_token(utilisateur_id)`** : Crée un JWT signé avec HS256, expire en 24h.

**`inscrire(db, nom, email, password, role)`** :
1. Vérifie que l'email n'existe pas déjà
2. Hashe le mot de passe en bcrypt
3. Force `role="agriculteur"` (sécurité)
4. Crée l'utilisateur en base
5. Retourne l'utilisateur créé

**`connecter(db, email, password)`** :
1. Cherche l'utilisateur par email
2. Vérifie le hash bcrypt du mot de passe
3. Vérifie que le compte est actif (sinon 403)
4. Génère un JWT
5. Retourne le token + infos utilisateur

### 2.8.2 commande_service.py

**`creer_commande(db, type_action, source, id_actionneur, ...)`** :
1. Vérifie que l'actionneur existe
2. Vérifie la cohérence source/utilisateur
3. **Vérification sécurité** : Si pompe ON, vérifie le niveau d'eau (min 5%)
4. Crée la commande en base
5. Publie une notification MQTT pour l'ESP32
6. Journalise dans l'historique

**`mettre_a_jour_statut(db, id, nouveau_statut)`** :
1. Vérifie que la transition est valide (FSM)
2. Met à jour le statut
3. Retourne la commande mise à jour

### 2.8.3 automatisation_service.py

**Mapping d'automatisation :**
```
humidite_sol  → capteur: yl-69     → actionneur: pompe
temperature   → capteur: dht22     → actionneur: ventilation
luminosite    → capteur: bh1750    → actionneur: eclairage
co2           → capteur: sen0159   → (pas d'actionneur)
niveau_eau    → capteur: niveau_eau → (pas d'actionneur)
```

**`evaluer_parcelle(db, parcelle_id)`** :
1. Pour chaque seuil de la parcelle :
   a. Trouve le capteur correspondant
   b. Récupère la dernière mesure
   c. Si `seuil.est_depasse(mesure.valeur)` :
      - Crée une alerte (dédoublonnée)
      - Crée une commande ON (source=auto)
   d. Si dans les bornes :
      - Résout les alertes actives
      - Crée une commande OFF

**`executer_boucle(db)`** :
1. Pour chaque parcelle, appelle `evaluer_parcelle()`
2. Valide les transactions
3. Publie les alertes générées via MQTT

### 2.8.4 mqtt_service.py

**Subscriber (`_boucle_subscriber`) :**
1. Se connecte au broker Mosquitto (TLS 8883)
2. S'abonne aux topics :
   - `sai/+/capteurs/#` : Données capteurs
   - `sai/+/alertes` : Alertes
   - `sai/+/actionneurs/#` : État des actionneurs
3. Pour chaque message reçu :
   - Parse le JSON
   - Route vers la bonne fonction de traitement
   - Insère en base de données

**Publisher :**
- `publier_alerte(alerte, db)` : Publie sur `sai/<parcelle>/alertes`
- `publier_commande_notification(commande, db)` : Publie sur `sai/<parcelle>/commandes/notif`

**Pourquoi TLS ?** Pour chiffrer les communications MQTT (port 8883 au lieu de 1883).

### 2.8.5 dashboard_service.py

**`aggregat_dashboard(db)`** :
1. Récupère tous les capteurs, actionneurs, parcelles
2. Récupère les alertes non résolues
3. Pour chaque capteur, récupère la dernière mesure (requête optimisée)
4. Retourne un seul payload agrégé

**Pourquoi une requête optimisée ?** La table `mesures` est très volumineuse. Sans optimisation, la requête serait lente.

## 2.9 schemas/ - Validation des données

**Pourquoi Pydantic ?** Pour valider automatiquement les données entrantes. Si un champ est manquant ou mal formaté, FastAPI retourne une erreur 422.

**Pattern Base / Create / Update / Response :**
- `Base` : Champs communs
- `Create` : Champs requis pour la création
- `Update` : Tous les champs optionnels (mise à jour partielle)
- `Response` : Champs retournés (jamais le mot de passe !)

**Exemple Utilisateur :**
```python
class UtilisateurBase(BaseModel):
    nom: str
    email: EmailStr
    role: str = "agriculteur"

class UtilisateurCreate(UtilisateurBase):
    password: str  # Requis à la création

class UtilisateurResponse(UtilisateurBase):
    id: int
    actif: bool
    created_at: datetime
    # password n'est JAMAIS dans la réponse
```

---

# 3. Frontend React

## 3.1 Structure du projet frontend

```
frontend/
├── index.html              # Point d'entrée HTML
├── package.json            # Dépendances et scripts
├── vite.config.js          # Configuration Vite
├── tailwind.config.js      # Configuration Tailwind CSS
├── src/
│   ├── main.jsx            # Point d'entrée React
│   ├── App.jsx             # Routeur principal
│   ├── index.css           # Styles globaux
│   ├── services/
│   │   ├── api.js          # Client HTTP (Axios)
│   │   ├── mqtt.js         # Client MQTT temps réel
│   │   └── localStorage.js # Stockage local
│   ├── context/
│   │   ├── AuthContext.jsx  # Gestion de l'authentification
│   │   ├── ThemeContext.jsx # Gestion du thème clair/sombre
│   │   └── ToastContext.jsx # Système de notifications
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppLayout.jsx # Mise en page principale
│   │   │   ├── Sidebar.jsx   # Barre latérale
│   │   │   ├── TopBar.jsx    # Barre supérieure
│   │   │   └── BottomNav.jsx # Navigation mobile
│   │   └── ui/
│   │       ├── GaugeCard.jsx  # Jauges SVG pour capteurs
│   │       ├── Modal.jsx      # Fenêtres modales
│   │       └── ConfirmModal.jsx # Confirmation
│   └── pages/
│       ├── Dashboard.jsx     # Tableau de bord principal
│       ├── Parcelles.jsx     # Gestion des parcelles
│       ├── Capteurs.jsx      # Gestion des capteurs
│       ├── Actionneurs.jsx   # Gestion des actionneurs
│       ├── History.jsx       # Historique des mesures
│       ├── Alertes.jsx       # Gestion des alertes
│       ├── Thresholds.jsx    # Configuration des seuils
│       ├── Users.jsx         # Gestion des utilisateurs
│       ├── Profile.jsx       # Profil utilisateur
│       ├── Login.jsx         # Page de connexion
│       ├── Register.jsx      # Page d'inscription
│       └── NotFound.jsx      # Page 404
```

## 3.2 Configuration

### package.json

**Dépendances principales :**
- `react` : Bibliothèque UI
- `react-router-dom` : Routage
- `axios` : Client HTTP
- `mqtt` : Client MQTT pour WebSocket
- `chart.js` + `react-chartjs-2` : Graphiques
- `lucide-react` : Icônes
- `tailwindcss` : Framework CSS

**Scripts :**
- `npm run dev` : Serveur de développement (port 3000)
- `npm run build` : Build de production
- `npm run preview` : Prévisualisation du build

### vite.config.js

**Configuration importante :**
```javascript
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    host: '0.0.0.0',  // Accessible depuis le réseau local
    proxy: {
      '/api': 'http://localhost:8000'  // Proxy vers le backend
    }
  }
})
```

**Pourquoi le proxy ?** En développement, le frontend (port 3000) et le backend (port 8000) sont sur des ports différents. Le proxy redirige les requêtes `/api` vers le backend.

## 3.3 Services

### services/api.js

**Client HTTP centralisé avec Axios :**

```javascript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
});

// Intercepteur : ajoute le JWT à chaque requête
api.interceptors.request.use((config) => {
  const user = localStorage.getItem('sai_current_user_v1');
  if (user) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

// Intercepteur : gère les erreurs 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('sai_current_user_v1');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

**Pourquoi des intercepteurs ?**
- Request interceptor : Ajoute automatiquement le JWT (pas besoin de le faire manuellement)
- Response interceptor : Redirige vers /login si le token expire

### services/mqtt.js

**Client MQTT temps réel via WebSocket :**

```javascript
const MQTT_URL = import.meta.env.VITE_MQTT_URL || 'ws://localhost:9001';

const client = mqtt.connect(MQTT_URL, {
  username: 'sai_frontend',
  password: '',
  reconnectPeriod: 5000,  // Reconnexion auto toutes les 5s
});

// S'abonne aux alertes
client.subscribe('sai/+/alertes');

// S'abonne aux mesures
client.subscribe('sai/+/capteurs/#');
```

**Pourquoi WebSocket ?** Le navigateur ne peut pas faire de MQTT directement. WebSocket est le pont entre MQTT et le navigateur.

**Pourquoi pas de mot de passe pour le frontend ?** Le frontend est en lecture seule (ACL Mosquitto).

## 3.4 Contexte

### AuthContext.jsx

**Rôle :** Gère l'état d'authentification global.

**Valeurs fournies :**
- `user` : Utilisateur courant (ou null)
- `login(email, password)` : Connexion
- `register(nom, email, password)` : Inscription
- `logout()` : Déconnexion
- `isAdmin()` : Vérifie le rôle admin

**Stockage :** Le JWT est stocké dans `localStorage` avec la clé `sai_current_user_v1`.

### ThemeContext.jsx

**Rôle :** Gère le thème clair/sombre.

**Fonctionnement :**
1. Au chargement, vérifie `localStorage` pour la préférence
2. Applique la classe `dark` sur `<html>`
3. Persiste le choix dans `localStorage`

### ToastContext.jsx

**Rôle :** Système de notifications popup.

**Types :** success, error, info, warning

**Auto-dismiss :** Les toasts disparaissent après 3 secondes.

## 3.5 Pages principales

### Dashboard.jsx

**La page la plus complexe du projet.**

**Fonctionnalités :**
1. **Jauges SVG** : Affiche les valeurs capteurs en temps réel
2. **Graphiques Chart.js** : Évolution des mesures dans le temps
3. **Alertes live** : Mise à jour via MQTT
4. **Contrôle des actionneurs** : Boutons ON/OFF
5. **Status des capteurs** : État actif/inactif

**Données :**
- Appelle `GET /api/dashboard` au chargement
- S'abonne aux topics MQTT pour les mises à jour temps réel
- Fallback HTTP si le broker est injoignable

### History.jsx

**Fonctionnalités :**
1. **Graphiques** : Sélection du capteur et de la période
2. **Tableau** : Liste des mesures avec pagination
3. **Export** : CSV et Excel (via `xlsx`)

### Alertes.jsx

**Fonctionnalités :**
1. **Filtres** : Par état (active, reconnue, resolue), par sévérité
2. **Actions** : Marquer comme reconnue/résolue
3. **Temps réel** : Nouvelles alertes via MQTT

---

# 4. CLI Python

## 4.1 Structure

```
Cli/
├── main.py              # Point d'entrée argparse
├── client.py            # Client HTTP (APIClient)
├── auth.py              # Fonctions login/logout
├── logs.py              # Journalisation (CDC 6.3)
├── config.json          # Config runtime (gitignoré)
├── commands/            # Modules de commandes
│   ├── capteurs.py
│   ├── actionneurs.py
│   ├── mesures.py
│   ├── commandes.py     # Le plus complexe (sécurité CDC)
│   ├── alertes.py
│   ├── seuils.py
│   ├── statut.py
│   └── batch.py         # Opérations en masse
└── test_cli.py          # Tests d'intégration
```

## 4.2 main.py - Point d'entrée

**Utilisation :**
```bash
python main.py login --email admin@sai.com --password admin123
python main.py capteurs
python main.py commander 1 --action on --duree 30
python main.py batch arrosage --actionneur 1 --duree 60
```

**Pattern argparse :**
```python
parser = argparse.ArgumentParser(description="CLI SAI")
sous_commandes = parser.add_subparsers(dest="commande", required=True)

# Sous-commande login
login_parser = sous_commandes.add_parser("login")
login_parser.add_argument("--email", required=True)
login_parser.add_argument("--password", required=True)

# Dispatch
args = parser.parse_args()
if args.commande == "login":
    from auth import login
    login(client, args.email, args.password)
```

## 4.3 client.py - Client HTTP

**Classe `APIClient` :**
- Stocke le JWT et la clé API dans `config.json`
- Envoie les headers `Authorization` et `X-API-Key`
- Gère les erreurs (401, 404, 422)
- Affiche les messages d'erreur en français

## 4.4 Sécurité CDC (Ca Des Charges)

### CDC 6.2.1 - Vérification du réservoir

Avant d'activer la pompe, le CLI vérifie le niveau d'eau :
```python
def _verifier_reservoir(api, actionneur, oui):
    if actionneur['nom'] == 'pompe':
        # Récupère la dernière mesure de niveau_eau
        dernier_niveau = _dernier_niveau_eau(api, parcelle_id)
        if dernier_niveau < 5.0:  # Seuil critique
            if not oui:
                print("ERREUR: Réservoir vide (< 5%)")
                sys.exit(1)
```

### CDC 6.3 - Confirmation pour actionneurs critiques

```python
ACTIONNEURS_CRITIQUES = {"pompe", "ventilation", "eclairage"}

def _confirmer_critique(api, actionneur, oui):
    if actionneur['nom'] in ACTIONNEURS_CRITIQUES:
        if not oui:
            reponse = input(f"Confirmer activation {actionneur['nom']}? [o/N] ")
            if reponse.lower() != 'o':
                sys.exit(0)
```

### CDC 6.3 - Journalisation

```python
def journal(commande: str, message: str, erreur: bool = False):
    logger.info(f"{commande} -> {message}")
```

## 4.5 Tests d'intégration (test_cli.py)

**Fonctionnement :**
1. Démarre le serveur uvicorn en arrière-plan
2. Attend 5 secondes pour le démarrage
3. Exécute 14 commandes de test
4. Vérifie les codes de retour
5. Tue le serveur à la fin

**Pourquoi lancer le serveur ?** Pour tester l'intégration complète CLI ↔ Backend ↔ BD.

---

# 5. Firmware ESP32 (IoT)

## 5.1 Structure

```
Iot/
├── platformio.ini       # Configuration PlatformIO
├── include/
│   ├── config.h         # Config réelle (gitignoré)
│   ├── config.h.example # Template
│   ├── pins.h           # Assignation GPIO
│   └── ca_cert.h        # Certificat CA embarqué
├── src/
│   ├── main.cpp         # Scheduler non-bloquant
│   ├── wifi_manager.cpp/h  # Gestion WiFi + NTP
│   ├── config_store.cpp/h  # Persistance NVS
│   ├── sensors.cpp/h    # 5 capteurs + filtre
│   ├── actuators.cpp/h  # 3 relais
│   ├── mqtt_publisher.cpp/h # Publication MQTT TLS
│   ├── http_commands.cpp/h  # Workflow HTTP pull/confirm
│   ├── automation.cpp/h # Évaluation seuils locale
│   └── buzzer.cpp/h     # Alertes sonores
└── INTERFACE.md         # Contrat ESP32 ↔ Backend
```

## 5.2 platformio.ini

```ini
[env:esp32dev]
platform = espressif32
board = esp32dev
framework = arduino
monitor_speed = 115200

lib_deps =
    knolleary/PubSubClient@^2.8      # MQTT
    bblanchon/ArduinoJson@^7          # JSON
    adafruit/DHT sensor library@^1.4  # DHT22
```

**Pourquoi PlatformIO ?** IDE orienté IoT, gère les bibliothèques, compile pour ESP32.

## 5.3 main.cpp - Scheduler non-bloquant

**Principe : Aucun `delay()` dans le code.**

Chaque module a :
- `_begin()` : Initialisation (appelé une fois)
- `_loop()` : Boucle d'exécution (appelée en continu)

```cpp
void setup() {
  config_store_begin();
  sensors_begin();
  actuators_begin();
  buzzer_begin();
  wifi_begin();
  mqtt_begin();
  http_commands_begin();
  automation_begin();
}

void loop() {
  wifi_loop();          yield();
  sensors_loop();       yield();
  mqtt_loop();          yield();
  http_commands_loop(); yield();
  automation_loop();    yield();
  buzzer_loop();        yield();
}
```

**Pourquoi `yield()` ?** Pour céder le CPU au système ( watchdog timer ).

## 5.4 sensors.cpp - 5 capteurs avec filtrage

**Capteurs :**
1. **DHT22** (GPIO 4) : Température + humidité air
2. **YL-69** (GPIO 34) : Humidité sol (analogique)
3. **LDR** (GPIO 36) : Luminosité (analogique)
4. **MQ-135** (GPIO 35) : CO₂ (analogique)
5. **HC-SR04** (GPIO 32/33) : Niveau d'eau (ultrasons)

**Filtrage :** Chaque capteur analogique utilise un `FiltreGlissant` (moyenne glissante, profondeur 8) pour lisser les lectures.

**Calibration MQ-135 :**
```cpp
// Formule : ppm = 400 * pow(Rs/Ro, -2.77)
float ppm = 400.0 * pow(rs_ro_ratio, -2.77);
```

**Formule HC-SR04 :**
```cpp
// Le capteur est monté à 200mm du fond
float pourcentage = (200.0 - distance_mm) / 180.0 * 100.0;
pourcentage = constrain(pourcentage, 0.0, 100.0);
```

## 5.5 actuators.cpp - 3 relais

```cpp
// Relais actif HIGH
#define GPIO_POMPE       26
#define GPIO_VENTILATION 27
#define GPIO_ECLAIRAGE   25

void set_actionneur(const char* nom, bool active) {
  if (strcmp(nom, "pompe") == 0) digitalWrite(GPIO_POMPE, active ? HIGH : LOW);
  // ...
}
```

## 5.6 mqtt_publisher.cpp - TLS MQTT

**Connexion :**
```cpp
WiFiClientSecure espClient;
espClient.setCACert(ca_cert);  // Certificat CA embarqué
PubSubClient client(espClient);
client.setServer("172.20.10.4", 8883);
```

**Publish :**
```cpp
// Mesures : sai/<parcelle>/capteurs/telemetrie
client.publish(topic, jsonBuffer, retained=true);

// Alertes : sai/<parcelle>/alertes
client.publish(topic, jsonAlerte);
```

**Subscribe :**
```cpp
// Notifications de commande : sai/<parcelle>/commandes/notif
client.subscribe(topic_notif);
```

## 5.7 http_commands.cpp - Machine à états

**Workflow :**
```
IDLE → A_CONFIRMER → A_ACTION → A_EXECUTER → A_CLOTURE → A_EXECUTE → IDLE
                                                                   \→ ECHOUEE → IDLE
```

**Étapes :**
1. `GET /api/commandes/attente` : Récupère les commandes en attente
2. `PUT /api/commandes/{id}` : Marque comme "recue"
3. `POST /api/actions` : Crée une action "en_cours"
4. Exécution physique de l'actionneur
5. `PUT /api/actions/{id}` : Marque comme "termine"
6. `PUT /api/commandes/{id}` : Marque comme "executee"

**Sécurité citerne :**
```cpp
if (niveau_eau < SEUIL_CITERNE_VIDE) {
  // Blocage pompe
  publier_alerte("citerne_vide");
  buzzer_beep(5, 500);
  return;
}
```

## 5.8 automation.cpp - Évaluation locale

**Seuils avec hystérésis :**
```
Sol:    ON < 30%, OFF >= 33%
Temp:   ON > 40°C, OFF <= 37°C
CO₂:    ON > 900 ppm, OFF <= 850 ppm
Lumière: ON < 30%, OFF > 50%
Citerne: OFF < 5%, re-ON >= 10%
```

**Pourquoi l'hystérésis ?** Pour éviter les oscillations (on/off/on/off rapide).

**Priorité citerne :** Si le niveau d'eau < 5%, la pompe est forcée OFF, peu importe l'humidité.

---

# 6. Broker Mosquitto (MQTT)

## 6.1 Configuration

**Deux listeners :**
1. **Port 8883** : MQTT/TLS (ESP32 + Backend)
2. **Port 9001** : WebSocket (Frontend React)

## 6.2 ACL (Access Control List)

| Utilisateur | Lecture | Écriture |
|-------------|---------|----------|
| `sai_backend` | `sai/#` (tout) | `sai/+/actionneurs/#`, `sai/+/alertes`, `sai/+/commandes/notif` |
| `sai_esp32` | `sai/+/commandes`, `sai/+/commandes/notif` | `sai/+/capteurs/#`, `sai/+/actionneurs/#`, `sai/+/alertes` |
| `sai_frontend` | `sai/#` (tout) | (rien) |

**Pourquoi cette ACL ?**
- Le backend peut tout lire mais écrit seulement les alertes et commandes
- L'ESP32 écrit les capteurs et alertes, lit les commandes
- Le frontend est en lecture seule (temps réel)

## 6.3 TLS

**Certificats :**
- CA racine : `mosquitto_ca.crt` (10 ans de validité)
- Serveur : `mosquitto_server.crt` (825 jours)

**Génération :** `mosquitto/scripts/gen_certs.ps1`

---

# 7. Base de données PostgreSQL

## 7.1 Schéma complet (11 tables)

```sql
-- 1. UTILISATEURS (racine)
CREATE TABLE utilisateurs (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'agriculteur',
    actif BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. PARCELLES
CREATE TABLE parcelles (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    localisation VARCHAR(255),
    id_utilisateur INTEGER NOT NULL REFERENCES utilisateurs(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. CAPTEURS
CREATE TABLE capteurs (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(30) NOT NULL,
    reference VARCHAR(50),
    gpio INTEGER NOT NULL,
    protocole VARCHAR(10) NOT NULL DEFAULT 'digital',
    etat VARCHAR(15) NOT NULL DEFAULT 'actif',
    id_parcelle INTEGER NOT NULL REFERENCES parcelles(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. MESURES (haute volumétrie)
CREATE TABLE mesures (
    id SERIAL PRIMARY KEY,
    valeur DECIMAL(10,2) NOT NULL,
    unite VARCHAR(10) NOT NULL,
    source VARCHAR(20) NOT NULL DEFAULT 'esp32',
    timestamp TIMESTAMP DEFAULT NOW(),
    id_capteur INTEGER NOT NULL REFERENCES capteurs(id) ON DELETE CASCADE
);

-- 5. ACTIONNEURS
CREATE TABLE actionneurs (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(20) NOT NULL,
    reference VARCHAR(50),
    gpio INTEGER NOT NULL,
    etat VARCHAR(10) NOT NULL DEFAULT 'inactif',
    id_parcelle INTEGER NOT NULL REFERENCES parcelles(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 6. COMMANDES
CREATE TABLE commandes (
    id SERIAL PRIMARY KEY,
    type_action VARCHAR(20) NOT NULL DEFAULT 'on',
    valeur_parametre VARCHAR(50),
    source VARCHAR(20) NOT NULL,
    timestamp TIMESTAMP DEFAULT NOW(),
    statut VARCHAR(15) NOT NULL DEFAULT 'envoyee',
    id_utilisateur INTEGER REFERENCES utilisateurs(id),
    id_actionneur INTEGER NOT NULL REFERENCES actionneurs(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 7. ACTIONS
CREATE TABLE actions (
    id SERIAL PRIMARY KEY,
    date_debut TIMESTAMP DEFAULT NOW(),
    date_fin TIMESTAMP,
    duree INTEGER,
    resultat TEXT,
    details TEXT,
    statut VARCHAR(15) NOT NULL DEFAULT 'en_cours',
    id_commande INTEGER NOT NULL UNIQUE REFERENCES commandes(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 8. ALERTES
CREATE TABLE alertes (
    id SERIAL PRIMARY KEY,
    type VARCHAR(30) NOT NULL,
    valeur DECIMAL(10,2),
    seuil DECIMAL(10,2),
    severite VARCHAR(10) NOT NULL DEFAULT 'haute',
    message TEXT NOT NULL,
    etat VARCHAR(15) NOT NULL DEFAULT 'active',
    date_debut TIMESTAMP DEFAULT NOW(),
    date_fin TIMESTAMP,
    id_parcelle INTEGER NOT NULL REFERENCES parcelles(id),
    id_mesure INTEGER REFERENCES mesures(id),
    id_action INTEGER REFERENCES actions(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 9. SEUILS
CREATE TABLE seuils (
    id SERIAL PRIMARY KEY,
    type_mesure VARCHAR(20) NOT NULL,
    valeur_min DECIMAL(10,2) NOT NULL,
    valeur_max DECIMAL(10,2) NOT NULL,
    unite VARCHAR(10) NOT NULL,
    id_utilisateur INTEGER NOT NULL REFERENCES utilisateurs(id),
    id_parcelle INTEGER NOT NULL REFERENCES parcelles(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 10. TOKENS
CREATE TABLE tokens (
    id SERIAL PRIMARY KEY,
    cle_api VARCHAR(255) UNIQUE NOT NULL,
    nom VARCHAR(50) NOT NULL,
    actif BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    last_used_at TIMESTAMP,
    id_utilisateur INTEGER NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE
);

-- 11. HISTORIQUE_ACTIONS (ajouté par Alembic)
CREATE TABLE historique_actions (
    id INTEGER PRIMARY KEY,
    type_action VARCHAR(20) NOT NULL,
    entite VARCHAR(20) NOT NULL,
    entite_id INTEGER NOT NULL,
    details TEXT,
    id_utilisateur INTEGER REFERENCES utilisateurs(id),
    created_at TIMESTAMP
);
```

## 7.2 Index de performance (18)

```sql
-- Mesures (table la plus volumineuse)
CREATE INDEX idx_mesures_timestamp ON mesures(timestamp DESC);
CREATE INDEX idx_mesures_id_capteur ON mesures(id_capteur);
CREATE INDEX idx_mesures_capteur_timestamp ON mesures(id_capteur, timestamp DESC);

-- Commandes
CREATE INDEX idx_commandes_timestamp ON commandes(timestamp DESC);
CREATE INDEX idx_commandes_statut ON commandes(statut);

-- Alertes
CREATE INDEX idx_alertes_etat ON alertes(etat);
CREATE INDEX idx_alertes_date ON alertes(date_debut DESC);
```

## 7.3 Triggers (auto-updated_at)

```sql
CREATE OR REPLACE FUNCTION mettre_a_jour_horodatage()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliqué à : utilisateurs, parcelles, capteurs, actionneurs, actions, alertes, seuils
```

## 7.4 Migrations Alembic

**Chaîne de migrations :**
```
02b2bd3ff25a (init)
  → a1b2c3d4e5f6 (add_actif)
    → d94e38b47852 (add_historique)
      → a1b2c3d4e5f7 (alignement_mpd)
        → e5f6g7h8i9j0 (nullable_utilisateur)
```

**Pourquoi Alembic ?** Pour versionner le schéma de la base de données. Chaque modification est traçable et réversible.

---

# 8. Flux de données complet

## 8.1 Flux Capteur → Base de données

```
1. ESP32 lit le capteur DHT22 (GPIO 4)
2. ESP32 formate le JSON : {"temperature": 26.5, "humidite_sol": 42.3, ...}
3. ESP32 publie MQTT : sai/serre-a/capteurs/telemetrie
4. Mosquitto reçoit le message
5. Backend (subscriber) reçoit le message
6. Backend parse le JSON
7. Backend résout : (serre-a, temperature) → capteur ID 1
8. Backend insère dans la table mesures
9. PostgreSQL stocke la mesure
```

## 8.2 Flux Commande → Actionneur

```
1. Utilisateur clique "Arrosage ON" dans le dashboard
2. Frontend envoie POST /api/commandes {"type_action": "on", "id_actionneur": 1}
3. Backend crée la commande (statut=envoyee)
4. Backend publie MQTT : sai/serre-a/commandes/notif
5. ESP32 reçoit la notification
6. ESP32 appelle GET /api/commandes/attente
7. ESP32 reçoit la commande
8. ESP32 appelle PUT /api/commandes/1 {"statut": "recue"}
9. ESP32 appelle POST /api/actions {"id_commande": 1, "statut": "en_cours"}
10. ESP32 active le relais GPIO 26 (pompe)
11. ESP32 appelle PUT /api/actions/1 {"statut": "termine"}
12. ESP32 appelle PUT /api/commandes/1 {"statut": "executee"}
13. La pompe tourne !
```

## 8.3 Flux Automatisation

```
1. Thread daemon se déclenche (toutes les 5 min)
2. Backend appelle executer_boucle(db)
3. Pour chaque parcelle :
   a. Récupère les seuils
   b. Pour chaque seuil :
      - Récupère la dernière mesure
      - Si seuil dépassé :
        * Crée une alerte
        * Crée une commande ON (source=auto)
      - Si dans les bornes :
        * Résout l'alerte active
        * Crée une commande OFF
4. Backend publie les alertes via MQTT
5. Frontend reçoit les alertes en temps réel
```

---

# 9. Sécurité et authentification

## 9.1 Niveaux de sécurité

| Couche | Mécanisme |
|--------|-----------|
| Transport | TLS 1.2 (port 8883 MQTT, HTTPS en production) |
| Authentification | JWT (HS256) + API Key (bcrypt) |
| Autorisation | Rôles (agriculteur/admin) + ACL MQTT |
| Validation | Pydantic (schemas) + CHECK constraints (SQL) |
| Chiffrement | bcrypt (mots de passe), TLS (transport) |
| Traçabilité | Historique actions + logs |

## 9.2 Bonnes pratiques respectées

- [x] Pas de mots de passe en clair (bcrypt)
- [x] Pas de secrets dans le code (.env gitignoré)
- [x] Validation des entrées (Pydantic)
- [x] Rate limiting (SlowAPI)
- [x] CORS restrictif
- [x] Logs d'audit (historique_actions)
- [x] Déconnexion automatique sur 401
- [x] Comptes désactivables (actif=False)

---

# 10. Automatisation et règles métier

## 10.1 Règles d'automatisation

| Mesure | Capteur | Actionneur | Seuil ON | Seuil OFF |
|--------|---------|------------|----------|-----------|
| humidite_sol | yl-69 | pompe | < 30% | >= 33% |
| temperature | dht22 | ventilation | > 40°C | <= 37°C |
| luminosite | bh1750 | eclairage | < 30% | > 50% |
| co2 | sen0159 | (aucun) | > 900 ppm | <= 850 ppm |
| niveau_eau | niveau_eau | (aucun) | < 5% (alerte) | - |

## 10.2 Priorité citerne

**Règle :** Si le niveau d'eau < 5%, la pompe est FORCÉE OFF, peu importe l'humidité du sol.

**Pourquoi ?** Pour éviter de pomper à sec (détérioration de la pompe).

## 10.3 Hystérésis

**Pourquoi ?** Pour éviter les oscillations. Sans hystérésis, si le seuil est à 30% :
- Humidité = 30.1% → Pompe OFF
- Humidité = 29.9% → Pompe ON
- Humidité = 30.1% → Pompe OFF
- ...

Avec hystérésis (ON < 30%, OFF >= 33%) :
- Humidité = 29% → Pompe ON
- Humidité = 33% → Pompe OFF
- Pas d'oscillation !

---

# 11. Tests et validation

## 11.1 Backend (pytest)

**15 fichiers de test :**
- `test_auth.py` : Inscription, connexion, JWT
- `test_utilisateurs.py` : CRUD utilisateurs
- `test_parcelles.py` : CRUD parcelles
- `test_mesures.py` : Création, filtres
- `test_commandes.py` : FSM des statuts
- `test_iot.py` : Auth API Key, workflow ESP32
- `test_dashboard.py` : Agrégation
- etc.

**Base de dédiée :** `sai_test` (isolée de la prod)

**Pourquoi une BD dédiée ?** Pour ne pas polluer les données de production lors des tests.

## 11.2 CLI (test_cli.py)

**Tests d'intégration :**
1. Démarre le serveur uvicorn
2. Exécute 14 commandes CLI
3. Vérifie les codes de retour
4. Tue le serveur

## 11.3 IoT

**Tests manuels** avec ESP32 réel (documentés dans README.md).

---

# 12. Déploiement et configuration

## 12.1 Mode développement (local)

| Composant | Port | Protocole |
|-----------|------|-----------|
| React (Vite) | 3000/5173 | HTTP |
| FastAPI | 8000 | HTTP |
| PostgreSQL | 5432 | TCP |
| Mosquitto | 1883/8883 | MQTT |
| ESP32 | Wi-Fi | MQTT |

## 12.2 Mode production

| Composant | Provider | Port | Protocole |
|-----------|----------|------|-----------|
| React | Vercel | 443 | HTTPS |
| FastAPI | Render | 443 | HTTPS |
| PostgreSQL | Render | 5432 | TCP+SSL |
| Mosquitto | Cloud | 8883 | MQTT/TLS |

## 12.3 Variables d'environnement

**Backend (.env) :**
```
DATABASE_URL=postgresql://sai_user:sai_password@localhost:5432/sai_db
JWT_SECRET_KEY=votre_clé_secrète
MQTT_BROKER=localhost
MQTT_PORT=8883
MQTT_TLS=true
```

**Frontend (.env) :**
```
VITE_API_URL=/api
VITE_MQTT_URL=ws://localhost:9001
```

---

# Glossaire

| Terme | Définition |
|-------|------------|
| **IoT** | Internet of Things (Objets connectés) |
| **MQTT** | Message Queuing Telemetry Transport (protocole léger) |
| **TLS** | Transport Layer Security (chiffrement) |
| **JWT** | JSON Web Token (token d'authentification) |
| **API Key** | Clé d'API pour l'authentification machine |
| **ORM** | Object-Relational Mapping (SQLAlchemy) |
| **REST** | REpresentational State Transfer (architecture API) |
| **WebSocket** | Protocole de communication temps réel |
| **Hystérésis** | Différence entre seuil d'activation et de désactivation |
| **FSM** | Finite State Machine (Machine à états) |
| **GPIO** | General Purpose Input/Output (broches ESP32) |
| **NVS** | Non-Volatile Storage (stockage persistant ESP32) |
| **Alembic** | Outil de migrations SQLAlchemy |
| **Pydantic** | Bibliothèque de validation de données Python |
| **FastAPI** | Framework web Python asynchrone |
| **React** | Bibliothèque JavaScript pour interfaces |
| **Vite** | Outil de build JavaScript rapide |
| **Tailwind CSS** | Framework CSS utility-first |
| **Chart.js** | Bibliothèque de graphiques JavaScript |
| **PlatformIO** | IDE pour systèmes embarqués |

---

# Récapitulatif des choix techniques

| Choix | Alternative | Pourquoi ce choix |
|-------|-------------|-------------------|
| FastAPI | Flask, Django | Auto-documenté (Swagger), typé (Pydantic), performant |
| React | Vue, Angular | Écosystème riche, grandes entreprises l'utilisent |
| PostgreSQL | MySQL, Firebase | Gratuit, fiable, supporte les données temporelles |
| MQTT | HTTP | 10x plus léger pour l'IoT, gère les mauvaises connexions |
| ESP32 | Arduino Uno | Wi-Fi + Bluetooth intégré, puissant, économique |
| JWT | Session cookies | Stateless, fonctionne avec l'IoT |
| bcrypt | MD5, SHA-256 | Lent par design (résistant aux attaques par force brute) |
| Tailwind | Bootstrap, CSS custom | Rapide à développer, léger en production |
| PlatformIO | Arduino IDE | Meilleure gestion des dépendances, multi-plateforme |

---

*Document généré automatiquement à partir de l'analyse complète du code source du projet SAI.*
*Dernière mise à jour : Septembre 2026*
