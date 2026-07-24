# Explication du MCD — Modèle Conceptuel de Données (SAI)

## 📖 Introduction

Le MCD (Modèle Conceptuel de Données) est le premier niveau de modélisation des données selon la méthode **Merise**. Il répond à la question :

> **"Quelles sont les entités du système et comment sont-elles liées ?"**

Il ne se préoccupe **pas encore** des aspects techniques (types SQL, index, performances). C'est une vue purement conceptuelle.

---

## 🎭 Les 10 Entités

### 1. UTILISATEUR
Représente toute personne qui interagit avec le système.

| Attribut | Type | Description |
|----------|------|-------------|
| `id_utilisateur` | INT PK | Identifiant unique |
| `nom` | VARCHAR | Nom complet |
| `email` | VARCHAR | Identifiant de connexion |
| `password_hash` | VARCHAR | Mot de passe hashé (bcrypt) |
| `role` | VARCHAR | `agriculteur` ou `admin` |
| `date_creation` | DATETIME | Date d'inscription |

**Note** : Un seul utilisateur avec un rôle (`agriculteur` ou `admin`). Pas de distinction en deux tables séparées.

### 2. PARCELLE
Zone de culture gérée par le système.

| Attribut | Type | Description |
|----------|------|-------------|
| `id_parcelle` | INT PK | Identifiant unique |
| `nom` | VARCHAR | Ex: "Serre A", "Champ Nord" |
| `localisation` | VARCHAR | Description de l'emplacement |
| `date_creation` | DATETIME | Date d'ajout |

### 3. CAPTEUR
Dispositif physique qui mesure une grandeur.

| Attribut | Type | Description |
|----------|------|-------------|
| `id_capteur` | INT PK | Identifiant unique |
| `nom` | VARCHAR | Ex: `dht22`, `yl-69`, `bh1750` |
| `reference` | VARCHAR | Référence fabricant |
| `gpio` | INT | Broche ESP32 |
| `protocole` | VARCHAR | `digital`, `analog`, `i2c` |
| `etat` | VARCHAR | `actif`, `inactif`, `defaillant` |

### 4. MESURE
Valeur lue par un capteur à un instant T.

| Attribut | Type | Description |
|----------|------|-------------|
| `id_mesure` | INT PK | Identifiant unique |
| `valeur` | DECIMAL | La valeur mesurée |
| `unite` | VARCHAR | `%`, `°C`, `ppm`, `lux` |
| `source` | VARCHAR | `esp32`, `manuel`, `simulation` |
| `timestamp` | DATETIME | Horodatage de la lecture |

### 5. ACTIONNEUR
Dispositif physique qui exécute une action.

| Attribut | Type | Description |
|----------|------|-------------|
| `id_actionneur` | INT PK | Identifiant unique |
| `nom` | VARCHAR | Ex: `pompe`, `ventilation`, `eclairage` |
| `reference` | VARCHAR | Référence fabricant |
| `gpio` | INT | Broche ESP32 |
| `etat` | VARCHAR | `actif`, `inactif` |

### 6. COMMANDE
Ordre envoyé à un actionneur (provenant du web, CLI, ou automatisation).

| Attribut | Type | Description |
|----------|------|-------------|
| `id_commande` | INT PK | Identifiant unique |
| `type_action` | VARCHAR | `on`, `off`, `programmer` |
| `valeur_parametre` | VARCHAR | Durée en secondes, etc. |
| `source` | VARCHAR | `web`, `cli`, `auto` |
| `timestamp` | DATETIME | Envoi de la commande |
| `statut` | VARCHAR | `envoyee`, `recue`, `executee`, `echouee` |

### 7. ACTION
Enregistrement de l'exécution d'une commande.

| Attribut | Type | Description |
|----------|------|-------------|
| `id_action` | INT PK | Identifiant unique |
| `date_debut` | DATETIME | Début de l'exécution |
| `date_fin` | DATETIME | Fin de l'exécution |
| `duree` | INT | Durée en secondes |
| `resultat` | TEXT | Message de résultat |
| `details` | TEXT | Infos complémentaires (JSON) |
| `statut` | VARCHAR | `en_cours`, `termine`, `echouee` |

### 8. ALERTE
Notification d'un événement anormal.

| Attribut | Type | Description |
|----------|------|-------------|
| `id_alerte` | INT PK | Identifiant unique |
| `type` | VARCHAR | `co2_eleve`, `temp_haute`, `reservoir_vide`... |
| `valeur` | DECIMAL | Valeur qui a déclenché l'alerte |
| `seuil` | DECIMAL | Seuil qui a été dépassé |
| `severite` | VARCHAR | `basse`, `haute`, `critique` |
| `message` | TEXT | Message pour le dashboard |
| `etat` | VARCHAR | `active`, `reconnue`, `resolue` |
| `date_debut` | DATETIME | Début de l'alerte |
| `date_fin` | DATETIME | Résolution (nullable) |

### 9. SEUIL
Valeurs limites configurées pour l'automatisation.

| Attribut | Type | Description |
|----------|------|-------------|
| `id_seuil` | INT PK | Identifiant unique |
| `type_mesure` | VARCHAR | `humidite_sol`, `temperature`, `co2`, `luminosite`, `niveau_eau` |
| `valeur_min` | DECIMAL | Seuil bas (ex: 30%) |
| `valeur_max` | DECIMAL | Seuil haut (ex: 50%) |
| `unite` | VARCHAR | `%`, `°C`, `ppm`, `lux` |

### 10. TOKEN
Clé API pour l'authentification du CLI.

| Attribut | Type | Description |
|----------|------|-------------|
| `id_token` | INT PK | Identifiant unique |
| `cle_api` | VARCHAR | Clé API (ex: `sk_sai_abc123...`) |
| `nom` | VARCHAR | Nom pour s'y retrouver |
| `actif` | BOOLEAN | Permet de révoquer une clé |
| `date_creation` | DATETIME | Date de génération |
| `date_expiration` | DATETIME | Date d'expiration |
| `dernier_usage` | DATETIME | Dernière utilisation |

---

## 🔗 Les 13 Relations et leurs cardinalités

| # | Entité 1 | Verbe | Entité 2 | Signification |
|---|----------|-------|----------|---------------|
| 1 | UTILISATEUR `(1,1)` | soumet | `(0,N)` COMMANDE | Un utilisateur soumet 0 à N commandes ; une commande vient d'exactement 1 utilisateur |
| 2 | UTILISATEUR `(1,1)` | possede | `(0,N)` TOKEN | Un utilisateur a 0 à N clés API ; une clé appartient à 1 utilisateur |
| 3 | UTILISATEUR `(1,1)` | configure | `(0,N)` SEUIL | Un utilisateur configure 0 à N seuils ; un seuil est configuré par 1 utilisateur |
| 4 | UTILISATEUR `(0,N)` | gere | `(1,1)` PARCELLE | Un utilisateur gère 0 ou plusieurs parcelles ; une parcelle est gérée par exactement 1 utilisateur |
| 5 | PARCELLE `(1,1)` | contient | `(0,N)` CAPTEUR | Une parcelle contient 0 à N capteurs ; un capteur est dans 1 parcelle |
| 6 | PARCELLE `(1,1)` | contient | `(0,N)` ACTIONNEUR | Une parcelle contient 0 à N actionneurs ; un actionneur est dans 1 parcelle |
| 7 | PARCELLE `(1,1)` | definit | `(0,N)` SEUIL | Une parcelle définit 0 à N seuils ; un seuil est défini pour 1 parcelle |
| 8 | PARCELLE `(1,1)` | concerne | `(0,N)` ALERTE | Une parcelle concerne 0 à N alertes ; une alerte concerne 1 parcelle |
| 9 | CAPTEUR `(1,1)` | preleve | `(0,N)` MESURE | Un capteur prélève 0 à N mesures ; une mesure vient d'1 capteur |
| 10 | MESURE `(0,N)` | declenche | `(0,1)` ALERTE | Une mesure peut déclencher 0 à N alertes ; une alerte peut être déclenchée par 0 ou 1 mesure |
| 11 | ACTION `(0,N)` | genere | `(0,1)` ALERTE | Une action peut générer 0 à N alertes ; une alerte peut être générée par 0 ou 1 action |
| 12 | ACTIONNEUR `(1,1)` | recoit | `(0,N)` COMMANDE | Un actionneur reçoit 0 à N commandes ; une commande est reçue par 1 actionneur |
| 13 | COMMANDE `(1,1)` | provoque | `(0,1)` ACTION | Une commande provoque 0 ou 1 action ; une action est provoquée par 1 commande |

### Détail des cardinalités importantes

#### Relation 4 : UTILISATEUR — PARCELLE
```
UTILISATEUR (0,N) — gère — (1,1) PARCELLE
```
- Un utilisateur peut ne gérer **aucune** parcelle (compte créé mais pas affecté) ou **plusieurs**
- Une parcelle a **exactement un** gestionnaire responsable (pas d'orphelin)

#### Relations 10 & 11 : Mesure/Alerte — Action/Alerte
```
MESURE (0,N) — déclenche — (0,1) ALERTE
ACTION (0,N) — génère — (0,1) ALERTE
```
- Une alerte ne peut avoir qu'**une seule cause** : soit une mesure anormale, soit une action échouée
- `(0,1)` côté ALERTE = une alerte peut être causée par **rien** (si créée manuellement), **1 mesure**, ou **1 action** (mais pas les deux à la fois)

#### Relation 13 : COMMANDE — ACTION
```
COMMANDE (1,1) — provoque — (0,1) ACTION
```
- Une commande est toujours émise (même si pas encore reçue)
- L'action n'existe que si la commande a été reçue et exécutée

---

## 📊 Logique métier

### Parcours d'une commande du web
```
UTILISATEUR (agriculteur) 
  → PARCELLE (gérée par l'agriculteur)
    → ACTIONNEUR (pompe dans la parcelle)
      → COMMANDE (soumise par l'utilisateur)
        → ACTION (provoquée par la commande)
```

### Parcours d'une alerte
```
Option A : MESURE (valeur anormale) 
  → ALERTE (déclenchée par la mesure)
    → PARCELLE (concerne la parcelle)

Option B : COMMANDE → ACTION (échec)
  → ALERTE (générée par l'action)
    → PARCELLE (concerne la parcelle)
```

---

## 📊 Traçabilité UC ↔ Entités

Chaque cas d'utilisation manipule une ou plusieurs entités du MCD. Cette table montre le lien entre les 14 UC et les 10 entités.

| UC | Intitulé | Entité(s) concernée(s) | Action principale |
|----|----------|------------------------|------------------|
| UC1 | S'authentifier | UTILISATEUR, TOKEN | Vérifier identifiants, générer JWT |
| UC2 | Consulter le tableau de bord | PARCELLE, CAPTEUR, MESURE, ACTIONNEUR, ALERTE | Lecture des dernières données |
| UC3 | Visualiser l'historique | MESURE | Lecture filtrée |
| UC4 | Commander actionneur (web) | COMMANDE, ACTIONNEUR, ACTION | Créer commande → provoquer action |
| UC5 | Commander actionneur (CLI) | COMMANDE, ACTIONNEUR, ACTION, TOKEN | Auth via clé API + commande |
| UC6 | Exécuter automatisation | MESURE, SEUIL, COMMANDE, ACTIONNEUR, ALERTE | Lire mesures → comparer seuils → agir |
| UC7 | Configurer les seuils | SEUIL | Créer/modifier des seuils |
| UC8 | Gérer les utilisateurs | UTILISATEUR | CRUD comptes |
| UC9 | Collecter données capteurs | CAPTEUR, MESURE | Lire capteurs → insérer mesures |
| UC10 | Recevoir et exécuter commande | ACTIONNEUR, COMMANDE, ACTION | Lire commande → activer GPIO |
| UC11 | Gérer la connexion réseau | *(aucune entité)* | Interne ESP32 |
| UC12 | **Gérer les capteurs** | **CAPTEUR, PARCELLE** | **CRUD capteurs + affectation parcelle** |
| UC13 | **Gérer les actionneurs** | **ACTIONNEUR, PARCELLE** | **CRUD actionneurs + affectation parcelle** |
| UC14 | **Gérer les parcelles** | **PARCELLE, UTILISATEUR** | **CRUD parcelles + gestion propriétaire** |

> Les 3 nouveaux UC (UC12-14) sont ajoutés en harmonisation avec le diagramme de cas d'utilisation. Les entités correspondantes existaient déjà dans le MCD.

### Impact des nouveaux UC sur le MCD

| Nouvel UC | Entité existante | Nouveau besoin | Ajustement MCD |
|-----------|------------------|----------------|----------------|
| UC12 | CAPTEUR | Création/suppression par Admin | Aucun (déjà lié à PARCELLE) |
| UC13 | ACTIONNEUR | Création/suppression par Admin | Aucun (déjà lié à PARCELLE) |
| UC14 | PARCELLE | Création par Agriculteur ET Admin | Aucun (déjà lié à UTILISATEUR) |

**Conclusion** : Le MCD n'a pas besoin d'être modifié. Les 10 entités et 13 relations couvrent déjà les besoins des 14 UC.

---

## ✅ Validation

Ce MCD a été conçu en respectant :
- Les règles de **gestion métier** du SAI
- Les **14 cas d'utilisation** et les **6 diagrammes de séquence** déjà modélisés
- Les **choix technologiques** (MQTT, FastAPI, PostgreSQL)

**Prochaine étape** : MLD (Modèle Logique de Données) — transformation des entités en tables relationnelles avec clés primaires et étrangères explicites.

---

*Document créé le 30/06/2026 — Projet SAI — Mis à jour le 20/07/2026 (harmonisation UC12-14)*
