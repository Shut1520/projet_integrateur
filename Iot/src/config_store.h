// config_store.h — Persistance configuration en NVS (SAI).
//
// Permet de surcharger la cle API (et autres parametres) a l'execution sans
// recompiler : la valeur est stockee en NVS (flash) et preferee a config.h.
// Utile pour changer la cle sans re-flash.

#ifndef CONFIG_STORE_H
#define CONFIG_STORE_H

#include <Arduino.h>

// Initialise la partition NVS (a appeler une fois au setup).
void config_store_begin();

// Retourne la cle API active : NVS si presente, sinon la valeur de config.h.
String config_store_cle_api();

// Persiste une nouvelle cle API en NVS (retourne true si OK).
bool config_store_set_cle_api(const String& cle);

#endif // CONFIG_STORE_H
