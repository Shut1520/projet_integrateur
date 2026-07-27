# Memoire — Projet SAI (Système Agricole Intelligent)

## Identité du projet
- **Nom** : SAI — Smart Agri System
- **Objectif** : Superviser, automatiser et contrôler à distance des parcelles agricoles via capteurs (DHT22, YL-69, BH1750, SEN0159, niveau d'eau) et actionneurs (pompe, ventilation, éclairage).
- **Cible** : Agriculteurs et Administrateurs (pas de rôle Technicien dans l'app web).

## Mon rôle
Je suis le **professeur & architecte logiciel** de l'étudiant. Je l'accompagne étape par étape dans la conception numérique complète : UML, Merise, base de données, backend, CLI, frontend, et préparation de la communication avec le système embarqué (ESP32).

## Stack technique
| Couche | Technologie |
|--------|-------------|
| Frontend | React 19 + Vite 6 + Tailwind CSS 4 + Chart.js 4 + Axios + Lucide React |
| Backend | FastAPI + SQLAlchemy (ORM) + PostgreSQL + Pydantic + JWT |
| CLI | Python + Click + Requests + JWT |
| Embarqué (futur) | ESP32 + MQTT + Capteurs/Actionneurs |

## Architecture dossiers clés
```
projet_integrateur/
├── backend/          # FastAPI, modèles, schémas, routes, services
├── cli/              # CLI Python (8 commandes)
├── frontend/         # React 19 (10 pages)
└── Diagrammes/       # UML, Merise, classes, séquences, activité
```

## Points d'attention mémorisés (bugs corrigés)
- **Champ Actionneur** : le champ API est `etat` ("actif"/"inactif"), PAS `statut` ("EN MARCHE"). Voir `backend/models/actionneur.py`.
- **Champ Alerte** : le champ API est `etat` ("active"/"reconnue"/"resolue") et `type` (alias de `type_alerte`). PAS `titre` ni `resolu` ni `timestamp` (c'est `date_debut`). Voir `backend/schemas/alerte.py`.
- **Champ Mesure** : le schéma ne renvoie que `id_capteur`, PAS `capteur_nom`. Pour filtrer par nom de capteur, il faut d'abord charger les capteurs et construire une map `nom→id`. Voir `backend/schemas/mesure.py`.
- **API Alertes** : la méthode de résolution est `resoudreAlerte(id)`, PAS `dismissAlerte()`.
- **Auth** : JWT stocké dans `localStorage` (clé `sai_current_user_v1`). Interceptors Axios injectent le token.
- **Proxy** : Vite redirige `/api` → `localhost:8000`.
- **Rôles** : `agriculteur` et `admin`. L'admin gère les capteurs, utilisateurs, seuils, parcelles. L'agriculteur consulte et contrôle.
- **No mock data** : Toutes les données passent par le backend réel (plus de fallback localStorage).
- **Windows UNICODE** : pas d'émojis dans les prints console (cp1252).
- **Bcrypt** : incompatible paslib → backend utilise `werkzeug.security`.
- **npm overrides** : `react-router@^8.3.0` forcé pour patcher le CVE.
- **Tailwind v4 dark mode** : sans `@custom-variant dark (&:where(.dark, .dark *))` dans `index.css`, les variantes `dark:` ne réagissent qu'à la media query `prefers-color-scheme`, PAS à la classe `.dark`. Le toggle sombre/clair ne fonctionne donc pas sans cette ligne.

## Où nous en sommes (dernière action)
Phase 5 (Frontend) **TERMINÉE**.
- Design **light mode** refondu selon la charte exacte : Primary `#2E7D32`, Secondary `#E8F5E9`, Tertiary `#1B5E20`, Neutral `#F5F7F2`.
- Sidebar blanche, fond global `#F5F7F2`, cartes blanches avec ombres subtiles.
- Dashboard épurer : "Vue d'ensemble", cartes métriques avec barres colorées fines, graphique + alertes + actionneurs.
- **Dark mode conservé strictement inchangé**.
- Bug Tailwind v4 corrigé (manquait `@custom-variant dark`).
- Dashboard détails : bordure rouge alertes, icônes actionneurs variées (Droplets, Wind, Lightbulb), titre "Température (24h)", barre jauge `h-1.5` avec fond gris pâle.
- Dashboard interactif : KPIs cliquables → redirigent vers `/history?capteur=xxx` (résolution nom→id côté frontend).
- Toggle actionneurs fonctionnel : `<button>` toggle vert/gris, commande API `on`/`off` via `commanderActionneur`.
- Données jauges corrigées : fetch capteurs d'abord, map nom→id, puis filtre mesures par `id_capteur`.
- TopBar corrigée : filtres alertes (`etat !== 'resolue'`), affichage `a.type` + `a.date_debut`, API `resoudreAlerte`.
- Build Vite : 17.15s, 0 erreur, 0 vulnerability.

## Prochaines étapes (à venir)
1. Déploiement & architecture réseau (diagramme de déploiement, schéma réseau)
2. Communication ESP32 / MQTT
3. Middleware backend (rate limiting, CORS, logging)
4. Services métier backend
5. Alembic migrations
6. Tests backend (pytest)
