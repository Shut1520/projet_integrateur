/**
 * Fonctions utilitaires de formatage pour l'interface SAI.
 * - formatDate : date complète en format français
 * - formatTimeAgo : temps relatif lisible ("Il y a 5 min")
 */

/**
 * Formate une date ISO en format français lisible (jj/mm/aaaa hh:mm).
 * @param {string} dateString - Chaîne de date ISO ou timestamp
 * @returns {string} Date formatée, ou chaîne vide si invalide
 */
export function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Convertit un nombre de secondes en une chaîne de temps relatif.
 * Exemples : "À l'instant", "Il y a 30s", "Il y a 5 min", "Il y a 2 h"
 */
export function formatTimeAgo(secondsAgo) {
  if (secondsAgo < 5) return 'À l\'instant';
  if (secondsAgo < 60) return `Il y a ${secondsAgo}s`;
  const mins = Math.floor(secondsAgo / 60);
  if (mins < 60) return `Il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  return `Il y a ${hours} h`;
}
