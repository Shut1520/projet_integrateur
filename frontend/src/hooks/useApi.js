/**
 * Hook personnalisé useApi — abstraction des appels API avec gestion d'état.
 * Gère le chargement, les erreurs (avec toasts automatiques),
 * et permet un re-fetch manuel ou automatique au montage.
 */
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../context/ToastContext';
import { getApiErrorMessage } from '../utils/errors';

/**
 * Hook personnalisé pour faire des appels API avec gestion d'état.
 *
 * @param {Function} apiFn - Fonction async qui retourne les données
 * @param {Array} deps - Dépendances pour relancer le fetch
 * @param {Object} options
 * @param {boolean} options.immediate - Lancer le fetch au mount (défaut: true)
 * @param {string} options.errorMessage - Message d'erreur custom
 *
 * @returns {{ data, loading, error, refetch }}
 */
export function useApi(apiFn, deps = [], options = {}) {
  const { immediate = true, errorMessage } = options;
  const { addToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFn();
      setData(result);
      return result;
    } catch (err) {
      const msg = errorMessage || getApiErrorMessage(err, 'Erreur de chargement');
      setError(msg);
      addToast({ type: 'error', title: 'Erreur', message: msg });
      return null;
    // Le finally s'exécute toujours, qu'il y ait eu succès ou erreur
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    if (immediate) refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, refetch, setData };
}
