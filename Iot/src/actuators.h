// actuators.h — Controle des actionneurs (SAI), par fonctions.
//
// Pilotage des relais (pompe, ventilation, eclairage). La publication de l'etat
// sur MQTT est geree par mqtt_publisher (etape 7.4) ; ce module ne fait que
// piloter physiquement les GPIO et exposer l'etat logique courant.

#ifndef ACTUATORS_H
#define ACTUATORS_H

#include <Arduino.h>

// Initialise les relais (pins en sortie, etat initial OFF). A appeler au setup.
void actuators_begin();

// Active/coupe un actionneur par son nom. Retourne true si nom connu.
bool set_actionneur(const String& nom, bool active);

// Accede a l'etat courant d'un actionneur (true = actif). Retourne false si inconnu.
bool actionneur_actif(const String& nom);

// Etat logique courant (ON si au moins un actionneur est actif).
bool au_moins_un_actif();

#endif // ACTUATORS_H
