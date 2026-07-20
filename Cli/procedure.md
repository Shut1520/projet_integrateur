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
8. [Consulter l'historique des commandes](#8-consulter-lhistorique-des-commandes)
9. [Gérer les alertes](#9-gérer-les-alertes)
10. [Gérer les seuils d'automatisation](#10-gérer-les-seuils-dautomatisation)
11. [Consulter le tableau de bord du système](#11-consulter-le-tableau-de-bord-du-système)
12. [Déconnexion (logout)](#12-déconnexion-logout)
13. [Erreurs courantes et dépannage](#13-erreurs-courantes-et-dépannage)

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

Le fichier `config.json` contient l'URL de l'API et le token d'authentification :

```json
{
    "api_url": "http://localhost:8000",
    "token": null
}
```

- **`api_url`** : Adresse du serveur FastAPI. Par défaut `http://localhost:8000`.
- **`token`** : Token JWT automatiquement géré lors de la connexion/déconnexion.

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
- Si non connecté : affiche un message indiquant qu'aucune session n'est active.

**Sortie attendue (connecté) :**

```
[OK] Connecte a l'API
     URL : http://localhost:8000
     Utilisateur : Admin SAI
     Email : admin@sai.com
     Role : admin
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
python cli.py commander <id_actionneur> --action on|off [--duree <secondes>]
```

**Paramètres :**
- `<id_actionneur>` : ID de l'actionneur cible (obligatoire).
- `--action` : `on` pour activer, `off` pour désactiver (obligatoire).
- `--duree` : Durée en secondes de l'action (optionnel).

**Exemples :**

```bash
python cli.py commander 1 --action on              # Allumer l'actionneur #1
python cli.py commander 1 --action off             # Éteindre l'actionneur #1
python cli.py commander 1 --action on --duree 60   # Allumer pendant 60 secondes
python cli.py commander 2 --action on              # Allumer l'actionneur #2
```

**Ce qui se passe :**
1. Le CLI envoie la commande à l'API (`POST /api/commandes`).
2. La source est automatiquement définie sur `"cli"`.
3. Un message de confirmation s'affiche avec l'ID de la commande et son statut.

**Sortie attendue :**

```
[OK] Commande envoyee : on sur actionneur #1
     ID commande : 15
     Statut : en_attente
     Duree : 60 secondes
```

---

## 8. Consulter l'historique des commandes

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

## 9. Gérer les alertes

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

## 10. Gérer les seuils d'automatisation

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

## 11. Consulter le tableau de bord du système

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

## 12. Déconnexion (logout)

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

## 13. Erreurs courantes et dépannage

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
| `capteurs` | Lister les capteurs | Oui |
| `mesures <id> [--nb N]` | Afficher les mesures d'un capteur | Oui |
| `actionneurs` | Lister les actionneurs | Oui |
| `commander <id> --action on/off [--duree S]` | Envoyer un ordre à un actionneur | Oui |
| `commandes` | Historique des commandes | Oui |
| `alertes [--etat ...] [--parcelle ...]` | Lister les alertes (avec filtres) | Oui |
| `alertes reconnaitre <id>` | Marquer une alerte comme reconnue | Oui |
| `alertes resoudre <id>` | Marquer une alerte comme résolue | Oui |
| `seuils [--parcelle ...]` | Lister les seuils configurés | Oui |
| `seuils configurer --type ... --min ... --max ... --unite ... --parcelle ...` | Configurer un seuil | Oui |
| `statut` | Tableau de bord du système | Oui |
