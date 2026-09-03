// wifi_manager.cpp — Implementation de la gestion WiFi non-bloquante (SAI).

#include "wifi_manager.h"
#include <WiFi.h>
#include <time.h>

#include "config.h"

// Intervalle minimal (ms) entre deux tentatives de (re)connexion.
static const unsigned long WIFI_RETRY_MS = 5000;

// Timestamp (millis) de la derniere tentative de connexion.
static unsigned long derniereTentative = 0;

// NTP synchronise.
static bool ntp_ok = false;

void wifi_begin() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  derniereTentative = millis();
  Serial.printf("[wifi] Connexion a '%s'...\n", WIFI_SSID);
}

// Tente de (re)connecter si deconnecte et si l'intervalle est ecoule.
void wifi_loop() {
  if (wifi_connected()) {
    // NTP : synchro une seule fois apres connexion WiFi.
    if (!ntp_ok) {
      configTime(0, 0, "pool.ntp.org", "time.nist.gov");
      struct tm t;
      if (getLocalTime(&t, 5000)) {
        ntp_ok = true;
        Serial.printf("[wifi] NTP synchro : %04d-%02d-%02d %02d:%02d:%02d UTC\n",
                      t.tm_year + 1900, t.tm_mon + 1, t.tm_mday,
                      t.tm_hour, t.tm_min, t.tm_sec);
      }
    }
    return; // deja connecte : rien a faire (non-bloquant)
  }

  unsigned long maintenant = millis();
  if (maintenant - derniereTentative < WIFI_RETRY_MS) {
    return; // pas encore le moment de retenter
  }
  derniereTentative = maintenant;

  Serial.println("[wifi] Reconnexion...");
  WiFi.disconnect();
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
}

bool wifi_connected() {
  return WiFi.status() == WL_CONNECTED && WiFi.localIP() != IPAddress(0, 0, 0, 0);
}
