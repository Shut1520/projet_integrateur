// mqtt_publisher.cpp — Implementation de la publication MQTT (SAI).

#include "mqtt_publisher.h"

#include "config.h"
#include "ca_cert.h"
#include "wifi_manager.h"

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// ─── Configuration ───
static WiFiClientSecure secure_client;
static PubSubClient mqtt_client(secure_client);

static const char* DEVICE_ID = "esp32_01";

// Timers non-bloquants.
static unsigned long derniereTentative = 0;
static unsigned long derniereMesure   = 0;
static unsigned long derniereAlerte   = 0;
static unsigned long compteurAlerte   = 0;

static String topic(const char* type) {
  return "sai/" + String(PARCELLE) + "/" + type;
}

// Construit un timestamp ISO 8601 (UTC) si NTP synchronise, sinon chaine vide
// (le serveur applique now() si le champ est absent).
static const char* timestamp_iso() {
  static char buf[32];
  time_t t = time(nullptr);
  if (t < 1000000) return ""; // NTP pas encore synchronise
  struct tm tmv;
  gmtime_r(&t, &tmv);
  snprintf(buf, sizeof(buf), "%04d-%02d-%02dT%02d:%02d:%02dZ",
           tmv.tm_year + 1900, tmv.tm_mon + 1, tmv.tm_mday,
           tmv.tm_hour, tmv.tm_min, tmv.tm_sec);
  return buf;
}

void mqtt_begin() {
  secure_client.setCACert(CA_CERT);
  mqtt_client.setServer(BROKER_HOST, BROKER_PORT);
  mqtt_client.setBufferSize(1024); // payload multi-mesures + JSON
}

void mqtt_publish_measures() {
  const SensorReadings& s = sensors_get_current();

  JsonDocument doc;
  doc["device_id"] = DEVICE_ID;
  doc["parcelle"]  = PARCELLE;
  doc["timestamp"] = timestamp_iso();
  if (!isnan(s.temperature))  doc["temperature"]  = s.temperature;
  if (!isnan(s.humidite_air)) doc["humidite_air"] = s.humidite_air;
  if (!isnan(s.humidite_sol)) doc["humidite_sol"] = s.humidite_sol;
  if (!isnan(s.co2))          doc["co2"]          = s.co2;
  if (!isnan(s.luminosite))   doc["luminosite"]   = s.luminosite;
  if (!isnan(s.niveau_eau))   doc["niveau_eau"]   = s.niveau_eau;

  char buffer[512];
  size_t n = serializeJson(doc, buffer, sizeof(buffer));
  if (n == 0) return;

  String t = topic("capteurs/telemetrie");
  if (mqtt_client.publish(t.c_str(), buffer, true)) {
    Serial.printf("[mqtt] published %u B -> %s\n", (unsigned)n, t.c_str());
  }
}

void mqtt_publish_alert(const char* type_alerte, const char* message, float valeur, float seuil) {
  JsonDocument doc;
  doc["type_alerte"] = type_alerte;
  doc["type"]        = type_alerte;
  doc["message"]     = message;
  doc["severite"]    = "haute";
  doc["etat"]        = "active";
  doc["valeur"]      = valeur;
  doc["seuil"]       = seuil;
  doc["parcelle"]    = PARCELLE;

  char buffer[256];
  size_t n = serializeJson(doc, buffer, sizeof(buffer));
  if (n == 0) return;

  String t = topic("alertes");
  if (mqtt_client.publish(t.c_str(), buffer, true)) {
    Serial.printf("[mqtt] alerte publiee -> %s\n", t.c_str());
  }
}

void mqtt_publish_actuator_state(const String& nom, bool actif) {
  JsonDocument doc;
  doc["nom"]  = nom;
  doc["etat"] = actif ? "actif" : "inactif";

  char buffer[128];
  size_t n = serializeJson(doc, buffer, sizeof(buffer));
  if (n == 0) return;

  String t = topic("actionneurs/") + nom;
  if (mqtt_client.publish(t.c_str(), buffer, true)) {
    Serial.printf("[mqtt] etat actionneur -> %s\n", t.c_str());
  }
}

bool mqtt_connected() {
  return mqtt_client.connected();
}

void mqtt_loop() {
  // Pas de WiFi : on attend (la reconnexion WiFi est dans wifi_loop()).
  if (!wifi_connected()) {
    return;
  }

  // (Re)connexion au broker, non-bloquante (retente a intervalle).
  if (!mqtt_client.connected()) {
    unsigned long maintenant = millis();
    if (maintenant - derniereTentative < 5000) return;
    derniereTentative = maintenant;

    secure_client.stop();
    if (mqtt_client.connect("sai_esp32_firmware", BROKER_USER, BROKER_PASS)) {
      Serial.println("[mqtt] Connecte au broker TLS");
      // Publie l'etat courant une fois connecte.
      mqtt_publish_measures();
    } else {
      Serial.printf("[mqtt] Echec connexion (rc=%d), nouvelle tentative.\n",
                    mqtt_client.state());
    }
    return;
  }

  mqtt_client.loop(); // traite les messages QoS

  unsigned long maintenant = millis();

  // Publication periodique des mesures.
  if (maintenant - derniereMesure >= INTERVALLE_MESURES) {
    derniereMesure = maintenant;
    mqtt_publish_measures();
  }

  // Alerte periodique (si activee).
  if (INTERVALLE_ALERTES > 0 && maintenant - derniereAlerte >= INTERVALLE_ALERTES) {
    derniereAlerte = maintenant;
    compteurAlerte++;
    char msg[64];
    snprintf(msg, sizeof(msg), "Alerte firmware #%lu sur '%s'", compteurAlerte, PARCELLE);
    mqtt_publish_alert("firmware_periodique", msg, 0.0f, 0.0f);
  }
}
