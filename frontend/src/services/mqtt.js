/**
 * Service MQTT temps réel (frontend SAI).
 *
 * Se connecte au broker Mosquitto via WebSocket (VITE_MQTT_URL, défaut
 * ws://localhost:9001) avec le compte en lecture `sai_frontend` (ACL read sai/#).
 *
 * Expose un petit registre de callbacks pour trois familles de messages :
 *   - `alerte` : topic `sai/<parcelle>/alertes` (payload AlertePub JSON)
 *   - `mesure` : topic `sai/<parcelle>/capteurs/#` (payload multi-mesures)
 *   - `actionneur` : topic `sai/<parcelle>/actionneurs/#` (état actionneur)
 *
 * La connexion est paresseuse : elle ne démarre qu'au premier abonnement et
 * reste active ensuite (reconnexion automatique toutes les 3 s).
 */
import mqtt from 'mqtt';

const MQTT_URL = import.meta.env.VITE_MQTT_URL || 'ws://localhost:9001';
const MQTT_USER = 'sai_frontend';
const MQTT_PASS = 'sai_frontend_pass';

const TOPIC_ALERTES = 'sai/+/alertes';
const TOPIC_MESURES = 'sai/+/capteurs/#';
const TOPIC_ACTIONNEURS = 'sai/+/actionneurs/#';

let client = null;
let connectHandler = null;
const listeners = { alerte: new Set(), mesure: new Set(), actionneur: new Set() };

/** Notifie tous les callbacks d'une famille, sans qu'un incident ne casse la boucle. */
function notify(type, message) {
  listeners[type].forEach((cb) => {
    try {
      cb(message);
    } catch (err) {
      console.error('[mqtt] Erreur callback', type, err);
    }
  });
}

/** Crée le client (une seule fois) puis le connecte au broker. */
function ensureClient() {
  if (client) return;
  client = mqtt.connect(MQTT_URL, {
    clientId: `sai_frontend_${Math.random().toString(16).slice(2, 10)}`,
    username: MQTT_USER,
    password: MQTT_PASS,
    reconnectPeriod: 3000,
    connectTimeout: 10000,
    clean: true,
  });

  client.on('connect', () => {
    console.info(`[mqtt] Connecté à ${MQTT_URL}`);
    client.subscribe(TOPIC_ALERTES, { qos: 1 });
    client.subscribe(TOPIC_MESURES, { qos: 1 });
    client.subscribe(TOPIC_ACTIONNEURS, { qos: 1 });
  });

  client.on('message', (topic, message) => {
    let payload;
    try {
      payload = JSON.parse(message.toString());
    } catch (err) {
      console.error('[mqtt] Payload JSON invalide', topic, err);
      return;
    }
    const parts = topic.split('/');
    const contexte = { topic, payload, parcelle: parts?.[1] };
    if (topic.endsWith('/alertes')) {
      notify('alerte', contexte);
    } else if (topic.includes('/capteurs/')) {
      notify('mesure', contexte);
    } else if (topic.includes('/actionneurs/')) {
      notify('actionneur', contexte);
    }
  });

  client.on('reconnect', () => console.info('[mqtt] Reconnexion...'));
  client.on('error', (err) => console.error('[mqtt] Erreur', err.message));
}

/**
 * S'abonne aux alertes temps réel (topic sai/+/alertes).
 * @returns {Function} fonction pour se désabonner
 */
export function subscribeAlertes(cb) {
  ensureClient();
  listeners.alerte.add(cb);
  return () => listeners.alerte.delete(cb);
}

/**
 * S'abonne aux mesures temps réel (topic sai/+/capteurs/#).
 * @returns {Function} fonction pour se désabonner
 */
export function subscribeMesures(cb) {
  ensureClient();
  listeners.mesure.add(cb);
  return () => listeners.mesure.delete(cb);
}

/**
 * S'abonne aux états de commande des actionneurs (topic sai/+/actionneurs/#).
 * @returns {Function} fonction pour se désabonner
 */
export function subscribeActionneurs(cb) {
  ensureClient();
  listeners.actionneur.add(cb);
  return () => listeners.actionneur.delete(cb);
}

/** Coupe la connexion proprement (appelé à la déconnexion utilisateur). */
export function deconnecterMqtt() {
  if (client) {
    client.end(true);
    client = null;
  }
}