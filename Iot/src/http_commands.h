// http_commands.h — Workflow commandes HTTP (SAI), non-bloquant.
//
// L'ESP32 interroge le backend (clave API X-API-Key) pour recuperer les
// commandes en attente (GET /api/commandes/attente), confirme leur statut
// (recue -> executee/echouee) et cree/clot l'action associee (POST /api/actions,
// PUT /api/actions/{id}).
//
// Parallèlement, sert de fallback HTTP d'ingestion des mesures si MQTT est
// indisponible (POST /api/mesures). Rien n'est bloquant : tout est pilote par
// millis() dans http_commands_loop().

#ifndef HTTP_COMMANDS_H
#define HTTP_COMMANDS_H

#include <Arduino.h>

// Initialise le client HTTP. A appeler une fois au setup.
void http_commands_begin();

// Charge au boot le mapping type_mesure -> id_capteur depuis le backend
// (GET /api/capteurs/iot?parcelle=<nom>). A appeler quand le WiFi est up.
void http_load_mapping_capteurs();

// Scheduler non-bloquant (millis) : pull des commandes + confirmations
// et fallback mesures HTTP si MQTT est down. A appeler a chaque loop().
void http_commands_loop();

// Associe un id backend (actionneur) a un nom local (pompe/ventilation/...).
// Utilite si l'ordre des IDs du seed differe de la table par defaut.
void http_set_mapping_actionneur(int id_actionneur, const String& nom);

// Envoie les mesures courantes en fallback HTTP (POST /api/mesures).
// Normalement reserve a la reconnexion MQTT ; exposee pour debug.
void http_publish_measures_fallback();

#endif // HTTP_COMMANDS_H
