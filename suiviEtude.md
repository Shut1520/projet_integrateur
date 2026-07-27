# Suivi d'etude — Projet SAI

Ce fichier liste les notions enseignees et apprises au fil de la conception du projet.

---

## 1. UML — Cas d'utilisation
- **Acteurs** : primaire (Agriculteur, Admin) vs secondaire (Systeme externe, Base de donnees).
- **Relations** : `<<include>>` (obligation), `<<extend>>` (conditionnel), generalisation/heritage.
- Extension ajoutee : `Afficher un message d'erreur` (mauvais identifiant, entrees invalides).

## 2. UML — Diagramme de sequence
- Messages synchrones/asynchrones, boucles `alt/opt/loop`, creation/destruction d'objets.
- 6 scenarios couvrant l'irrigation (auto/manuelle), alertes, authentification.

## 3. UML — Diagramme d'activite
- Noeuds d'action, decisions, fourche/jonction (fork/jonction), partitions.
- Approche modulaire : initialisation, boucle d'automatisation, extinction.

## 4. Merise — MCD / MLD / MPD
- Entites, attributs, identifiants, relations (1:1, 1:N, N:M).
- Transformation MCD -> MLD (tables, PK, FK, cardinalites).
- MPD : SQL DDL + ORM SQLAlchemy (Mapped, Column, relationship).

## 5. Base de donnees — SQLAlchemy
- `Base` (declarative base), `__tablename__`, `Column`, types (`String`, `Integer`, `Float`, `DateTime`, `Boolean`, `Enum`).
- Relations : `ForeignKey`, `relationship()`, `back_populates`.
- `Mapped[...]` vs `Column(...)` (option moderne SQLAlchemy 2.0).
- Seed : insertion de donnees de test (fixtures / mock data).

## 6. Backend — FastAPI
- Architecture : modeles (ORM) -> schemas (Pydantic) -> routes (APIRouter) -> services (logique metier).
- Pydantic : `BaseModel`, heritage (`Create`, `Update`, `Response`), `Config.from_attributes`.
- Auth JWT : `oauth2_scheme`, `create_access_token`, dependance `get_current_user`.
- CORS, middleware, gestion des exceptions HTTP.

## 7. CLI — Python Click
- Decorateurs `@click.command()`, `@click.option()`, groupes de commandes.
- Requetes HTTP avec `requests`, gestion du token JWT dans `config.json`.
- Difference argparse / Click : Click est plus expressif pour les CLI complexes.

## 8. Frontend — React 19 + Vite + Tailwind CSS 4
- **Variables CSS** : themeclair/sombre via `:root` et `.dark`, pas de duplication de classes.
- **Tailwind 4** : `@import "tailwindcss"`, arbitrary values `bg-[#F5F7F2]`.
- **`@custom-variant dark`** : directive obligatoire en Tailwind v4 pour lier les variantes `dark:` a la classe CSS `.dark` et non a la media query systeme. Syntaxe : `@custom-variant dark (&:where(.dark, .dark *))`. Sans ca, le toggle clair/sombre est inoperant.
- **Context React** : `createContext`, `useContext`, providers (Auth, Theme, Toast).
- **Routing** : `react-router-dom` v6+, `BrowserRouter`, `Routes`, `Route`, `Navigate`, `Outlet`, `NavLink`.
- **Axios** : intercepteurs (injecter token, gerer 401), proxy Vite.
- **Chart.js** : enregistrement des composants (`ChartJS.register`), `Line`, datasets, options responsive.
- **Lucide React** : icones en SVG, `className` pour colorer.
- **Build & deploiement** : `npm run build`, `dist/`, audit securite (`npm audit fix`).

## 9. Design UI/UX
- **Charte graphique** : primary/secondary/tertiary/neutral + etats (success, warning, error, info).
- **Hierarchie visuelle** : fond > surface > carte > element.
- **Dark mode** : ne jamais casser le theme sombre en modifiant le theme clair ; verifier chaque classe `dark:`.
- **Diagnostic dark mode** : si l'app reste sombre malgre le toggle -> verifier `@custom-variant dark` dans `index.css`, puis vider le `localStorage`.
- **Cartes de metriques** : label uppercase + valeur bold + barre coloree fine = pattern dashboard agricole.
- **ConfirmModal** : composant reutilisable (`components/ui/ConfirmModal.jsx`) avec overlay noir + icone AlertTriangle + 2 boutons (Annuler gris / Confirmer rouge). Remplace `window.confirm()` natif.
- **Couleurs light mode** : fond `#F5F7F2`, inputs `#F5F7F2`, sidebar `#FFFFFF`. Ne JAMAIS utiliser `#f8faf5`.

## 10. Notions transverses
- **REST API** : methodes HTTP (GET, POST, PUT, DELETE), endpoints, status codes.
- **JWT** : header.payload.signature, `Bearer`, expiration, refresh (non implemente pour l'instant).
- **Migration Alembic** (theorie) : versionnement incremental du schema DB, `alembic revision --autogenerate`, `upgrade head`.
- **Securite** : mots de passes hashes (`werkzeug.security`), CORS, rate limiting (a venir).

## 11. Debugging frontend-backend
- **Champs API** : toujours verifier les schemas Pydantic (`schemas/*.py`) pour connaitre les noms exacts renvoyes par l'API. Les alias Pydantic (`alias="type"`) changent le nom du champ dans la reponse JSON.
- **Filter par relation** : si le schema mesure ne renvoie que `id_capteur`, il faut charger les capteurs separement pour construire une map `nom->id` avant de filtrer.
- **Toggle switch** : `commanderActionneur()` cree une Commande mais ne met PAS a jour l'etat de l'actionneur dans la BDD. Il faut aussi appeler `updateActionneur(id, {etat: nextEtat})` AVANT la commande. Voir `Dashboard.jsx:L163-180`.
- **References croisees** : comparer systematiquement le frontend (`*.jsx`) avec le backend (`schemas/*.py`, `models/*.py`) pour detecter les incoherences de noms de champs.
