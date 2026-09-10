# Fonctionnement du Système Agricole Intelligent (SAI)

## Vue d'ensemble

Le système est un serre agricole connectée pilotée par un **ESP32** qui lit des capteurs, active des actionneurs (pompe, ventilation, éclairage), émet des alertes sonores via un buzzer, et communique avec un backend (FastAPI + PostgreSQL) via **MQTT** et **HTTP**.

L'automatisation fonctionne à **deux niveaux** pour assurer la résilience :
1. **Automatisation locale ESP32** (toutes les 10 secondes) — fonctionne même sans réseau
2. **Automatisation backend** (toutes les 5 minutes) — utilise des seuils configurables en base de données

---

## 1. Capteurs utilisés

| Capteur | GPIO | Mesure | Unité |
|---|---|---|---|
| DHT22 | 4 | Température ambiante | °C |
| DHT22 | 4 | Humidité de l'air | % |
| YL-69 | 34 (ADC) | Humidité du sol | % |
| LDR | 36 (ADC) | Luminosité ambiante | % |
| MQ-135 | 35 (ADC) | Concentration de CO₂ | ppm |
| HC-SR04 | 32 (TRIG) / 33 (ECHO) | Niveau d'eau | % |

- Tous les capteurs analogiques utilisent un **filtre glissant** (moyenne sur 8 lectures) pour lisser les valeurs bruitées.
- Les lectures sont effectuées toutes les **2 secondes**.

---

## 2. Actionneurs utilisés

| Actionneur | GPIO | Type | Rôle |
|---|---|---|---|
| Pompe d'irrigation | 26 | Relais (HIGH = ON) | Arrosage quand le sol est trop sec |
| Ventilation | 27 | Relais (HIGH = ON) | Refroidissement / extraction de CO₂ |
| Éclairage | 25 | Relais (HIGH = ON) | Éclairage artificiel quand il fait trop sombre |
| Buzzer actif | 5 | Sortie numérique (HIGH/LOW) | Alertes sonores |

---

## 3. Logique d'automatisation des actionneurs

### 3.1 Pompe d'irrigation

| Seuil | Valeur | Action |
|---|---|---|
| SEUIL_SOL_SEC | 30% | **Pompe ON** si humidité sol < 30% |
| SEUIL_SOL_REACTIV | 33% | **Pompe OFF** si humidité sol >= 33% |

**Fonctionnement :**
- Le sol est trop sec → la pompe s'allume.
- La pompe reste allumée jusqu'à ce que l'humidité atteigne 33%.
- L'écart de 3% (hystérésis) empêche la pompe de s'activer/désactiver en continu quand la valeur oscille autour du seuil.
- Une fois activée → **1 bip court (200ms)** + publication MQTT de l'état.

### 3.2 Ventilation (partagée : température + CO₂)

| Seuil | Valeur | Action |
|---|---|---|
| SEUIL_TEMP_HAUTE | 40°C | **Ventilation ON** si température > 40°C |
| SEUIL_TEMP_REACTIV | 37°C | Ventilation OFF uniquement si température <= 37°C **ET** CO₂ <= 850 ppm |
| SEUIL_CO2_HAUT | 900 ppm | **Ventilation ON** si CO₂ > 900 ppm |
| SEUIL_CO2_REACTIV | 850 ppm | Ventilation OFF uniquement si CO₂ <= 850 ppm **ET** température <= 37°C |

**Fonctionnement :**
- La ventilation s'allume si la température **OU** le CO₂ dépasse leur seuil respectif.
- La ventilation ne s'éteint que si les **deux** conditions sont redevenues normales.
- Une valeur NaN (lecture invalide) est considérée comme OK (ne bloque pas l'arrêt).
- Chaque activation → **1 bip court (200ms)** + publication MQTT.

### 3.3 Éclairage

| Seuil | Valeur | Action |
|---|---|---|
| SEUIL_LUM_BAS | 30% | **Éclairage ON** si luminosité < 30% |
| SEUIL_LUM_HAUT | 50% | **Éclairage OFF** si luminosité >= 50% |

**Fonctionnement :**
- Il fait trop sombre → l'éclairage s'allume.
- Reste allumé jusqu'à ce que la luminosité atteigne 50%.
- Hystérésis de 20% pour éviter les oscillations.
- Chaque activation → **1 bip court (200ms)** + publication MQTT.

---

## 4. Signification des sons du buzzer

Le buzzer est **actif** (simple ON/OFF, pas de PWM). Tous les signaux sont **non-bloquants** (utilisation de `millis()`).

| Signal | Nombre de bips | Durée par bip | Déclencheur | Signification |
|---|---|---|---|---|
| Bip court | 1 | 200 ms | Seuil dépassé | Un actionneur vient de s'activer automatiquement |
| Bips longs | 3 | 500 ms | WiFi ou MQTT perdu | Perte de liaison avec le serveur |

### Résumé simple :
- **1 bip court** = « Un actionneur s'est activé » (pompe, ventilation ou éclairage)
- **3 bips longs** = « Attention, le système a perdu sa connexion réseau »

---

## 5. Scénarios de fonctionnement complet

### Scénario 1 : Irrigation automatique

1. Le capteur YL-69 lit une humidité de sol de **25%** (inférieur à 30%)
2. `appliquer_seuil_arrosage()` détecte le dépassement
3. Le relais pompe est activé (GPIO 26 → HIGH)
4. MQTT publie : `sai/Serre A/actionneurs/pompe` avec `{"nom":"pompe","etat":"actif"}`
5. Le buzzer émet **1 bip court**
6. Le système continue de surveiller ; quand l'humidité atteint **>= 33%**, la pompe est désactivée

### Scénario 2 : Ventilation pour température élevée

1. Le capteur DHT22 lit **42°C** (supérieur à 40°C)
2. `appliquer_seuil_ventilation()` détecte le dépassement
3. Le relais ventilation est activé (GPIO 27 → HIGH)
4. MQTT publie l'état + **1 bip court**
5. La ventilation reste allumée jusqu'à ce que la température descende **<= 37°C** ET que le CO₂ soit **<= 850 ppm**

### Scénario 3 : Ventilation pour CO₂ élevé

1. Le capteur MQ-135 lit **950 ppm** (supérieur à 900 ppm)
2. `appliquer_seuil_co2()` détecte le dépassement
3. Le relais ventilation est activé (GPIO 27 → HIGH)
4. MQTT publie l'état + **1 bip court**
5. La ventilation reste allumée jusqu'à ce que le CO₂ descende **<= 850 ppm** ET que la température soit **<= 37°C**

### Scénario 4 : Éclairage automatique

1. Le capteur LDR lit une luminosité de **20%** (inférieur à 30%)
2. `appliquer_seuil_eclairage()` détecte le dépassement
3. Le relais éclairage est activé (GPIO 25 → HIGH)
4. MQTT publie l'état + **1 bip court**
5. L'éclairage reste allumé jusqu'à ce que la luminosité atteigne **>= 50%**

### Scénario 5 : Perte de connectivité

1. La connexion WiFi ou MQTT est interrompue
2. `verifier_liaison()` (vérifié toutes les 30 secondes) détecte la panne
3. Une alerte MQTT est publiée : `{"type_alerte":"liaison","message":"Perte de liaison ESP32 (WiFi ou MQTT)"}`
4. Le buzzer émet **3 bips longs** (3 × 500ms = 3 secondes d'alarme)
5. Le système **continue de fonctionner en local** : les capteurs sont lus, l'automatisation locale continue de tourner

### Scénario 6 : Commande à distance (depuis l'interface web ou le CLI)

1. L'utilisateur envoie une commande via l'interface web ou le CLI (ex : « activer la pompe »)
2. Le backend crée une commande avec le statut `envoyee`
3. Le backend publie une notification MQTT sur `sai/Serre A/commandes/notif`
4. L'ESP32 reçoit la notification → déclenche un pull immédiat
5. L'ESP32 récupère la commande via `GET /api/commandes/attente`
6. La machine à états exécute :
   - `PUT /api/commandes/{id}` → statut `recue`
   - `POST /api/actions` → statut `en_cours`
   - `set_actionneur("pompe", true)` → active le relais physiquement
   - `PUT /api/actions/{id}` → statut `termine`, résultat `ok`
   - `PUT /api/commandes/{id}` → statut `executee`
7. Si une étape échoue → le statut final est `echouee`

---

## 6. Séquence de démarrage (Boot)

1. Initialisation du moniteur série (115200 baud)
2. `config_store_begin()` — chargement de la clé API depuis la flash NVS
3. `sensors_begin()` — initialisation du DHT22, configuration des broches ADC, setup TRIG/ECHO du HC-SR04
4. `actuators_begin()` — tous les relais en OUTPUT LOW (tout éteint)
5. `buzzer_begin()` — buzzer en OUTPUT LOW (silencieux)
6. `wifi_begin()` — connexion WiFi (non-bloquante)
7. `mqtt_begin()` — configuration du client MQTT (TLS, port 8883)
8. `http_commands_begin()` — initialisation de la machine à états des commandes HTTP
9. `automation_begin()` — réinitialisation des timers d'automatisation

---

## 7. Boucle principale (Loop)

Chaque itération de `loop()` appelle dans l'ordre :

| Étape | Fonction | Fréquence |
|---|---|---|
| 1 | `wifi_loop()` | Continu (reconnexion toutes les 5s si déconnecté) |
| 2 | `sensors_loop()` | Toutes les 2 secondes |
| 3 | `mqtt_loop()` | Continu (télémétrie toutes les 5s, alertes périodiques toutes les 60s) |
| 4 | `http_commands_loop()` | Toutes les 1.3 secondes (pull des commandes) |
| 5 | `automation_loop()` | Toutes les 10 secondes (évaluation des seuils) + vérification liaison toutes les 30s |
| 6 | `buzzer_loop()` | Continu (gestion non-bloquante des séquences de bips) |

---

## 8. Affectation des broches GPIO

| GPIO | Composant | Direction |
|---|---|---|
| 4 | DHT22 (température/humidité) | Entrée (numérique) |
| 5 | Buzzer actif | Sortie |
| 25 | Relais éclairage | Sortie |
| 26 | Relais pompe | Sortie |
| 27 | relais ventilation | Sortie |
| 32 | HC-SR04 TRIG | Sortie |
| 33 | HC-SR04 ECHO | Entrée (nécessite diviseur de tension 5V→3.3V) |
| 34 | YL-69 humidité sol | Entrée (analogique ADC) |
| 35 | MQ-135 CO₂ | Entrée (analogique ADC, pin ADC uniquement) |
| 36 | LDR luminosité | Entrée (analogique ADC1, pin pure entrée) |

---

## 9. Topics MQTT

| Topic | Direction | Usage |
|---|---|---|
| `sai/<parcelle>/capteurs/telemetrie` | ESP32 → Broker | Télémesures multi-capteurs (JSON) |
| `sai/<parcelle>/alertes` | ESP32 → Broker | Événements d'alerte (JSON) |
| `sai/<parcelle>/actionneurs/<nom>` | ESP32 → Broker | Changements d'état des actionneurs |
| `sai/<parcelle>/commandes/notif` | Backend → ESP32 | Notification de commande (déclenche un pull immédiat) |

---

## 10. Tableau récapitulatif de tous les seuils

| Paramètre | Seuil d'activation | Seuil de désactivation | Actionneur |
|---|---|---|---|
| Humidité du sol | < 30% | >= 33% | Pompe |
| Température | > 40°C | <= 37°C (si CO₂ OK) | Ventilation |
| CO₂ | > 900 ppm | <= 850 ppm (si temp OK) | Ventilation |
| Luminosité | < 30% | >= 50% | Éclairage |
