// automation.cpp — Implementation de l'automatisation embarquee (SAI).

#include "automation.h"

#include "config.h"
#include "sensors.h"
#include "actuators.h"
#include "buzzer.h"
#include "wifi_manager.h"
#include "mqtt_publisher.h"
#include "http_commands.h"

// Intervalle d'evaluation des seuils locaux.
static const unsigned long INTERVALLE_AUTO = 10000; // 10 s

// Cooldown apres une commande backend : l'automatisation locale est suspendue
// pendant 60s pour laisser le backend etre l'autorite unique.
static const unsigned long COOLDOWN_APRES_COMMANDE = 60000; // 60 s
static unsigned long derniereCommandeBackend = 0;

static unsigned long derniereEval = 0;
static unsigned long derniereAlerteLiaison = 0;
static const unsigned long INTERVALLE_ALERTE_LIAISON = 30000; // 30 s

// Politique "priorite local > distant" : quand un seuil est actif, on force
// l'actionneur ON ; l'etat est relache (mise a OFF) lorsque le seuil redevient
// sous la valeur avec hysteresis (deadband) pour eviter les oscillations.
// La ventilation est partagee (temp + CO2) : elle n'est coupee que quand les
// DEUX seuils sont sous la normale.
static void appliquer_seuil_arrosage() {
  const SensorReadings& s = sensors_get_current();
  if (isnan(s.humidite_sol)) return;
  bool actif = actionneur_actif("pompe");
  if (s.humidite_sol < SEUIL_SOL_SEC) {
    if (!actif) {
      Serial.printf("[auto] sol=%d%% < %d => pompe ON\n", (int)s.humidite_sol, SEUIL_SOL_SEC);
      set_actionneur("pompe", true);
      mqtt_publish_actuator_state("pompe", true);
      http_queue_actuator_sync("pompe", true);
      buzzer_beep(1, 200);
    }
  } else if (actif && s.humidite_sol >= SEUIL_SOL_REACTIV) {
    // Hysteresis : ne coupe que quand on depasse la valeur de reactivation
    Serial.printf("[auto] sol=%d%% >= %d => pompe OFF\n", (int)s.humidite_sol, SEUIL_SOL_REACTIV);
    set_actionneur("pompe", false);
    mqtt_publish_actuator_state("pompe", false);
    http_queue_actuator_sync("pompe", false);
  }
}

static void appliquer_seuil_ventilation() {
  const SensorReadings& s = sensors_get_current();
  if (isnan(s.temperature)) return;
  if (s.temperature > SEUIL_TEMP_HAUTE) {
    if (!actionneur_actif("ventilation")) {
      Serial.printf("[auto] T=%.1f > %d => ventilation ON\n", s.temperature, SEUIL_TEMP_HAUTE);
      set_actionneur("ventilation", true);
      http_queue_actuator_sync("ventilation", true);
      buzzer_beep(1, 200);
    }
  }
}

static void appliquer_seuil_co2() {
  const SensorReadings& s = sensors_get_current();
  if (isnan(s.co2)) return;
  if (s.co2 > SEUIL_CO2_HAUT) {
    if (!actionneur_actif("ventilation")) {
      Serial.printf("[auto] CO2=%.0f > %d => ventilation ON (surventilation)\n", s.co2, SEUIL_CO2_HAUT);
      set_actionneur("ventilation", true);
      http_queue_actuator_sync("ventilation", true);
      buzzer_beep(1, 200);
    }
  }
}

// Coupe la ventilation uniquement si les DEUX seuils (temp ET co2) sont sous
// la normale avec hysteresis, car l'actionneur est partage. Les NaN sont
// respectes : pas de desactivation si une lecture est inconnue.
static void desactiver_ventilation() {
  const SensorReadings& s = sensors_get_current();
  bool tempOK  = isnan(s.temperature) || s.temperature <= SEUIL_TEMP_REACTIV;
  bool co2OK   = isnan(s.co2)        || s.co2        <= SEUIL_CO2_REACTIV;
  bool inactif = !actionneur_actif("ventilation");
  if (tempOK && co2OK && !inactif) {
    Serial.println("[auto] T et CO2 sous seuils => ventilation OFF");
    set_actionneur("ventilation", false);
    mqtt_publish_actuator_state("ventilation", false);
    http_queue_actuator_sync("ventilation", false);
  }
}

// Seuil eclairage : luminosite basse => ON, haute => OFF (hysteresis).
static void appliquer_seuil_eclairage() {
  const SensorReadings& s = sensors_get_current();
  if (isnan(s.luminosite)) return;
  bool actif = actionneur_actif("eclairage");
  if (s.luminosite < SEUIL_LUM_BAS) {
    if (!actif) {
      Serial.printf("[auto] lum=%d%% < %d => eclairage ON\n", (int)s.luminosite, SEUIL_LUM_BAS);
      set_actionneur("eclairage", true);
      mqtt_publish_actuator_state("eclairage", true);
      http_queue_actuator_sync("eclairage", true);
      buzzer_beep(1, 200);
    }
  } else if (actif && s.luminosite >= SEUIL_LUM_HAUT) {
    Serial.printf("[auto] lum=%d%% >= %d => eclairage OFF\n", (int)s.luminosite, SEUIL_LUM_HAUT);
    set_actionneur("eclairage", false);
    mqtt_publish_actuator_state("eclairage", false);
    http_queue_actuator_sync("eclairage", false);
  }
}

// Alerte si perte de liaison WiFi ou MQTT (best effort sur MQTT).
static void verifier_liaison(unsigned long maintenant) {
  if (maintenant - derniereAlerteLiaison < INTERVALLE_ALERTE_LIAISON) return;
  derniereAlerteLiaison = maintenant;

  bool ok = wifi_connected() && mqtt_connected();
  if (!ok) {
    Serial.println("[auto] liaison perdue (wifi ou mqtt)");
    mqtt_publish_alert("liaison", "Perte de liaison ESP32 (WiFi ou MQTT)", -1.0f, 0.0f);
    buzzer_beep(3, 500); // 3 bips longs pour perte liaison
  }
}

void automation_begin() {
  derniereEval = 0;
  derniereAlerteLiaison = 0;
  derniereCommandeBackend = 0;
}

void automation_commande_recue() {
  derniereCommandeBackend = millis();
  Serial.println("[auto] commande backend recue => cooldown 60s");
}

void automation_loop() {
  unsigned long maintenant = millis();

  // Cooldown : pas d'automatisation locale 60s apres une commande backend.
  if (maintenant - derniereCommandeBackend < COOLDOWN_APRES_COMMANDE) {
    verifier_liaison(maintenant);
    yield();
    return;
  }

  if (maintenant - derniereEval >= INTERVALLE_AUTO) {
    derniereEval = maintenant;
    appliquer_seuil_arrosage();
    appliquer_seuil_ventilation();
    appliquer_seuil_co2();
    desactiver_ventilation();
  }

  verifier_liaison(maintenant);

  yield();
}
