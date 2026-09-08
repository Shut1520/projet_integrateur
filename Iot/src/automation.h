// automation.h — Automatisation embarquee (SAI), non-bloquante.
//
// Evalue periodiquement les seuils locaux (config.h : SEUIL_SOL_SEC,
// SEUIL_TEMP_HAUTE, SEUIL_CO2_HAUT) sur les lectuures capteurs courantes et
// pilote les actionneurs en consequence. L'automatisation locale prime sur les
// commandes distantes tant qu'un seuil est dechu. Emet aussi une alerte si la
// liaison (WiFi/MQTT) est perdue.

#ifndef AUTOMATION_H
#define AUTOMATION_H

#include <Arduino.h>

// Initialise le module. A appeler une fois au setup.
void automation_begin();

// Scheduler non-bloquant (millis) : applique les seuils locaux + alerte liaison.
// A appeler a chaque loop().
void automation_loop();

// Marque qu'une commande backend vient d'etre executee.
// Declenche un cooldown (60s) pendant lequel l'automatisation locale est suspendue.
void automation_commande_recue();

#endif // AUTOMATION_H
