// sensors.h — Lecture des capteurs (SAI), par fonctions.
//
// Fournit :
//   - sensors_begin()  : initialisation (DHT, ADC, etat).
//   - sensors_loop()   : non-bloquant (millis) : relit et filtre les capteurs a
//                        intervalle, met a jour le struct courant.
//   - sensors_get_current() : valeurs courantes publieurs (pour mqtt).
//   - read*()          : lecture immédiate d'un capteur (tests / debug).
//
// Capteurs : DHT22 (temp/hum), YL-69 (humidite sol), LDR (luminosite 0-100%),
// MQ-135 (CO2 ppm), niveau d'eau (%). Valeurs invalides -> NaN.

#ifndef SENSORS_H
#define SENSORS_H

#include <Arduino.h>

// Dernieres valeurs lues (filtrees) par type de mesure.
struct SensorReadings {
  float temperature;
  float humidite_air;
  float humidite_sol;
  float luminosite;   // %
  float co2;          // ppm
  float niveau_eau;   // %
};

// Initialise les capteurs (DHT, ADC). A appeler une fois au setup.
void sensors_begin();

// Scheduler non-bloquant (millis) : relit + filtre periodiquement.
void sensors_loop();

// Retourne les dernieres valeurs filtrees.
const SensorReadings& sensors_get_current();

// Lectures immediates (debug / calibration). Retournent NaN si invalide.
float read_temperature();
float read_humidity();
float read_ldr();
float read_soil_moisture();
float read_co2();
float read_water_level();

#endif // SENSORS_H
