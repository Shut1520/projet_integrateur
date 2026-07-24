# Spécifications Figma — Maquette Frontend SAI

> **Projet** : SAI (Système Agricole Intelligent)  
> **Stack** : React 18 + Vite  
> **Design system** : Sur-mesure (agriculture, moderne, professionnel)  
> **Figma** : [Créer un nouveau fichier Figma] → utiliser ce document comme cahier des charges

---

## Table des matières

1. [Charte graphique](#1-charte-graphique)
2. [Typographie](#2-typographie)
3. [Composants atomiques](#3-composants-atomiques)
4. [Composons moléculaires](#4-composants-moléculaires)
5. [Pages / Écrans](#5-pages--écrans)
6. [Navigation & routage](#6-navigation--routage)
7. [Spécifications responsive](#7-spécifications-responsive)
8. [Animations & micro-interactions](#8-animations--micro-interactions)

---

## 1. Charte graphique

### 1.1 Mode clair

| Rôle | Code hex | Usage | Aperçu |
|------|----------|-------|--------|
| **Primaire** | `#2E7D32` | Boutons principaux, header, liens actifs, accents forts | Vert forêt |
| Primaire light | `#E8F5E9` | Badges, backgrounds de cartes, états "actif" | Vert pâle |
| Primaire dark | `#1B5E20` | Hover des boutons, titres importants | Vert foncé |
| **Surfond** | `#FFFFFF` | Arrière-plan des pages, cartes | Blanc pur |
| Surface | `#F5F7F2` | Arrière-plan secondaire, sidebar | Blanc cassé |
| **Texte primaire** | `#1A1A1A` | Titres, corps de texte | Noir |
| Texte secondaire | `#5A5A5A` | Labels, sous-titres, métadonnées | Gris moyen |
| Texte désactivé | `#BDBDBD` | Placeholder, disabled | Gris clair |
| **Bordure** | `#E0E0E0` | Cards, inputs, séparateurs | Gris bordure |
| **Succès** | `#43A047` | Confirmation, vert de mesure | Vert vif |
| **Avertissement** | `#FB8C00` | Alertes sévérité "basse", warning | Orange |
| **Erreur** | `#E53935` | Alertes "haute"/"critique", erreurs | Rouge |
| **Info** | `#1E88E5` | Informations, notifications système | Bleu |

### 1.2 Mode sombre

| Rôle | Code hex | Usage |
|------|----------|-------|
| **Primaire** | `#66BB6A` | Boutons, liens, accents (vert clair lisible sur fond sombre) |
| Primaire light | `#1B3D1F` | Badges, backgrounds de cartes en mode sombre |
| Primaire dark | `#A5D6A7` | Hover des boutons (vert plus clair) |
| **Surfond** | `#0D1117` | Arrière-plan principal (noir léger) |
| Surface | `#161B22` | Arrière-plan secondaire, cartes, sidebar |
| Surface élevée | `#21262D` | Cards, dropdowns, modaux |
| **Texte primaire** | `#F0F0F0` | Titres, corps de texte |
| Texte secondaire | `#8B949E` | Labels, sous-titres |
| Texte désactivé | `#484F58` | Placeholder, disabled |
| **Bordure** | `#30363D` | Cards, inputs, séparateurs |
| **Succès** | `#4CAF50` | Confirmation |
| **Avertissement** | `#FFB74D` | Warning |
| **Erreur** | `#EF5350` | Alertes critiques |
| **Info** | `#42A5F5` | Informations |

### 1.3 Règles d'application

- Le **vert** est réservé aux actions principales, aux indicateurs "actif/ok", et aux titres structurants.
- Le **rouge** uniquement pour les alertes critiques et les erreurs de validation.
- L'**orange** pour les avertissements et les sévérités "basse".
- Le **gris** pour tout ce qui est structurel : bordures, fonds secondaires, textes secondaires.
- **Ne jamais** utiliser plus de 2 couleurs d'accent sur une même carte.

---

## 2. Typographie

### 2.1 Police

- **Famille** : `Inter` (Google Font) — moderne, lisible, professionnelle  
  → Lien : `https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap`
- **Fallback** : `system-ui, -apple-system, sans-serif`

### 2.2 Hiérarchie

| Style | Poids | Taille (px) | Line-height | Usage |
|-------|-------|-------------|-------------|-------|
| **H1** | Bold (700) | 32 | 1.2 | Titre de page (unique) |
| **H2** | Semi-bold (600) | 24 | 1.3 | Section title |
| **H3** | Semi-bold (600) | 20 | 1.4 | Card title |
| **H4** | Medium (500) | 16 | 1.5 | Sous-titre, label de champ |
| **Body** | Regular (400) | 14 | 1.6 | Corps de texte |
| **Body small** | Regular (400) | 12 | 1.5 | Métadonnées, timestamps |
| **Caption** | Medium (500) | 11 | 1.4 | Badges, tags |
| **Button** | Semi-bold (600) | 14 | 1 | Boutons |
| **Overline** | Semi-bold (600) | 10 | 1.2 | Uppercase, labels de section |
| **Numeric** | Medium (500) | 32–48 | 1 | Valeurs de capteurs (dashboard) |

### 2.3 Mode sombre

- Mêmes tailles et poids. Couleurs adaptées (texter primaire blanc cassé, secondaire gris clair).

---

## 3. Composants atomiques

### 3.1 Boutons

#### Bouton principal (Primary)

```
┌──────────────────────┐
│  Label du bouton     │
└──────────────────────┘
```

| Propriété | Valeur |
|-----------|--------|
| Background | `#2E7D32` (clair) / `#66BB6A` (sombre) |
| Text color | `#FFFFFF` |
| Padding | 12px 24px |
| Border-radius | 8px |
| Font | 14px Semi-bold |
| Icon gap | 8px |
| Hover | Opacité 0.9 ou fond `#1B5E20` |
| Active | Scale 0.98 |
| Disabled | Opacité 0.5, pas de hover |
| States | Default / Hover / Pressed / Disabled / Loading (spinner) |

#### Bouton secondaire (Outline)

| Propriété | Valeur |
|-----------|--------|
| Bordure | 1.5px solid `#2E7D32` |
| Text color | `#2E7D32` |
| Background | Transparent |
| Hover | Fond `#E8F5E9` |

#### Bouton tertiaire (Ghost)

| Propriété | Valeur |
|-----------|--------|
| Text color | `#5A5A5A` |
| Background | Transparent |
| Hover | Fond `rgba(0,0,0,0.05)` |

#### Bouton danger (destructif)

| Propriété | Valeur |
|-----------|--------|
| Background | `#E53935` |
| Hover | `#C62828` |

#### Bouton icône seul

| Taille | Padding | Forme |
|--------|---------|-------|
| 36×36px | 8px | Carré arrondi (8px) |
| 44×44px | 10px | Idem, pour mobile |

#### Variantes de taille

| Taille | Padding Y | Padding X | Font |
|--------|-----------|-----------|------|
| Small | 6px | 12px | 12px |
| Medium | 10px | 20px | 14px |
| Large | 14px | 28px | 16px |

### 3.2 Champs de formulaire (Inputs)

```
┌─────────────────────────────────────────┐
│  Label                                   │
│  ┌─────────────────────────────────────┐│
│  │ Placeholder / Valeur                ││
│  └─────────────────────────────────────┘│
│  Message d'aide / Erreur                │
└─────────────────────────────────────────┘
```

| Propriété | Valeur |
|-----------|--------|
| Label | H4 (16px Medium), margin-bottom 6px |
| Hauteur input | 44px |
| Border | 1.5px solid `#E0E0E0` |
| Border-radius | 8px |
| Padding X | 14px |
| Font | 14px Regular |
| Placeholder | `#BDBDBD` |
| Background | `#FFFFFF` |
| Focus | Border `#2E7D32`, box-shadow `0 0 0 3px rgba(46,125,50,0.15)` |
| Error | Border `#E53935`, text error `#E53935` |
| Disabled | Background `#F5F5F5`, text `#BDBDBD` |

#### États

- **Default** : bordure grise
- **Focused** : bordure verte + halo vert clair
- **Filled** : bordure grise, texte noir
- **Error** : bordure rouge + message d'erreur en dessous
- **Success** : bordure verte + icône check
- **Disabled** : fond grisé, pas d'interaction

### 3.3 Select / Dropdown

| Propriété | Valeur |
|-----------|--------|
| Même base qu'un input | 44px haut, 8px radius |
| Icône | Chevron vers le bas |
| Options panel | Box-shadow `0 4px 20px rgba(0,0,0,0.12)`, border-radius 8px |
| Option height | 40px |
| Option hover | Fond `#E8F5E9` |
| Selected | Fond `#2E7D32`, texte blanc |

### 3.4 Checkbox & Toggle

#### Checkbox

| Propriété | Valeur |
|-----------|--------|
| Taille | 20×20px |
| Border radius | 4px |
| Checked | Fond `#2E7D32` |
| Unchecked | Bordure 1.5px solid `#BDBDBD` |
| Label | 14px Regular, gap 8px |

#### Toggle switch

| Propriété | Valeur |
|-----------|--------|
| Width | 44px |
| Height | 24px |
| Knob | 20px cercle blanc |
| ON | Track `#2E7D32` |
| OFF | Track `#E0E0E0` |

### 3.5 Badges & Tags

| Variante | Background | Text color |
|----------|------------|------------|
| Default | `#E8F5E9` | `#2E7D32` |
| Warning | `#FFF3E0` | `#FB8C00` |
| Error | `#FFEBEE` | `#E53935` |
| Info | `#E3F2FD` | `#1E88E5` |
| Neutral | `#F5F5F5` | `#5A5A5A` |

| Propriété | Valeur |
|-----------|--------|
| Padding | 4px 10px |
| Border-radius | 16px (pill) |
| Font | 11px Medium (Caption) |

### 3.6 Alertes / Notifications

| Type | Icône | Background | Border-left | Texte |
|------|-------|------------|-------------|-------|
| Success | Check | `#E8F5E9` | 4px `#43A047` | `#2E7D32` |
| Warning | Triangle | `#FFF3E0` | 4px `#FB8C00` | `#E65100` |
| Error | X | `#FFEBEE` | 4px `#E53935` | `#C62828` |
| Info | i | `#E3F2FD` | 4px `#1E88E5` | `#0D47A1` |

| Propriété | Valeur |
|-----------|--------|
| Padding | 12px 16px |
| Border-radius | 8px |
| Font | 14px Regular |
| Dismiss | Bouton icône X en haut à droite |

### 3.7 Cartes (Cards)

```
┌─────────────────────────────────────────┐
│  ┌──────┐  Titre de la carte            │
│  │ Icon │  Sous-titre ou métadonnée     │
│  └──────┘                               │
│                                         │
│  Contenu principal de la carte          │
│                                         │
│  ─────────────────────────────────────  │
│  Footer (optionnel)                     │
└─────────────────────────────────────────┘
```

| Propriété | Valeur |
|-----------|--------|
| Background | `#FFFFFF` (clair) / `#21262D` (sombre) |
| Border-radius | 12px |
| Box-shadow | `0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)` |
| Padding | 20px |
| Header gap | 12px entre icône et titre |

### 3.8 Squelettes de chargement (Skeleton)

| Propriété | Valeur |
|-----------|--------|
| Background | `#E0E0E0` (clair) / `#30363D` (sombre) |
| Border-radius | 4px |
| Animation | Pulse (opacité 0.4 → 1 → 0.4, 1.5s) |
| Hauteurs types | Texte : 14px, Titre : 24px, Card : 120px |

### 3.9 Modals / Dialogues

```
┌─────────────────────────────────────────┐
│  ┌───────────────────────────────────┐  │
│  │  Header (titre + X close)        │  │
│  ├───────────────────────────────────┤  │
│  │  Body / contenu                   │  │
│  │                                   │  │
│  ├───────────────────────────────────┤  │
│  │  Footer (actions : Cancel / OK)   │  │
│  └───────────────────────────────────┘  │
│                                         │
└────────────── Overlay semi-transparent ──┘
```

| Propriété | Valeur |
|-----------|--------|
| Overlay | `rgba(0,0,0,0.5)` |
| Modal width | 480px (max 90vw) |
| Border-radius | 16px |
| Background | `#FFFFFF` (clair) / `#21262D` (sombre) |
| Padding | 24px |
| Header | 20px Semi-bold + close icon top-right |

### 3.10 Tooltips

| Propriété | Valeur |
|-----------|--------|
| Background | `#1A1A1A` (clair) / `#F0F0F0` (sombre) |
| Text color | `#FFFFFF` (clair) / `#1A1A1A` (sombre) |
| Padding | 6px 12px |
| Border-radius | 6px |
| Font | 12px Regular |
| Arrow | 4px triangle pointing to trigger |

---

## 4. Composants moléculaires

### 4.1 Sidebar / Navigation latérale

```
┌──────────┬──────────────────────────────────────┐
│ LOGO     │                                      │
│ SAI      │           CONTENU PRINCIPAL          │
│          │                                      │
│ 📊  Dashboard │                                  │
│ 📈  Historique │                                 │
│ ⚙️  Parcelles  │                                 │
│ 🔧  Actionneurs│                                 │
│ 📐  Seuils     │                                 │
│ 👥  Utilisateurs│ (admin only)                   │
│          │                                      │
│ ──────── │                                      │
│          │                                      │
│ 👤  Profil│                                     │
│ 🚪  Déconnexion│                                │
└──────────┴──────────────────────────────────────┘
```

| Propriété | Valeur |
|-----------|--------|
| Width | 260px (fermé : 64px) |
| Background | `#FFFFFF` (clair) / `#161B22` (sombre) |
| Border-right | 1px solid `#E0E0E0` (clair) / `#30363D` (sombre) |
| Item height | 44px |
| Item padding | 12px 20px |
| Item border-radius | 8px |
| Item hover | Fond `#E8F5E9` (clair) / `#21262D` (sombre) |
| Item active | Fond `#2E7D32`, texte blanc |
| Icon size | 20×20px |
| Logo | Espacement 24px en haut, 24px en bas |

### 4.2 Top bar / Header

```
┌──────────────────────────────────────────────┐
│  ← (menu toggle)  SAI        🔔  👤 Jean    │
└──────────────────────────────────────────────┘
```

| Propriété | Valeur |
|-----------|--------|
| Hauteur | 64px |
| Background | `#FFFFFF` ou `#2E7D32` (clair) / `#161B22` (sombre) |
| Border-bottom | 1px solid `#E0E0E0` |
| Padding X | 24px |
| Notification bell | Badge rouge avec compteur |
| User avatar | 36×36px cercle, initiales |

### 4.3 Tableau de données (Data Table)

```
┌──────┬──────────┬──────────┬──────────┬──────┐
│  #   │  Capteur │ Valeur   │ État     │ Act. │
├──────┼──────────┼──────────┼──────────┼──────┤
│  1   │ DHT22    │ 25.3°C   │ ✅ Actif │ ⚙️   │
│  2   │ YL-69    │ 45%     │ ✅ Actif │ ⚙️   │
│  3   │ BH1750   │ 1200 lux│ ❌ Def.  │ ⚙️   │
└──────┴──────────┴──────────┴──────────┴──────┘
```

| Propriété | Valeur |
|-----------|--------|
| Header background | `#F5F7F2` (clair) / `#21262D` (sombre) |
| Header font | 12px Medium uppercase |
| Row height | 52px |
| Border | `#E0E0E0` 1px |
| Row hover | Fond `#E8F5E9` |
| Striped | Optionnel : odd rows `#F9FAF8` |
| Border-radius | 8px |
| Pagination | En bas : 10 / 25 / 50 lignes, navigation pages |

### 4.4 Graphiques / Charts (Chart.js)

#### Jauge (Gauge)

```
      ┌─────────────────────────────┐
      │      ┌─────────────────┐     │
      │      │    ▓▓▓▓░░░░░    │     │
      │      │    25.3 °C      │     │
      │      └─────────────────┘     │
      │      DHT22 - Température     │
      └─────────────────────────────┘
```

- Arc de cercle ou barre horizontale
- Dégradé vert ↔ orange ↔ rouge (selon seuils)
- Valeur centrale en Numeric bold
- Label en dessous (nom capteur + unité)
- Seuils matérialisés par des lignes de référence (min / max)

#### Line chart (historique)

```
         📈 Température (7 derniers jours)
   35 ┤        ╱╲     ╱╲
   30 ┤  ╱╲  ╱  ╲  ╱  ╲  ╱╲
   25 ┤ ╱  ╲╱    ╲╱    ╲╱  ╲
      └──────────────────────────
       Lun Mar Mer Jeu Ven Sam Dim
```

- Courbe principale en `#2E7D32`
- Zone de remplissage en `rgba(46,125,50,0.1)`
- Seuils en lignes pointillées orange
- Axe X : temps, Axe Y : valeur
- Tooltip au hover : date + valeur précise
- Périodes sélectionnables : 24h / 7j / 30j / 90j / Personnalisé

#### Bar chart (comparaison)

```
         ☀️ Luminosité par capteur
 2000 ┤  ████
 1500 ┤  ████  ████
 1000 ┤  ████  ████  ████
  500 ┤  ████  ████  ████  ████
      └──────────────────────────
        BH1750  Capt2  Capt3  Capt4
```

- Barres vertes `#43A047`
- Barre sélectionnée `#2E7D32`

### 4.5 Indicateur d'état d'actionneur

```
┌──────────────────────────────────────┐
│  💧 Pompe                             │
│                                       │
│     ┌───────────────────────┐         │
│     │      ● EN MARCHE      │         │
│     └───────────────────────┘         │
│                                       │
│  [   Démarrer  ]  [  Programmer  ]    │
└──────────────────────────────────────┘
```

| État | Couleur pastille | Texte |
|------|------------------|-------|
| Actif | `#43A047` vert | "En marche" |
| Inactif | `#BDBDBD` gris | "Arrêté" |
| Erreur | `#E53935` rouge | "Défaillant" |

- Carte avec icône (pompe 💧, ventilation 🌬️, éclairage 💡)
- Deux boutons d'action : bascule ON/OFF + programmation (durée)
- Timer visuel si programmé : "Arrêt dans 12s"

### 4.6 Carte de seuil configurable

```
┌──────────────────────────────────────┐
│  🌡️ Température                       │
│                                       │
│  Min ────●──────────────●─── Max      │
│         30°C            35°C          │
│                                       │
│  [ 30 °C ]  ──────────  [ 35 °C ]    │
│                                       │
│  [  Modifier  ]    [ Supprimer ]      │
└──────────────────────────────────────┘
```

- Double slider (curseur min/max)
- Inputs numériques synchronisés à côté
- Unité affichée
- Couleur de la barre : vert dans la zone normale, rouge si valeur critique

### 4.7 Carte d'alerte

```
┌───🟥──────────────────────────────────┐
│  CRITIQUE · CO₂ élevé                │
│  Valeur : 1200 ppm (seuil : 1000)    │
│  Parcelle : Serre A                  │
│  Il y a 2 min                        │
│                                       │
│  [  Reconnaître  ]                    │
└──────────────────────────────────────┘
```

- Bordure gauche colorée selon sévérité (rouge=critique, orange=haute, jaune=basse)
- Icône selon le type
- Bouton "Reconnaître" → passe à "reconnue"
- Possibilité de clore / résoudre

---

## 5. Pages / Écrans

### 5.1 Login

```
┌──────────────────────────────────────────┐
│                                          │
│              ┌──────────┐                │
│              │  LOGO     │               │
│              │  🌱 SAI   │               │
│              └──────────┘                │
│                                          │
│         Système Agricole Intelligent     │
│                                          │
│   ┌─────────────────────────────────┐   │
│   │ ✉️  Email                       │   │
│   │  emmanuel@sai.com              │   │
│   └─────────────────────────────────┘   │
│                                          │
│   ┌─────────────────────────────────┐   │
│   │ 🔒  Mot de passe                │   │
│   │  ********                      │   │
│   └─────────────────────────────────┘   │
│                                          │
│   [x] Se souvenir de moi                 │
│                                          │
│   ┌─────────────────────────────────┐   │
│   │        SE CONNECTER             │   │
│   └─────────────────────────────────┘   │
│                                          │
│   Mot de passe oublié ?                  │
│                                          │
│   ──────────────────────────────────     │
│   © 2026 SAI - Tous droits réservés     │
└──────────────────────────────────────────┘
```

**Figma frame** : 480×800 (centré sur desktop) / 100vw×100vh (mobile)

**Éléments** :
- Logo centré (icône feuille/plante + "SAI")
- Sous-titre "Système Agricole Intelligent"
- Champ email avec icône
- Champ password avec icône et toggle visibilité
- Checkbox "Se souvenir de moi"
- Bouton "Se connecter" → full-width, primary
- Lien "Mot de passe oublié ?"
- Footer copyright

**États** :
- **Chargement** : spinner dans le bouton, champs désactivés
- **Erreur** : message rouge sous le formulaire "Identifiants incorrects"
- **Validation** : erreur inline si champs vides ou email invalide

---

### 5.2 Dashboard (Tableau de bord)

```
┌──────────┬────────────────────────────────────────────────┐
│  SAI     │  🔔 Dashboard                     👤 Jean      │
│          │                                                │
│ 📊 Dashb │  ┌──────┬──────┬──────┬──────┬──────┐         │
│ 📈 Hist. │  │ 🌡️   │ 💧   │ ☀️   │ 🌿   │ 💨   │         │
│ ⚙️ Parc. │  │25.3°C│ 45%  │1200lx│ 800  │ 32%  │         │
│ 🔧 Act.  │  │ Temp │ Hum. │ Lum. │ CO₂  │ Eau  │         │
│ 📐 Seuil │  └──────┴──────┴──────┴──────┴──────┘         │
│ 👥 Users │                                                │
│          │  ┌────────────────────┐  ┌────────────────┐    │
│          │  │  [  🟢 Pompe  ]    │  │  Alertes (2)   │    │
│          │  │  [  🟡 Ventil. ]   │  │  🟥 CO₂ élevé  │    │
│          │  │  [  🔴 Éclair. ]   │  │  🟧 Temp haute│    │
│          │  └────────────────────┘  └────────────────┘    │
│          │                                                │
│          │  ┌────────────────────────────────────────┐    │
│          │  │  📈 Température (24h)                  │    │
│          │  │  ╱╲    ╱╲                              │    │
│          │  │ ╱  ╲  ╱  ╲  ╱╲                        │    │
│          │  │╱    ╲╱    ╲╱  ╲                       │    │
│          │  └────────────────────────────────────────┘    │
│          │                                                │
│          │  Dernière mise à jour : il y a 12s             │
└──────────┴────────────────────────────────────────────────┘
```

**Figma frame** : 1440×900

**Éléments** :
- Sidebar + Top bar
- **5 mini-jauges** en ligne (cartes de 240px) :
  - Température 🌡️ (valeur + unité, icône)
  - Humidité sol 💧
  - Luminosité ☀️
  - CO₂ 🌿
  - Niveau d'eau 💨
  - *Chaque jauge change de couleur selon les seuils*
- **Section Actionneurs** : 3 cartes (Pompe, Ventilation, Éclairage) avec état + bouton bascule
- **Section Alertes** : 3 dernières alertes non résolues
- **Graphique principal** : Température ou humidité sur 24h (line chart)
- **Indicateur de rafraîchissement** : "Dernière mise à jour : il y a Xs" en bas à droite

**États** :
- **Loading** : skeleton cards pour chaque section
- **Alerte critique** : Alerte s'affiche en haut du dashboard avec fond rouge, ne se ferme pas tant que non reconnue
- **Données vides** : Message "En attente des premiers relevés capteurs..."

---

### 5.3 Historique

```
┌──────────────────────────────────────────────┐
│  🔔 Dashboard > Historique                   │
│                                              │
│  Filtres :                                    │
│  [📅 Aujourd'hui ▼] [🌡️ Capteur ▼] [ Parcelle ▼] │
│                                              │
│  📈 Température - 7 derniers jours           │
│  ┌────────────────────────────────────────┐  │
│  │     ╱╲    ╱╲                          │  │
│  │    ╱  ╲  ╱  ╲  ╱╲                    │  │
│  │   ╱    ╲╱    ╲╱  ╲                   │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  [24h] [7j] [30j] [90j] [Personnalisé ▼]     │
│                                              │
│  ┌─────────┬───────┬───────┬───────┬────┐   │
│  │ Date    │ Capt. │ Valeur│ Unité │ Src│   │
│  ├─────────┼───────┼───────┼───────┼────┤   │
│  │ 12/07   │ DHT22 │ 25.3  │ °C    │ esp│   │
│  │ 12/07   │ YL-69 │ 45.0  │ %     │ esp│   │
│  │ ...     │       │       │       │    │   │
│  └─────────┴───────┴───────┴───────┴────┘   │
│  [← Précédent]  1 2 3 ... 12  [Suivant →]   │
│                                              │
│  [  Exporter CSV ▼ ]                         │
└──────────────────────────────────────────────┘
```

**Figma frame** : 1440×900

**Éléments** :
- Breadcrumb : Dashboard > Historique
- **Filtres** horizontaux : Période (date picker), Capteur (dropdown), Parcelle (dropdown)
- **Bouton "Appliquer"** les filtres
- **Graphique** principal (line chart) occupant ~40% de la hauteur
- **Sélecteur de période** : chips 24h/7j/30j/90j/Personnalisé
- **Tableau** paginé des mesures avec colonnes : Date, Capteur, Valeur, Unité, Source
- **Export CSV** button en bas à droite

**États** :
- **Loading** : skeleton pour le graphique + tableau
- **Aucune donnée** : "Aucune mesure trouvée pour cette période"
- **Export** : spinner pendant génération, puis téléchargement

---

### 5.4 Parcelles (Gestion)

```
┌──────────────────────────────────────────────┐
│  ⚙️ Parcelles               [+ Nouvelle]     │
│                                              │
│  ┌──────────────────────────────┐            │
│  │  🏠 Serre A                  │   ⋮        │
│  │  Jardin principal            │            │
│  │  ──────────────────────────  │            │
│  │  5 capteurs · 3 actionneurs  │            │
│  │  6 seuils configurés         │            │
│  │  🟢 Actif                    │            │
│  └──────────────────────────────┘            │
│                                              │
│  ┌──────────────────────────────┐            │
│  │  🏠 Champ Nord               │   ⋮        │
│  │  Parcelle B                  │            │
│  │  ──────────────────────────  │            │
│  │  3 capteurs · 2 actionneurs  │            │
│  │  4 seuils configurés         │            │
│  │  🟡 Inactif                  │            │
│  └──────────────────────────────┘            │
└──────────────────────────────────────────────┘
```

**Figma frame** : 1440×900

**Éléments** :
- Bouton "+ Nouvelle parcelle" → ouvre modal de création
- **Grille de cartes** (2 ou 3 colonnes) avec :
  - Nom, localisation
  - Résumé (nb capteurs, actionneurs, seuils)
  - Statut (Actif / Inactif) en badge
  - Menu contextuel (Modifier, Supprimer)
- **Modal de création/édition** :
  - Nom (input), Localisation (input), Propriétaire (select)

---

### 5.5 Actionneurs (Contrôle manuel + Gestion CRUD)

L'administrateur peut **consulter, commander, programmer, ajouter, modifier et supprimer** les actionneurs. L'agriculteur peut seulement consulter et commander.

```
┌──────────────────────────────────────────────┐
│  🔧 Actionneurs · Serre A     [+ Ajouter]   │
│                                              │
│  ┌────────────────────┐ ┌────────────────┐   │
│  │  💧 Pompe           │ │ 🌬️ Ventilation │   │
│  │  GPIO 26            │ │ GPIO 27        │   │
│  │  ● EN MARCHE       │ │ ○ ARRÊTÉ      │   │
│  │  Depuis 2h30       │ │                │   │
│  │                     │ │                │   │
│  │ [   Arrêter    ]   │ │ [ Démarrer  ]  │   │
│  │ [ Programmer ▼ ]   │ │ [ Programmer]  │   │
│  │                     │ │                │   │
│  │ ✏️ Modifier  🗑️     │ │ ✏️ Modifier 🗑️ │   │
│  └────────────────────┘ └────────────────┘   │
│                                              │
│  ┌────────────────────┐                      │
│  │  💡 Éclairage       │                      │
│  │  GPIO 25            │                      │
│  │  ● EN MARCHE       │                      │
│  │  (Programmé 12s)   │                      │
│  │                     │                      │
│  │ [   Arrêter    ]   │                      │
│  │ [ Programmer ▼ ]   │                      │
│  │                     │                      │
│  │ ✏️ Modifier  🗑️     │                      │
│  └────────────────────┘                      │
└──────────────────────────────────────────────┘
```

**Figma frame** : 1440×900

**Éléments** :
- Sélecteur de parcelle en haut (dropdown)
- **Bouton "+ Ajouter"** (visible admin uniquement) → ouvre le modal de création
- **Grille de cartes** d'actionneurs (3 col) avec pour chaque carte :
  - Icône + nom
  - GPIO (label discret en gris)
  - Indicateur d'état (pastille verte/grise/rouge + texte)
  - Durée si actif
  - Bouton principal (Arrêter si ON, Démarrer si OFF)
  - Bouton "Programmer" → modal durée
  - **Liens "Modifier" (✏️) et "Supprimer" (🗑️)** (visible admin uniquement, en bas de carte, texte gris)
- **Timeline** des dernières commandes en bas de page

---

#### Modal de création / modification d'un actionneur

```
┌─────────────────────────────────────────┐
│  ✏️  [Nouvel actionneur / Modifier]     │
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ 🏷️ Nom de l'actionneur *           ││
│  │  Ex: pompe, ventilation, eclairage ││
│  └─────────────────────────────────────┘│
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ 🔖 Référence (optionnel)           ││
│  │  Ex: Pompe 12V, LED 50W          ││
│  └─────────────────────────────────────┘│
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ 🔌 Broche GPIO *                   ││
│  │  [  26  ]     (0-39)              ││
│  └─────────────────────────────────────┘│
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ 🏠 Parcelle de rattachement *      ││
│  │  [  Serre A  ▼  ]                 ││
│  │  ├ Serre A                         ││
│  │  ├ Champ Nord                      ││
│  │  └ Serre B                         ││
│  └─────────────────────────────────────┘│
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ ⚡ État initial                     ││
│  │  ○ Actif  ● Inactif                ││
│  └─────────────────────────────────────┘│
│                                         │
│  [  Annuler  ]    [  💾 Enregistrer  ] │
└─────────────────────────────────────────┘
```

**Champs du formulaire :**

| # | Champ | Type Figma | Requis | Contraintes |
|---|-------|-----------|:------:|-------------|
| 1 | **Nom** | `Input text` | ✅ | 1 à 20 caractères, minuscules conseillées. Placeholder: `Ex: pompe, ventilation, eclairage` |
| 2 | **Référence** | `Input text` | ❌ | Max 50 caractères. Placeholder: `Ex: Pompe 12V, LED 50W` |
| 3 | **GPIO** | `Input number` | ✅ | Valeur entre 0 et 39 (broches ESP32). Afficher la plage `(0-39)` à droite. Validation : entier uniquement |
| 4 | **Parcelle** | `Select` | ✅ | Liste des parcelles chargée depuis l'API. La parcelle courante est pré-sélectionnée |
| 5 | **État initial** | `Radio group` | ❌ | Par défaut "Inactif". Deux options : Actif / Inactif |

**Champs exclus (générés automatiquement) :**
- `id` — SERIAL PK
- `created_at` / `updated_at` — horodatage automatique
- `commandes` — relation ORM, remplie via les commandes

**États du modal :**

| État | Rendu |
|------|-------|
| **Création** | Titre "Nouvel actionneur", tous les champs vides (ou defaults) |
| **Modification** | Titre "Modifier l'actionneur", champs pré-remplis avec les données existantes |
| **Nom vide** | Validation inline : `⚠️ Le nom est requis (max 20 car.)` |
| **GPIO invalide** | `⚠️ La broche GPIO doit être entre 0 et 39` |
| **GPIO déjà utilisé** | `⚠️ Cette broche GPIO est déjà utilisée par un autre actionneur` (vérification côté API) |
| **Parcelle non sélectionnée** | `⚠️ Veuillez sélectionner une parcelle` |
| **Soumission réussie** | Toast vert `✅ Actionneur "Pompe" créé` + fermeture du modal + refresh de la grille |
| **Erreur API** | Toast rouge avec le message d'erreur |

---

#### Modal de suppression d'un actionneur

```
┌─────────────────────────────────────────┐
│  🗑️ Supprimer l'actionneur              │
│                                         │
│  Es-tu sûr de vouloir supprimer         │
│  l'actionneur **💧 Pompe (GPIO 26)**     │
│  de la parcelle **Serre A** ?           │
│                                         │
│  ⚠️ Cette action est irréversible.      │
│  Toutes les commandes et actions liées   │
│  seront également supprimées.           │
│                                         │
│  [  Annuler  ]    [  🗑️ Supprimer  ]    │
└─────────────────────────────────────────┘
```

- Le bouton "Supprimer" est en **rouge** (bouton danger)
- Texte explicatif des conséquences (cascade delete)
- Modal de confirmation obligatoire avant suppression

---

#### Modal de programmation (existant)

```
┌─────────────────────────────────────────┐
│  ⏱ Programmer · 💧 Pompe               │
│                                         │
│  Activer la pompe pendant :             │
│                                         │
│  ┌─────┐ ┌──────────┐                  │
│  │  30 │ │ [secondes]▼│                │
│  └─────┘ └──────────┘                  │
│                                         │
│  [  Annuler  ]    [  ✅ Programmer  ]   │
└─────────────────────────────────────────┘
```

- Input numérique + select d'unité (secondes/minutes/heures)
- Valeur par défaut : 30 secondes
- Le bouton principal change de texte selon l'action : "Démarrer", "Programmer" (témoin des actions)

---

#### Modal : Ajouter / Modifier un actionneur

```
┌─────────────────────────────────────────┐
│  ➕ NOUVEL ACTIONNEUR                    │
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ 🔧 Nom de l'actionneur *           ││
│  │  Ex: pompe, ventilation, eclairage ││
│  └─────────────────────────────────────┘│
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ 🏷️ Référence fabricant (optionnel) ││
│  │  Ex: Pompe 12V, Ventilateur 120mm ││
│  └─────────────────────────────────────┘│
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ 🔌 Broche GPIO ESP32 *             ││
│  │  [  26  ]  (0-39)                  ││
│  └─────────────────────────────────────┘│
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ 📍 Parcelle de rattachement *      ││
│  │  [  Serre A  ▼  ]                  ││
│  └─────────────────────────────────────┘│
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ ⚡ État initial                     ││
│  │  ○ Actif  ● Inactif                ││
│  └─────────────────────────────────────┘│
│                                         │
│  [  Annuler  ]    [  ✅ Enregistrer  ]  │
└─────────────────────────────────────────┘
```

**Champs du formulaire :**

| # | Champ | Type Figma | Requis | Contraintes |
|---|-------|-----------|:------:|-------------|
| 1 | **Nom** | `Input text` | ✅ | 1 à 20 caractères. Placeholder "pompe, ventilation, eclairage" |
| 2 | **Référence** | `Input text` | ❌ | Max 50 caractères. Placeholder "Pompe 12V, Ventilateur 120mm" |
| 3 | **Broche GPIO** | `Input number` | ✅ | 0 à 39. Afficher la plage autorisée en helper text. Step 1 |
| 4 | **Parcelle** | `Select / Dropdown` | ✅ | Liste des parcelles chargée depuis l'API. Affiche le nom de la parcelle |
| 5 | **État initial** | `Radio group` | ❌ | Par défaut "Inactif". Deux options : Actif / Inactif |

**Comportements :**

| État | Rendu |
|------|-------|
| **Ouverture du modal (création)** | Titre "➕ Nouvel actionneur", champs vides, "État initial" par défaut sur Inactif |
| **Ouverture du modal (modification)** | Titre "✏️ Modifier {nom}", champs pré-remplis avec les données actuelles |
| **Nom vide** | Validation inline : `⚠️ Le nom est requis (1-20 caractères)` |
| **GPIO invalide** | Validation inline : `⚠️ La broche GPIO doit être entre 0 et 39` |
| **Parcelle non sélectionnée** | Bordure rouge + `⚠️ Veuillez sélectionner une parcelle` |
| **GPIO déjà utilisé** | Message d'erreur (vérification côté API) : `❌ La broche GPIO 26 est déjà utilisée par "Pompe"` |
| **Soumission réussie** | Toast vert `✅ Actionneur "Pompe" créé` + fermeture du modal + refresh grille |
| **Erreur API** | Toast rouge `❌ Erreur : {message}` |
| **Édition : même GPIO** | Toléré si c'est le même actionneur qu'on modifie |

---

#### Modal : Confirmation de suppression

```
┌─────────────────────────────────────────┐
│  🗑️ Supprimer l'actionneur ?           │
│                                         │
│  💧 Pompe                               │
│  Parcelle : Serre A                     │
│  GPIO 26                                │
│                                         │
│  ⚠️ Cette action est irréversible.      │
│  L'actionneur sera retiré du système.   │
│                                         │
│  [  Annuler  ]    [  Supprimer  (rouge) ]│
└─────────────────────────────────────────┘
```

| Élément | Valeur |
|---------|--------|
| Type | Modal destructif (bouton supprimer en rouge `#E53935`) |
| Contenu | Résumé de l'actionneur (icône, nom, parcelle, GPIO) |
| Message | "Cette action est irréversible." |
| Confirmation | L'utilisateur doit cliquer "Supprimer" explicitement |
| Succès | Toast `✅ Actionneur "Pompe" supprimé` + retrait de la grille |

---

#### Modèle de données (backend) pour référence

```python
# backend/models/actionneur.py
class Actionneur(Base):
    nom = Column(String(20), nullable=False)        # 'pompe', 'ventilation', 'eclairage'
    reference = Column(String(50), nullable=True)    # Référence fabricant
    gpio = Column(Integer, nullable=False)           # Broche GPIO ESP32 (0-39)
    etat = Column(String(10), nullable=False, default="inactif")  # 'actif', 'inactif'
    id_parcelle = Column(Integer, ForeignKey("parcelles.id"), nullable=False)
```

---

### 5.6 Seuils (Configuration)

```
┌──────────────────────────────────────────────┐
│  📐 Configuration des seuils · Serre A       │
│                                              │
│  La configuration des seuils permet de       │
│  définir les limites pour l'automatisation.   │
│                                              │
│  ┌─────────────────────────────────────────┐ │
│  │ 🌡️ Température                          │ │
│  │  Min ═══●═══════════════●═══ Max        │ │
│  │        30°C             35°C            │ │
│  │  [ 30 ] °C   ────   [ 35 ] °C          │ │
│  │  Automatisation : ✅ Activation ventilo │ │
│  │  [ Modifier ]  [Supprimer]              │ │
│  └─────────────────────────────────────────┘ │
│                                              │
│  ┌─────────────────────────────────────────┐ │
│  │ 💧 Humidité sol                          │ │
│  │  Min ═══●═══════════════●═══ Max        │ │
│  │        30%              70%             │ │
│  │  [ 30 ] %   ────   [ 70 ] %            │ │
│  │  Automatisation : ✅ Activation pompe   │ │
│  │  [ Modifier ]  [Supprimer]              │ │
│  └─────────────────────────────────────────┘ │
│                                              │
│  ┌─────────────────────────────────────────┐ │
│  │ 🌿 CO₂                                   │ │
│  │  Max seulement : ════════●═══════════   │ │
│  │                        1000 ppm          │ │
│  │  [ 1000 ] ppm                           │ │
│  │  Automatisation : ✅ Activation ventilo │ │
│  │  [ Modifier ]  [Supprimer]              │ │
│  └─────────────────────────────────────────┘ │
│                                              │
│  [  + Ajouter un seuil  ]                    │
└──────────────────────────────────────────────┘
```

**Figma frame** : 1440×900

**Éléments** :
- Sélecteur de parcelle
- Phrase d'introduction explicative
- **Cartes de seuil** avec :
  - Type de mesure + icône
  - **Double slider** (range) pour min/max
  - **Inputs numériques** synchronisés
  - Texte "Automatisation : ✅ Activation [action]"
  - Boutons Modifier / Supprimer
- Cas particulier : CO₂ → seuil max seulement (min pas pertinent)
- **Bouton "+ Ajouter un seuil"** → modal
- **Modal d'ajout** :
  - Type de mesure (dropdown)
  - Valeur min (number)
  - Valeur max (number)
  - Unité (auto-remplie selon type)
  - Action déclenchée (select : pompe, ventilo, éclairage, alerte)
  - Boutons Confirmer / Annuler

---

### 5.7 Utilisateurs (Admin only)

```
┌──────────────────────────────────────────────┐
│  👥 Gestion des utilisateurs  [+ Ajouter]   │
│                                              │
│  ┌─────┬──────────┬────────────┬──────┬───┐  │
│  │  #  │ Nom      │ Email      │ Rôle │ ⊹  │  │
│  ├─────┼──────────┼────────────┼──────┼───┤  │
│  │  1  │ Admin    │ admin@..   │ ⚠️   │ ✏️🗑️│  │
│  │     │          │            │ Admin│    │  │
│  │  2  │ Emmanuel │ emmanuel@..│ 👨‍🌾   │ ✏️🗑️│  │
│  │     │          │            │ Agri │    │  │
│  │  3  │ Jean     │ jean@...   │ 👨‍🌾   │ ✏️🗑️│  │
│  └─────┴──────────┴────────────┴──────┴───┘  │
│                                              │
│  [← Précédent]  1 sur 1  [Suivant →]         │
└──────────────────────────────────────────────┘
```

**Figma frame** : 1440×900

**Éléments** :
- Bouton "+ Ajouter" → ouvre modal de création
- **Tableau** des utilisateurs avec colonnes : ID, Nom, Email, Rôle, Actions
- **Badge de rôle** : Admin (rouge/info), Agriculteur (vert)
- **Actions** : Éditer (icône crayon), Supprimer (icône poubelle)
- **Modal de création/édition** :
  - Nom (input), Email (input email), Rôle (select), Mot de passe (input password)
  - Boutons Confirmer / Annuler
- **Modal de confirmation** "Supprimer l'utilisateur X ?" → destructif

---

### 5.8 Profil utilisateur

```
┌──────────────────────────────────────────────┐
│  👤 Mon Profil                                │
│                                              │
│  ┌─────────────────────────────────────────┐ │
│  │  ┌──────┐                              │ │
│  │  │  EM  │  Emmanuel                     │ │
│  │  └──────┘  emmanuel@sai.com             │ │
│  │             👨‍🌾 Agriculteur              │ │
│  │                                         │ │
│  │  [  Modifier le profil  ]               │ │
│  └─────────────────────────────────────────┘ │
│                                              │
│  ┌─────────────────────────────────────────┐ │
│  │  🔑 Clés API                             │ │
│  │  ┌──────┬──────────┬──────────┬──────┐  │ │
│  │  │ Nom  │ Clé       │ Expire   │ Act. │  │ │
│  │  ├──────┼──────────┼──────────┼──────┤  │ │
│  │  │ Dev  │ sk...fg  │ 31/12/27 │ ✅   │  │ │
│  │  └──────┴──────────┴──────────┴──────┘  │ │
│  │  [  + Générer une clé ]                  │ │
│  └─────────────────────────────────────────┘ │
│                                              │
│  ┌─────────────────────────────────────────┐ │
│  │  🔒 Sécurité                             │ │
│  │  [  Changer le mot de passe  ]          │ │
│  └─────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

**Figma frame** : 1440×900

**Éléments** :
- **Carte d'identité** : Avatar (initiales), nom, email, rôle
- **Section Clés API** : tableau + bouton générer → modal
- **Section Sécurité** : bouton changement mot de passe → modal
- **Modal changement de mot de passe** :
  - Ancien mot de passe, Nouveau mot de passe, Confirmation
- **Modal génération clé API** :
  - Nom de la clé, date d'expiration optionnelle
  - Affichage de la clé unique avec copie bouton (montrée 1 fois)

---

### 5.9 Notifications / Alertes (toast)

```
┌───────────────────────────────────────┐
│  ✅ Pompe activée avec succès         │ ✕
├───────────────────────────────────────┤
│  ❌ Erreur : impossible de contacter  │ ✕
│     l'ESP32                           │
├───────────────────────────────────────┤
│  ⚠️ CO₂ élevé : 1200 ppm (seuil 1000)│ ✕
└───────────────────────────────────────┘
```

- Position : Top-right, empilées
- Auto-dismiss : 5s pour succès, 10s pour avertissement
- Persistant pour les alertes critiques
- Animation : slide-in depuis la droite

---

## 6. Navigation & Routage

### 6.1 Arborescence

```
/login                    → Login
/                         → Dashboard (redirection si auth)
/dashboard                → Dashboard (page principale)
/history                  → Historique des mesures
/parcelles                → Gestion des parcelles
/parcelles/:id            → Détail d'une parcelle
/actionneurs              → Contrôle des actionneurs
/actionneurs/:id          → Détail d'un actionneur
/thresholds               → Configuration des seuils
/admin/users              → Gestion utilisateurs (admin only)
/profile                  → Profil utilisateur
/settings                 → Paramètres généraux
```

### 6.2 Structure de layout

```
Routes sans sidebar :
┌────────────────────────┐
│       LOGIN            │
│   (centré, pas de      │
│    sidebar)            │
└────────────────────────┘

Routes avec sidebar :
┌──────────┬────────────────────────────┐
│ SIDEBAR  │  TOP BAR                   │
│          ├────────────────────────────┤
│ 260px    │  CONTENU PRINCIPAL         │
│          │  (padding 24-32px)        │
│          │                            │
│          │  ← scrollable →            │
└──────────┴────────────────────────────┘
```

---

## 7. Spécifications Responsive

> **Approche : Desktop-first** — Le site est conçu d'abord pour un écran d'ordinateur (1440×900), puis adapté aux tablettes et mobiles. Les fonctionnalités ne sont jamais réduites sur mobile, seulement réorganisées.

### 7.1 Système de grille

| Breakpoint | Min width | Device | Colonnes | Gap | Container max-width | Cible |
|------------|-----------|--------|----------|-----|-------------------|-------|
| `sm` | 0px | Mobile portrait | 4 | 16px | 100% | Smartphones |
| `md` | 640px | Mobile paysage / petite tablette | 8 | 20px | 100% | Galaxy Tab, iPad mini |
| `lg` | 1024px | Tablette / petit desktop | 12 | 24px | 1200px | iPad Pro, laptop 13" |
| `xl` | 1280px | Desktop standard | 12 | 24px | 1440px | Écran 14-16" |
| `2xl` | 1536px | Grand écran | 12 | 32px | 100% | Écran 27"+ |

**Règle** : On utilise toujours des unités `rem` et `vw` plutôt que des px pour les largeurs, afin que le layout respire naturellement.

### 7.2 Layout général par breakpoint

```
DESKTOP (≥ 1024px) :
┌──────────┬──────────────────────────────────┐
│          │  TOP BAR (64px)                  │
│ SIDEBAR  ├──────────────────────────────────┤
│ (260px)  │  CONTENU PRINCIPAL               │
│          │  padding: 32px                   │
│          │  max-width du contenu: ~1100px   │
│          │  ← scroll vertical →             │
└──────────┴──────────────────────────────────┘

TABLET (768px → 1023px) :
┌──────┬─────────────────────────────────────┐
│      │  TOP BAR (56px, hamburger visible)  │
│ NAV  ├─────────────────────────────────────┤
│(64px)│  CONTENU PRINCIPAL                  │
│      │  padding: 24px                      │
│      │                                      │
└──────┴─────────────────────────────────────┘

MOBILE (< 768px) :
┌──────────────────────────────────────┐
│  TOP BAR (56px, hamburger + titre)   │
├──────────────────────────────────────┤
│  CONTENU PRINCIPAL                   │
│  padding: 16px                        │
│                                      │
├──────────────────────────────────────┤
│  BOTTOM NAV (64px, 5 icônes)        │
└──────────────────────────────────────┘
```

### 7.3 Comportement de la sidebar selon l'appareil

| État | Desktop (≥ 1024px) | Tablet (768-1023px) | Mobile (< 768px) |
|------|--------------------|--------------------|-----------------|
| **Par défaut** | Ouverte (260px) | Rétractée (64px, icônes) | Cachée |
| **Toggle** | Rétractable 260↔64px | Drawer overlay depuis la gauche | Drawer overlay depuis la gauche |
| **Texte** | Visible | Caché (tooltip au hover) | Caché |
| **Icônes** | 20px + label | 24px seules | Idem drawer |
| **Overlay** | Aucun | Fond semi-transparent | Fond semi-transparent |
| **Fermeture** | Clic toggle | Clic overlay ou toggle | Clic overlay ou toggle |

### 7.4 Top bar responsive

```
DESKTOP :
┌──────────────────────────────────────────────┐
│  ☰ (toggle sidebar)     SAI     🔔(3)  👤 Jean│
└──────────────────────────────────────────────┘

MOBILE :
┌──────────────────────────────────────────────┐
│  ☰     SAI - Dashboard          🔔(3)  👤   │
└──────────────────────────────────────────────┘
```

| Élément | Desktop | Mobile |
|---------|---------|--------|
| Menu toggle (sidebar) | Visible | Visible |
| Logo / Titre de page | Logo SAI | Titre de la page courante |
| Notification bell | Visible + badge | Visible + badge |
| User avatar | Nom + avatar | Avatar seul |
| Hauteur | 64px | 56px |

### 7.5 Contenu : grilles et cartes

#### Dashboard — mini-jauges

```
DESKTOP (≥ 1200px) :        TABLET (768-1199px) :       MOBILE (< 768px) :
┌────┐┌────┐┌────┐┌────┐┌──┐  ┌────┐┌────┐            ┌──────────┐
│ 🌡 ││ 💧 ││ ☀ ││ 🌿││ 💨│  │ 🌡 ││ 💧 │            │ 🌡️ 25.3°C │
│25° ││45% ││1200││800 ││32%│  │25° ││45% │            │ Temp.    │
└────┘└────┘└────┘└────┘└──┘  └────┘└────┘            ├──────────┤
                                ┌────┐┌────┐            │ 💧 45%   │
                                │ ☀ ││ 🌿│            │ Humidité│
                                │1200││800 │            ├──────────┤
                                └────┘└────┘            │ ☀️ 1200lx│
                                                         │ Lumin.  │
                                                         ├──────────┤
                                                         │ ...      │
                                                         └──────────┘
```

| Breakpoint | Colonnes | Taille de carte |
|------------|----------|-----------------|
| Desktop ≥ 1200px | 5 colonnes | 1/5 de la largeur |
| Desktop 1024-1199px | 3 + 2 (2 lignes) | 1/3 puis 1/2 |
| Tablet 768-1023px | 2 colonnes | 1/2 → wrap |
| Mobile < 768px | 1 colonne | Full width, vertical stack |

#### Section actionneurs (Dashboard)

| Breakpoint | Disposition |
|------------|-------------|
| Desktop | 3 cartes côte-à-côte (horizontal) |
| Tablet | 2 + 1 (2 col puis 1 col) |
| Mobile | 1 carte par ligne (vertical stack) |

#### Graphiques

| Breakpoint | Hauteur | Largeur |
|------------|---------|---------|
| Desktop | 350px | 100% du conteneur |
| Tablet | 280px | 100% du conteneur |
| Mobile | 220px | 100% du conteneur, scroll X si besoin |

### 7.6 Tableaux responsifs

Sur **tablet et mobile**, les tableaux ne rétrécissent pas — ils deviennent injouables en dessous d'une certaine largeur. Deux stratégies complémentaires :

#### Stratégie A : Scroll horizontal (recommandé pour les tableaux denses)

```
┌──────────────────────────────────────┐
│  ← faites défiler →                  │
│  ┌───────────────────────────────┐   │
│  │ 📅 Date │ 🌡️ Val │ Unité │ 📍 │   │
│  │─────────│────────│───────│────│   │
│  │ 09/07   │ 25.3   │ °C    │ DH │   │
│  │ 09/07   │ 45.0   │ %     │ YL │   │
│  └───────────────────────────────┘   │
│  Indice visuel : ombre à droite      │
└──────────────────────────────────────┘
```

- Le tableau conserve ses colonnes
- Un ombre portée à droite indique qu'il y a plus de contenu
- L'utilisateur swipe / scroll horizontalement
- Les en-têtes restent figées (sticky first column optionnel)

#### Stratégie B : Cards verticales (recommandé pour les listes simples)

```
MOBILE :
┌────────────────────────────────┐
│  📅 09/07/2026 14:30          │
│  🌡️ DHT22 · 25.3 °C          │
│  📡 Source: ESP32             │
├────────────────────────────────┤
│  📅 09/07/2026 14:25          │
│  💧 YL-69 · 45.0 %           │
│  📡 Source: ESP32             │
└────────────────────────────────┘
```

**Quand utiliser A ou B ?**

| Type de données | Desktop | Tablet | Mobile |
|----------------|---------|--------|--------|
| Mesures (historique) | Tableau complet | Scroll horizontal | Scroll horizontal |
| Utilisateurs | Tableau complet | Cards verticales | Cards verticales |
| Commandes récentes | Tableau complet | Cards verticales | Cards verticales |
| Capteurs / Actionneurs | Grille de cartes | Grille 2 col | 1 col |

### 7.7 Pages : adaptations détaillées

#### Login

```
DESKTOP :                     MOBILE :
┌──────────────────────┐     ┌──────────────────┐
│      ┌──────────┐    │     │    ┌──────────┐  │
│      │  LOGO    │    │     │    │  LOGO    │  │
│      └──────────┘    │     │    └──────────┘  │
│                      │     │                  │
│  ┌────────────────┐  │     │  ┌────────────┐ │
│  │  Champ email   │  │     │  │ Champ email│ │
│  └────────────────┘  │     │  └────────────┘ │
│                      │     │                  │
│  ┌────────────────┐  │     │  ┌────────────┐ │
│  │  Mot de passe  │  │     │  │ Mot passe  │ │
│  └────────────────┘  │     │  └────────────┘ │
│                      │     │                  │
│  [  Se connecter  ]  │     │ [ Se connecter ]│
└──────────────────────┘     └──────────────────┘
```

| Propriété | Desktop | Mobile |
|-----------|---------|--------|
| Position | Centré vertical + horizontal | Centré horizontal, 20% top |
| Card width | 420px max | 100% (padding 24px) |
| Logo | 64×64px | 48×48px |
| Marges hautes | Auto (centré) | 40px top |
| Background | Vert subtil ou image de fond | Blanc pur |

#### Dashboard

| Section | Desktop | Tablet | Mobile |
|---------|---------|--------|--------|
| Mini-jauges | 5 colonnes | 2+2+1 (wrap) | 1 colonne (stack) |
| Actionneurs + Alertes | 2 colonnes côte-à-côte | 2 colonnes | 1 colonne (stack) |
| Graphique | Pleine largeur | Pleine largeur | Pleine largeur |
| Refresh indicator | Top-right | Top-right | Sous le graphique |

#### Historique

| Élément | Desktop | Tablet | Mobile |
|---------|---------|--------|--------|
| Filtres | Ligne horizontale | Wrap sur 2 lignes | Wrap vertical (stack) |
| Date picker | Inline | Inline | Pleine largeur |
| Graphique | 400px haut | 280px haut | 220px haut |
| Tableau | Complet avec pagination | Scroll horizontal | Scroll horizontal |
| Export CSV | Visible | Icône seule | Menu flottant |

#### Seuils (Configuration)

| Élément | Desktop | Tablet | Mobile |
|---------|---------|--------|--------|
| Cartes de seuil | 2 colonnes | 2 colonnes | 1 colonne |
| Double slider | Horizontal, 300px+ | Horizontal, réduit | Pleine largeur |
| Inputs numériques | Côte-à-côte | Côte-à-côte | Ligne séparée |
| Boutons Modifier/Suppr | Bas de carte | Bas de carte | Bas de carte, full width |

#### Actionneurs

| Élément | Desktop | Tablet | Mobile |
|---------|---------|--------|--------|
| Cartes d'actionneurs | 3 colonnes | 2 colonnes | 1 colonne |
| Sélecteur parcelle | Dropdown inline | Dropdown inline | Pleine largeur |
| Boutons ON/OFF | Côte-à-côte | Côte-à-côte | Full width, stack |

#### Gestion utilisateurs (admin)

| Élément | Desktop | Tablet | Mobile |
|---------|---------|--------|--------|
| Tableau | Complet | Cards verticales | Cards verticales |
| Bouton + Ajouter | Top-right | Top-right | Pleine largeur en haut |
| Modal création | Centré, 480px | Pleine écran (drawer) | Pleine écran (drawer) |

### 7.8 Modaux et dialogues responsifs

| Propriété | Desktop (≥ 1024px) | Tablet (768-1023px) | Mobile (< 768px) |
|-----------|--------------------|--------------------|-----------------|
| Largeur | 480px (ou 640px pour formulaires longs) | 90vw, max 600px | 100vw, 100vh (drawer) |
| Position | Centré | Centré | Bottom sheet ou plein écran |
| Border-radius | 16px | 12px | 0 (plein écran) ou 16px top (sheet) |
| Padding | 24px | 20px | 16px |
| Fermeture | ✕ top-right + click overlay | ✕ top-right + click overlay | ✕ top-right + swipe down |
| Animation | Scale + fade | Scale + fade | Slide-up (bottom sheet) |

```
MOBILE BOTTOM SHEET :
┌──────────────────────────────────────────┐
│  ─── (drag handle, 32px, center)        │
│                                          │
│  Titre du modal                          │
│  ──────────────────────────────────────  │
│                                          │
│  Contenu du formulaire                   │
│  Champ 1                                 │
│  Champ 2                                 │
│                                          │
│  ┌──────────────────────────────────┐   │
│  │         Confirmer                │   │
│  ├──────────────────────────────────┤   │
│  │         Annuler                  │   │
│  └──────────────────────────────────┘   │
└──────────────────────────────────────────┘
```

### 7.9 Navigation mobile (Bottom nav)

```
┌──────┬──────┬──────┬──────┬──────┐
│ 📊  │ 📈  │ ⚙️  │ 🔧  │ 👤  │
│ Dash │ Hist │ Parc │ Act. │ Plus │ ← 5e = menu déroulant
└──────┴──────┴──────┴──────┴──────┘
```

| Propriété | Valeur |
|-----------|--------|
| Hauteur | 64px (dont safe-area-bottom pour iPhone) |
| Background | `#FFFFFF` (clair) / `#161B22` (sombre) |
| Border-top | 1px solid `#E0E0E0` |
| Icônes | 24×24px |
| Label | 10px Medium, sous l'icône |
| Actif | Vert `#2E7D32` |
| Inactif | Gris `#8B949E` |
| Items | 5 max (le 5e = "Plus" avec les entrées restantes) |
| Safe area | Padding-bottom: env(safe-area-inset-bottom) |

**Ordre des onglets sur mobile :**

1. Dashboard (📊) — page d'accueil
2. Historique (📈) — consultation principale
3. Parcelles (⚙️)
4. Actionneurs (🔧)
5. Plus (👤) — Profil, Seuils, Admin, Déconnexion

### 7.10 Ajustements typographiques responsifs

| Style | Desktop | Tablet | Mobile |
|-------|---------|--------|--------|
| H1 | 32px | 28px | 24px |
| H2 | 24px | 22px | 20px |
| H3 | 20px | 18px | 16px |
| Body | 14px | 14px | 14px |
| Numeric (dashboard) | 32-48px | 28-40px | 24-32px |

### 7.11 Touch targets (mobile et tablette)

| Élément | Taille minimale | Notes |
|---------|-----------------|-------|
| Boutons | 44×44px | Standard Apple HIG |
| Liens dans texte | 44×44px | Zone de clic étendue |
| Icônes cliquables | 44×44px | Padding autour de l'icône |
| Inputs | 44px haut | Idem desktop |
| Checkbox / Radio | 24×24px | Plus grand que desktop (20px) |
| Toggle | 48×28px | Plus grand que desktop (44×24) |
| Bottom nav items | 64×64px (zone de clic) | Toute la zone |
| Espacement entre cliquables | ≥ 8px | Éviter les doubles taps |

### 7.12 Points de vigilance responsive

| Problème | Solution |
|----------|----------|
| Graphiques trop petits | Toujours `width: 100%`, hauteur minimale 220px |
| Tableaux qui débordent | Scroll horizontal avec ombre indicatrice + sticky 1ère colonne |
| Double slider sur mobile | Empiler min/max verticalement ou utiliser des inputs séparés |
| Sidebar qui prend trop de place | Drawer overlay avec tap pour fermer |
| Trop d'infos dans les cartes | Réduire les métadonnées, utiliser des badges |
| Modaux qui débordent | Bottom sheet ou plein écran sur mobile |
| Alertes toasts invisibles | Position top avec padding safe-area |
| Bottom nav cache du contenu | Padding-bottom: calc(64px + env(safe-area-inset-bottom)) |
| Trop de colonnes de filtres | Passer en vertical stack sur mobile |
| Images ou icônes qui rétrécissent mal | `flex-shrink: 0` ou tailles en rem |
| Zoom indésirable sur input (iOS) | `font-size: 16px` minimum sur les inputs |

### 7.13 Récapitulatif : rendu final par page

| Page | Desktop frame | Tablet frame | Mobile frame |
|------|--------------|--------------|--------------|
| Login | 1440×900 | 834×1194 | 390×844 |
| Dashboard | 1440×900 | 834×1194 | 390×844 |
| Historique | 1440×900 | 834×1194 | 390×844 |
| Parcelles | 1440×900 | 834×1194 | 390×844 |
| Actionneurs | 1440×900 | 834×1194 | 390×844 |
| Seuils | 1440×900 | 834×1194 | 390×844 |
| Utilisateurs | 1440×900 | 834×1194 | 390×844 |
| Profil | 1440×900 | 834×1194 | 390×844 |

> **Dans Figma** : Créer 3 variants de chaque page (Desktop / Tablet / Mobile) avec Auto Layout. Utiliser les contraintes "Fill" pour les éléments qui doivent s'étirer, et "Hug" pour ceux qui ont une taille fixe.

### 7.14 Test de responsive : scénarios à valider

- [ ] **1440×900** (desktop standard) : tout est visible sans scroll horizontal
- [ ] **1280×720** (petit écran) : sidebar rétractable, grilles passent à 3 colonnes
- [ ] **1024×768** (iPad) : sidebar en icônes, cartes 2 colonnes
- [ ] **834×1194** (iPad Pro portrait) : bottom nav + contenu 1-2 colonnes
- [ ] **768×1024** (iPad portrait) : bottom nav, tout en 1-2 colonnes
- [ ] **430×932** (iPhone 14 Pro Max) : bottom nav, 1 colonne, polices lisibles
- [ ] **390×844** (iPhone 14) : bottom nav, tout en stack vertical
- [ ] **375×667** (iPhone SE) : minimum, vérifier que rien ne déborde
- [ ] **Chargement lent :** les skeletons cards s'affichent correctement à toutes les tailles

---

## 8. Animations & Micro-interactions

| Élément | Animation | Durée | Easing |
|---------|-----------|-------|--------|
| Sidebar collapse | Width transition 260px ↔ 64px | 250ms | ease-in-out |
| Page transition | Fade in | 200ms | ease |
| Modal appear | Scale 0.95→1 + fade | 200ms | ease-out |
| Toast appear | Slide right → left | 300ms | ease |
| Button hover | Fond opacité | 150ms | ease |
| Button click | Scale 0.98 | 100ms | ease |
| Skeleton | Pulse opacity | 1.5s | ease-in-out |
| Chart tooltip | Opacity 0→1 | 150ms | ease |
| Notification badge | Scale pop | 200ms | bounce |
| Toggle switch | Knob slide + bg color | 200ms | ease |
| Dropdown open | Opacity + translateY(-4px) | 150ms | ease-out |
| Row hover (table) | Fond change | 100ms | ease |

---

## 9. Annexes

### 9.1 Icônes

- **Set recommandé** : [Lucide React](https://lucide.dev/) (open source, 1000+ icônes)
- **Taille standard** : 20×20px (ou 24×24px pour navigation)
- **Couleur** : Hérite du texte parent ou couleur contextuelle

Liste des icônes par section :

| Section | Icône |
|---------|-------|
| Dashboard | `LayoutDashboard` |
| Historique | `LineChart` |
| Parcelles | `Farm` / `MapPin` |
| Actionneurs | `Zap` / `Cpu` |
| Seuils | `SlidersHorizontal` |
| Utilisateurs | `Users` |
| Profil | `User` |
| Pompe | `Droplet` |
| Ventilation | `Wind` |
| Éclairage | `Sun` |
| Température | `Thermometer` |
| Humidité | `Droplets` |
| CO₂ | `Cloud` |
| Alerte | `AlertTriangle` / `AlertCircle` |
| Login | `LogIn` |
| Déconnexion | `LogOut` |

### 9.2 Spacing system

| Token | Pixels | Usage |
|-------|--------|-------|
| space-xs | 4px | Petits écarts |
| space-sm | 8px | Entre icône et texte |
| space-md | 12px | Padding interne carte |
| space-lg | 20px | Padding carte standard |
| space-xl | 24px | Entre sections |
| space-2xl | 32px | Marge top de page |
| space-3xl | 48px | Grandes séparations |

### 9.3 Shadow system

| Niveau | Desktop (clair) | Mode sombre |
|--------|-----------------|-------------|
| sm | `0 1px 2px rgba(0,0,0,0.05)` | `0 1px 2px rgba(0,0,0,0.3)` |
| md (cards) | `0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)` | `0 1px 3px rgba(0,0,0,0.4)` |
| lg (dropdown) | `0 4px 20px rgba(0,0,0,0.12)` | `0 4px 20px rgba(0,0,0,0.5)` |
| xl (modal) | `0 8px 40px rgba(0,0,0,0.16)` | `0 8px 40px rgba(0,0,0,0.6)` |

### 9.4 Border-radius system

| Token | Valeur | Usage |
|-------|--------|-------|
| radius-sm | 4px | Checkbox, inputs |
| radius-md | 8px | Boutons, cartes légères |
| radius-lg | 12px | Cartes principales |
| radius-xl | 16px | Modals |
| radius-full | 9999px | Badges, pills |

### 9.5 États vides (Empty states)

Chaque page doit avoir un état vide designé :

```
┌────────────────────────────────┐
│                                │
│         📊 (icône 64px)       │
│                                │
│    Aucune donnée disponible    │
│                                │
│  Les mesures apparaîtront ici  │
│  dès que les capteurs          │
│  commenceront à transmettre.   │
│                                │
│  [  Configurer les capteurs  ] │
│                                │
└────────────────────────────────┘
```

- Icône en gris clair (64×64px)
- Titre : "Aucune donnée disponible" (H3)
- Description : texte secondaire
- CTA : bouton d'action pertinent (optionnel)

---

## 10. Checklist Figma

- [ ] Créer les **color styles** (clair + sombre) → 20+ styles
- [ ] Créer les **text styles** → 10 styles (H1→Caption, Button, Numeric)
- [ ] Créer les **effect styles** (shadows) → 4 niveaux × 2 modes
- [ ] Créer les **grid styles** (responsive)
- [ ] Créer les **composants atomiques** : Button, Input, Checkbox, Toggle, Badge, Card, Modal, Alert, Tooltip, Skeleton
- [ ] Créer les **composants moléculaires** : Sidebar, TopBar, DataTable, SensorGauge, ActuatorCard, ThresholdCard, AlertCard, ChartContainer, FilterBar
- [ ] Créer les **pages** : Login, Dashboard, History, Parcelles, Actionneurs, Thresholds, Users (admin), Profile
- [ ] Créer les **variants** : chaque composant → tous ses états
- [ ] Créer les **prototypes** : flux complet (Login → Dashboard → Actionneurs → Seuils → Historique)
- [ ] Appliquer **Auto Layout** sur chaque frame
- [ ] Vérifier **contraste WCAG AA** minimum (ratio 4.5:1 pour le texte)

---

> **Document généré le 09/07/2026** — Prêt pour la création de la maquette Figma.
