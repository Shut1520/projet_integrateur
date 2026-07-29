# Memoire — Projet SAI (Systeme Agricole Intelligent)

## Identite du projet
- **Nom** : SAI — Smart Agri System
- **Objectif** : Superviser, automatiser et controler a distance des parcelles agricoles via capteurs (DHT22, YL-69, BH1750, SEN0159, niveau d'eau) et actionneurs (pompe, ventilation, eclairage).
- **Cible** : Agriculteurs et Administrateurs (pas de role Technicien dans l'app web).

## Mon role
Je suis le **professeur & architecte logiciel** de l'etudiant. Je l'accompagne etape par etape dans la conception numerique complete : UML, Merise, base de donnees, backend, CLI, frontend, et preparation de la communication avec le systeme embarque (ESP32).

## Stack technique
| Couche | Technologie |
|--------|-------------|
| Frontend | React 19 + Vite 6 + Tailwind CSS 4 + Chart.js 4 + Axios + Lucide React |
| Backend | FastAPI + SQLAlchemy (ORM) + PostgreSQL + Pydantic + JWT |
| CLI | Python + Click + Requests + JWT |
| Embarque (futur) | ESP32 + MQTT + Capteurs/Actionneurs |

## Architecture dossiers cles
```
projet_integrateur/
├── backend/          # FastAPI, modeles, schemas, routes, services
├── cli/              # CLI Python (8 commandes)
├── frontend/         # React 19 (10 pages)
└── Diagrammes/       # UML, Merise, classes, sequences, activite
```

## Points d'attention memorises (bugs corriges)
- **Champ Actionneur** : le champ API est `etat` ("actif"/"inactif"), PAS `statut` ("EN MARCHE"). Voir `backend/models/actionneur.py`.
- **Champ Alerte** : le champ API est `etat` ("active"/"reconnue"/"resolue") et `type` (alias de `type_alerte`). PAS `titre` ni `resolu` ni `timestamp` (c'est `date_debut`). Voir `backend/schemas/alerte.py`.
- **Champ Mesure** : le schema ne renvoie que `id_capteur`, PAS `capteur_nom`. Pour filtrer par nom de capteur, il faut d'abord charger les capteurs et construire une map `nom->id`. Voir `backend/schemas/mesure.py`.
- **API Alertes** : la methode de resolution est `resoudreAlerte(id)`, PAS `dismissAlerte()`.
- **Auth** : JWT stocke dans `localStorage` (cle `sai_current_user_v1`). Interceptors Axios injectent le token.
- **Proxy** : Vite redirige `/api` -> `localhost:8000`.
- **Roles** : `agriculteur` et `admin`. L'admin gere les capteurs, utilisateurs, seuils, parcelles. L'agriculteur controle et consulte.
- **No mock data** : Toutes les donnees passent par le backend reel (plus de fallback localStorage).
- **Windows UNICODE** : pas d'emojis dans les prints console (cp1252).
- **Bcrypt** : incompatible paslib -> backend utilise `werkzeug.security`.
- **npm overrides** : `react-router@^8.3.0` force pour patcher le CVE.
- **Tailwind v4 dark mode** : sans `@custom-variant dark (&:where(.dark, .dark *))` dans `index.css`, les variantes `dark:` ne reagissent qu'a la media query `prefers-color-scheme`, PAS a la classe `.dark`. Le toggle sombre/clair ne fonctionne donc pas sans cette ligne.
- **Toggle actionneurs** : `commanderActionneur()` cree une Commande mais ne met PAS a jour l'etat de l'actionneur dans la BDD. Il faut aussi appeler `updateActionneur(id, {etat: nextEtat})` AVANT la commande. Voir `Dashboard.jsx:L163-180`.

## Oui nous en sommes (derniere action)
Phase 5 (Frontend) **TERMINEE**.
- Design **light mode** refondu selon la charte exacte : Primary `#2E7D32`, Secondary `#E8F5E9`, Tertiary `#1B5E20`, Neutral `#F5F7F2`.
- Sidebar blanche, fond global `#F5F7F2`, cartes blanches avec ombres subtiles.
- Dashboard epure : "Vue d'ensemble", cartes metriques avec barres colorees fines, graphique + alertes + actionneurs.
- **Dark mode conserve strictement inchange**.
- Bug Tailwind v4 corrige (manquait `@custom-variant dark`).
- Dashboard details : bordure rouge alertes, icones actionneurs variees (Droplets, Wind, Lightbulb), titre "Temperature (24h)", barre jauge `h-1.5` avec fond gris pale.
- Dashboard interactif : KPIs cliquables -> redirigent vers `/history?capteur=xxx` (resolution nom->id cote frontend).
- Toggle actionneurs fonctionnel : double appel API — `updateActionneur(id, {etat})` pour mettre a jour l'etat dans la BDD + `commanderActionneur(id, action)` pour enregistrer la commande (tracabilite / ESP32 futur). Voir `Dashboard.jsx:L163-180`.
- ConfirmModal custom : composant reutilisable (`components/ui/ConfirmModal.jsx`), utilise dans 5 pages CRUD (Actionneurs, Capteurs, Parcelles, Users, Profile). Remplace `window.confirm()` par une modale stylisee (AlertTriangle + 2 boutons).
- Fix `#f8faf5` : toutes les occurrences hardcoded remplacees par `#F5F7F2` (charte officielle) dans toutes les pages.
- Filtres CRUD implementes : barre de filtres unifiee (Filter icon + selects + Search) sur Parcelles (type_culture + proprietaire + recherche), Actionneurs (parcelle + etat + recherche) et Capteurs (parcelle + etat + recherche). Bug filtre actionneurs corrige : comparaison `String()` pour eviter `number !== string`.
- Fix toggle Actionneurs page : meme double appel API que Dashboard (`updateActionneur` + `commanderActionneur`).
- Detail modals : click sur carte Capteur/Actionneur → modal avec tous les champs (nom, GPIO, protocole, etat, reference, parcelle, dates). Bouton Affecter pour reaffecter a une autre parcelle (`updateCapteur/updateActionneur(id, {id_parcelle})`).
- Detail Parcelle : click sur carte → vue detaillee avec infos generales + liste capteurs attaches + liste actionneurs attaches + bouton Reaffecter pour deplacer un composant vers une autre parcelle.
- Compteurs sur cartes Parcelles : badge affichant le nombre de capteurs et actionneurs attaches.
- Donnees jauges corrigees : fetch capteurs d'abord, map nom->id, puis filtre mesures par `id_capteur`.
- TopBar corrigee : filtres alertes (`etat !== 'resolue'`), affichage `a.type` + `a.date_debut`, API `resoudreAlerte`.
- Build Vite : 17.15s, 0 erreur, 0 vulnerability.

## Prochaines etapes (a venir)
1. Deploiement & architecture reseau (diagramme de deploiement, schema reseau)
2. Communication ESP32 / MQTT
3. Middleware backend (rate limiting, CORS, logging)
4. Services metier backend
5. Alembic migrations
6. Tests backend (pytest)
