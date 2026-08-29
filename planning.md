# Planning d'exécution — Projet SAI

**Échéance** : 1 semaine  
**Dernière mise à jour** : 2026-08-19 02:30

---

## Légende

| Statut | Signification |
|--------|---------------|
| ⬜ | Non démarré |
| 🔄 | En cours |
| ✅ | Terminé |
| ⚠️ | Problème / à revoir |

---

## Jour 1-2 — Phase 6 : Diagramme de déploiement UML

| # | Tâche | Statut | Fichiers |
|---|-------|--------|----------|
| 1.1 | Diagramme de déploiement UML (composants → nœuds physiques) | ✅ | `Diagrammes/3.Deploiement/deploiement_local.md`, `deploiement_production.md` |
| 1.2 | Schéma d'architecture réseau (IP, ports, protocoles, flux) | ✅ | `Diagrammes/4.Architecture_reseau/architecture_reseau_local.md`, `architecture_reseau_production.md`, `explication_reseau.md` |
| 1.3 | Explication des choix (TLS, QoS, Docker) | ✅ | `Diagrammes/3.Deploiement/explication_deploiement.md` |

---

## Jour 3 — Backend Python 3.12 + fix frontend

| # | Tâche | Statut | Fichiers |
|---|-------|--------|----------|
| 2.1 | Migration Python 3.12 : `database.py` → `DeclarativeBase` (SQLAlchemy 2.0) | ✅ | `backend/database.py` |
| 2.2 | Fix `Query.get()` → `db.get()` dans 11 fichiers routes | ✅ | `backend/routes/*.py` |
| 2.3 | Fix `datetime.utcnow()` → `datetime.now(timezone.utc)` | ✅ | `backend/models/token.py` |
| 2.4 | Fix Pydantic schemas : `class Config` → `ConfigDict` (10 fichiers) | ✅ | `backend/schemas/*.py` |
| 2.5 | Fix `seed.py` : `bulk_save_objects()` → `add_all()` | ✅ | `backend/seed.py` |
| 2.6 | Créer `backend/requirements.txt` avec dépendances pinées | ✅ | `backend/requirements.txt` |
| 2.7 | Installer `psycopg2-binary` (precompilé pour Python 3.12) | ✅ | pip |
| 2.8 | Test uvicorn avec Python 3.12 : démarrage OK | ✅ | `backend/main.py` |
| 2.9 | Middleware JWT : `Depends(get_utilisateur_connecte)` sur les routes protégées | ✅ | `backend/auth.py` + 11 fichiers routes |
| 2.10 | Fix scroll sidebar : bug scroll simultané sidebar + contenu (`todo.md:36`) | ✅ | `frontend/src/components/layout/`, `frontend/src/index.css` |

---

## Jour 4 — Backend : Couche Services

| # | Tâche | Statut | Fichiers |
|---|-------|--------|----------|
| 3.1 | Créer `backend/services/automatisation_service.py` | ✅ | `backend/services/automatisation_service.py` |
| 3.2 | Créer `backend/services/commande_service.py` | ✅ | `backend/services/commande_service.py` |
| 3.3 | Créer `backend/services/auth_service.py` | ✅ | `backend/services/auth_service.py` |
| 3.4 | Refactorer les routes pour appeler les services | ✅ | `backend/routes/auth.py`, `backend/routes/commandes.py` |

---

## Jour 5 — Backend : Tests + Alembic

| # | Tâche | Statut | Fichiers |
|---|-------|--------|----------|
| 4.1 | Initialiser Alembic (`alembic init`) | ✅ | `backend/alembic/`, `backend/alembic.ini` |
| 4.2 | Configurer env.py pour SQLAlchemy 2.0 + autogenerate | ✅ | `backend/alembic/env.py` |
| 4.3 | Générer baseline migration (10 tables) + appliquer | ✅ | `backend/alembic/versions/02b2bd3ff25a_init.py` |
| 4.4 | Tests pytest CRUD (10 entités, 88 tests) | ✅ | `backend/tests/` |

---

## Jour 6-7 — Phase 7 : IoT / MQTT (conception, sans hardware)

| # | Tâche | Statut | Fichiers |
|---|-------|--------|----------|
| 5.1 | Protocole MQTT (broker, topics, QoS, TLS) | ⬜ | `Iot/mqtt_protocol.md` |
| 5.2 | Architecture firmware ESP32 (pseudo-code, GPIO, publish/subscribe) | ⬜ | `Iot/firmware_architecture.md` |
| 5.3 | Mode dégradé (automatisation locale sans serveur) | ⬜ | `Iot/mode_degrade.md` |
| 5.4 | Plan d'intégration ESP32 → MQTT → Backend → BD | ⬜ | `Iot/integration_plan.md` |

---

## Résumé de progression

| Phase | Tâches totales | Terminées | En cours | Restantes |
|-------|----------------|-----------|----------|-----------|
| Phase 6 (Déploiement) | 3 | 3 | 0 | 0 |
| Backend (Jour 3-5) | 18 | 18 | 0 | 0 |
| Phase 7 (IoT) | 4 | 0 | 0 | 4 |
| **TOTAL** | **25** | **21** | **0** | **4** |

---

*Mise à jour automatique à chaque tâche complétée.*
