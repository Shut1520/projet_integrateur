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

// Calibration MQ-135 CO2 (air propre → 400 ppm, calib. point unique).
// ADC_AIR = valeur ADC lue en air propre (calibration pass 1).
// Formule : ppm = 400 * pow(Rs/Ro, -2.77), Rs/Ro = ((4095-adc)/adc) / ((4095-AIR)/AIR).
static const int      MQ135_ADC_AIR    = 1500; // PLACEHOLDER — mesure ADC air propre
static const float    MQ135_PPM_AIR    = 400.0f;  // ppm en air propre
static const float    MQ135_COEF_B     = -2.77f;  // pente datasheet MQ-135 CO2

// Calibration ultrason HC-SR04 (capteur au-dessus du recipient).
// Recipient : hauteur interne 200 mm, remplissage max 180 mm.
// Capteur place a 200 mm du fond, emetteur/recepteur orientes vers le bas.
static const float    HAUTEUR_RECIPIENT_MM = 200.0f;  // position du capteur (mm)
static const float    HAUTEUR_PLEIN_MM     = 180.0f;  // hauteur d'eau = 100%

// ─── Etat interne ───
static DHT dht(GPIO_DHT22, DHT22);

static SensorReadings courantes = { NAN, NAN, NAN, NAN, NAN, NAN };
static unsigned long  derniereLecture = 0;
static int            compteurDebug = 0;

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
  pinMode(GPIO_LDR, INPUT);
  pinMode(GPIO_YL69, INPUT);
  pinMode(GPIO_MQ135, INPUT);

  // HC-SR04 : TRIG en sortie, ECHO en entree
  pinMode(GPIO_ULTRASO_TRIG, OUTPUT);
  digitalWrite(GPIO_ULTRASO_TRIG, LOW);
  pinMode(GPIO_ULTRASO_ECHO, INPUT);
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

  // Debug serie : impression toutes les 20 s (10 lectures)
  compteurDebug++;
  if (compteurDebug >= 10) {
    compteurDebug = 0;
    int adc_co2 = analogRead(GPIO_MQ135);
    Serial.printf("[sensors] T=%.1fC humAir=%d%% sol=%d%% lum=%d%% co2_adc=%d co2=%.0fppm eau=%.0f%%\n",
                  courantes.temperature,
                  (int)courantes.humidite_air,
                  (int)courantes.humidite_sol,
                  (int)courantes.luminosite,
                  adc_co2,
                  courantes.co2,
                  courantes.niveau_eau);
  }
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

  // Rs/Ro : resistance normalisee en air propre
  float rs_air = (4095.0f - MQ135_ADC_AIR) / MQ135_ADC_AIR;
  float rs_now = (4095.0f - (float)adc) / (float)adc;
  float ratio  = rs_now / rs_air;

  float ppm = MQ135_PPM_AIR * pow(ratio, MQ135_COEF_B);
  return constrain(ppm, 0.0f, 2000.0f);
}

float read_water_level() {
  // Envoi d'une impulsion de 10 us sur TRIG
  digitalWrite(GPIO_ULTRASO_TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(GPIO_ULTRASO_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(GPIO_ULTRASO_TRIG, LOW);

  // Mesure du temps de retour de l'echo (timeout 5 ms = ~850 mm max)
  unsigned long duree = pulseIn(GPIO_ULTRASO_ECHO, HIGH, 5000);
  if (duree == 0) return NAN;

  // Distance en mm : t = 2d / 0.34 mm/us => d = t * 0.34 / 2
  float distance_mm = duree * 0.34f / 2.0f;

  // Hauteur d'eau = position capteur - distance mesuree
  float hauteur_mm = HAUTEUR_RECIPIENT_MM - distance_mm;

  // Remplissage en % (clampe 0-100)
  float pct = (hauteur_mm / HAUTEUR_PLEIN_MM) * 100.0f;
  return constrain(pct, 0.0f, 100.0f);
}
