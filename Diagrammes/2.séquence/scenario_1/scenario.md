# Scénario 1 : Irrigation automatique déclenchée par seuil d'humidité

## Description

Le système vérifie périodiquement l'humidité du sol. Si elle tombe sous le seuil configuré, il déclenche automatiquement la pompe d'irrigation sans intervention humaine. Quand l'humidité remonte au-dessus du seuil haut, il arrête la pompe.

C'est le scénario principal de l'automatisation (UC6).

## Acteurs / Lignes de vie

- ⏱️ **Horloge Système** : Timer du moteur d'automatisation (toutes les 5 min)
- ⚙️ **Backend (FastAPI)** : Moteur d'automatisation qui prend les décisions
- 🗄️ **Base de Données** : PostgreSQL (tables mesures, seuils, actions)
- 📡 **Broker MQTT** : Mosquitto
- 🔌 **ESP32** : Exécute la commande sur la pompe
- 💧 **Pompe** : Actionneur physique
- 🌐 **Dashboard Web** : Affichage de l'état pour l'agriculteur

## Scénario pas à pas

```
Phase 1 : Détection du besoin d'irrigation

Étape 1  : Le timer du moteur d'automatisation se déclenche (5 min)
Étape 2  : Le backend lit la dernière mesure d'humidité du sol en BD
Étape 3  : Le backend lit les seuils d'humidité configurés en BD
Étape 4  : Le backend compare : humidité = 25%, seuil_min = 30%
Étape 5  : Le backend décide de lancer l'irrigation

Phase 2 : Exécution de l'irrigation

Étape 6  : Le backend enregistre l'action "irrigation" en BD
Étape 7  : Le backend publie "pompe ON" sur le topic MQTT
Étape 8  : L'ESP32 reçoit la commande et active GPIO26
Étape 9  : La pompe se met en marche, l'arrosage commence
Étape 10 : L'ESP32 publie le statut "pompe active"
Étape 11 : Le backend notifie le dashboard "Arrosage en cours"

Phase 3 : Arrêt de l'irrigation

Étape 12 : 5 minutes plus tard, le timer se déclenche à nouveau
Étape 13 : Le backend vérifie : humidité = 52%, seuil_max = 50%
Étape 14 : Le seuil haut est atteint → arrêt de l'irrigation
Étape 15 : Le backend publie "pompe OFF" sur MQTT
Étape 16 : L'ESP32 coupe la pompe
Étape 17 : L'ESP32 publie le statut "pompe inactive"
Étape 18 : Le backend met à jour l'action en BD
Étape 19 : Le dashboard affiche "Irrigation terminée"
```

## Logique de décision

```
┌─ Toutes les 5 minutes ─────────────────┐
│                                         │
│  Lire humidité_sol depuis la BD         │
│  Lire seuils depuis la BD               │
│                                         │
│  SI humidité_sol < seuil_min (30%)      │
│  ET pompe INACTIVE                      │
│  ALORS → Démarrer irrigation            │
│                                         │
│  SI humidité_sol > seuil_max (50%)      │
│  ET pompe ACTIVE                        │
│  ALORS → Arrêter irrigation             │
│                                         │
│  SINON → Ne rien faire                  │
└─────────────────────────────────────────┘
```

## Seuils par défaut

| Seuil | Valeur | Rôle |
|-------|--------|------|
| Humidité minimale | 30% | Déclenche le démarrage de la pompe |
| Humidité maximale | 50% | Déclenche l'arrêt de la pompe |
| Hystérésis | 20% | Évite les démarrages/arrêts trop fréquents |

> **Hystérésis** : L'écart entre seuil min et max empêche la pompe de s'allumer et s'éteindre en boucle si l'humidité fluctue autour d'une valeur unique.
