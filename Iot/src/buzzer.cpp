// buzzer.cpp — Implementation du pilotage buzzer actif (SAI).
//
// Buzzer actif : simple HIGH/LOW. Pas de PWM necessaire.
// La sequence est geree de facon non-bloquante via millis().

#include "buzzer.h"
#include "pins.h"

// Etat interne
static bool buzzerActif = false;
static int  bipRestants = 0;
static unsigned long dureeBipMs = 200;
static unsigned long dernierChangement = 0;
static bool etatPhysique = false; // etat du buzzer (HIGH/LOW)

void buzzer_begin() {
  pinMode(GPIO_BUZZER, OUTPUT);
  digitalWrite(GPIO_BUZZER, LOW);
  buzzerActif = false;
}

void buzzer_loop() {
  if (!buzzerActif || bipRestants <= 0) return;

  unsigned long maintenant = millis();
  if (maintenant - dernierChangement < dureeBipMs) return;

  dernierChangement = maintenant;

  if (etatPhysique) {
    // Etait ON -> OFF
    digitalWrite(GPIO_BUZZER, LOW);
    etatPhysique = false;
    bipRestants--;
  } else {
    // Etait OFF -> ON (prochain bip)
    if (bipRestants > 0) {
      digitalWrite(GPIO_BUZZER, HIGH);
      etatPhysique = true;
    }
  }
}

void buzzer_beep(int nb_bips, unsigned long duree_ms) {
  bipRestants = nb_bips;
  dureeBipMs = duree_ms;
  dernierChangement = millis();
  buzzerActif = true;
  // Demarrer immediatement le premier bip
  digitalWrite(GPIO_BUZZER, HIGH);
  etatPhysique = true;
}

void buzzer_stop() {
  digitalWrite(GPIO_BUZZER, LOW);
  buzzerActif = false;
  bipRestants = 0;
  etatPhysique = false;
}
