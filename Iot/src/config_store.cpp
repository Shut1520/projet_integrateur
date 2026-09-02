// config_store.cpp — Implementation de la persistance NVS (SAI).

#include "config_store.h"
#include <Preferences.h>

#include "config.h"

// Namespace et cle utilises dans la partition NVS.
static const char* NVS_NAMESPACE = "sai";
static const char* NVS_CLE_API   = "cle_api";

static Preferences preferences;

void config_store_begin() {
  preferences.begin(NVS_NAMESPACE, false);
}

String config_store_cle_api() {
  String cle = preferences.getString(NVS_CLE_API, "");
  if (cle.length() > 0) {
    return cle; // valeur NVS : prioritaire
  }
  return String(API_KEY); // fallback config.h
}

bool config_store_set_cle_api(const String& cle) {
  if (cle.length() == 0) {
    return false;
  }
  return preferences.putString(NVS_CLE_API, cle) > 0;
}
