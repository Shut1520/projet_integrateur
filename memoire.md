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

## Points d'attention mémorisés
- **Auth** : JWT stocké dans `localStorage` (clé `sai_current_user_v1`). Interceptors Axios injectent le token.
- **Proxy** : Vite redirige `/api` → `localhost:8000`.
- **Rôles** : `agriculteur` et `admin`. L'admin gère les capteurs, utilisateurs, seuils, parcelles. L'agriculteur consulte et contrôle.
- **No mock data** : Toutes les données passent par le backend réel (plus de fallback localStorage).
- **Windows UNICODE** : pas d'émojis dans les prints console (cp1252).
- **Bcrypt** : incompatible paslib → backend utilise `werkzeug.security`.
- **npm overrides** : `react-router@^8.3.0` forcé pour patcher le CVE.

## Où nous en sommes (dernière action)
Phase 5 (Frontend) **TERMINÉE**.
- Design **light mode** refondu selon la charte exacte : Primary `#2E7D32`, Secondary `#E8F5E9`, Tertiary `#1B5E20`, Neutral `#F5F7F2`.
- Sidebar blanche, fond global `#F5F7F2`, cartes blanches avec ombres subtiles.
- Dashboard épurer : "Vue d'ensemble", cartes métriques avec barres colorées fines, graphique + alertes + actionneurs.
- **Dark mode conservé strictement inchangé**.
- Build Vite : 12.9s, 0 erreur, 0 vulnerability.

## Prochaines étapes (à venir)
1. Déploiement & architecture réseau (diagramme de déploiement, schéma réseau)
2. Communication ESP32 / MQTT
3. Middleware backend (rate limiting, CORS, logging)
4. Services métier backend
5. Alembic migrations
6. Tests backend (pytest)
