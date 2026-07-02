# Explication du MLD — Modèle Logique de Données (SAI)

## 📖 Qu'est-ce que le MLD ?

Le MLD est la **deuxième étape de la méthode Merise**. Il transforme le MCD (vue conceptuelle, entités et relations) en **tables relationnelles** concrètes prêtes à être implémentées dans une base de données SQL (PostgreSQL pour notre projet).

> **MCD** = "Quoi stocker ?" → Entités, attributs, relations
> **MLD** = "Comment le stocker ?" → Tables, colonnes, types SQL, clés primaires/étrangères

---

## 🔄 Les 3 règles de transformation MCD → MLD

### Règle 1 : Entité → Table
Chaque entité du MCD devient une **table**. Chaque attribut devient une **colonne** avec un **type SQL précis** (SERIAL, VARCHAR, DECIMAL, TIMESTAMP, BOOLEAN, TEXT).

```
MCD :  UTILISATEUR { nom, email, password_hash, role }
MLD :  Table "utilisateurs" (id SERIAL PK, nom VARCHAR, email VARCHAR UNIQUE, ...)
```

### Règle 2 : Relation 1:N → Clé étrangère
On ajoute la clé primaire du côté "1" comme **clé étrangère** (FOREIGN KEY) dans la table du côté "N".

```
MCD :  PARCELLE (1,1) — contient — (0,N) CAPTEUR
MLD :  Table "capteurs" ajoute colonne "id_parcelle INTEGER FK → parcelles(id)"
```

### Règle 3 : Relation N:N → Table de liaison (non utilisée ici)
On crée une **troisième table** avec les deux clés étrangères. Notre MCD n'a pas de relation N:N pure (on les a toutes décomposées en deux 1:N).

---

## 🧩 Pourquoi SERIAL et pas INT ?

En PostgreSQL, `SERIAL` est un type spécial qui crée automatiquement un **auto-incrément** (chaque nouvelle ligne reçoit un ID unique sans qu'on ait à le fournir).

```sql
id SERIAL PRIMARY KEY
-- Équivalent à :
id INTEGER NOT NULL DEFAULT nextval('table_id_seq') PRIMARY KEY
```

---

## 🗝️ Clés étrangères : comment ça marche ?

Une **clé étrangère (FK)** est un lien entre deux tables. Elle garantit l'**intégrité référentielle** : on ne peut pas insérer une ligne avec un `id_utilisateur` qui n'existe pas dans la table `utilisateurs`.

### Exemple

```sql
-- Table parcelles
id_parcelle INTEGER NOT NULL REFERENCES utilisateurs(id)
```

Si on essaie :
```sql
INSERT INTO parcelles (nom, id_utilisateur) VALUES ('Serre A', 999);
-- ERREUR : l'utilisateur 999 n'existe pas !
```

PostgreSQL **bloque** l'insertion. C'est ce qu'on appelle l'intégrité référentielle.

---

## 🔒 Pourquoi des contraintes CHECK ?

Les contraintes `CHECK` empêchent d'insérer des valeurs invalides. Elles sont une **couche de sécurité** au niveau de la base de données.

### Exemple

```sql
role VARCHAR(20) CHECK (role IN ('agriculteur', 'admin'))
```

Si on essaie :
```sql
INSERT INTO utilisateurs (nom, email, role) VALUES ('Jean', 'jean@mail.com', 'superadmin');
-- ERREUR : 'superadmin' n'est pas dans la liste !
```

Cela évite que le backend ait à faire toutes les validations : la BD rejette déjà les données invalides.

---

## 🎯 Décisions importantes du MLD

### 1. `commandes.id_utilisateur` est NULLABLE

**Pourquoi ?** Quand la source est `'auto'` (automatisation déclenchée par le timer), il n'y a pas d'utilisateur derrière. La commande est générée par le système.

```
source = 'web'    → id_utilisateur = rempli (l'utilisateur connecté)
source = 'cli'    → id_utilisateur = rempli (l'utilisateur qui tape la commande)
source = 'auto'   → id_utilisateur = NULL (timer, pas d'humain)
```

### 2. Relation COMMANDE → ACTION est 1:1 (UNIQUE)

Une commande ne provoque qu'**une seule action**. On ajoute `UNIQUE` sur `actions.id_commande` pour empêcher qu'une même commande soit liée à deux actions.

```
commande #42 → action #87  ✅
commande #42 → action #88  ❌ Bloqué par UNIQUE
```

### 3. `alertes.id_mesure` et `alertes.id_action` sont tous deux NULLABLE

Une alerte a **une seule source** :
- Soit une **mesure** anormale (ex: CO₂ > 1000 ppm) → `id_mesure` rempli, `id_action` NULL
- Soit une **action** échouée (ex: pompe bloquée) → `id_action` rempli, `id_mesure` NULL

La contrainte CHECK garantit qu'**au moins l'un des deux** est rempli :

```sql
CHECK (id_mesure IS NOT NULL OR id_action IS NOT NULL)
```

Si on essaie d'insérer une alerte sans source :
```sql
INSERT INTO alertes (type, message, id_parcelle) VALUES ('test', 'alerte sans source', 1);
-- ERREUR : ni id_mesure ni id_action ne sont remplis !
```

### 4. `created_at` / `updated_at` sur les tables principales

Ces colonnes servent à **tracer** quand un enregistrement a été créé et modifié. Utile pour :
- Auditer qui a modifié quoi
- Afficher "Dernière modification il y a 2 jours" dans le frontend
- Déboguer (savoir quand un seuil a été changé)

**Exception** : La table `mesures` n'a pas `created_at`/`updated_at` car elle aura un **très gros volume** (1 mesure toutes les 10s × 5 capteurs = ~43 200 lignes/jour). Le `timestamp` suffit comme horodatage.

---

## 📊 Graphique des dépendances

```
                    ┌──────────────┐
                    │ utilisateurs │  ← Table racine (pas de FK)
                    └──────┬───────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
   ┌──────────┐    ┌────────────┐    ┌─────────┐
   │ parcelles│    │ commandes* │    │  tokens │
   └────┬─────┘    └─────┬──────┘    └─────────┘
        │                │
   ┌────┼────┐           │
   │    │    │           │
   ▼    ▼    ▼           ▼
capteurs seuils    actionneurs
   │                  │
   ▼                  │
mesures               │
   │                  │
   └────────┐    ┌────┘
            ▼    ▼
         ┌──────────┐
         │ alertes  │ ← Reçoit des FK de 3 tables
         └──────────┘
            ▲
            │
         ┌──────┐
         │actions│
         └──────┘
```

### Ordre de création recommandé

Pour respecter les FK, il faut créer les tables **dans cet ordre** :

```
1. utilisateurs      (pas de FK)
2. parcelles         (FK → utilisateurs)
3. capteurs          (FK → parcelles)
4. actionneurs       (FK → parcelles)
5. mesures           (FK → capteurs)
6. commandes         (FK → utilisateurs, actionneurs)
7. actions           (FK → commandes)
8. alertes           (FK → parcelles, mesures, actions)
9. seuils            (FK → utilisateurs, parcelles)
10. tokens           (FK → utilisateurs)
```

---

## 📝 Conventions de nommage

| Élément | Convention | Exemple |
|---------|-----------|---------|
| Table | Minuscule, pluriel, snake_case | `utilisateurs`, `parcelles` |
| Colonne | Minuscule, snake_case | `id_utilisateur`, `password_hash` |
| Clé primaire | `id` | `id` (toujours SERIAL) |
| Clé étrangère | `id_` + nom de la table référencée | `id_parcelle` → `parcelles.id` |
| Timestamp | `created_at`, `updated_at`, `timestamp` | Convention PostgreSQL |

---

*Document MLD expliqué — Projet SAI — 02/07/2026*
