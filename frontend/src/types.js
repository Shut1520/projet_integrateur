/**
 * Constants and types reference for JavaScript.
 * Les rôles utilisent les valeurs stockées en base de données (minuscules).
 */

export const USER_ROLES = {
  ADMIN: 'admin',
  AGRICULTEUR: 'agriculteur',
};

export const USER_ROLES_LABELS = {
  admin: 'Administrateur',
  agriculteur: 'Agriculteur',
};

export const ALERTE_SEVERITIES = {
  CRITIQUE: 'critique',
  HAUTE: 'haute',
  BASSE: 'basse',
};

export const CAPTEUR_TYPES = {
  TEMPERATURE: 'dht22',
  HUMIDITE_SOL: 'yl-69',
  LUMINOSITE: 'bh1750',
  CO2: 'sen0159',
  NIVEAU_EAU: 'niveau_eau',
};

export const ACTIONNEUR_TYPES = {
  POMPE: 'pompe',
  VENTILATION: 'ventilation',
  ECLAIRAGE: 'eclairage',
};

export const COMMANDE_STATUTS = {
  ENVOYEE: 'envoyee',
  RECUE: 'recue',
  EXECUTEE: 'executee',
  ECHOUEE: 'echouee',
};

export const ACTION_STATUTS = {
  EN_COURS: 'en_cours',
  TERMINE: 'termine',
  ECHOUEE: 'echouee',
};

export const ALERTE_ETATS = {
  ACTIVE: 'active',
  RECONNUE: 'reconnue',
  RESOLUE: 'resolue',
};
