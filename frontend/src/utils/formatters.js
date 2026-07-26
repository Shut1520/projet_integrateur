/**
 * Fonctions utilitaires de formatage pour l'interface SAI.
 * - formatDate : date complète en format français
 * - formatTimeAgo : temps relatif lisible ("Il y a 5 min")
 * - exportMesuresToCSV : export de données vers un fichier CSV téléchargeable
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

/**
 * Exporte un tableau de mesures au format CSV et déclenche le téléchargement.
 * @param {Array} mesures - Tableau d'objets mesures
 * @param {string} filename - Nom du fichier à télécharger
 */
export function exportMesuresToCSV(mesures, filename = 'sai_export.csv') {
  const headers = ['ID', 'Capteur Code', 'Nom Capteur', 'Parcelle', 'Valeur', 'Unité', 'Statut', 'Date/Heure'];
  const rows = mesures.map((m) => [
    m.id,
    `"${m.capteurCode}"`,
    `"${m.capteurNom}"`,
    `"${m.parcelleNom}"`,
    m.valeur,
    `"${m.unite}"`,
    `"${m.statut}"`,
    `"${m.timestamp}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
