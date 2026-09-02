// automation.cpp — Implementation de l'automatisation embarquee (SAI).

#include "automation.h"

#include "config.h"
#include "sensors.h"
#include "actuators.h"
#include "wifi_manager.h"
#include "mqtt_publisher.h"

// Intervalle d'evaluation des seuils locaux.
static const unsigned long INTERVALLE_AUTO = 10000; // 10 s

static unsigned long derniereEval = 0;
static unsigned long derniereAlerteLiaison = 0;
static const unsigned long INTERVALLE_ALERTE_LIAISON = 30000; // 30 s

// Politique "priorite local > distant" : quand un seuil est actif, on force
// l'actionneur ON ; l'etat n'est relache (possible mise a OFF) que lorsque le
// seuil redevient sous la valeur. Le retour a OFF est géré par la commande
// distante (http_commands) entre deux evaluations ; ici on ne fait que REIMPOSER
// ON tant que le seuil est dechu.
static void appliquer_seuil_arrosage() {
  const SensorReadings& s = sensors_get_current();
  if (isnan(s.humidite_sol)) return;
  if (s.humidite_sol < SEUIL_SOL_SEC) {
    bool dejaActif = actionneur_actif("pompe");
    if (!dejaActif) {
      Serial.printf("[auto] sol=%d%% < %d => pompe ON\n", (int)s.humidite_sol, SEUIL_SOL_SEC);
    }
    set_actionneur("pompe", true);
  }
}

static void appliquer_seuil_ventilation() {
  const SensorReadings& s = sensors_get_current();
  if (isnan(s.temperature)) return;
  if (s.temperature > SEUIL_TEMP_HAUTE) {
    Serial.printf("[auto] T=%.1f > %d => ventilation ON\n", s.temperature, SEUIL_TEMP_HAUTE);
    set_actionneur("ventilation", true);
  }
}

static void appliquer_seuil_co2() {
  const SensorReadings& s = sensors_get_current();
  if (isnan(s.co2)) return;
  if (s.co2 > SEUIL_CO2_HAUT) {
    Serial.printf("[auto] CO2=%.0f > %d => ventilation ON (surventilation)\n", s.co2, SEUIL_CO2_HAUT);
    set_actionneur("ventilation", true);
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
  }
}

void automation_begin() {
  derniereEval = 0;
  derniereAlerteLiaison = 0;
}

void automation_loop() {
  unsigned long maintenant = millis();

  if (maintenant - derniereEval >= INTERVALLE_AUTO) {
    derniereEval = maintenant;
    appliquer_seuil_arrosage();
    appliquer_seuil_ventilation();
    appliquer_seuil_co2();
  }

  verifier_liaison(maintenant);

  yield();
}
