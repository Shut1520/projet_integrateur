# SAI — Frontend React

Interface web du **Système Agricole Intelligent (SAI)**.

## Stack

- **React 19** + **Vite 6**
- **Tailwind CSS 4** (charte graphique agriculture)
- **React Router 7** (navigation)
- **Chart.js 4** + **react-chartjs-2** (graphiques)
- **Lucide React** (icônes)
- **Axios** (appels API)

## Démarrage

```bash
# 1. Installer les dépendances
npm install

# 2. Lancer le serveur de développement
npm run dev
# → http://localhost:3000
```

## Configuration

Le frontend communique avec le backend FastAPI via le **proxy Vite** configuré dans `vite.config.js` :
- **Frontend** : `http://localhost:3000`
- **Backend** : `http://localhost:8000`
- **Appels API** : préfixe `/api` (le proxy redirige automatiquement)

Assure-toi que le **backend est démarré** avant d'utiliser l'application (voir `../backend/README.md`).

## Structure

```
src/
├── components/
│   ├── layout/      # AppLayout, Sidebar, TopBar, BottomNav
│   └── ui/          # GaugeCard, Modal (composants réutilisables)
├── context/         # AuthContext, ThemeContext, ToastContext
├── pages/           # Login, Register, Dashboard, Parcelles, Actionneurs, ...
├── services/
│   ├── api.js       # Client Axios + méthodes API
│   └── storage.js   # localStorage (utilisateur + token)
├── utils/           # formatters.js (dates, CSV)
├── App.jsx          # Routes + ProtectedRoute
└── main.jsx         # Point d'entrée
```

## Authentification

L'authentification utilise **JWT** :
1. `POST /api/auth/login` → récupère un `access_token`
2. Le token est stocké dans `localStorage` avec l'utilisateur
3. Un **interceptor Axios** ajoute automatiquement `Authorization: Bearer <token>` à chaque requête
4. Sur 401, l'utilisateur est déconnecté automatiquement

## Pages

| Route | Page | Accès |
|-------|------|-------|
| `/login` | Connexion | Public |
| `/register` | Inscription | Public |
| `/dashboard` | Tableau de bord | Connecté |
| `/parcelles` | Gestion des parcelles (UC14) | Connecté |
| `/actionneurs` | Contrôle des actionneurs (UC13) | Connecté |
| `/history` | Historique des mesures (UC3) | Connecté |
| `/thresholds` | Configuration des seuils (UC7) | Connecté |
| `/capteurs` | Gestion des capteurs (UC12) | Admin |
| `/users` | Gestion des utilisateurs (UC8) | Admin |
| `/profile` | Profil utilisateur | Connecté |

## Build de production

```bash
npm run build
# → génère dist/
```
