# Scénario 5 : Collecte de données capteurs

## Description

L'ESP32 lit périodiquement les valeurs de tous les capteurs et les publie sur le broker MQTT. Le backend reçoit ces mesures et les stocke en base de données pour l'historique et le dashboard.

## Acteurs / Lignes de vie

- ⏱️ **Horloge ESP32** : Timer interne qui déclenche la lecture (toutes les 10s)
- 🔌 **ESP32** : Microcontrôleur qui lit les capteurs et publie sur MQTT
- 🌱 **Capteurs** : YL-69, DHT22, BH1750, SEN0159, niveau d'eau
- 📡 **Broker MQTT** : Mosquitto
- ⚙️ **Backend (FastAPI)** : Abonné MQTT, reçoit et stocke
- 🗄️ **Base de Données** : PostgreSQL (table mesures)

## Scénario pas à pas

```
Étape 1  : Le timer interne de l'ESP32 se déclenche (toutes les 10s)
Étape 2  : L'ESP32 lit le DHT22 (température + humidité) via GPIO4
Étape 3  : L'ESP32 lit le YL-69 (humidité sol) via GPIO34 (ADC)
Étape 4  : L'ESP32 lit le BH1750 (luminosité) via I2C (GPIO21/22)
Étape 5  : L'ESP32 lit le SEN0159 (CO2) via GPIO35 (ADC)
Étape 6  : L'ESP32 lit le capteur de niveau d'eau via GPIO32 (ADC)
Étape 7  : L'ESP32 formate toutes les mesures en un objet JSON
Étape 8  : L'ESP32 publie le JSON sur le topic MQTT sai/parcelle1/capteurs/mesures
Étape 9  : Le broker MQTT reçoit et redistribue le message
Étape 10 : Le backend (abonné au topic) reçoit le message
Étape 11 : Le backend valide et formate les données
Étape 12 : Le backend insère les données dans la table mesures
Étape 13 : La BD confirme l'insertion
Étape 14 : Le backend met à jour le cache pour le dashboard
```

## Format du payload JSON publié par l'ESP32

```json
{
  "device_id": "esp32_parcelle1",
  "parcelle": "parcelle1",
  "timestamp": "2026-06-30T14:30:00Z",
  "mesures": {
    "temperature": 28.4,
    "humidite_air": 62.0,
    "humidite_sol": 41.2,
    "co2": 850,
    "luminosite": 320,
    "niveau_eau": 78
  }
}
```

## Protocoles de lecture utilisés

| Capteur | GPIO | Protocole | Type de lecture |
|---------|------|-----------|-----------------|
| DHT22 | GPIO4 | OneWire digital | Température (°C), Humidité air (%) |
| YL-69 | GPIO34 | ADC analogique | Humidité sol (valeur brute → %) |
| BH1750 | GPIO21/22 | I2C | Luminosité (lux) |
| SEN0159 | GPIO35 | ADC analogique | CO2 (ppm) |
| Niveau eau | GPIO32 | ADC analogique | Niveau réservoir (%) |
