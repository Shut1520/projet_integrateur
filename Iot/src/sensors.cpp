// sensors.cpp — Implementation de la lecture des capteurs (SAI).

#include "sensors.h"

#include "config.h"
#include "pins.h"
#include <DHT.h>

// ─── Constantes de calibration / filtrage ───
static const int      NB_LISSAGE_MAX   = 8;   // profondeur de la moyenne glissante
static const unsigned long INTERVALLE_LECTURE_MS = 2000; // relit tous les 2 s

// Calibration LDR (espaces analytiques du pont diviseur). Ajuster selon test reel.
static const int      LDR_MIN_ADU      = 300;  // lecture ADC en pleine lumiere
static const int      LDR_MAX_ADU      = 3600; // lecture ADC a l'obscurite

// Coefficients de la courbe log MQ-135 pour le CO2 (parametrables). A recalibrer
// idealement en usine/lab. Formule : ppm = A * (R/Ro) ^ B.
static const float    MQ135_COEF_A     = 116.6f;
static const float    MQ135_COEF_B     = -2.77f;

// ─── Etat interne ───
static DHT dht(GPIO_DHT22, DHT22);

static SensorReadings courantes = { NAN, NAN, NAN, NAN, NAN, NAN };
static unsigned long  derniereLecture = 0;

// Petit filtre moyenne glissante, un par capteur analogique (tampon isole).
struct FiltreGlissant {
  float buf[NB_LISSAGE_MAX];
  int   i = 0;
  int   n = 0;
  static float ajouter(float valeur, FiltreGlissant& f) {
    f.buf[f.i] = valeur;
    f.i = (f.i + 1) % NB_LISSAGE_MAX;
    if (f.n < NB_LISSAGE_MAX) f.n++;
    float somme = 0.0f;
    for (int k = 0; k < f.n; k++) somme += f.buf[k];
    return somme / f.n;
  }
};

static FiltreGlissant filtre_sol, filtre_ldr, filtre_co2, filtre_eau;

// Map lineaire d'une valeur ADC (0-4095) vers [0..100] sur une plage [min..max].
static float map_pourcent(int adc, int min_adc, int max_adc) {
  float p = (float)(adc - min_adc) / (float)(max_adc - min_adc);
  p = constrain(p, 0.0f, 1.0f);
  return 100.0f - (p * 100.0f); // capteur resistif : plus sombre = valeur plus haute
}

void sensors_begin() {
  dht.begin();
  analogSetWidth(12); // resolution 0-4095
  analogSetPinAttenuation(GPIO_YL69, ADC_11db);
  analogSetPinAttenuation(GPIO_LDR, ADC_11db);
  analogSetPinAttenuation(GPIO_MQ135, ADC_11db);
  analogSetPinAttenuation(GPIO_NIVEAU_EAU, ADC_11db);
  pinMode(GPIO_LDR, INPUT);
  pinMode(GPIO_YL69, INPUT);
  pinMode(GPIO_MQ135, INPUT);
  pinMode(GPIO_NIVEAU_EAU, INPUT);
}

void sensors_loop() {
  unsigned long maintenant = millis();
  if (maintenant - derniereLecture < INTERVALLE_LECTURE_MS) return;
  derniereLecture = maintenant;

  // DHT : necessite un delai court interne (~20-50 ms) ; acceptable (non long).
  courantes.temperature  = read_temperature();
  courantes.humidite_air = read_humidity();

  // Capteurs ADC lisses (un filtre par capteur).
  courantes.humidite_sol = FiltreGlissant::ajouter(read_soil_moisture(), filtre_sol);
  courantes.luminosite   = FiltreGlissant::ajouter(read_ldr(), filtre_ldr);
  courantes.co2          = FiltreGlissant::ajouter(read_co2(), filtre_co2);
  courantes.niveau_eau   = FiltreGlissant::ajouter(read_water_level(), filtre_eau);
}

const SensorReadings& sensors_get_current() {
  return courantes;
}

// ─── Lectures immediates ───

float read_temperature() {
  float v = dht.readTemperature();
  return isnan(v) ? NAN : v;
}

float read_humidity() {
  float v = dht.readHumidity();
  return isnan(v) ? NAN : v;
}

float read_ldr() {
  int adc = analogRead(GPIO_LDR);
  if (adc <= 0) return NAN;
  return map_pourcent(adc, LDR_MIN_ADU, LDR_MAX_ADU);
}

float read_soil_moisture() {
  // Plus le sol est sec, plus la resistance augmente (valeur ADC haute).
  int adc = analogRead(GPIO_YL69);
  if (adc <= 0) return NAN;
  return map_pourcent(adc, LDR_MIN_ADU / 2, LDR_MAX_ADU); // plage analogique similaire
}

float read_co2() {
  int adc = analogRead(GPIO_MQ135);
  if (adc <= 0) return NAN;
  // R/Ro approxime par la lecture ADC (courbe log). Ro = calibration air ambiant.
  // En l'absence de calibration reel, on utilise une reference nominale.
  float ratio = (float)adc / 4095.0f;
  float ppm = MQ135_COEF_A * pow(ratio, MQ135_COEF_B);
  if (ppm < 200.0f) ppm = 200.0f;
  if (ppm > 2000.0f) ppm = 2000.0f;
  return ppm;
}

float read_water_level() {
  int adc = analogRead(GPIO_NIVEAU_EAU);
  if (adc <= 0) return NAN;
  return map_pourcent(adc, 0, 4095);
}
