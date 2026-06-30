# Explication du Diagramme d'Activité — Cycle de vie ESP32

## 📖 Introduction

Le diagramme d'activité modélise le **flux d'exécution complet** du microcontrôleur ESP32, depuis sa mise sous tension jusqu'à son extinction. Il couvre à la fois :

- Les décisions du **moteur d'automatisation** (irrigation, ventilation, éclairage)
- Les **sécurités** (niveau d'eau critique, perte de connexion)
- Les **modes de fonctionnement** (Normal / Dégradé local)

### Fichiers disponibles dans ce dossier

| Fichier | Contenu |
|---------|---------|
| `diagramme_activite_complet.md` | Version monolithique (les 3 phases en un seul diagramme) |
| `diagramme_activite_initialisation.md` | **Phase 1** : Boot → Config → Connexion → Choix mode (Normal/Dégradé) |
| `diagramme_activite_automatisation.md` | **Phase 2** : Boucle 5 min → Lecture capteurs → Décisions → Sécurité |
| `diagramme_activite_extinction.md` | **Phase 3** : Interruption → Arrêt séquentiel → Publication → Extinction |
| `explication_activite.md` | Ce fichier — explication détaillée complète |

---

## 🏗️ Structure générale (3 phases)

Le diagramme est divisé en **3 grandes phases** qui représentent le cycle de vie complet :

```
┌──────────────────────────────────────────────────────┐
│  PHASE 1 : INITIALISATION                            │
│  ESP32 sous tension → Config → Connexion → Choix     │
│  mode                                                 │
├──────────────────────────────────────────────────────┤
│  PHASE 2 : BOUCLE D'AUTOMATISATION                   │
│  Lire capteurs → Décisions → Actions → Sécurité      │
│  → Timer 5 min → Boucle                              │
├──────────────────────────────────────────────────────┤
│  PHASE 3 : EXTINCTION                                │
│  Interruption → Arrêt propre → Désactiver tout → Fin │
└──────────────────────────────────────────────────────┘
```

---

## 🔵 Phase 1 : Initialisation (lignes 10-26)

### Étape par étape :

| Étape | Nœud | Description |
|-------|------|-------------|
| 1 | `Debut ((ESP32 sous tension))` | L'ESP32 reçoit du courant (branchement, reset) |
| 2 | `Init [Initialisation ESP32]` | Le firmware configure les broches GPIO (26, 27, 25 en sortie ; 34, 35, 32, 4, 21, 22 en entrée), les protocoles I2C (BH1750), ADC (YL-69, SEN0159, niveau eau), et les timers internes |
| 3 | `WiFi {Tenter connexion}` | L'ESP32 tente de se connecter au réseau Wi-Fi configuré |
| 4 | `MQTT {Tenter connexion broker}` | Si Wi-Fi OK, il tente de se connecter au broker Mosquitto (port 8883 TLS) |

### Décision : Normal ou Dégradé ?

```
                    ┌──────────────┐
                    │  INIT ESP32   │
                    └──────┬───────┘
                           ▼
                    ┌──────────────┐
                    │ Tentative    │
                    │ Wi-Fi        │
                    └──┬───────┬───┘
               Échec  │       │  Succès
                      ▼       ▼
               ┌──────────┐ ┌──────────────┐
               │  Mode    │ │ Tentative    │
               │ Dégradé  │ │ MQTT         │
               │  Local   │ └──┬───────┬───┘
               └──────────┘ Échec│       │Succès
                                ▼       ▼
                         ┌──────────┐ ┌──────────┐
                         │  Mode    │ │  Mode    │
                         │ Dégradé  │ │  Normal  │
                         └──────────┘ └──────────┘
```

**Pourquoi cette double sécurité ?** L'ESP32 peut avoir le Wi-Fi mais pas le broker MQTT (ex: serveur MQTT down). Dans les deux cas, il bascule en **Mode Dégradé Local** où il exécute lui-même les règles d'automatisation critiques.

---

## 🟠 Phase 2 : Boucle d'Automatisation (lignes 28-91)

### 2.1. Boucle principale (ligne 30)

```
Boucle[Boucle automatisation toutes les 5 min]
```

Le cœur du système : toutes les **5 minutes**, le cycle complet se répète. Cette période est configurable.

### 2.2. Lecture des capteurs (lignes 32-36)

| Capteur | Valeur mesurée | Protocole |
|---------|---------------|-----------|
| DHT22 | Température + Humidité air | GPIO4 (Digital) |
| YL-69 | Humidité du sol | GPIO34 (ADC) |
| BH1750 | Luminosité | GPIO21/22 (I2C) |
| SEN0159 | CO₂ | GPIO35 (ADC) |
| Niveau eau | Niveau du réservoir | GPIO32 (ADC) |

**Publication MQTT** (ligne 34) : En mode Normal, les mesures sont envoyées au broker sur `sai/parcelle1/capteurs/mesures`. En mode Dégradé, cette étape est sautée.

### 2.3. Décision Irrigation (lignes 38-58)

#### Logique de déclenchement :

```
┌─ SI humidité_sol < 30% ET pompe inactive ──────┐
│   → Vérifier niveau réservoir                   │
│     ├─ SI niveau > 10% → Activer pompe          │
│     └─ SI niveau ≤ 10% → Alerte réservoir vide  │
└─────────────────────────────────────────────────┘

┌─ SI humidité_sol > 50% ET pompe active ─────────┐
│   → Désactiver pompe                             │
└─────────────────────────────────────────────────┘
```

**Décision :** `Reserv {Verifier reservoir}` — Avant d'activer la pompe, on vérifie le niveau d'eau pour ne pas pomper à sec. C'est une sécurité mécanique.

**Alerte réservoir :** `AlertNiv[Alerte reservoir]` — Si le niveau est trop bas (< 10%), une notification est envoyée au dashboard et l'irrigation est bloquée.

**Arrêt automatique :** `StopPompeC {Arreter pompe}` — Quand l'humidité dépasse 50%, la pompe est désactivée. C'est **l'hystérésis** (écart de 20% entre seuil min et max) qui évite les cycles marche/arrêt trop fréquents.

### 2.4. Actions parallèles : Notifications (lignes 60-66)

Après chaque action (pompe ON, pompe OFF, alerte), **deux actions se produisent en parallèle** :

```
Suite1[Notifications]
    ├── Notif1[Notification dashboard WebSocket]
    └── Notif2[Mise a jour BD statut action]
```

- **WebSocket** : Le dashboard reçoit la notification en temps réel (pas de rafraîchissement manuel)
- **Base de Données** : L'action est enregistrée pour l'historique

### 2.5. Décision Ventilation (lignes 68-82)

#### Logique de déclenchement :

```
┌─ SI température > 35°C OU CO₂ > 1000 ppm ───────┐
│   → Activer ventilation (GPIO27 HIGH)             │
└─────────────────────────────────────────────────┘

┌─ SI température < 30°C ET CO₂ < 800 ppm ─────────┐
│   → Désactiver ventilation (GPIO27 LOW)           │
└─────────────────────────────────────────────────┘
```

**Pourquoi deux seuils (35°C/1000 ppm → 30°C/800 ppm) ?** C'est encore l'hystérésis : on ne coupe pas la ventilation dès que la valeur redescend juste sous le seuil, on attend qu'elle redescende suffisamment bas.

### 2.6. Décision Éclairage (lignes 84-92)

```
┌─ SI luminosité < 200 lux depuis plus d'1h ───────┐
│   → Allumer éclairage (GPIO25 HIGH)               │
└─────────────────────────────────────────────────┘
```

**Condition temporelle :** L'éclairage ne s'allume pas immédiatement si une ombre passe devant le capteur. Il faut que la luminosité reste basse pendant **au moins 1 heure**.

### 2.7. Vérifications de Sécurité parallèles (lignes 94-114)

**Deux surveillances en parallèle :**

#### Sécurité 1 : Niveau d'eau critique

```
Sec1[Surveiller niveau eau]
    ├── SI niveau < 5% → AlertCrit[Alerte critique notification]
    └── SI niveau ≥ 5% → Timer (continuer)
```

Le seuil de **5%** est différent du seuil d'irrigation (10%) :
- **10%** : Trop bas pour irriguer (on bloque la pompe)
- **5%** : Critique (alerte urgente, le réservoir est presque vide)

#### Sécurité 2 : Connexion réseau

```
Sec2[Surveiller connexion]
    ├── OK → Timer (continuer)
    └── Perte détectée → Reconnex[Tenter reconnexion]
        ├── Succès → Retour mode Normal
        └── Échec → Rester en mode Dégradé
```

**En mode Dégradé :** L'ESP32 exécute localement les règles d'automatisation (seuils d'humidité et température) pour protéger les cultures. Il tente de se reconnecter à chaque cycle.

### 2.8. Retour boucle (ligne 116)

```
Timer[Attente 5 minutes] --> Boucle
```

Une fois toutes les vérifications faites, le système attend **5 minutes** puis recommence.

---

## 🔴 Phase 3 : Extinction (lignes 118-126)

Le système peut s'arrêter de deux façons :

| Déclencheur | Description |
|-------------|-------------|
| `Boucle -.->|Interruption| Extinction` | Coupure de courant, reset manuel, ou commande d'extinction |
| `Init -.->|Echec materiel| Extinction` | Échec matériel lors de l'initialisation (ex: capteur défaillant bloquant) |

Les flèches en **pointillés** `-.->` indiquent que l'extinction est **asynchrone** (elle peut arriver à tout moment, pas à un cycle précis).

### Arrêt propre :

```
Extinction[Signal d extinction]
    → StopAll[Desactiver tous les actionneurs]
        → PubFinal[Publier statut final si connexion disponible]
            → Fin((ESP32 hors tension))
```

1. **Désactiver TOUS les actionneurs** : La pompe (GPIO26 LOW), la ventilation (GPIO27 LOW), l'éclairage (GPIO25 LOW) — pour éviter que les relais restent bloqués
2. **Publier statut final** : Si la connexion réseau est encore disponible, l'ESP32 envoie un dernier message MQTT indiquant son arrêt
3. **Hors tension** : L'ESP32 cesse complètement de fonctionner

---

## 📊 Tableau récapitulatif des décisions

| Décision | Condition Oui | Condition Non | GPIO |
|----------|---------------|---------------|------|
| Irrigation | Humidité < seuil min (30%) | Humidité ≥ seuil min | GPIO26 |
| Arrêt irrigation | Humidité > seuil max (50%) | Humidité ≤ seuil max | GPIO26 |
| Ventilation | Temp > 35°C OU CO₂ > 1000 ppm | Temp ≤ 35°C ET CO₂ ≤ 1000 ppm | GPIO27 |
| Arrêt ventilation | Temp < 30°C ET CO₂ < 800 ppm | Temp ≥ 30°C OU CO₂ ≥ 800 ppm | GPIO27 |
| Éclairage | Lux < 200 depuis > 1h | Lux ≥ 200 OU < 1h | GPIO25 |
| Réserve eau | Niveau > 10% (autoriser pompe) | Niveau ≤ 10% (bloquer pompe) | — |
| Alerte critique | Niveau < 5% | Niveau ≥ 5% | — |
| Mode | Wi-Fi + MQTT OK (Normal) | Perte réseau (Dégradé) | — |

---

## ✅ Ce que ce diagramme nous apporte

1. **Vision complète** : Du boot à l'extinction, tout le cycle de vie est modélisé
2. **Sécurités intégrées** : Vérification réservoir, mode dégradé, alerte critique
3. **Hystérésis** : Tous les actionneurs ont des seuils min et max pour éviter les cycles courts
4. **Parallélisme** : Notifications et surveillance sécurité s'exécutent en même temps que les actions
5. **Documentation pour le développeur IoT** : Le fichier servira de cahier des charges pour la programmation du firmware ESP32

---

*Document créé le 30/06/2026 — Projet SAI (Système Agricole Intelligent)*
