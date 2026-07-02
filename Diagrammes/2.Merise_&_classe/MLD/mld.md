# MLD — Modèle Logique de Données (SAI)

> Document de référence pour la structure de la base de données PostgreSQL.
> Transformé depuis le MCD selon la méthode Merise (Règle 1:N → clé étrangère).

---

## 📋 Liste des 10 tables

| # | Table | Entité MCD | Nombre de colonnes | FK |
|---|-------|-----------|-------------------|----|
| 1 | `utilisateurs` | UTILISATEUR | 7 | 0 |
| 2 | `parcelles` | PARCELLE | 5 | 1 (utilisateurs) |
| 3 | `capteurs` | CAPTEUR | 7 | 1 (parcelles) |
| 4 | `mesures` | MESURE | 5 | 1 (capteurs) |
| 5 | `actionneurs` | ACTIONNEUR | 6 | 1 (parcelles) |
| 6 | `commandes` | COMMANDE | 8 | 2 (utilisateurs, actionneurs) |
| 7 | `actions` | ACTION | 8 | 1 (commandes) |
| 8 | `alertes` | ALERTE | 11 | 3 (parcelles, mesures, actions) |
| 9 | `seuils` | SEUIL | 7 | 2 (utilisateurs, parcelles) |
| 10 | `tokens` | TOKEN | 8 | 1 (utilisateurs) |

---

## 🏗️ Définition des tables

### 1. Table `utilisateurs`

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Identifiant auto-incrémenté |
| `nom` | VARCHAR(100) | NOT NULL | Nom complet |
| `email` | VARCHAR(150) | UNIQUE, NOT NULL | Identifiant de connexion |
| `password_hash` | VARCHAR(255) | NOT NULL | Hash bcrypt du mot de passe |
| `role` | VARCHAR(20) | NOT NULL, DEFAULT 'agriculteur', CHECK (role IN ('agriculteur', 'admin')) | Rôle utilisateur |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Date de création |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Date de dernière mise à jour |

---

### 2. Table `parcelles`

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Identifiant auto-incrémenté |
| `nom` | VARCHAR(100) | NOT NULL | Nom de la parcelle |
| `localisation` | VARCHAR(255) | | Description de l'emplacement |
| `id_utilisateur` | INTEGER | NOT NULL, FK → utilisateurs(id) | Gestionnaire de la parcelle |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Date de création |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Date de dernière mise à jour |

---

### 3. Table `capteurs`

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Identifiant auto-incrémenté |
| `nom` | VARCHAR(30) | NOT NULL | Ex: 'dht22', 'yl-69', 'bh1750' |
| `reference` | VARCHAR(50) | | Référence fabricant |
| `gpio` | INTEGER | NOT NULL | Broche ESP32 |
| `protocole` | VARCHAR(10) | NOT NULL, CHECK (protocole IN ('digital', 'analog', 'i2c')) | Protocole de communication |
| `etat` | VARCHAR(15) | NOT NULL, DEFAULT 'actif', CHECK (etat IN ('actif', 'inactif', 'defaillant')) | État du capteur |
| `id_parcelle` | INTEGER | NOT NULL, FK → parcelles(id) | Parcelle d'appartenance |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Date d'ajout |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Date de dernière mise à jour |

---

### 4. Table `mesures`

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Identifiant auto-incrémenté |
| `valeur` | DECIMAL(10,2) | NOT NULL | Valeur mesurée |
| `unite` | VARCHAR(10) | NOT NULL | Unité (%, °C, ppm, lux) |
| `source` | VARCHAR(20) | CHECK (source IN ('esp32', 'manuel', 'simulation')) | Origine de la mesure |
| `timestamp` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Horodatage de la lecture |
| `id_capteur` | INTEGER | NOT NULL, FK → capteurs(id) | Capteur qui a prélevé |

> **Note** : Pas de `created_at`/`updated_at` ici car la table aura un très gros volume (1 mesure toutes les 10s par capteur). Le `timestamp` suffit.

---

### 5. Table `actionneurs`

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Identifiant auto-incrémenté |
| `nom` | VARCHAR(20) | NOT NULL | Ex: 'pompe', 'ventilation', 'eclairage' |
| `reference` | VARCHAR(50) | | Référence fabricant |
| `gpio` | INTEGER | NOT NULL | Broche ESP32 |
| `etat` | VARCHAR(10) | NOT NULL, DEFAULT 'inactif', CHECK (etat IN ('actif', 'inactif')) | État actuel |
| `id_parcelle` | INTEGER | NOT NULL, FK → parcelles(id) | Parcelle d'appartenance |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Date d'ajout |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Date de dernière mise à jour |

---

### 6. Table `commandes`

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Identifiant auto-incrémenté |
| `type_action` | VARCHAR(20) | NOT NULL, CHECK (type_action IN ('on', 'off', 'programmer')) | Type de commande |
| `valeur_parametre` | VARCHAR(50) | | Durée en secondes, etc. |
| `source` | VARCHAR(20) | NOT NULL, CHECK (source IN ('web', 'cli', 'auto')) | Origine de la commande |
| `timestamp` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Date d'envoi |
| `statut` | VARCHAR(15) | NOT NULL, DEFAULT 'envoyee', CHECK (statut IN ('envoyee', 'recue', 'executee', 'echouee')) | Statut d'exécution |
| `id_utilisateur` | INTEGER | **NULLABLE**, FK → utilisateurs(id) | Qui a émis la commande (NULL si source = 'auto') |
| `id_actionneur` | INTEGER | NOT NULL, FK → actionneurs(id) | Actionneur ciblé |

---

### 7. Table `actions`

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Identifiant auto-incrémenté |
| `date_debut` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Début de l'exécution |
| `date_fin` | TIMESTAMP | | Fin de l'exécution (NULL tant qu'en cours) |
| `duree` | INTEGER | | Durée en secondes (calculé à la fin) |
| `resultat` | TEXT | | Message de résultat |
| `details` | TEXT | | Infos complémentaires (JSON) |
| `statut` | VARCHAR(15) | NOT NULL, DEFAULT 'en_cours', CHECK (statut IN ('en_cours', 'termine', 'echouee')) | État de l'action |
| `id_commande` | INTEGER | NOT NULL, **UNIQUE**, FK → commandes(id) | Commande qui a provoqué l'action |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Date de création |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Date de dernière mise à jour |

> **UNIQUE sur `id_commande`** : Garantit qu'une commande ne provoque qu'une seule action (relation 1:1).

---

### 8. Table `alertes`

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Identifiant auto-incrémenté |
| `type` | VARCHAR(30) | NOT NULL | Ex: 'co2_eleve', 'temp_haute', 'reservoir_vide' |
| `valeur` | DECIMAL(10,2) | | Valeur qui a déclenché l'alerte |
| `seuil` | DECIMAL(10,2) | | Seuil dépassé |
| `severite` | VARCHAR(10) | NOT NULL, CHECK (severite IN ('basse', 'haute', 'critique')) | Niveau de gravité |
| `message` | TEXT | NOT NULL | Message pour le dashboard |
| `etat` | VARCHAR(15) | NOT NULL, DEFAULT 'active', CHECK (etat IN ('active', 'reconnue', 'resolue')) | État de l'alerte |
| `date_debut` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Début de l'alerte |
| `date_fin` | TIMESTAMP | | Résolution (NULL tant qu'active) |
| `id_parcelle` | INTEGER | NOT NULL, FK → parcelles(id) | Parcelle concernée |
| `id_mesure` | INTEGER | **NULLABLE**, FK → mesures(id) | Mesure qui a déclenché (0 ou 1) |
| `id_action` | INTEGER | **NULLABLE**, FK → actions(id) | Action qui a généré (0 ou 1) |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Date de création |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Date de dernière mise à jour |

**Contraintes supplémentaires :**
```sql
CONSTRAINT chk_source_alerte CHECK (id_mesure IS NOT NULL OR id_action IS NOT NULL)
```
> Garantit qu'une alerte a **au moins une source** (mesure OU action).

---

### 9. Table `seuils`

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Identifiant auto-incrémenté |
| `type_mesure` | VARCHAR(20) | NOT NULL | Ex: 'humidite_sol', 'temperature', 'co2' |
| `valeur_min` | DECIMAL(10,2) | NOT NULL | Seuil bas |
| `valeur_max` | DECIMAL(10,2) | NOT NULL | Seuil haut |
| `unite` | VARCHAR(10) | NOT NULL | Unité du seuil |
| `id_utilisateur` | INTEGER | NOT NULL, FK → utilisateurs(id) | Qui a configuré le seuil |
| `id_parcelle` | INTEGER | NOT NULL, FK → parcelles(id) | Parcelle concernée |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Date de création |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Date de dernière mise à jour |

---

### 10. Table `tokens`

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Identifiant auto-incrémenté |
| `cle_api` | VARCHAR(255) | UNIQUE, NOT NULL | Clé API (sk_sai_abc123...) |
| `nom` | VARCHAR(50) | NOT NULL | Nom pour identification ("Ma clé PC") |
| `actif` | BOOLEAN | NOT NULL, DEFAULT TRUE | Permet de révoquer la clé |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Date de génération |
| `expires_at` | TIMESTAMP | | Date d'expiration (NULL = pas d'expiration) |
| `last_used_at` | TIMESTAMP | | Dernière utilisation |
| `id_utilisateur` | INTEGER | NOT NULL, FK → utilisateurs(id) | Propriétaire de la clé |

---

## 🗺️ Schéma des relations (FK)

```
utilisateurs (1)
    │
    ├─── (N) parcelles.id_utilisateur
    │         │
    │         ├─── (N) capteurs.id_parcelle
    │         ├─── (N) actionneurs.id_parcelle
    │         ├─── (N) seuils.id_parcelle
    │         └─── (N) alertes.id_parcelle
    │
    ├─── (N) commandes.id_utilisateur (NULLABLE)
    ├─── (N) seuils.id_utilisateur
    └─── (N) tokens.id_utilisateur

capteurs (1)
    └─── (N) mesures.id_capteur
              └─── (0..1) alertes.id_mesure (NULLABLE)

actionneurs (1)
    └─── (N) commandes.id_actionneur
              └─── (0..1) actions.id_commande (UNIQUE)
                    └─── (0..1) alertes.id_action (NULLABLE)

CHECK alertes : id_mesure IS NOT NULL OR id_action IS NOT NULL
```

---

## 📐 Résumé des contraintes CHECK

| Table | Colonne | Valeurs autorisées |
|-------|---------|-------------------|
| `utilisateurs` | `role` | 'agriculteur', 'admin' |
| `capteurs` | `protocole` | 'digital', 'analog', 'i2c' |
| `capteurs` | `etat` | 'actif', 'inactif', 'defaillant' |
| `mesures` | `source` | 'esp32', 'manuel', 'simulation' |
| `actionneurs` | `etat` | 'actif', 'inactif' |
| `commandes` | `type_action` | 'on', 'off', 'programmer' |
| `commandes` | `source` | 'web', 'cli', 'auto' |
| `commandes` | `statut` | 'envoyee', 'recue', 'executee', 'echouee' |
| `actions` | `statut` | 'en_cours', 'termine', 'echouee' |
| `alertes` | `severite` | 'basse', 'haute', 'critique' |
| `alertes` | `etat` | 'active', 'reconnue', 'resolue' |
| `alertes` | *(global)* | `id_mesure IS NOT NULL OR id_action IS NOT NULL` |

---

*Document MLD — Projet SAI — Terminé le 02/07/2026*
