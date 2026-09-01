# Guide Utilisateur — CLI SAI (Système Agricole Intelligent)

Ce document détaille toutes les étapes d'utilisation de l'interface en ligne de commande (CLI) du projet SAI.

---

## Table des matières

1. [Prérequis et installation](#1-prérequis-et-installation)
2. [Connexion (login)](#2-connexion-login)
3. [Vérifier le statut de connexion](#3-vérifier-le-statut-de-connexion)
4. [Lister les capteurs](#4-lister-les-capteurs)
5. [Consulter les mesures d'un capteur](#5-consulter-les-mesures-dun-capteur)
6. [Lister les actionneurs](#6-lister-les-actionneurs)
7. [Envoyer une commande à un actionneur](#7-envoyer-une-commande-à-un-actionneur)
8. [Actions en lot (batch)](#8-actions-en-lot-batch)
9. [Consulter l'historique des commandes](#9-consulter-lhistorique-des-commandes)
10. [Gérer les alertes](#10-gérer-les-alertes)
11. [Gérer les seuils d'automatisation](#11-gérer-les-seuils-dautomatisation)
12. [Consulter le tableau de bord du système](#12-consulter-le-tableau-de-bord-du-système)
13. [Clé API (apikey)](#13-clé-api-apikey)
14. [Déconnexion (logout)](#14-déconnexion-logout)
15. [Erreurs courantes et dépannage](#15-erreurs-courantes-et-dépannage)

---

## 1. Prérequis et installation

### 1.1. Installer les dépendances

Le CLI nécessite **Python 3** et la bibliothèque `requests`. Installer les dépendances avec :

```bash
pip install -r requirements.txt
```

Le fichier `requirements.txt` contient :

```
requests>=2.31.0
```

### 1.2. Vérifier la configuration

Le fichier `config.json` contient l'URL de l'API, le token d'authentification et la clé API :

```json
{
    "api_url": "http://localhost:8000",
    "token": null,
    "cle_api": null
}
```

- **`api_url`** : Adresse du serveur FastAPI. Par défaut `http://localhost:8000`.
- **`token`** : Token JWT automatiquement géré lors de la connexion/déconnexion.
- **`cle_api`** : Clé API (`sk_sai_...`) envoyée dans l'en-tête `X-API-Key`, gérée par la commande `apikey` (voir section 13).

### 1.3. Vérifier que le serveur API est lancé

Avant d'utiliser le CLI, assurez-vous que le serveur FastAPI est démarré sur l'adresse configurée. Sans serveur, les commandes retourneront une erreur de connexion.

---

## 2. Connexion (login)

La connexion est **obligatoire** avant toute utilisation des fonctionnalités du CLI.

```bash
python cli.py login --email <email> --password <mot_de_passe>
```

**Exemple :**

```bash
python cli.py login --email admin@sai.com --password admin123
```

**Ce qui se passe :**
1. Le CLI envoie les identifiants à l'API (`POST /api/auth/login`).
2. L'API retourne un token JWT et les informations de l'utilisateur.
3. Le token est automatiquement sauvegardé dans `config.json`.
4. Un message de confirmation s'affiche avec le nom, le rôle et l'email de l'utilisateur connecté.

**Sortie attendue :**

```
Connexion en cours...
[OK] Connecte en tant que Admin SAI
     Role : admin
     Email : admin@sai.com
```

---

## 3. Vérifier le statut de connexion

Pour vérifier si vous êtes connecté et obtenir les informations de votre session :

```bash
python cli.py status
```

Avec vérification du token auprès du serveur :

```bash
python cli.py status --check
```

**Ce qui se passe :**
- Si connecté : affiche l'URL du serveur, le nom, l'email et le rôle de l'utilisateur.
- Si une clé API est configurée : affiche un préfixe masqué (`sk_sai_...` initiales).
- Si non connecté : affiche un message indiquant qu'aucune session n'est active.

**Sortie attendue (connecté, avec clé API) :**

```
[OK] Connecte a l'API
     URL : http://localhost:8000
     Utilisateur : Admin SAI
     Email : admin@sai.com
     Role : admin
     Cle API : sk_sai_5f8a... (configuree)
```

**Sortie attendue (non connecté) :**

```
[--] Non connecte
     Lancez : python cli.py login
```

---

## 4. Lister les capteurs

Affiche la liste de tous les capteurs enregistrés dans le système.

```bash
python cli.py capteurs
```

**Ce qui se passe :**
1. Le CLI interroge l'API (`GET /api/capteurs`).
2. Un tableau s'affiche avec pour chaque capteur : ID, Nom, GPIO, État, Parcelle et Protocole.

**Sortie attendue :**

```
Capteurs (3 trouves)
---------------------------------------------
ID   Nom          GPIO  Etat        Parcelle   Protocole
---------------------------------------------
1    DHT22        4     actif       1          wifi
2    SoilMoist    34    actif       1          analogique
3    BMP280       21    inactif     2          i2c
---------------------------------------------
```

---

## 5. Consulter les mesures d'un capteur

Affiche les dernières mesures enregistrées par un capteur donné.

```bash
python cli.py mesures <id_capteur> [--nb <nombre>]
```

**Paramètres :**
- `<id_capteur>` : ID du capteur (obligatoire).
- `--nb <nombre>` : Nombre de mesures à afficher. Par défaut : **10**.

**Exemples :**

```bash
python cli.py mesures 1          # 10 dernières mesures du capteur #1
python cli.py mesures 1 --nb 5   # 5 dernières mesures du capteur #1
python cli.py mesures 3 --nb 20  # 20 dernières mesures du capteur #3
```

**Ce qui se passe :**
1. Le CLI interroge l'API (`GET /api/mesures/dernieres/{id}?nb=N`).
2. Un tableau s'affiche avec : ID, Valeur, Unité, Source et Date/Heure de chaque mesure.

**Sortie attendue :**

```
Dernieres 5 mesures du capteur #1
------------------------------------------------------------
ID     Valeur       Unite    Source       Date
------------------------------------------------------------
42     23.5         C        esp32       2025-06-14 10:30:00
41     24.1         C        esp32       2025-06-14 10:25:00
40     22.8         C        esp32       2025-06-14 10:20:00
39     23.0         C        esp32       2025-06-14 10:15:00
38     24.5         C        esp32       2025-06-14 10:10:00
------------------------------------------------------------
```

---

## 6. Lister les actionneurs

Affiche la liste de tous les actionneurs enregistrés dans le système.

```bash
python cli.py actionneurs
```

**Ce qui se passe :**
1. Le CLI interroge l'API (`GET /api/actionneurs`).
2. Un tableau s'affiche avec : ID, Nom, GPIO, État et Parcelle de chaque actionneur.

**Sortie attendue :**

```
Actionneurs (2 trouves)
----------------------------------------------
ID   Nom            GPIO  Etat        Parcelle
----------------------------------------------
1    PompeEau       12    actif       1
2    VoletSud       14    inactif     2
----------------------------------------------
```

---

## 7. Envoyer une commande à un actionneur

Envoie un ordre (on/off) à un actionneur spécifique.

```bash
python cli.py commander <id_actionneur> --action on|off [--duree <secondes>] [--oui]
```

**Paramètres :**
- `<id_actionneur>` : ID de l'actionneur cible (obligatoire).
- `--action` : `on` pour activer, `off` pour désactiver (obligatoire).
- `--duree` : Durée en secondes de l'action (optionnel).
- `--oui` : Confirme les actions critiques sans prompt interactif (optionnel).

**Exemples :**

```bash
python cli.py commander 1 --action on              # Allumer l'actionneur #1
python cli.py commander 1 --action off             # Éteindre l'actionneur #1
python cli.py commander 1 --action on --duree 60   # Allumer pendant 60 secondes
python cli.py commander 1 --action on --duree 60 --oui   # Sans confirmation
python cli.py commander 2 --action on              # Allumer l'actionneur #2
```

**Vérifications automatiques (CDC 6.2.1 / 6.3) :**

1. **Pompe (irrigation)** : le CLI interroge le capteur `niveau_eau` de la parcelle. Niveau sous 15 % → irrigation **bloquée**, sauf si `--oui` est fourni (permet de forcer).
2. **Actionneurs critiques** (`pompe`, `ventilation`, `eclairage`) : confirmation interactive `[o/N]` demandée avant l'envoi, sauf avec `--oui`.

**Sortie attendue :**

```
[OK] Commande envoyee : on sur actionneur #1
     ID commande : 15
     Statut : envoyee
     Duree : 60 secondes
```

Toutes les exécutions sont **journalisées** dans `cli.log` (CDC 6.3).

---

## 8. Actions en lot (batch)

### 8.1. Arrosage (irrigation)

Lance une irrigation en vérifiant d'abord le niveau du réservoir (CDC 6.2.1 / F05).

```bash
python cli.py batch arrosage --actionneur <id> [--duree <secondes>] [--parcelle <id>] [--oui]
```

**Paramètres :**
- `--actionneur` : ID de la pompe (obligatoire).
- `--duree` : Durée de l'arrosage en secondes (optionnel, défaut illimité).
- `--parcelle` : ID de la parcelle pour localiser le capteur `niveau_eau` (optionnel, défaut : déduit de l'actionneur).
- `--oui` : Force l'arrosage sans confirmation, même si le niveau est bas.

**Ce qui se passe :**
1. Le CLI récupère la dernière mesure `niveau_eau` de la parcelle.
2. Si le niveau est **sous 15 %** : l'arrosage est **annulé**, sauf `--oui` (la décision est journalisée).
3. Si aucune mesure n'existe : l'arrosage est lancé avec un avertissement.
4. La commande est envoyée à l'API (`POST /api/commandes`), source `cli`.

**Sortie attendue :**

```
[INFO] Niveau reservoir : 45.0 %
[OK] Arrosage lance : pompe #1 - 60s
     ID commande : 22
     Statut : envoyee
```

### 8.2. Ventilation

Lance la ventilation après confirmation de l'action (CDC 6.2.2 / F05).

```bash
python cli.py batch ventilation --actionneur <id> [--duree <secondes>] [--oui]
```

**Exemple :**

```bash
python cli.py batch ventilation --actionneur 2 --duree 120 --oui
```

---

## 9. Consulter l'historique des commandes

Affiche les 20 dernières commandes envoyées dans le système.

```bash
python cli.py commandes
```

**Ce qui se passe :**
1. Le CLI interroge l'API (`GET /api/commandes`).
2. Un tableau s'affiche avec : ID, Type d'action, Source, Statut, Actionneur et Date.

**Sortie attendue :**

```
Commandes recentes (8 trouves)
----------------------------------------------------------------------
ID   Type         Source   Statut        Actionneur  Date
----------------------------------------------------------------------
15   on           cli      en_attente    1           2025-06-14 11:00:00
14   off          auto     execute       1           2025-06-14 10:55:00
13   on           cli      execute       2           2025-06-14 10:50:00
...
----------------------------------------------------------------------
```

---

## 10. Gérer les alertes

### 9.1. Lister les alertes

```bash
python cli.py alertes
```

Par défaut, affiche toutes les alertes.

**Filtres optionnels :**

```bash
python cli.py alertes --etat active            # Uniquement les alertes actives
python cli.py alertes --etat reconnue          # Uniquement les alertes reconnues
python cli.py alertes --etat resolue           # Uniquement les alertes résolues
python cli.py alertes --parcelle 1             # Uniquement les alertes de la parcelle #1
python cli.py alertes --etat active --parcelle 2  # Combinaison de filtres
```

**Sortie attendue :**

```
Alertes (2 trouvees)
---------------------------------------------------------------------------
ID   Type                 Severite   Etat         Parcelle  Date
---------------------------------------------------------------------------
5    humidite_basse        critique   active       1         2025-06-14 09:00
     `-- Humidite sol < 20% depuis 2h
3    temperature_haute     moyenne    reconnue     2         2025-06-13 14:30
     `-- Temperature > 40C
---------------------------------------------------------------------------
```

### 9.2. Reconnaître une alerte

Marque une alerte comme « reconnue » (vous en avez pris connaissance).

```bash
python cli.py alertes reconnaitre <id_alerte>
```

**Exemple :**

```bash
python cli.py alertes reconnaitre 5
```

**Sortie attendue :**

```
[OK] Alerte #5 marquee comme reconnue.
```

### 9.3. Résoudre une alerte

Marque une alerte comme « résolue » (le problème est traité).

```bash
python cli.py alertes resoudre <id_alerte>
```

**Exemple :**

```bash
python cli.py alertes resoudre 5
```

**Sortie attendue :**

```
[OK] Alerte #5 resolue.
```

---

## 11. Gérer les seuils d'automatisation

Les seuils définissent les plages de valeurs acceptées pour chaque type de mesure et chaque parcelle. Lorsqu'une mesure dépasse ces seuils, une alerte est automatiquement générée.

### 10.1. Lister les seuils configurés

```bash
python cli.py seuils
```

**Filtre optionnel par parcelle :**

```bash
python cli.py seuils --parcelle 1    # Seuils de la parcelle #1
```

**Sortie attendue :**

```
Seuils (3 trouves)
-----------------------------------------------------------------
ID   Type             Min        Max        Unite    Parcelle
-----------------------------------------------------------------
1    humidite_sol     30.0       80.0       %        1
2    temperature      5.0        40.0       C        1
3    ph_sol           5.5        7.5        ph       2
-----------------------------------------------------------------
```

### 10.2. Configurer un nouveau seuil

```bash
python cli.py seuils configurer --type <type_mesure> --min <valeur_min> --max <valeur_max> --unite <unite> --parcelle <id_parcelle>
```

**Paramètres (tous obligatoires) :**
- `--type` : Type de mesure (ex : `humidite_sol`, `temperature`, `ph_sol`).
- `--min` : Seuil minimum acceptable.
- `--max` : Seuil maximum acceptable.
- `--unite` : Unité de mesure (ex : `%`, `C`, `ph`, `ppm`).
- `--parcelle` : ID de la parcelle concernée.

**Exemple :**

```bash
python cli.py seuils configurer --type humidite_sol --min 30 --max 80 --unite % --parcelle 1
```

**Ce qui se passe :**
1. Le CLI récupère le profil utilisateur connecté pour associer le seuil.
2. Le seuil est envoyé à l'API (`POST /api/seuils`).
3. Un message de confirmation s'affiche avec l'ID du seuil créé.

**Sortie attendue :**

```
[OK] Seuil configure : humidite_sol [30.0 - 80.0] %
     Parcelle #1
     ID seuil : 4
```

---

## 12. Consulter le tableau de bord du système

Affiche une vue d'ensemble du système avec les statistiques principales.

```bash
python cli.py statut
```

**Ce qui se passe :**
1. Le CLI récupère les capteurs, actionneurs, alertes actives et parcelles depuis l'API.
2. Un tableau de bord formaté s'affiche.

**Sortie attendue :**

```
=============================================
  🌿 TABLEAU DE BORD SAI - SYSTEME AGRICOLE INTELLIGENT
=============================================

  📦 Parcelles      : 3
  📡 Capteurs       : 5/6 actifs
  ⚙️  Actionneurs   : 2/3 actifs
  🔔 Alertes        : 2 non resolues

  ⚠️  ATTENTION : 2 alerte(s) necessite(nt) votre attention !

=============================================
```

---

## 13. Clé API (apikey)

Le CLI peut s'authentifier auprès des **endpoints IoT** (équivalent ESP32) grâce à une **clé API** (`sk_sai_...`, table `tokens`), envoyée dans l'en-tête `X-API-Key`. Utile lorsque le CLI doit jouer le rôle du microcontrôleur (création de mesures, récupération de commandes en attente...).

### 13.1. Enregistrer une clé API

```bash
python cli.py apikey sk_sai_5f8a2c1b9d3e4f0a...
```

**Ce qui se passe :**
1. La clé est sauvegardée dans `config.json` (`cle_api`).
2. Un accusé de réception masqué s'affiche : `[OK] Cle API enregistree : sk_sai_5f8a...`.

### 13.2. Effacer la clé API

```bash
python cli.py apikey --effacer
```

> La clé API **n'est jamais affichée en clair** : `status` n'affiche que le préfixe (`sk_sai_...` initiales).

---

## 14. Déconnexion (logout)

Déconnecte l'utilisateur et supprime le token de session.

```bash
python cli.py logout
```

**Ce qui se passe :**
1. Le token JWT est supprimé du fichier `config.json`.
2. Un message de confirmation s'affiche.

**Sortie attendue :**

```
[OK] Deconnecte.
```

> **Note :** Après déconnexion, toute tentative d'accès aux ressources protégées retournera une erreur `401 Non autorise`.

---

## 15. Erreurs courantes et dépannage

| Erreur | Cause | Solution |
|--------|-------|----------|
| `[ERR] Impossible de se connecter a http://localhost:8000` | Le serveur API n'est pas lancé ou l'URL est incorrecte | Vérifiez que le serveur FastAPI est démarré. Vérifiez `config.json`. |
| `[ERR] 401 Non autorise` | Token expiré ou invalide | Reconnectez-vous avec `python cli.py login`. |
| `[ERR] 404 : Ressource introuvable` | ID inexistant (capteur, actionneur, alerte...) | Vérifiez l'ID avec les commandes de listing (`capteurs`, `actionneurs`, etc.). |
| `[ERR] 422 : Donnees invalides` | Paramètres manquants ou format incorrect | Vérifiez les arguments de la commande. |
| `[ERR] Reponse invalide du serveur` | Le serveur n'a pas retourné de token | Vérifiez vos identifiants (email/mot de passe). |
| `Aucun capteur trouve` / `Aucun actionneur trouve` | Aucun équipement enregistré dans la base | Ajoutez des capteurs/actionneurs via l'API ou l'interface web. |
| `[WARN] Token invalide ou expire` (lors de `status`) | La session a expiré | Reconnectez-vous avec `python cli.py login`. |

---

## Récapitulatif rapide des commandes

| Commande | Description | Obligatoire : connexion |
|----------|-------------|:-----------------------:|
| `login --email ... --password ...` | Connexion à l'API | Non |
| `logout` | Déconnexion | Non |
| `status` | Vérifier l'état de la session | Non |
| `status --check` | Vérifier le token auprès du serveur | Non |
| `apikey <sk_sai_...>` | Enregistrer la clé API (`X-API-Key`) | Non |
| `apikey --effacer` | Effacer la clé API | Non |
| `capteurs` | Lister les capteurs | Oui |
| `mesures <id> [--nb N]` | Afficher les mesures d'un capteur | Oui |
| `actionneurs` | Lister les actionneurs | Oui |
| `commander <id> --action on/off [--duree S] [--oui]` | Envoyer un ordre à un actionneur | Oui |
| `batch arrosage --actionneur <id> [--duree S] [--parcelle P] [--oui]` | Irrigation avec vérification du réservoir | Oui |
| `batch ventilation --actionneur <id> [--duree S] [--oui]` | Ventilation en lot | Oui |
| `commandes` | Historique des commandes | Oui |
| `alertes [--etat ...] [--parcelle ...]` | Lister les alertes (avec filtres) | Oui |
| `alertes reconnaitre <id>` | Marquer une alerte comme reconnue | Oui |
| `alertes resoudre <id>` | Marquer une alerte comme résolue | Oui |
| `seuils [--parcelle ...]` | Lister les seuils configurés | Oui |
| `seuils configurer --type ... --min ... --max ... --unite ... --parcelle ...` | Configurer un seuil | Oui |
| `statut` | Tableau de bord du système | Oui |
