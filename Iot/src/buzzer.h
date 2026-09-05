// buzzer.h — Pilotage d'un buzzer actif pour alertes (SAI).
//
// Fournit :
//   - buzzer_begin()   : initialise le GPIO en sortie (OFF au demarrage).
//   - buzzer_loop()    : scheduler non-bloquant (millis), gere les bips en cours.
//   - buzzer_beep()    : declenche une sequence de bips (nb_bips ON/OFF identiques).
//   - buzzer_stop()    : coupe immediatement le buzzer.

#ifndef BUZZER_H
#define BUZZER_H

#include <Arduino.h>

void buzzer_begin();
void buzzer_loop();
void buzzer_beep(int nb_bips, unsigned long duree_ms = 200);
void buzzer_stop();

#endif // BUZZER_H
