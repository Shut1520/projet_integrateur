/**
 * Service de stockage local (localStorage) — version allégée.
 * On ne garde que l'utilisateur courant (avec son token JWT).
 * Toutes les autres données sont gérées côté backend PostgreSQL.
 *
 * Clés utilisées :
 *   - sai_current_user_v1 : objet utilisateur + token JWT
 *   - sai_theme : préférence clair/sombre
 */

const STORAGE_KEYS = {
  CURRENT_USER: 'sai_current_user_v1',
  THEME: 'sai_theme',
};

/**
 * Lecture sécurisée d'une valeur JSON depuis localStorage.
 * Retourne fallback si la clé n'existe pas ou si le JSON est corrompu.
 */
export function getStoredData(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

/**
 * Écriture sécurisée d'une valeur dans localStorage.
 * Si data est null/undefined, la clé est supprimée.
 */
export function setStoredData(key, data) {
  try {
    if (data === null || data === undefined) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(data));
    }
  } catch (e) {
    console.error('Error writing localStorage key', key, e);
  }
}

/**
 * Interface publique du service de stockage.
 * Fournit des méthodes nommées pour lire/écrire l'utilisateur courant.
 */
export const storage = {
  getCurrentUser: () => getStoredData(STORAGE_KEYS.CURRENT_USER, null),
  setCurrentUser: (user) => setStoredData(STORAGE_KEYS.CURRENT_USER, user),
  clearCurrentUser: () => setStoredData(STORAGE_KEYS.CURRENT_USER, null),
};
