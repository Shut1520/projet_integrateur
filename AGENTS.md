# AGENTS.md — SAI (Systeme Agricole Intelligent)

Academic project (end-of-year integrator). Three active sub-projects plus an empty IoT placeholder.

## contrainte 

always discuss in french

## Structure

- `frontend/` — React 19 + Vite 6 + Tailwind CSS 4
- `backend/` — FastAPI + SQLAlchemy + PostgreSQL
- `Cli/` — Python CLI (argparse + requests), talks to backend API
- `Iot/` — Placeholder (no code yet)
- `Diagrammes/` — UML, Merise, déploiement et architecture réseau :
  - `1.UML/` — Use case, séquence, activité
  - `2.Merise_&_classe/` — MCD, MLD, MPD, classes POO
  - `3.Deploiement/` — Diagrammes de déploiement (local + production)
  - `4.Architecture_reseau/` — Architecture réseau (local + production)

## Commands

### Backend (from `backend/`)

```bash
# Start dev server (Python 3.12)
python main.py
# or: uvicorn main:app --reload --port 8000

# Init database (requires PostgreSQL running, superuser 'postgres')
python init_db.py
python init_db.py --seed   # + test data
python init_db.py --drop   # reset tables

# Seed test data separately
python seed.py
python seed.py --drop --mock 100
```

Dépendances Python (voir `requirements.txt`) :
```
fastapi==0.111.0, uvicorn==0.30.1, sqlalchemy==2.0.30, psycopg2-binary==2.9.9, pydantic==2.13.4, python-jose==3.3.0, werkzeug==3.1.3
```

Backend entry: `backend/main.py`. Routes live in `backend/routes/`. Models in `backend/models/`, schemas in `backend/schemas/`.

### Frontend (from `frontend/`)

```bash
npm install
npm run dev    # http://localhost:3000
npm run build  # → dist/
```

Vite proxies `/api` → `http://localhost:8000` (backend must be running).

### CLI (from `Cli/`)

```bash
pip install -r requirements.txt  # just `requests`
python main.py login --email admin@sai.com --password admin123
python main.py capteurs
python main.py commander 1 --action on --duree 60
python test_cli.py    # lance le backend + exécute 8 commandes CLI
```

## Outils manquants

- ~~Pas de `requirements.txt`~~ ✅ Créé avec dépendances pinées (Python 3.12).
- Pas de `pyproject.toml` pour le backend.
- Pas de scripts `lint`/`typecheck`/`test` dans `package.json`.
- ESLint configuré mais manuel : `npx eslint .` depuis `frontend/`.
- Pas de pipeline CI/CD.

## Key Architecture Facts

- **Auth**: JWT. Login → `POST /api/auth/login` → token stored in localStorage key `sai_current_user_v1`. Axios interceptor adds `Authorization: Bearer <token>` to all requests. 401 → auto-logout.
- **Roles**: `admin` and `agriculteur`. Admin-only pages: `/capteurs`, `/users`.
- **API prefix**: All backend routes are under `/api/`. Frontend `apiClient` uses `baseURL: '/api'`.
- **DB credentials** are hardcoded in `backend/database.py` (`sai_user:sai_password@localhost:5432/sai_db`) and `backend/init_db.py` (superuser `postgres`).
- **10 DB tables**: utilisateurs, parcelles, capteurs, actionneurs, mesures, commandes, actions, alertes, seuils, tokens.
- **Sensors**: dht22, yl-69, bh1750, sen0159, niveau_eau (HC-SR04).
- **Actuators**: pompe, ventilation, eclairage.

## Conventions

- Backend uses French naming for models, routes, schemas, variables, and comments.
- Frontend uses English for component names, French for UI text.
- Backend routes follow pattern: `GET ""` (list), `GET "/{id}"`, `POST ""`, `PUT "/{id}"`, `DELETE "/{id}"`.
- Schemas: `XxxBase`, `XxxCreate`, `XxxUpdate`, `XxxResponse` per entity.
- No test suite, linter, or CI pipeline exists in this repo.

## Pièges

- **`passlib` + `bcrypt 5.x`** : incompatible. Utiliser `werkzeug.security` (pas passlib/bcrypt).
- **`<select>` retourne des chaînes** : toujours comparer avec `String(a) === String(b)` quand on filtre par ID.
- **Tailwind v4 dark mode** : nécessite `@custom-variant dark (&:where(.dark, .dark *));` dans `index.css`, sinon le toggle ne fait rien.
- **Repo `.git/` imbriqué** : `projet_integrateur/` contient son propre `.git/` à l'intérieur du repo parent.
- **Identifiants DB hardcodés** : pas de `.env` pour le backend. Credentials dans `database.py` et `init_db.py` (y compris le mot de passe superuser).
- **Python 3.12 + psycopg2** : `psycopg2` n'est pas précompilé. Installer `psycopg2-binary` à la place.
- **SQLAlchemy 2.0** : `declarative_base()` déprécié → `DeclarativeBase`. `Query.get()` déprécié → `Session.get()`.
- **Pydantic v2** : `class Config: from_attributes = True` déprécié → `model_config = ConfigDict(from_attributes=True)`.
