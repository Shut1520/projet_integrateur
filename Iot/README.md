# Firmware ESP32 — SAI (Système Agricole Intelligent)

Firmware du microcontrôleur **ESP32** (carte DevKit 38 pins) pour le prototype SAI.
Il lit les capteurs, pilote les actionneurs, publie les mesures en **MQTT** (TLS) et
exécute le **workflow commandes HTTP** (pull/confirmation). Écrit en **Arduino C++**
sous **PlatformIO**, entièrement **non-bloquant** (scheduler par `millis()`, zéro
`delay()` long).

---

## 1. Architecture du firmware

| Fichier | Rôle |
|---------|------|
| `src/main.cpp` | Scheduler global : appelle une fonction par module à chaque `loop()`. |
| `src/wifi_manager.h/.cpp` | Connexion/reconnexion WiFi non-bloquante. |
| `src/config_store.h/.cpp` | Stockage NVS (`Preferences`) : clé API (prioritaire sur `config.h`). |
| `src/pins.h` | Attribution des GPIO (capteurs + actionneurs). |
| `src/sensors.h/.cpp` | Lecture + filtrage (lissage glissant) des 5 capteurs (DHT22, YL-69, LDR, MQ-135, HC-SR04). |
| `src/actuators.h/.cpp` | Pilotage des 3 relais (pompe, ventilation, éclairage) par nom. |
| `src/buzzer.h/.cpp` | Alertes sonores : séquences de bips non-bloquantes (buzzer actif, GPIO 5). |
| `src/ca_cert.h` | Certificat CA du broker (TLS). |
| `src/mqtt_publisher.h/.cpp` | Publication MQTT : mesures, alertes, états actionneurs. |
| `src/http_commands.h/.cpp` | Workflow commandes HTTP (pull/confirm/action) + fallback mesures. |
| `src/automation.h/.cpp` | Automatisation embarquée (seuils locaux, priorité local > distant). |
| `include/config.h(.example)` | Configuration du firmware (WiFi, broker, clé API, paramètres). |

Le firmware suit le contrat d'interface **`Iot/INTERFACE.md`** (endpoints, topics,
formats JSON).

---

## 2. Câblage (GPIO)

| Composant | GPIO | Type | Note |
|-----------|------|------|------|
| DHT22 (temp/hum) | **4** | digital | |
| YL-69 (humidité sol) | **34** | analog ADC | |
| LDR (luminosité) | **36** | analog ADC1 | entrée pure |
| MQ-135 (CO2) | **35** | analog ADC | **ADC-only** (jamais en sortie) |
| HC-SR04 TRIG | **32** | sortie | impulsion 10 µs |
| HC-SR04 ECHO | **33** | entrée | **diviseur 5V→3.3V obligatoire** |
| Pompe (relais) | **26** | sortie | logique active HIGH |
| Ventilation (relais) | **27** | sortie | |
| Éclairage (relais) | **25** | sortie | |
| Buzzer actif | **5** | sortie | alertes (bip liaison + seuils) |

> **HC-SR04** : capteur placé à 200 mm du fond du récipient (émetteur/récepteur
> vers le bas). Hauteur max d'eau = 180 mm = 100 %. Formule :
> `pct = (200 − distance_mm) / 180 × 100` clampé [0, 100]. ECHO en 5 V :
> **diviseur résistif obligatoire** (1 kΩ/1 kΩ ou 1 kΩ/2 kΩ) avant GPIO 33.

---

## 3. Configuration

Copier `include/config.h.example` vers `include/config.h` et renseigner :

- `WIFI_SSID` / `WIFI_PASSWORD`
- `BROKER_HOST` / `BROKER_PORT` (TLS 8883) / `BROKER_USER` / `BROKER_PASS`
- `API_BASE` (backend HTTP) / `API_KEY`
- `PARCELLE` (nom exact en BD, ex. `Serre A`)
- `INTERVALLE_MESURES`, `INTERVALLE_COMMANDES`, `INTERVALLE_ALERTES`
- `SEUIL_SOL_SEC`, `SEUIL_TEMP_HAUTE`, `SEUIL_CO2_HAUT` (automatisation locale)

> `config.h` est **gitignoré** (contient clé API + mot de passe WiFi). La clé API
> peut aussi être stockée en NVS (voir `config_store`).

Le mapping `id_actionneur → nom` et `type_mesure → id_capteur` est défini dans
`http_commands.cpp` (valeurs par défaut alignées sur le seed BD) et surchargeable
via `http_set_mapping_actionneur()`.

---

## 4. Build & flash

Depuis `Iot/` :

```powershell
# compil & vérifie
pio run

# téléverser sur l'ESP32 branché
pio run --target upload

# moniteur série
pio device monitor --baud 115200
```

> `pio` n'est pas dans le PATH par défaut : utiliser
> `$env:USERPROFILE\.platformio\penv\Scripts\pio.exe`.

---

## 5. Comportement runtime

- **Mesures** : publiées en MQTT sur `sai/<parcelle>/capteurs/telemetrie` toutes
  les `INTERVALLE_MESURES` (JSON multi-capteurs, timestamp ISO 8601 si NTP sync).
- **Commandes** : `GET /api/commandes/attente` toutes les `INTERVALLE_COMMANDES` ;
  chaque commande est confirmée `recue`, son action créée, l'actionneur piloté,
  puis marquée `executee` (ou `echouee`).
- **Fallback mesures** : si WiFi up mais MQTT down, `POST /api/mesures` par capteur
  mappé (meilleur effort).
- **Automatisation** : évaluation des seuils locaux toutes les 10 s ; l'actionneur
  est maintenu ON tant que le seuil est déchu (priorité **local > distant**).
- **Liaison** : alerte MQTT `liaison` si WiFi/MQTT perdus (toutes les 30 s).

---

## 6. Tests matériels (7.7)

Étapes prévues avec le vrai ESP32 (partie validation B, jouée en dernière position
conformément au plan `preparation_IOT.md`) :

1. **Upload** et vérification du démarrage (logs série `=== SAI ESP32 firmware ===`).
2. **Capteurs** : comparer les lectures série aux valeurs réelles (luminosité,
   humidité sol, CO2, niveau d'eau HC-SR04, température). Niveau : vider le
   récipient → ~0 %, remplir à 90 mm → ~50 %, à 180 mm → ~100 %.
3. **Actionneurs** : commander pompe/ventilation/eclairage et vérifier les relais.
4. **Buzzer** : couper le WiFi → 3 bips longs ; déclencher un seuil (sol < 30 %,
   temp > 40 °C ou CO2 > 900) → 1 bip court.
5. **MQTT** : vérifier la publication des mesures sur le broker (`mosquitto_sub`).
6. **Workflow commandes** : émettre une commande (web/CLI) et vérifier le cycle
   `recue → action → executee` en BD.
7. **Automatisation + liaison** : déclencher un seuil, couper le WiFi, vérifier
   l'alerte.

> Prérequis : broker Mosquitto (TLS 8883) + backend démarrés, WiFi configuré,
> `config.h` complété avec la vraie clé API, CA conforme au broker.
