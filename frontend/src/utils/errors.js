/**
 * Helpers pour transformer les erreurs Axios en messages utilisateur lisibles.
 * Priorise les messages détaillés du backend (Pydantic), puis les messages
 * HTTP génériques, puis le fallback personnalisé.
 */

const HTTP_MESSAGES = {
  400: 'Requête invalide.',
  401: 'Non authentifié. Veuillez vous reconnecter.',
  403: 'Action non autorisée.',
  404: 'Ressource introuvable.',
  409: 'Conflit : la ressource existe déjà.',
  422: 'Données invalides. Vérifiez les champs du formulaire.',
  500: 'Erreur interne du serveur.',
  502: 'Serveur injoignable.',
  503: 'Service temporairement indisponible.',
};

/**
 * Extrait un message d'erreur lisible à partir d'une erreur Axios.
 * @param {Error} err - Objet erreur retourné par Axios
 * @param {string} fallback - Message par défaut si aucun détail n'est disponible
 * @returns {string} Message d'erreur formaté pour l'utilisateur
 */
export function getApiErrorMessage(err, fallback = 'Une erreur est survenue.') {
  if (!err) return fallback;
  // Erreur réseau
  if (err.message === 'Network Error') {
    return 'Impossible de joindre le serveur. Vérifiez votre connexion.';
  }
  if (err.code === 'ECONNABORTED') {
    return 'La requête a expiré (timeout).';
  }
  // Erreur HTTP avec détail
  const status = err.response?.status;
  if (status) {
    const detail = err.response?.data?.detail;
    if (typeof detail === 'string' && detail.length > 0 && detail.length < 200) {
      return detail;
    }
    // Erreur de validation Pydantic : extraire le premier champ en erreur
    if (Array.isArray(detail) && detail.length > 0) {
      // Erreur de validation Pydantic
      const first = detail[0];
      const field = first?.loc?.filter((l) => l !== 'body').join('.') || 'champ';
      return `${field} : ${first?.msg || 'invalide'}`;
    }
    return HTTP_MESSAGES[status] || fallback;
  }
  return err.message || fallback;
}
