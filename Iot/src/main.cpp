// main.cpp — Firmware SAI (ESP32) : scheduler non-bloquant.
//
// loop() se contente d'appeler, a chaque iteration, une fonction par module.
// Chaque fonction decide elle-meme, via millis(), si une action doit avoir
// lieu (intervalle ecoule) et retourne immediatement sinon. Aucune boucle
// d'attente bloquante ni delay() long : tout est non-bloquant et par fonctions.

#include <Arduino.h>

#include "config.h"
#include "wifi_manager.h"
#include "config_store.h"
#include "sensors.h"
#include "actuators.h"
#include "mqtt_publisher.h"
#include "http_commands.h"
#include "automation.h"

void setup() {
  Serial.begin(115200);
  delay(200); // laisse le temps au port serie de s'initialiser

  Serial.println("=== SAI ESP32 firmware ===");

  config_store_begin();
  Serial.printf("[main] Parcelle: '%s'\n", PARCELLE);
  Serial.printf("[main] Cle API  : %.8s...\n", config_store_cle_api().c_str());

  sensors_begin();
  actuators_begin();
  wifi_begin();
  mqtt_begin();
  http_commands_begin();
  automation_begin();
}

void loop() {
  // Scheduler non-bloquant : chaque fonction s'auto-gere par millis().
  wifi_loop();
  sensors_loop();
  mqtt_loop();
  http_commands_loop();
  automation_loop();
}
