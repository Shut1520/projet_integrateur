# Spécificités et Exigences Techniques — Frontend SAI

> **Projet** : SAI (Système Agricole Intelligent)
> **Version** : 1.0.0 — Juillet 2026
> **Statut** : Phase 5 — Conception & Développement Frontend

---

## 1. Vue d'ensemble

Le frontend est l'interface web d'exploitation du système agricole intelligent. Il permet aux agriculteurs et administrateurs de visualiser les données des capteurs en temps réel, d'contrôler les actionneurs, de consulter l'historique, de configurer les seuils d'automatisation et de gérer les utilisateurs.

**Architecture globale** : Le frontend communique avec un backend FastAPI via HTTP/REST. Les données temps réel (capteurs, alertes) peuvent être enrichies par WebSocket ou rafraîchissement périodique.

---

## 2. Technologies & Dépendances

### 2.1 Stack technique principale

| Technologie | Version | Rôle |
|-------------|---------|------|
| **React** | ^19.2.5 | Framework UI (composants, hooks, JSX) |
| **Vite** | ^8.0.10 | Bundler / outil de build (HMR, preview) |
| **React Router DOM** | ^7.18.1 | Routage côté client (SPA) |
| **Axios** | ^1.18.1 | Client HTTP pour appels API REST |
| **Chart.js** | ^4.5.1 | Librairie de graphiques (line, bar, gauge) |
| **react-chartjs-2** | ^5.3.1 | Wrapper React pour Chart.js |
| **Lucide React** | ^1.26.0 | Icônes SVG (1000+ icônes open source) |

### 2.2 Outils de développement

| Outil | Version | Usage |
|-------|---------|-------|
| **ESLint** | ^10.2.1 | Linting JS/JSX |
| **@eslint/js** | ^10.0.1 | Configuration ESLint recommandée |
| **eslint-plugin-react-hooks** | ^7.1.1 | Règles des hooks React |
| **eslint-plugin-react-refresh** | ^0.5.2 | Support React Refresh (HMR) |
| **globals** | ^17.5.0 | Variables globales navigateur |
| **@vitejs/plugin-react** | ^6.0.1 | Plugin Vite pour React (Oxc/SWC) |

### 2.3 Spécificités du projet

- **Type de module** : ESM (`"type": "module"` dans package.json)
- **Pas de TypeScript** : Le projet utilise du JavaScript/JSX pur (pas de TS configuré)
- **Pas de state manager externe** : Pas de Redux/Zustand — gestion d'état via React Context + `useState`/`useReducer`
- **Pas de framework CSS** : Pas de Bootstrap/Tailwind/Material UI — CSS personnalisé avec variables CSS
- **Pas de tests configurés** : Jest/Vitest/Cypress non installés (à ajouter pour les tests)

---

## 3. Architecture du Frontend

### 3.1 Structure des dossiers (cible)

```
frontend/
├── public/                    # Assets statiques (favicon, icons.svg)
├── src/
│   ├── main.jsx               # Point d'entrée React (createRoot)
│   ├── App.jsx                # Routeur principal + layout
│   ├── index.css              # Variables CSS globales + reset
│   ├── App.css                # Styles spécifiques App
│   ├── assets/                # Images, logos, illustrations
│   ├── components/            # Composants réutilisables
│   │   ├── ui/                # Atomes : Button, Input, Badge, Card, Modal, Alert, Skeleton, Tooltip
│   │   ├── layout/            # Sidebar, TopBar, BottomNav (mobile)
│   │   ├── charts/            # SensorGauge, LineChart, BarChart
│   │   └── forms/             # FilterBar, ThresholdSlider, CommandTimer
│   ├── pages/                 # Pages écrans (1 par route)
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── History.jsx
│   │   ├── Parcelles.jsx
│   │   ├── Actionneurs.jsx
│   │   ├── Thresholds.jsx
│   │   ├── Users.jsx
│   │   └── Profile.jsx
│   ├── hooks/                 # Custom hooks
│   │   ├── useAuth.js         # Auth + JWT
│   │   ├── useApi.js          # Wrapper Axios
│   │   ├── useSensors.js      # Données capteurs
│   │   └── useAlerts.js       # Gestion alertes temps réel
│   ├── context/               # Contexts React
│   │   ├── AuthContext.jsx    # État utilisateur connecté
│   │   └── ThemeContext.jsx   # Mode clair/sombre
│   ├── services/              # Appels API centralisés
│   │   ├── api.js             # Instance Axios configurée
│   │   ├── authService.js
│   │   ├── sensorService.js
│   │   ├── actuatorService.js
│   │   └── alertService.js
│   └── utils/                 # Helpers
│       ├── formatters.js      # Dates, nombres, unités
│       ├── constants.js       # Seuils, couleurs, config
│       └── validators.js      # Validation formulaires
├── index.html                 # Template HTML (Vite)
├── vite.config.js             # Config Vite (plugin-react)
├── eslint.config.js           # Config ESLint flat config
├── package.json
└── figma.md                   # Spécifications maquette complète (1697 lignes)
```

### 3.2 Routage

| Route | Page | Layout | Rôle requis |
|-------|------|--------|-------------|
| `/login` | Login | Sans sidebar | Public |
| `/` | Redirect → `/dashboard` | — | Auth |
| `/dashboard` | Dashboard | Sidebar + TopBar | Agriculteur / Admin |
| `/history` | Historique | Sidebar + TopBar | Agriculteur / Admin |
| `/parcelles` | Parcelles | Sidebar + TopBar | Agriculteur / Admin |
| `/parcelles/:id` | Détail Parcelle | Sidebar + TopBar | Agriculteur / Admin |
| `/actionneurs` | Actionneurs | Sidebar + TopBar | Agriculteur / Admin |
| `/actionneurs/:id` | Détail Actionneur | Sidebar + TopBar | Agriculteur / Admin |
| `/thresholds` | Seuils | Sidebar + TopBar | Agriculteur / Admin |
| `/admin/users` | Utilisateurs | Sidebar + TopBar | **Admin uniquement** |
| `/profile` | Profil | Sidebar + TopBar | Agriculteur / Admin |
| `/settings` | Paramètres | Sidebar + TopBar | Agriculteur / Admin |

### 3.3 Layouts

- **Sans sidebar** : Login uniquement (centré vertical/horizontal)
- **Avec sidebar** :
  - Desktop (≥1024px) : Sidebar fixe 260px + TopBar 64px + contenu scrollable
  - Tablet (768-1023px) : Sidebar rétractée 64px (icônes seules) ou drawer overlay
  - Mobile (<768px) : Pas de sidebar visible → Bottom Navigation 64px + TopBar 56px

---

## 4. Intégration API Backend

### 4.1 Configuration Axios

- **Base URL** : `http://localhost:8000` (développement) ou URL de production
- **CORS** : Backend configuré pour accepter `http://localhost:5173` (Vite dev)
- **Timeout** : 10 secondes
- **Headers par défaut** : `Content-Type: application/json`

### 4.2 Authentification JWT

- **Stockage** : `localStorage` (token persistant) + `sessionStorage` (option "Se souvenir de moi")
- **Header** : `Authorization: Bearer <token>`
- **Expiration** : 24 heures (backend)
- **Refresh** : Pas de refresh token configuré — redirection vers login si 401
- **Endpoints auth** :
  - `POST /api/auth/register` → Création compte
  - `POST /api/auth/login` → Réception `{ access_token, token_type, expires_in, utilisateur }`
  - `GET /api/auth/me` → Profil utilisateur connecté

### 4.3 Endpoints API principaux

| Ressource | Endpoints | Usage frontend |
|-----------|-----------|--------------|
| **Auth** | `POST /api/auth/login`, `GET /api/auth/me` | Connexion, profil |
| **Utilisateurs** | `GET/POST/PUT/DELETE /api/utilisateurs` | CRUD users (admin) |
| **Parcelles** | `GET/POST/PUT/DELETE /api/parcelles` | Gestion parcelles |
| **Capteurs** | `GET/POST/PUT/DELETE /api/capteurs` | Liste capteurs |
| **Mesures** | `GET /api/mesures`, `GET /api/mesures/dernieres/{id}` | Dashboard, historique |
| **Actionneurs** | `GET/POST/PUT/DELETE /api/actionneurs` | Contrôle actionneurs |
| **Commandes** | `POST /api/commandes` | Envoi commandes ON/OFF/programmation |
| **Actions** | `GET /api/actions` | Suivi historique actions |
| **Alertes** | `GET/PUT /api/alertes` | Alertes temps réel, reconnaissance |
| **Seuils** | `GET/POST/PUT/DELETE /api/seuils` | Configuration seuils |
| **Tokens** | `GET/POST /api/tokens` | Clés API (profil) |

### 4.4 Gestion des erreurs API

- **401 Unauthorized** → Redirection `/login` + suppression token
- **403 Forbidden** → Message "Accès refusé" (rôle insuffisant)
- **404 Not Found** → Affichage état vide
- **409 Conflict** → Message spécifique (ex: email déjà utilisé)
- **422 Validation** → Affichage erreurs inline formulaire
- **Network/Timeout** → Toast d'erreur "Connexion impossible"

---

## 5. Design System

### 5.1 Charte graphique

**Thème clair**
- Primaire : `#2E7D32` (vert forêt)
- Primaire light : `#E8F5E9`
- Primaire dark : `#1B5E20`
- Surfond : `#FFFFFF`
- Surface : `#F5F7F2`
- Texte : `#1A1A1A` / `#5A5A5A` / `#BDBDBD`
- Bordure : `#E0E0E0`
- Succès : `#43A047` | Avertissement : `#FB8C00` | Erreur : `#E53935` | Info : `#1E88E5`

**Thème sombre**
- Primaire : `#66BB6A` | Surface : `#161B22` | Surfond : `#0D1117`
- Texte : `#F0F0F0` / `#8B949E` | Bordure : `#30363D`

### 5.2 Typographie

- **Police** : `Inter` (Google Fonts) — fallback `system-ui, -apple-system, sans-serif`
- **Hiérarchie** : H1 32px Bold → H2 24px SemiBold → H3 20px SemiBold → H4 16px Medium → Body 14px Regular → Caption 11px Medium

### 5.3 Système de composants atomiques

| Composant | États requis | Notes |
|-----------|--------------|-------|
| **Button** | Default, Hover, Active, Disabled, Loading | Variantes : Primary, Outline, Ghost, Danger |
| **Input** | Default, Focus, Filled, Error, Success, Disabled | Hauteur 44px, radius 8px, halo vert au focus |
| **Select** | Default, Open, Selected | Panel shadow 0 4px 20px rgba |
| **Checkbox** | Checked, Unchecked | 20×20px, radius 4px |
| **Toggle** | ON/OFF | 44×24px, knob 20px |
| **Badge** | Default, Warning, Error, Info, Neutral | Pill radius 16px |
| **Alert/Toast** | Success, Warning, Error, Info | Border-left 4px colorée, dismissable |
| **Card** | — | Radius 12px, shadow md, padding 20px |
| **Modal** | — | Width 480px (desktop), overlay rgba(0,0,0,0.5), radius 16px |
| **Skeleton** | Pulse | Opacité 0.4↔1, 1.5s |

### 5.4 Composants moléculaires (métier)

- **Sidebar** : Navigation latérale 260px (desktop), 64px (repliée), drawer (mobile)
- **TopBar** : 64px haut, toggle sidebar, titre page, notifications, avatar
- **BottomNav** : 64px + safe-area, 5 onglets (mobile uniquement)
- **SensorGauge** : Jauge circulaire/barre avec valeur numérique, couleur selon seuils
- **ActuatorCard** : État ON/OFF, boutons commander/programmer, GPIO
- **ThresholdCard** : Double slider min/max, inputs synchronisés, action déclenchée
- **AlertCard** : Bordure gauche sévérité, reconnaître/résoudre
- **DataTable** : Header sticky, pagination, scroll horizontal sur mobile
- **FilterBar** : Période, capteur, parcelle
- **ChartContainer** : Line chart (historique) / Bar chart (comparaison)

---

## 6. Pages fonctionnelles — Exigences détaillées

### 6.1 Login

- Centré verticalement (desktop) / 20% top (mobile)
- Logo SAI + sous-titre
- Champs : Email (avec icône), Password (avec toggle visibilité)
- Checkbox "Se souvenir de moi"
- Bouton "Se connecter" full-width primary
- Lien "Mot de passe oublié ?"
- États : Loading (spinner), Erreur (message rouge inline), Validation (champs vides/email invalide)

### 6.2 Dashboard

- **5 mini-jauges** (Température, Humidité sol, Luminosité, CO₂, Niveau eau)
  - Couleur dynamique selon seuils (vert → orange → rouge)
  - Valeur numeric bold 32-48px
- **Section Actionneurs** : 3 cartes (Pompe, Ventilation, Éclairage)
  - Boutons ON/OFF + Programmer (durée)
- **Section Alertes** : 3 dernières alertes non résolues
- **Graphique principal** : Line chart température/humidité (24h par défaut)
- **Indicateur rafraîchissement** : "Dernière mise à jour : il y a Xs"
- États : Loading (skeleton cards), Alerte critique (banner rouge fixe), Données vides

### 6.3 Historique

- **Filtres** : Période (date picker), Capteur (dropdown), Parcelle (dropdown)
- **Sélecteur période** : Chips 24h / 7j / 30j / 90j / Personnalisé
- **Graphique** : Line chart pleine largeur (hauteur 350px desktop / 280px tablet / 220px mobile)
- **Tableau** : Date, Capteur, Valeur, Unité, Source — pagination 10/25/50 lignes
- **Export CSV** : Téléchargement des données filtrées
- États : Loading skeleton, Aucune donnée, Export en cours

### 6.4 Parcelles

- Bouton "+ Nouvelle parcelle" → Modal création
- Grille de cartes 2-3 colonnes : Nom, Localisation, Résumé (capteurs/actionneurs/seuils), Statut badge
- Menu contextuel : Modifier, Supprimer
- Modal : Nom (input), Localisation (input), Propriétaire (select)

### 6.5 Actionneurs

- Sélecteur de parcelle en haut
- Grille de cartes 3 colonnes (desktop) :
  - Icône + Nom, GPIO, Indicateur état (pastille + texte), Durée si actif
  - Bouton principal : Démarrer/Arrêter
  - Bouton "Programmer" → modal durée (input numérique + unité)
  - Admin : Modifier / Supprimer (liens en bas de carte)
- Modal création/modification : Nom, Référence, GPIO (0-39), Parcelle, État initial
- Modal suppression : Confirmation destructive avec résumé
- Timeline des dernières commandes en bas

### 6.6 Seuils (Configuration)

- Sélecteur de parcelle
- Cartes de seuil avec double slider (min/max) + inputs synchronisés
- Type de mesure + icône
- Action déclenchée (ventilo/pompe/éclairage/alerte)
- Boutons Modifier / Supprimer
- "+ Ajouter un seuil" → Modal : Type, Min, Max, Unité (auto), Action
- Cas particulier CO₂ : seuil max seulement

### 6.7 Utilisateurs (Admin only)

- Tableau : ID, Nom, Email, Rôle (badge), Actions (éditer/supprimer)
- Pagination
- Bouton "+ Ajouter" → Modal : Nom, Email, Rôle (select), Mot de passe
- Modal suppression destructive
- Sur mobile : transformation en cards verticales

### 6.8 Profil

- Carte d'identité : Avatar (initiales), Nom, Email, Rôle
- Section Clés API : tableau + bouton générer
- Section Sécurité : changement mot de passe
- Modal clé API : Nom, expiration, affichage unique avec copie
- Modal mot de passe : Ancien, Nouveau, Confirmation

---

## 7. Responsive Design

### 7.1 Approche

- **Desktop-first** : Conçu d'abord pour 1440×900, puis adapté
- Unités `rem` et `%` / `vw` pour les largeurs
- **Grille responsive** : 4/8/12 colonnes selon breakpoint

### 7.2 Breakpoints

| Nom | Min width | Cible |
|-----|-----------|-------|
| `sm` | 0px | Mobile portrait |
| `md` | 640px | Mobile paysage / petite tablette |
| `lg` | 1024px | Tablette / petit desktop |
| `xl` | 1280px | Desktop standard |
| `2xl` | 1536px | Grand écran |

### 7.3 Adaptations par appareil

| Élément | Desktop (≥1024px) | Tablet (768-1023px) | Mobile (<768px) |
|---------|--------------------|--------------------|-----------------|
| Sidebar | 260px fixe | 64px icônes ou drawer | Drawer overlay |
| TopBar | 64px | 56px | 56px + hamburger |
| Bottom nav | Non | Non | 64px + safe-area |
| Dashboard jauges | 5 colonnes | 2+2+1 wrap | 1 colonne stack |
| Actionneurs | 3 colonnes | 2 colonnes | 1 colonne |
| Tableaux | Complet | Scroll horizontal | Scroll horizontal ou cards |
| Modaux | 480px centré | 90vw | 100vw bottom sheet |
| Touch targets | 36-44px | 44px | 44px min (Apple HIG) |

### 7.4 Points de vigilance

- Graphiques : `width: 100%`, hauteur min 220px
- Tableaux : scroll horizontal + ombre indicatrice + sticky 1ère colonne
- Modaux : bottom sheet sur mobile (slide-up, swipe down pour fermer)
- Bottom nav : padding-bottom `calc(64px + env(safe-area-inset-bottom))`
- Inputs iOS : `font-size: 16px` minimum pour éviter zoom

---

## 8. Animations & Micro-interactions

| Élément | Animation | Durée | Easing |
|---------|-----------|-------|--------|
| Sidebar collapse | Width 260↔64px | 250ms | ease-in-out |
| Page transition | Fade in | 200ms | ease |
| Modal appear | Scale 0.95→1 + fade | 200ms | ease-out |
| Toast/Alert | Slide right→left | 300ms | ease |
| Button hover | Opacité fond | 150ms | ease |
| Button click | Scale 0.98 | 100ms | ease |
| Skeleton | Pulse opacité | 1.5s | ease-in-out |
| Chart tooltip | Opacity 0→1 | 150ms | ease |
| Notification badge | Scale pop | 200ms | bounce |
| Toggle switch | Knob slide + bg | 200ms | ease |
| Dropdown open | Opacity + translateY(-4px) | 150ms | ease-out |
| Row hover | Fond change | 100ms | ease |

---

## 9. Exigences non-fonctionnelles

### 9.1 Accessibilité (WCAG 2.1 niveau AA)

- Contraste minimum 4.5:1 pour le texte
- Toutes les icônes interactives : aria-label
- Focus visible sur tous les éléments interactifs
- Modaux : trap focus, fermeture Escape
- Formulaires : labels associés, messages d'erreur liés (aria-describedby)
- Notifications : role="alert" / aria-live

### 9.2 Performance

- Lazy loading des pages (React.lazy + Suspense)
- Graphiques : pas de re-render inutile, mémoization
- Images : format WebP, tailles responsives
- Bundle split par route

### 9.3 Sécurité

- Token JWT jamais exposé dans les logs
- Sanitization des entrées utilisateur (XSS)
- Validation côté client + serveur
- Logout : suppression complète token + état auth

### 9.4 Tests (à implémenter)

- **Unitaires** : Jest/Vitest + React Testing Library (composants isolés)
- **E2E** : Cypress ou Playwright (scénarios critiques : login → dashboard → commande actionneur)
- **Cross-browser** : Chrome, Firefox, Safari, Edge
- **Cross-device** : Desktop 1440px, iPad 834px, iPhone 390px

---

## 10. Intégration temps réel (recommandations)

Actuellement le backend ne fournit pas de WebSocket. Pour les alertes temps réel et le rafraîchissement des capteurs :

- **Polling** : `setInterval` 5-10s sur le dashboard pour les dernières mesures
- **Notifications** : Vérification périodique des alertes non reconnues
- **Optimisation** : AbortController pour annuler les requêtes en cours si nouvelle requête ou changement de page

---
