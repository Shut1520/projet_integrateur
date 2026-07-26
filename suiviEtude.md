# Suivi d'étude — Projet SAI

Ce fichier liste les notions enseignées et apprises au fil de la conception du projet.

---

## 1. UML — Cas d'utilisation
- **Acteurs** : primaire (Agriculteur, Admin) vs secondaire (Système externe, Base de données).
- **Relations** : `<<include>>` (obligation), `<<extend>>` (conditionnel), généralisation/héritage.
- Extension ajoutée : `Afficher un message d'erreur` (mauvais identifiant, entrées invalides).

## 2. UML — Diagramme de séquence
- Messages synchrones/asynchrones, boucles `alt/opt/loop`, création/destruction d'objets.
- 6 scénarios couvrant l'irrigation (auto/manuelle), alertes, authentification.

## 3. UML — Diagramme d'activité
- Nœuds d'action, décisions, fourche/jonction (fork/join), partitions.
- Approche modulaire : initialisation, boucle d'automatisation, extinction.

## 4. Merise — MCD / MLD / MPD
- Entités, attributs, identifiants, relations (1:1, 1:N, N:M).
- Transformation MCD → MLD (tables, PK, FK, cardinalités).
- MPD : SQL DDL + ORM SQLAlchemy (Mapped, Column, relationship).

## 5. Base de données — SQLAlchemy
- `Base` (déclarative base), `__tablename__`, `Column`, types (`String`, `Integer`, `Float`, `DateTime`, `Boolean`, `Enum`).
- Relations : `ForeignKey`, `relationship()`, `back_populates`.
- `Mapped[...]` vs `Column(...)` (option moderne SQLAlchemy 2.0).
- Seed : insertion de données de test (fixtures / mock data).

## 6. Backend — FastAPI
- Architecture : modèles (ORM) → schémas (Pydantic) → routes (APIRouter) → services (logique métier).
- Pydantic : `BaseModel`, héritage (`Create`, `Update`, `Response`), `Config.from_attributes`.
- Auth JWT : `oauth2_scheme`, `create_access_token`, dépendance `get_current_user`.
- CORS, middleware, gestion des exceptions HTTP.

## 7. CLI — Python Click
- Décorateurs `@click.command()`, `@click.option()`, groupes de commandes.
- Requêtes HTTP avec `requests`, gestion du token JWT dans `config.json`.
- Différence argparse / Click : Click est plus expressif pour les CLI complexes.

## 8. Frontend — React 19 + Vite + Tailwind CSS 4
- **Variables CSS** : thème clair/sombre via `:root` et `.dark`, pas de duplication de classes.
- **Tailwind 4** : `@import "tailwindcss"`, arbitrary values `bg-[#F5F7F2]`.
- **Context React** : `createContext`, `useContext`, providers (Auth, Theme, Toast).
- **Routing** : `react-router-dom` v6+, `BrowserRouter`, `Routes`, `Route`, `Navigate`, `Outlet`, `NavLink`.
- **Axios** : interceptors (injecter token, gérer 401), proxy Vite.
- **Chart.js** : enregistrement des composants (`ChartJS.register`), `Line`, datasets, options responsive.
- **Lucide React** : icônes en SVG, `className` pour colorer.
- **Build & déploiement** : `npm run build`, `dist/`, audit sécurité (`npm audit fix`).

## 9. Design UI/UX
- **Charte graphique** : primary/secondary/tertiary/neutral + états (success, warning, error, info).
- **Hiérarchie visuelle** : fond > surface > carte > élément.
- **Dark mode** : ne jamais casser le thème sombre en modifiant le thème clair ; vérifier chaque classe `dark:`.
- **Cartes de métriques** : label uppercase + valeur bold + barre colorée fine = pattern dashboard agricole.

## 10. Notions transverses
- **REST API** : méthodes HTTP (GET, POST, PUT, DELETE), endpoints, status codes.
- **JWT** : header.payload.signature, `Bearer`, expiration, refresh (non implémenté pour l'instant).
- **Migration Alembic** (théorie) : versionnement incrémental du schéma DB, `alembic revision --autogenerate`, `upgrade head`.
- **Sécurité** : mots de passe hashés (`werkzeug.security`), CORS, rate limiting (à venir).
