# Progression — Projet SAI

## Legende
- Termine
- En cours
- Non demarre

---

## Phase 1 — Conception UML & Merise ✅
| Livrable | Statut | Fichiers / Notes |
|----------|--------|------------------|
| Diagramme de cas d'utilisation | ✅ | 14 UC (inclus extensions : afficher message d'erreur, etc.) |
| Diagrammes de sequence | ✅ | 6 scenarios (irrigation auto, manuelle, alertes, auth, etc.) |
| Diagramme d'activite | ✅ | Version complete + 3 versions modulaires (init, boucle, extinction) |
| MCD | ✅ | 10 entites, cardinalites validees |
| MLD | ✅ | Tables relationnelles avec PK/FK |
| Diagramme de classe POO | ✅ | 10 classes SQLAlchemy avec attributs/methodes |
| MPD | ✅ | Script SQL de creation + modeles Python |

---

## Phase 2 — Base de Donnees ✅
| Livrable | Statut | Notes |
|----------|--------|-------|
| Modeles SQLAlchemy (10 tables) | ✅ | Utilisateur, Parcelle, Capteur, Mesure, Actionneur, Commande, Action, Alerte, Seuil, Token |
| Script init_db.py | ✅ | Cree la DB + user PostgreSQL, teste OK |
| Seed (donnees de test) | ✅ | 250+ lignes inserees via seed.py |
| Alembic migrations | ⬜ | Configure plus tard si necessaire |

---

## Phase 3 — Backend FastAPI ✅
| Livrable | Statut | Notes |
|----------|--------|-------|
| Schemas Pydantic (10 fichiers) | ✅ | Base, Create, Update, Response pour chaque entite |
| Routeurs API (11 fichiers) | ✅ | CRUD complet sur toutes les entites |
| Auth JWT (register/login/me) | ✅ | Route dediee `/api/auth` |
| main.py + CORS | ✅ | Application montee, proxy Vite configure |
| Middleware (rate limit, logging) | ⬜ | A faire |
| Services metier | ⬜ | A faire |
| Tests backend (pytest) | ⬜ | A faire |
| Alembic upgrade | ⬜ | A faire |

---

## Phase 4 — CLI Python ✅
| Livrable | Statut | Notes |
|----------|--------|-------|
| Structure argparse/click | ✅ | 8 commandes implementees |
| Auth JWT via CLI | ✅ | Login, token stocke dans config.json |
| Commandes metier | ✅ | Mesures, actionneurs, alertes, parcelles, seuils, capteurs |
| Tests CLI | ✅ | 8/8 OK |

---

## Phase 5 — Frontend React ✅
| Livrable | Statut | Notes |
|----------|--------|-------|
| Setup Vite + React 19 + Tailwind 4 | ✅ | Build 12.9s, 0 vuln |
| Routing + AuthContext | ✅ | ProtectedRoute, JWT, localStorage |
| ThemeContext (clair/sombre) | ✅ | Dark mode fige, light mode refondu |
| 10 pages fonctionnelles | ✅ | Dashboard, Login, Register, Parcelles, Actionneurs, Seuils, Historique, Capteurs, Utilisateurs, Profil |
| API service + interceptors | ✅ | Axios, proxy `/api` |
| Design system light mode | ✅ | Charte exacte `#2E7D32`, `#E8F5E9`, `#1B5E20`, `#F5F7F2`. Bug `@custom-variant dark` Tailwind v4 corrige |
| Design system dark mode | ✅ | Conserve strictement inchange |
| Dashboard details | ✅ | Bordure rouge alertes, icones actionneurs variees, titre graphique, barres jauge ameliorees |
| KPIs interactives | ✅ | Clic sur KPI -> navigation `/history?capteur=xxx`, filtre auto cote History (`useSearchParams`) |
| Toggle actionneurs | ✅ | Double appel API : `updateActionneur(id, {etat})` + `commanderActionneur(id, action)`. Voir `Dashboard.jsx:L163-180` |
| Cohérence API frontend/backend | ✅ | Champs corriges : `a.type` (pas `a.titre`), `a.etat` (pas `a.resolu`), `m.id_capteur` (pas `m.capteur_nom`) |
| Modales de confirmation | ✅ | `window.confirm()` remplace par `ConfirmModal` custom (`components/ui/ConfirmModal.jsx`) dans 5 pages (Actionneurs, Capteurs, Parcelles, Users, Profile) |
| Fix couleurs hardcoded | ✅ | Toutes les occurrences `#f8faf5` remplacees par `#F5F7F2` dans toutes les pages |
| Filtres CRUD (Parcelles, Actionneurs, Capteurs) | ✅ | Barre de filtres unifiee : recherche texte + selects (parcelle, etat, type_culture, proprietaire). Voir `Parcelles.jsx`, `Actionneurs.jsx`, `Capteurs.jsx` |
| Fix toggle Actionneurs page | ✅ | Meme double appel API que Dashboard : `updateActionneur` + `commanderActionneur`. Fix bug filtre parcelle (string vs number) avec `String()` |
| Detail modal (Capteurs, Actionneurs) | ✅ | Click sur carte → modal detail avec tous les champs + dates + reaffectation a une autre parcelle |
| Detail modal Parcelles | ✅ | Click sur carte → vue detaillee avec infos parcelle + liste capteurs/actionneurs attaches + reaffectation |
| Affectation capteurs/actionneurs | ✅ | Selecteur de parcelle dans le detail modal + bouton Affecter, utilise `updateCapteur/updateActionneur(id, {id_parcelle})` |

#### Phase 5b — Refonte design Light Mode Dashboard (TERMINÉE ✅)
- [x] **KPIs interactives** — Clic sur KPI → navigation `/history?capteur=xxx`. Voir `Dashboard.jsx:L262-297` (GaugeCard onClick) + `History.jsx:L54-78` (useSearchParams + match capteur par nom).
- [x] **Toggle interrupteur contrôle rapide** — Double appel API : `updateActionneur(id, {etat})` + `commanderActionneur(id, action)`. Voir `Dashboard.jsx:L163-180` (handleToggleActuator).
- [x] **ConfirmModal custom** — `window.confirm()` remplacé par `ConfirmModal` dans 5 pages. Voir `components/ui/ConfirmModal.jsx` + usages dans `Actionneurs.jsx`, `Capteurs.jsx`, `Parcelles.jsx`, `Users.jsx`, `Profile.jsx`.
- [x] **Filtres CRUD (Parcelles, Actionneurs, Capteurs)** — Barre de filtres unifiée : recherche + selects. `Parcelles.jsx:L268-277`, `Actionneurs.jsx:L219-230`, `Capteurs.jsx:L163-172`.
- [x] **Détail modals (Parcelles, Capteurs, Actionneurs)** — Click carte → modal info + grille dates + réaffectation parcelle. Voir les sections `Modal Detail` dans chaque fichier.
- [x] **Affectation capteurs/actionneurs aux parcelles** — Sélecteur parcelle dans le détail modal → `updateCapteur/updateActionneur(id, {id_parcelle})`. Voir `Parcelles.jsx:L212-236`, `Capteurs.jsx:L145-156`, `Actionneurs.jsx:L207-217`.

---

## Phase 6 — Architecture reseau & deploiement ⬜
| Livrable | Statut |
|----------|--------|
| Diagramme de deploiement | ⬜ |
| Schema d'architecture reseau | ⬜ |

---

## Phase 7 — Systeme embarque & MQTT ⬜
| Livrable | Statut |
|----------|--------|
| Protocole MQTT (broker, topics) | ⬜ |
| Firmware ESP32 (capteurs + WiFi) | ⬜ |
| Integration backend ↔ ESP32 | ⬜ |
