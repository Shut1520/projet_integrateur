/**
 * Format helper functions for SAI Frontend (JS)
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

export function formatTimeAgo(secondsAgo) {
  if (secondsAgo < 5) return 'À l\'instant';
  if (secondsAgo < 60) return `Il y a ${secondsAgo}s`;
  const mins = Math.floor(secondsAgo / 60);
  if (mins < 60) return `Il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  return `Il y a ${hours} h`;
}

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
