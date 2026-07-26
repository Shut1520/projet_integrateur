# Progression — Projet SAI

## Légende
- ✅ Terminé
- 🔄 En cours
- ⬜ Non démarré

---

## Phase 1 — Conception UML & Merise ✅
| Livrable | Statut | Fichiers / Notes |
|----------|--------|------------------|
| Diagramme de cas d'utilisation | ✅ | 14 UC (inclus extensions : afficher message d'erreur, etc.) |
| Diagrammes de séquence | ✅ | 6 scénarios (irrigation auto, manuelle, alertes, auth, etc.) |
| Diagramme d'activité | ✅ | Version complète + 3 versions modulaires (init, boucle, extinction) |
| MCD | ✅ | 10 entités, cardinalités validées |
| MLD | ✅ | Tables relationnelles avec PK/FK |
| Diagramme de classe POO | ✅ | 10 classes SQLAlchemy avec attributs/méthodes |
| MPD | ✅ | Script SQL de création + modèles Python |

---

## Phase 2 — Base de Données ✅
| Livrable | Statut | Notes |
|----------|--------|-------|
| Modèles SQLAlchemy (10 tables) | ✅ | Utilisateur, Parcelle, Capteur, Mesure, Actionneur, Commande, Action, Alerte, Seuil, Token |
| Script init_db.py | ✅ | Crée la DB + user PostgreSQL, testé OK |
| Seed (données de test) | ✅ | 250+ lignes insérées via seed.py |
| Alembic migrations | ⬜ | Configuré plus tard si nécessaire |

---

## Phase 3 — Backend FastAPI ✅
| Livrable | Statut | Notes |
|----------|--------|-------|
| Schémas Pydantic (10 fichiers) | ✅ | Base, Create, Update, Response pour chaque entité |
| Routeurs API (11 fichiers) | ✅ | CRUD complet sur toutes les entités |
| Auth JWT (register/login/me) | ✅ | Route dédiée `/api/auth` |
| main.py + CORS | ✅ | Application montée, proxy Vite configuré |
| Middleware (rate limit, logging) | ⬜ | À faire |
| Services métier | ⬜ | À faire |
| Tests backend (pytest) | ⬜ | À faire |
| Alembic upgrade | ⬜ | À faire |

---

## Phase 4 — CLI Python ✅
| Livrable | Statut | Notes |
|----------|--------|-------|
| Structure argparse/click | ✅ | 8 commandes implémentées |
| Auth JWT via CLI | ✅ | Login, token stocké dans config.json |
| Commandes métier | ✅ | Mesures, actionneurs, alertes, parcelles, seuils, capteurs |
| Tests CLI | ✅ | 8/8 OK |

---

## Phase 5 — Frontend React ✅
| Livrable | Statut | Notes |
|----------|--------|-------|
| Setup Vite + React 19 + Tailwind 4 | ✅ | Build 12.9s, 0 vuln |
| Routing + AuthContext | ✅ | ProtectedRoute, JWT, localStorage |
| ThemeContext (clair/sombre) | ✅ | Dark mode figé, light mode refondu |
| 10 pages fonctionnelles | ✅ | Dashboard, Login, Register, Parcelles, Actionneurs, Seuils, Historique, Capteurs, Utilisateurs, Profil |
| API service + interceptors | ✅ | Axios, proxy `/api` |
| Design system light mode | ✅ | Charte exacte `#2E7D32`, `#E8F5E9`, `#1B5E20`, `#F5F7F2`. Bug `@custom-variant dark` Tailwind v4 corrigé |
| Design system dark mode | ✅ | Conservé strictement inchangé |
| Dashboard détails | ✅ | Bordure rouge alertes, icônes variées actionneurs, titre graphique, barres jauge améliorées |

---

## Phase 6 — Architecture réseau & déploiement ⬜
| Livrable | Statut |
|----------|--------|
| Diagramme de déploiement | ⬜ |
| Schéma d'architecture réseau | ⬜ |

---

## Phase 7 — Système embarqué & MQTT ⬜
| Livrable | Statut |
|----------|--------|
| Protocole MQTT (broker, topics) | ⬜ |
| Firmware ESP32 (capteurs + WiFi) | ⬜ |
| Intégration backend ↔ ESP32 | ⬜ |
