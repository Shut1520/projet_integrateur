/**
 * Constantes et types métier pour le frontend SAI.
 * Les rôles utilisent les valeurs stockées en base de données (minuscules).
 * Ces constantes servent de référence pour les comparaisons et l'affichage
 * dans tous les composants de l'application.
 */

// Rôles utilisateurs (alignés sur le schéma backend)
export const USER_ROLES = {
  ADMIN: 'admin',
  AGRICULTEUR: 'agriculteur',
};

// Libellés d'affichage pour chaque rôle
export const USER_ROLES_LABELS = {
  admin: 'Administrateur',
  agriculteur: 'Agriculteur',
};

// Niveaux de sévérité des alertes (du plus grave au moins grave)
export const ALERTE_SEVERITIES = {
  CRITIQUE: 'critique',
  HAUTE: 'haute',
  BASSE: 'basse',
};

// Types de capteurs Physiques — correspond aux noms techniques utilisés par l'ESP32
export const CAPTEUR_TYPES = {
  TEMPERATURE: 'dht22',
  HUMIDITE_SOL: 'yl-69',
  LUMINOSITE: 'bh1750',
  CO2: 'sen0159',
  NIVEAU_EAU: 'niveau_eau',
};

// Types d'actionneurs (périphériques de commande)
export const ACTIONNEUR_TYPES = {
  POMPE: 'pompe',
  VENTILATION: 'ventilation',
  ECLAIRAGE: 'eclairage',
};

// États possibles d'une commande envoyée à un actionneur
export const COMMANDE_STATUTS = {
  ENVOYEE: 'envoyee',
  RECUE: 'recue',
  EXECUTEE: 'executee',
  ECHOUEE: 'echouee',
};

// États d'exécution d'une action (pipeline de traitement)
export const ACTION_STATUTS = {
  EN_COURS: 'en_cours',
  TERMINE: 'termine',
  ECHOUEE: 'echouee',
};

// États du cycle de vie d'une alerte
export const ALERTE_ETATS = {
  ACTIVE: 'active',
  RECONNUE: 'reconnue',
  RESOLUE: 'resolue',
};
