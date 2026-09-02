// wifi_manager.h — Gestion WiFi non-bloquante (SAI).
//
// Fournit une fonction de boucle `wifi_loop()` a appeler a chaque iteration du
// scheduler dans main.cpp. Elle assure la connexion initiale puis la
// reconnexion automatique au reseau, sans jamais bloquer le processeur
// (pas de while(d'attente) ni de delay() long).
//
// APIs : wifi_begin(), wifi_loop(), wifi_connected().

#ifndef WIFI_MANAGER_H
#define WIFI_MANAGER_H

#include <Arduino.h>

// Initialise le WiFi en mode station et lance la connexion (non-bloquant).
void wifi_begin();

// A appeler a chaque iteration : pilote reconnexion + watchdog (non-bloquant).
void wifi_loop();

// Retourne true si le WiFi est connecte avec une adresse IP.
bool wifi_connected();

#endif // WIFI_MANAGER_H
