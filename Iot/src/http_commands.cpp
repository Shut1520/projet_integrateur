// http_commands.cpp — Implementation du workflow commandes HTTP (SAI).
//
// Pull des commandes en attente puis execution sequentielle d'UNE commande par
// boucle (pour rester non-bloquant). Chaque etape HTTP est courte ; on enchaîne
// via une petite machine a etats. Le fallback mesures HTTP est declenche quand
// MQTT est indisponible.

#include "http_commands.h"

#include "config.h"
#include "pins.h"
#include "wifi_manager.h"
#include "config_store.h"
#include "sensors.h"
#include "actuators.h"
#include "mqtt_publisher.h"

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ─── Mapping id_actionneur -> nom local ───
static const char* nom_actionneur(int id);
static int id_capteur(const char* type);

// Mapping id_actionneur -> nom, valeurs par defaut alignees sur le seed BD.
struct MapAct {
  int id;
  const char* nom;
};

static MapAct mapping_actionneurs[] = {
  { 1, "pompe"       },
  { 2, "ventilation" },
  { 3, "eclairage"   },
};
static const int NB_MAP_ACT = sizeof(mapping_actionneurs) / sizeof(mapping_actionneurs[0]);

// Mapping type_mesure -> id_capteur backend (fallback HTTP mesures).
struct MapCapt {
  const char* type;
  int id;
};

static MapCapt mapping_capteurs[] = {
  { "temperature",  1 },
  { "humidite_air", 2 },
  { "humidite_sol", 3 },
  { "luminosite",   4 },
  { "co2",          5 },
  { "niveau_eau",   6 },
};
static const int NB_MAP_CAPT = sizeof(mapping_capteurs) / sizeof(mapping_capteurs[0]);

// ─── Machine a etats du workflow (une commande a la fois, non-bloquant) ───
static enum EtatCmd {
  IDLE,        // en attente de pull
  A_CONFIRMER, // marquer "recue"
  A_ACTION,    // creer l'action
  A_EXECUTER,  // piloter l'actionneur
  A_CLOTURE,   // cloturer l'action (PUT /api/actions/{id})
  A_EXECUTE,   // marquer "executee"
  ECHOUEE      // marquer "echouee"
} etat = IDLE;

static unsigned long derniereTentativePull = 0;
static unsigned long derniereFallback = 0;
static bool mapping_charge = false;

// Commande courante.
static int  cmd_id            = -1;
static int  cmd_id_action     = -1; // id de l'action creee (0 si inconnu)
static String cmd_type_action;
static int  cmd_id_actionneur = -1;
static String cmd_nom_actionneur; // nom reçu du backend (fallback si vide)

static const char* base_url() { return API_BASE; }

// ─── Bas-niveau HTTP ───
// Envoie une requete HTTP : GET sans corps ou PUT/POST avec corps JSON.
// Retourne le code HTTP ; -2 si WiFi absent ; -1 si echec reseau.
static int requete_http(const String& method, const String& chemin,
                        const char* body) {
  if (!wifi_connected()) return -2;

  WiFiClient client;
  HTTPClient http;
  http.begin(client, (String(base_url()) + chemin).c_str());
  http.addHeader("X-API-Key", config_store_cle_api().c_str());
  if (body != nullptr) {
    http.addHeader("Content-Type", "application/json");
  }

  int code;
  if (method == "GET") {
    code = http.GET();
  } else {
    code = http.sendRequest(method.c_str(), body == nullptr ? "" : body);
  }
  http.end();
  return code;
}

// ─── Pull : GET /commandes/attente ───
// Charge une commande 'envoyee' (la plus ancienne) si presente. Retourne true
// si une commande a ete tiree et l'etat passe a A_CONFIRMER.
static bool pull_et_demarrer() {
  if (!wifi_connected()) return false;

  WiFiClient client;
  HTTPClient http;
  http.begin(client, (String(base_url()) + "/commandes/attente").c_str());
  http.addHeader("X-API-Key", config_store_cle_api().c_str());
  int code = http.GET();
  if (code == 200) {
    String payload = http.getString();
    http.end();

    JsonDocument doc;
    DeserializationError err = deserializeJson(doc, payload);
    if (!err && doc.is<JsonArray>()) {
      JsonArray arr = doc.as<JsonArray>();
      if (arr.size() > 0) {
        JsonObject c = arr[0];
        cmd_id            = c["id"].as<int>();
        cmd_type_action   = c["type_action"].as<const char*>();
        cmd_id_actionneur = c["id_actionneur"].as<int>();
        cmd_nom_actionneur = c["nom_actionneur"].as<const char*>();
        cmd_id_action     = -1;
        Serial.printf("[http] commande tiree : id=%d actionneur=%d action=%s\n",
                      cmd_id, cmd_id_actionneur, cmd_type_action.c_str());
        etat = A_CONFIRMER;
        return true;
      }
    }
    return false;
  }
  http.end();
  return false;
}

// ─── Etapes du workflow ───
static void confirmer_recue() {
  int rc = requete_http("PUT", "/commandes/" + String(cmd_id), "{\"statut\":\"recue\"}");
  Serial.printf("[http] cmd#%d recue (rc=%d)\n", cmd_id, rc);
  etat = (rc == 200) ? A_ACTION : ECHOUEE;
}

static void creer_action() {
  JsonDocument doc;
  doc["id_commande"] = cmd_id;
  doc["statut"]      = "en_cours";
  char body[96];
  serializeJson(doc, body, sizeof(body));

  if (!wifi_connected()) { etat = ECHOUEE; return; }

  WiFiClient client;
  HTTPClient http;
  http.begin(client, (String(base_url()) + "/actions").c_str());
  http.addHeader("X-API-Key", config_store_cle_api().c_str());
  http.addHeader("Content-Type", "application/json");
  int rc = http.sendRequest("POST", body);
  cmd_id_action = -1;
  if (rc == 201) {
    // Lit l'id de l'action creee pour pouvoir la cloturer ensuite.
    String payload = http.getString();
    JsonDocument rep;
    if (!deserializeJson(rep, payload)) {
      cmd_id_action = rep["id"].as<int>();
    }
  }
  http.end();
  Serial.printf("[http] action creee pour cmd#%d id=%d (rc=%d)\n",
                cmd_id, cmd_id_action, rc);
  etat = (rc == 201 && cmd_id_action > 0) ? A_EXECUTER : ECHOUEE;
}

static void executer_actionneur() {
  bool actif = cmd_type_action.equalsIgnoreCase("on");
  // Priorite au nom reçu du backend ; sinon mapping id -> nom.
  const char* nom =
      cmd_nom_actionneur.length() ? cmd_nom_actionneur.c_str()
                                  : nom_actionneur(cmd_id_actionneur);
  if (nom == nullptr) {
    Serial.printf("[http] actionneur id=%d inconnu\n", cmd_id_actionneur);
    etat = ECHOUEE;
    return;
  }
  bool ok = set_actionneur(nom, actif);
  if (ok) mqtt_publish_actuator_state(nom, actif);
  etat = ok ? A_CLOTURE : ECHOUEE;
}

static void cloturer_action() {
  JsonDocument doc;
  doc["statut"]  = "termine";
  doc["resultat"] = "ok";
  char body[48];
  serializeJson(doc, body, sizeof(body));
  int rc = requete_http("PUT", "/actions/" + String(cmd_id_action), body);
  Serial.printf("[http] action#%d terminee (rc=%d)\n", cmd_id_action, rc);
  etat = A_EXECUTE;
}

static void marquer_final(const char* statut) {
  JsonDocument doc;
  doc["statut"] = statut;
  char body[32];
  serializeJson(doc, body, sizeof(body));
  int rc = requete_http("PUT", "/commandes/" + String(cmd_id), body);
  Serial.printf("[http] cmd#%d -> %s (rc=%d)\n", cmd_id, statut, rc);
  etat = IDLE;
}

// ─── Fallback mesures HTTP (POST /api/mesures par capteur mappe) ───
void http_publish_measures_fallback() {
  if (!wifi_connected()) return;

  const SensorReadings& s = sensors_get_current();
  struct { const char* type; float valeur; const char* unite; } mesures[] = {
    { "temperature",  s.temperature,  "C"   },
    { "humidite_air", s.humidite_air, "%"   },
    { "humidite_sol", s.humidite_sol, "%"   },
    { "luminosite",   s.luminosite,   "%"   },
    { "co2",          s.co2,          "ppm" },
    { "niveau_eau",   s.niveau_eau,   "%"   },
  };

  for (unsigned i = 0; i < sizeof(mesures) / sizeof(mesures[0]); i++) {
    if (isnan(mesures[i].valeur)) continue;
    int idc = id_capteur(mesures[i].type);
    if (idc < 0) continue;

    JsonDocument doc;
    doc["valeur"]     = mesures[i].valeur;
    doc["unite"]      = mesures[i].unite;
    doc["source"]     = "esp32";
    doc["id_capteur"] = idc;
    char body[96];
    serializeJson(doc, body, sizeof(body));

    int rc = requete_http("POST", "/mesures", body);
    if (rc != 201) {
      Serial.printf("[http] fallback %s rc=%d, arrete\n", mesures[i].type, rc);
      return;
    }
    Serial.printf("[http] fallback %s ok\n", mesures[i].type);
  }
}

// ─── API publique ───
// Charge au boot le mapping type_mesure -> id_capteur depuis le backend
// (GET /api/capteurs/iot?parcelle=<nom>). Les IDs capteurs dependent de la BD ;
// ce chargement evite de hardcoder des valeurs qui divergeraient du seed.
void http_load_mapping_capteurs() {
  if (mapping_charge) return;
  if (!wifi_connected()) return;

  WiFiClient client;
  HTTPClient http;
  // Encoder les espaces (%20) dans le nom de parcelle pour eviter un 400 HTTP.
  String parcelle = PARCELLE;
  parcelle.replace(" ", "%20");
  String chemin = "/capteurs/iot?parcelle=" + parcelle;
  http.begin(client, (String(base_url()) + chemin).c_str());
  http.addHeader("X-API-Key", config_store_cle_api().c_str());
  int code = http.GET();
  if (code == 200) {
    String payload = http.getString();
    http.end();
    JsonDocument doc;
    DeserializationError err = deserializeJson(doc, payload);
    if (err || !doc.is<JsonObject>()) {
      Serial.println("[http] echec parse mapping capteurs");
      return;
    }
    for (JsonPair kv : doc.as<JsonObject>()) {
      const char* type = kv.key().c_str();
      JsonObject meta = kv.value().as<JsonObject>();
      int id = meta["id"].as<int>();
      for (int i = 0; i < NB_MAP_CAPT; i++) {
        if (strcmp(mapping_capteurs[i].type, type) == 0 && id > 0) {
          mapping_capteurs[i].id = id;
          break;
        }
      }
      Serial.printf("[http] mapping %s -> id %d\n", type, id);
    }
    mapping_charge = true;
  } else {
    http.end();
    Serial.printf("[http] chargement mapping capteurs rc=%d\n", code);
  }
}

void http_commands_begin() {
  derniereTentativePull = 0;
  derniereFallback = 0;
  cmd_id_action = -1;
  mapping_charge = false;
}

void http_set_mapping_actionneur(int id_actionneur, const String& nom) {
  if (id_actionneur <= 0 || nom.isEmpty()) return;
  for (int i = 0; i < NB_MAP_ACT; i++) {
    if (mapping_actionneurs[i].id == id_actionneur) {
      mapping_actionneurs[i].nom = strdup(nom.c_str());
      return;
    }
  }
}

void http_commands_loop() {
  unsigned long maintenant = millis();

  // Re-tente le chargement du mapping capteurs des que le WiFi est up
  // (au boot WiFi n'est pas pret, donc on differe jusqu'a la 1re connexion).
  if (wifi_connected() && !mapping_charge) {
    http_load_mapping_capteurs();
  }

  // Fallback mesures : WiFi up mais MQTT down, a intervalle.
  if (wifi_connected() && !mqtt_connected() &&
      maintenant - derniereFallback >= INTERVALLE_MESURES) {
    derniereFallback = maintenant;
    http_publish_measures_fallback();
  }

  // Machine a etats du workflow commandes (pull periodic + une commande a la fois).
  switch (etat) {
    case IDLE:
      if (maintenant - derniereTentativePull >= INTERVALLE_COMMANDES) {
        derniereTentativePull = maintenant;
        pull_et_demarrer(); // peut passer etat a A_CONFIRMER, sinon reste IDLE
      }
      break;

    case A_CONFIRMER: confirmer_recue();        break;
    case A_ACTION:    creer_action();           break;
    case A_EXECUTER:  executer_actionneur();    break;
    case A_CLOTURE:   cloturer_action();        break;
    case A_EXECUTE:   marquer_final("executee"); break;
    case ECHOUEE:     marquer_final("echouee");  break;
  }

  yield();
}

// ─── Helpers mapping ───
static const char* nom_actionneur(int id) {
  for (int i = 0; i < NB_MAP_ACT; i++) {
    if (mapping_actionneurs[i].id == id) return mapping_actionneurs[i].nom;
  }
  return nullptr;
}

static int id_capteur(const char* type) {
  for (int i = 0; i < NB_MAP_CAPT; i++) {
    if (strcmp(mapping_capteurs[i].type, type) == 0) return mapping_capteurs[i].id;
  }
  return -1;
}
