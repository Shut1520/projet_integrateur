/**
 * Configuration globale de l'application SAI.
 */

export const APP_NAME = 'SAI';
export const APP_FULL_NAME = 'Système Agricole Intelligent';
export const APP_VERSION = '1.0.0';

// URLs utiles
export const API_PREFIX = '/api';

// Durées de polling (en ms)
export const POLLING = {
  DASHBOARD: 5_000,
  ALERTES: 10_000,
  MESURES: 5_000,
};

// Limites d'affichage
export const LIMITS = {
  HISTORIQUE_PAR_PAGE: 8,
  MAX_TOKENS_PAR_UTILISATEUR: 10,
};

// Statuts applicatifs (alignés sur le backend)
export const ROLES = {
  ADMIN: 'admin',
  AGRICULTEUR: 'agriculteur',
};

export const ROLE_LABELS = {
  admin: 'Administrateur',
  agriculteur: 'Agriculteur',
};

export const SEUIL_TYPES = {
  TEMPERATURE: 'temperature',
  HUMIDITE_SOL: 'humidite_sol',
  CO2: 'co2',
  LUMINOSITE: 'luminosite',
  NIVEAU_EAU: 'niveau_eau',
};

export const CAPTEUR_TYPES = {
  DHT22: 'dht22',
  YL69: 'yl-69',
  BH1750: 'bh1750',
  SEN0159: 'sen0159',
  NIVEAU_EAU: 'niveau_eau',
};

export const ACTIONNEUR_TYPES = {
  POMPE: 'pompe',
  VENTILATION: 'ventilation',
  ECLAIRAGE: 'eclairage',
};
