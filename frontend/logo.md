# Brief de Conception — Logo du SAI

## Résumé du projet

**SAI** (Système Agricole Intelligent) est une application web et IoT de **surveillance et automatisation agricole**. Elle connecte des capteurs physiques (humidité du sol, température, luminosité, CO₂, niveau d'eau) via un ESP32 à un dashboard web React, permettant à un agriculteur de surveiller ses parcelles en temps réel, recevoir des alertes, et commander des actionneurs (pompe d'irrigation, ventilation, éclairage).

---

## Identité visuelle à traduire

| Concept | Signification dans le projet |
|---------|------------------------------|
| **Agriculture / Nature** | Parcelles, cultures, irrigation, sol |
| **Intelligence / Technologie** | ESP32, automatisation, MQTT, données temps réel |
| **Surveillance / Contrôle** | Dashboard, capteurs, alertes, seuils |
| **Fiabilité / Simplicité** | Interface professionnelle, confiance de l'agriculteur |

---

## Contraintes existantes (Charte graphique du projet)

La charte graphique (`figma.md`) définit déjà :

| Élément | Valeur |
|---------|--------|
| **Couleur primaire** | `#2E7D32` (vert forêt) |
| **Police du projet** | Inter |
| **Mode clair / sombre** | Le logo doit fonctionner sur fond blanc (`#FFFFFF`), fond surface (`#F5F7F2`), et fond sombre (`#0D1117` / `#161B22`) |
| **Emplacement** | Sidebar (260px ouvert, 64px réduit), page Login (centré), top bar |
| **Taille min.** | 48×48px (favicon) jusqu'à 64×64px (login) |

---

## Description pour le concept du logo

### Concept principal : La feuille connectée

Le logo fusionne **une feuille de plante** et **un circuit/microcontrôleur** pour incarner l'alliance entre agriculture et technologie.

#### Forme

- **Silhouette de feuille** stylisée et épurée (forme ovale/lancéolée avec une pointe vers le haut-droite pour évoquer la croissance et l'optimisme)
- **Nervure centrale de la feuille** remplacée par une **ligne de circuit** (trait horizontal ponctué de 2-3 petits ronds/nœuds) qui symbolise les capteurs IoT et la transmission de données
- La ligne de circuit part de la tige (base) et se déploie dans la feuille, évoquant le flux de données depuis les capteurs vers le cloud
- Quelques **petites branches secondaires** partant de la nervure centrale pour donner un aspect de feuille réaliste tout en rappelant des chemins de circuit imprimé

#### Variantes

| Variante | Usage |
|----------|-------|
| **Icône seule** | Favicon (16/32px), sidebar réduite (24px), bottom nav mobile |
| **Icône + texte "SAI"** | Sidebar ouverte, header top bar, login page |
| **Icône + texte complet "Système Agricole Intelligent"** | Page de login uniquement (sous-titre) |

#### Palette

| Élément | Mode clair | Mode sombre |
|---------|-----------|-------------|
| Feuille (corps) | `#2E7D32` | `#66BB6A` |
| Ligne de circuit | `#FFFFFF` (contre-jour sur la feuille) | `#0D1117` (sur la feuille claire) |
| Texte "SAI" | `#1A1A1A` | `#F0F0F0` |
| Texte complet | `#5A5A5A` | `#8B949E` |

#### Style

- **Flat design** (pas d'ombres portées, pas de dégradés lourds)
- **Coin arrondis** cohérents avec le design system (border-radius 8px)
- **Épaisseur de trait** constante (style "outline" ou "line icon", comme Lucide)
- Pas de détails trop fins qui disparaîtraient en petite taille

#### Ce qu'il faut éviter

- ❌ Image photoréaliste de plante
- ❌ Formes trop complexes (invisibles en favicon)
- ❌ Couleurs supplémentaires en dehors de la charte
- ❌ Texte dans le favicon (seulement l'icône seule)
- ❌ Symboles trop techniques seuls (circuit sans feuille = trop informatique)

---

## Contraintes techniques

| Format | Taille | Usage |
|--------|--------|-------|
| **SVG** | Vectoriel | Source principale, tous les usages web |
| **PNG** | 512×512, 192×192, 48×48, 32×32, 16×16 | Favicon, splash screens, exports |
| **ICO** | 32×32, 16×16 | Favicon navigateur (`favicon.ico`) |

---

## Résumé en une phrase

> Un logo **feuille stylisée** en **vert forêt** (`#2E7D32`) dont la nervure centrale est remplacée par un **circuit IoT** fin, accompagné du texte **"SAI"** en Inter Bold — épuré, moderne, lisible de 16px à 512px, fonctionnant en mode clair et sombre.
