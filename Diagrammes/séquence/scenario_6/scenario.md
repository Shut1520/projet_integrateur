# Scénario 6 : Alerte critique

## Description

Le système détecte une condition critique (température excessive, CO₂ trop élevé, humidité trop basse, niveau d'eau critique) et déclenche une alerte dans le dashboard. Selon le type d'alerte, une action automatique peut être déclenchée.

## Acteurs / Lignes de vie

- ⏱️ **Horloge Système** : Timer du moteur d'automatisation (toutes les 5 min)
- ⚙️ **Backend (FastAPI)** : Moteur d'automatisation + générateur d'alertes
- 🗄️ **Base de Données** : PostgreSQL (tables mesures, seuils, alertes)
- 📡 **Broker MQTT** : Mosquitto (pour les alertes qui nécessitent une action)
- 🔌 **ESP32** : Reçoit la commande d'action si nécessaire
- 💨 **Ventilation** : Actionneur déclenché si alerte CO₂/température
- 🌐 **Dashboard Web** : Interface qui affiche les alertes en temps réel

## Types d'alertes et actions associées

| Type d'alerte | Condition | Action automatique | Priorité |
|---------------|-----------|-------------------|----------|
| 🌡️ Température excessive | Temp > 40°C | Déclencher ventilation | Haute |
| 💨 CO₂ trop élevé | CO₂ > 1200 ppm | Déclencher ventilation | Haute |
| 💧 Humidité sol critique | Humidité < 20% | Déclencher pompe | Haute |
| 🪣 Réservoir vide | Niveau eau < 5% | Aucune (intervention manuelle requise) | Critique |
| ☀️ Luminosité trop basse | Lux < 100 pendant 2h | Allumer éclairage | Basse |

## Scénario pas à pas (cas CO₂ élevé)

```
Étape 1  : Le timer du moteur d'automatisation se déclenche (toutes les 5 min)
Étape 2  : Le backend lit les dernières mesures en BD
Étape 3  : Le backend lit les seuils configurés en BD
Étape 4  : Le backend compare : CO₂ = 1350 ppm, seuil max = 1000 ppm
Étape 5  : Le backend décide : alerte critique + action ventilation
Étape 6  : Le backend crée un enregistrement d'alerte en BD
Étape 7  : La BD retourne l'ID de l'alerte
Étape 8  : Le backend publie une commande MQTT "ventilation ON"
Étape 9  : L'ESP32 reçoit et active la ventilation
Étape 10 : Le backend notifie le dashboard via WebSocket
Étape 11 : Le dashboard affiche l'alerte à l'agriculteur
Étape 12 : Quand le CO₂ redescend sous le seuil, le système arrête la ventilation
```

## Format du payload d'alerte

```json
{
  "id": 42,
  "type": "co2_eleve",
  "parcelle": "parcelle1",
  "valeur": 1350,
  "seuil": 1000,
  "unite": "ppm",
  "severite": "haute",
  "message": "CO₂ critique : 1350 ppm (seuil : 1000 ppm)",
  "action_auto": "ventilation",
  "timestamp": "2026-06-30T14:35:00Z"
}
```
