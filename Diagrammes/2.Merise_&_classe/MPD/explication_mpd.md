# MPD — Modèle Physique de Données (SAI)

## 📖 Qu'est-ce que le MPD ?

Le MPD est la **dernière étape de la méthode Merise**. Il transforme le MLD en un **script SQL exécutable** qui crée la base de données.

> **MCD** = Quoi stocker ? (entités + relations)  
> **MLD** = Comment stocker ? (tables + types + FK)  
> **MPD** = Créer la BD ! (script SQL prêt à exécuter)

---

## 🔄 Les nouveautés du MPD par rapport au MLD

| Élément MLD | Élément MPD (SQL) | Explication |
|-------------|------------------|-------------|
| FK | `REFERENCES table(colonne) ON DELETE ...` | Précise ce qui arrive si la référence est supprimée |
| PRIMARY KEY | `SERIAL PRIMARY KEY` | Auto-incrémenté |
| CHECK | `CHECK (col IN ('a', 'b'))` | Contrainte inline dans la table |
| — | `CREATE INDEX ...` | Index pour accélérer les requêtes |
| — | `CREATE OR REPLACE FUNCTION ...` | Fonction trigger pour `updated_at` |
| — | `COMMENT ON TABLE ...` | Documentation directement dans la BD |

---

## 🗑️ Les 3 comportements `ON DELETE`

C'est la grande nouveauté du MPD : que faire quand on supprime une ligne référencée ?

| Comportement | Signification | Exemple dans notre projet |
|-------------|---------------|--------------------------|
| `CASCADE` | Supprime les enfants en même temps | Si on supprime une **parcelle**, ses **capteurs** sont supprimés (composition ◆) |
| `RESTRICT` | Bloque la suppression si des enfants existent | Si un **utilisateur** a des **parcelles**, on ne peut pas le supprimer |
| `SET NULL` | Met la FK à NULL si le parent est supprimé | Si un **utilisateur** est supprimé, ses **commandes** gardent l'historique avec `id_utilisateur = NULL` |

### Tableau récapitulatif

| Table | FK vers | ON DELETE | Raison |
|-------|---------|-----------|--------|
| `parcelles` | `utilisateurs` | `RESTRICT` | On ne supprime pas un utilisateur qui a des parcelles |
| `capteurs` | `parcelles` | `CASCADE` | Composition : si parcelle supprimée, capteurs aussi |
| `actionneurs` | `parcelles` | `CASCADE` | Composition |
| `mesures` | `capteurs` | `CASCADE` | Composition |
| `commandes` | `utilisateurs` | `SET NULL` | Historique conservé même si l'utilisateur est supprimé |
| `commandes` | `actionneurs` | `RESTRICT` | On ne supprime pas un actionneur qui a des commandes |
| `actions` | `commandes` | `CASCADE` | Composition |
| `alertes` | `parcelles` | `CASCADE` | Composition |
| `alertes` | `mesures` | `SET NULL` | L'alerte reste, mais sans lien vers la mesure supprimée |
| `alertes` | `actions` | `SET NULL` | L'alerte reste, mais sans lien vers l'action supprimée |
| `seuils` | `utilisateurs` | `RESTRICT` | On ne supprime pas un utilisateur qui a configuré des seuils |
| `seuils` | `parcelles` | `CASCADE` | Composition |
| `tokens` | `utilisateurs` | `CASCADE` | Composition |

---

## 📊 Index créés

| Table | Colonne indexée | Pourquoi |
|-------|----------------|----------|
| `parcelles` | `id_utilisateur` | Chercher les parcelles d'un utilisateur |
| `capteurs` | `id_parcelle` | Chercher les capteurs d'une parcelle |
| `actionneurs` | `id_parcelle` | Chercher les actionneurs d'une parcelle |
| `mesures` | `id_capteur` | Chercher les mesures d'un capteur |
| `mesures` | `timestamp DESC` | Trier par date (dashboard, historique) |
| `commandes` | `id_utilisateur`, `id_actionneur`, `timestamp DESC` | Requêtes fréquentes |
| `actions` | `id_commande` | Relation 1:1 |
| `alertes` | `id_parcelle`, `id_mesure`, `id_action` | FK |
| `alertes` | `severite`, `etat` | Filtrer les alertes actives/critiques |
| `seuils` | `id_utilisateur`, `id_parcelle` | FK |
| `tokens` | `id_utilisateur`, `cle_api` | Authentification rapide |

---

## 🎯 Trigger `updated_at` automatique

Le MPD ajoute une fonction trigger qui met automatiquement à jour `updated_at` à chaque modification :

```sql
CREATE OR REPLACE FUNCTION mettre_a_jour_horodatage()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

Cette fonction est appelée automatiquement avant chaque `UPDATE` sur les tables qui en ont besoin.

---

## ✅ Ordre de création (respect des dépendances)

```
 1  utilisateurs  (aucune FK)
 2  parcelles     (FK → utilisateurs)
 3  capteurs      (FK → parcelles)
 4  actionneurs   (FK → parcelles)
 5  mesures       (FK → capteurs)
 6  commandes     (FK → utilisateurs NULL, actionneurs)
 7  actions       (FK → commandes, UNIQUE)
 8  alertes       (FK → parcelles, mesures NULL, actions NULL)
 9  seuils        (FK → utilisateurs, parcelles)
10  tokens        (FK → utilisateurs)
```

---

## 🔗 Traçabilité UC ↔ MPD

Le script SQL du MPD couvre l'ensemble des 14 UC. Les UC12-14 n'ont nécessité aucune modification des tables SQL.

| UC | Intitulé | Tables SQL concernées | Contrainte MPD clé |
|----|----------|----------------------|-------------------|
| UC12 | Gérer les capteurs | `capteurs` | `FK → parcelles ON DELETE CASCADE` |
| UC13 | Gérer les actionneurs | `actionneurs` | `FK → parcelles ON DELETE CASCADE` |
| UC14 | Gérer les parcelles | `parcelles` | `FK → utilisateurs ON DELETE RESTRICT` |

> Les contraintes `ON DELETE` assurent l'intégrité : supprimer une parcelle supprime ses capteurs/actionneurs (CASCADE), mais on ne peut pas supprimer un utilisateur qui a des parcelles (RESTRICT).

## 📁 Fichier

- **Script SQL** : `mpd.sql` (exécutable directement dans PostgreSQL)

---

*Document créé le 05/07/2026 — Projet SAI — MPD terminé — Mis à jour 20/07/2026 (harmonisation UC12-14)*
