# Référence des commandes — CLI SAI

Toutes les commandes disponibles dans l'interface en ligne de commande du Système Agricole Intelligent.

---

## Table des matières

1. [Connexion et session](#1-connexion-et-session)
2. [Capteurs](#2-capteurs)
3. [Mesures](#3-mesures)
4. [Actionneurs](#4-actionneurs)
5. [Commandes (ordonner)](#5-commandes-ordonner)
6. [Historique des commandes](#6-historique-des-commandes)
7. [Alertes](#7-alertes)
8. [Seuils](#8-seuils)
9. [Tableau de bord](#9-tableau-de-bord)

---

## 1. Connexion et session

### `login`

Authentifie l'utilisateur auprès de l'API et sauvegarde le token JWT.

```bash
python cli.py login --email <email> --password <mot_de_passe>
```

| Paramètre | Obligatoire | Description |
|-----------|:-----------:|-------------|
| `--email` | Oui | Adresse email de l'utilisateur |
| `--password` | Oui | Mot de passe |

**Exemple :**

```bash
python cli.py login --email admin@sai.com --password admin123
```

---

### `logout`

Déconnecte l'utilisateur et supprime le token de session.

```bash
python cli.py logout
```

Aucun paramètre.

---

### `status`

Affiche l'état de la connexion actuelle.

```bash
python cli.py status [--check]
```

| Paramètre | Obligatoire | Description |
|-----------|:-----------:|-------------|
| `--check` | Non | Vérifie le token auprès du serveur |

**Exemples :**

```bash
python cli.py status            # Vérification locale
python cli.py status --check    # Vérification auprès du serveur
```

---

## 2. Capteurs

### `capteurs`

Liste tous les capteurs enregistrés dans le système.

```bash
python cli.py capteurs
```

Aucun paramètre.

**Colonnes affichées :** ID, Nom, GPIO, État, Parcelle, Protocole

---

## 3. Mesures

### `mesures`

Affiche les dernières mesures d'un capteur spécifique.

```bash
python cli.py mesures <id_capteur> [--nb <nombre>]
```

| Paramètre | Obligatoire | Description | Défaut |
|-----------|:-----------:|-------------|--------|
| `capteur_id` | Oui | ID du capteur | — |
| `--nb` | Non | Nombre de mesures à afficher | 10 |

**Exemples :**

```bash
python cli.py mesures 1              # 10 dernières mesures du capteur #1
python cli.py mesures 1 --nb 5       # 5 dernières mesures
python cli.py mesures 3 --nb 20      # 20 dernières mesures du capteur #3
```

**Colonnes affichées :** ID, Valeur, Unité, Source, Date

---

## 4. Actionneurs

### `actionneurs`

Liste tous les actionneurs enregistrés dans le système.

```bash
python cli.py actionneurs
```

Aucun paramètre.

**Colonnes affichées :** ID, Nom, GPIO, État, Parcelle

---

## 5. Commandes (ordonner)

### `commander`

Envoie un ordre (on/off) à un actionneur.

```bash
python cli.py commander <id_actionneur> --action <on|off> [--duree <secondes>]
```

| Paramètre | Obligatoire | Description | Défaut |
|-----------|:-----------:|-------------|--------|
| `actionneur_id` | Oui | ID de l'actionneur cible | — |
| `--action` | Oui | `on` (activer) ou `off` (désactiver) | — |
| `--duree` | Non | Durée en secondes de l'action | illimité |

**Exemples :**

```bash
python cli.py commander 1 --action on              # Allumer l'actionneur #1
python cli.py commander 1 --action off             # Éteindre l'actionneur #1
python cli.py commander 1 --action on --duree 60   # Allumer pendant 60 secondes
python cli.py commander 2 --action on              # Allumer l'actionneur #2
python cli.py commander 2 --action off --duree 120 # Éteindre après 120 secondes
```

**Source automatiquement définie :** `cli`

---

## 6. Historique des commandes

### `commandes`

Affiche les 20 dernières commandes envoyées dans le système.

```bash
python cli.py commandes
```

Aucun paramètre.

**Colonnes affichées :** ID, Type, Source, Statut, Actionneur, Date

---

## 7. Alertes

### `alertes` — Lister

Affiche les alertes avec des filtres optionnels.

```bash
python cli.py alertes [--etat <etat>] [--parcelle <id>]
```

| Paramètre | Obligatoire | Description |
|-----------|:-----------:|-------------|
| `--etat` | Non | Filtrer par état : `active`, `reconnue`, `resolue` |
| `--parcelle` | Non | Filtrer par ID de parcelle |

**Exemples :**

```bash
python cli.py alertes                            # Toutes les alertes
python cli.py alertes --etat active              # Uniquement les actives
python cli.py alertes --etat reconnue            # Uniquement les reconnues
python cli.py alertes --parcelle 1               # Alertes de la parcelle #1
python cli.py alertes --etat active --parcelle 2 # Combinaison de filtres
```

**Colonnes affichées :** ID, Type, Sévérité, État, Parcelle, Date

---

### `alertes reconnaitre`

Marque une alerte comme « reconnue » (prise en connaissance).

```bash
python cli.py alertes reconnaitre <id_alerte>
```

| Paramètre | Obligatoire | Description |
|-----------|:-----------:|-------------|
| `id` | Oui | ID de l'alerte à reconnaître |

**Exemple :**

```bash
python cli.py alertes reconnaitre 5
```

---

### `alertes resoudre`

Marque une alerte comme « résolue » (problème traité).

```bash
python cli.py alertes resoudre <id_alerte>
```

| Paramètre | Obligatoire | Description |
|-----------|:-----------:|-------------|
| `id` | Oui | ID de l'alerte à résoudre |

**Exemple :**

```bash
python cli.py alertes resoudre 5
```

---

## 8. Seuils

### `seuils` — Lister

Affiche les seuils d'automatisation configurés.

```bash
python cli.py seuils [--parcelle <id>]
```

| Paramètre | Obligatoire | Description |
|-----------|:-----------:|-------------|
| `--parcelle` | Non | Filtrer par ID de parcelle |

**Exemples :**

```bash
python cli.py seuils                # Tous les seuils
python cli.py seuils --parcelle 1   # Seuils de la parcelle #1
```

**Colonnes affichées :** ID, Type, Min, Max, Unité, Parcelle

---

### `seuils configurer`

Crée ou met à jour un seuil d'automatisation pour une parcelle.

```bash
python cli.py seuils configurer --type <type> --min <min> --max <max> --unite <unite> --parcelle <id>
```

| Paramètre | Obligatoire | Description |
|-----------|:-----------:|-------------|
| `--type` | Oui | Type de mesure : `humidite_sol`, `temperature`, `ph_sol`, etc. |
| `--min` | Oui | Seuil minimum |
| `--max` | Oui | Seuil maximum |
| `--unite` | Oui | Unité : `%`, `C`, `ph`, `ppm`, etc. |
| `--parcelle` | Oui | ID de la parcelle |

**Exemple :**

```bash
python cli.py seuils configurer --type humidite_sol --min 30 --max 80 --unite % --parcelle 1
```

---

## 9. Tableau de bord

### `statut`

Affiche une vue d'ensemble du système (parcelles, capteurs, actionneurs, alertes actives).

```bash
python cli.py statut
```

Aucun paramètre.

---

## Récapitulatif rapide

| Commande | Description |
|----------|-------------|
| `login --email ... --password ...` | Connexion |
| `logout` | Déconnexion |
| `status [--check]` | État de la session |
| `capteurs` | Lister les capteurs |
| `mesures <id> [--nb N]` | Mesures d'un capteur |
| `actionneurs` | Lister les actionneurs |
| `commander <id> --action on/off [--duree S]` | Envoyer un ordre |
| `commandes` | Historique des commandes |
| `alertes [--etat ...] [--parcelle ...]` | Lister les alertes |
| `alertes reconnaitre <id>` | Reconnaître une alerte |
| `alertes resoudre <id>` | Résoudre une alerte |
| `seuils [--parcelle ...]` | Lister les seuils |
| `seuils configurer --type ... --min ... --max ... --unite ... --parcelle ...` | Configurer un seuil |
| `statut` | Tableau de bord |

---

## Codes de retour

| Code | Signification |
|------|---------------|
| `[OK]` | Opération réussie |
| `[ERR]` | Erreur (connexion, authentification, données invalides...) |
| `[--]` | Information (ex : non connecté) |
| `[WARN]` | Avertissement (ex : token expiré) |
