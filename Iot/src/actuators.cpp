// actuators.cpp — Implementation du controle des actionneurs (SAI).

#include "actuators.h"

#include "config.h"
#include "pins.h"

// Etats logiques par actionneur (indices stables du tableau officiel).
enum ActId { ACT_POMPE = 0, ACT_VENTILATION, ACT_ECLAIRAGE, ACT_COUNT };

static const char* noms[ACT_COUNT] = { "pompe", "ventilation", "eclairage" };
static const uint8_t pins[ACT_COUNT] = { GPIO_POMPE, GPIO_VENTILATION, GPIO_ECLAIRAGE };
static bool etats[ACT_COUNT] = { false, false, false };

// Retrouve l'indice d'un actionneur par son nom ; -1 si inconnu.
static int trouver_index(const String& nom) {
  for (int i = 0; i < ACT_COUNT; i++) {
    if (nom.equalsIgnoreCase(noms[i])) return i;
  }
  return -1;
}

void actuators_begin() {
  for (int i = 0; i < ACT_COUNT; i++) {
    pinMode(pins[i], OUTPUT);
    digitalWrite(pins[i], LOW);
    etats[i] = false;
  }
}

bool set_actionneur(const String& nom, bool active) {
  int i = trouver_index(nom);
  if (i < 0) return false;
  digitalWrite(pins[i], active ? HIGH : LOW);
  etats[i] = active;
  Serial.printf("[actuators] %s -> %s\n", noms[i], active ? "ON" : "OFF");
  return true;
}

bool actionneur_actif(const String& nom) {
  int i = trouver_index(nom);
  return i >= 0 && etats[i];
}

bool au_moins_un_actif() {
  for (int i = 0; i < ACT_COUNT; i++) {
    if (etats[i]) return true;
  }
  return false;
}
