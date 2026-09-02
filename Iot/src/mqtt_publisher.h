// mqtt_publisher.h — Publication MQTT (SAI), non-bloquante.
//
// Publie vers le broker Mosquitto (TLS 8883, user sai_esp32) :
//   - mesures multi-capteurs sur  sai/<parcelle>/capteurs/telemetrie
//   - alerte periodique sur        sai/<parcelle>/alertes
//   - etat d'un actionneur sur     sai/<parcelle>/actionneurs/<nom>
//
// Connexion et reconnexion gerees de facon non-bloquante dans mqtt_loop().

#ifndef MQTT_PUBLISHER_H
#define MQTT_PUBLISHER_H

#include <Arduino.h>
#include "sensors.h"

// Initialise le client MQTT (TLS + auth). A appeler au setup.
void mqtt_begin();

// Scheduler non-bloquant : reconnecte si besoin et publie a intervalle.
void mqtt_loop();

// Publie les mesures courantes (toutes les INTERVALLE_MESURES).
void mqtt_publish_measures();

// Publie une alerte sur sai/<parcelle>/alertes (JSON).
void mqtt_publish_alert(const char* type_alerte, const char* message, float valeur, float seuil);

// Publie l'etat d'un actionneur sur sai/<parcelle>/actionneurs/<nom>.
void mqtt_publish_actuator_state(const String& nom, bool actif);

// Est-on connecte au broker ?
bool mqtt_connected();

#endif // MQTT_PUBLISHER_H
