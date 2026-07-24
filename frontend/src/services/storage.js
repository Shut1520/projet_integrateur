/**
 * Service de stockage local (localStorage) — version allégée.
 * On ne garde que l'utilisateur courant (avec son token JWT).
 * Toutes les autres données sont gérées côté backend PostgreSQL.
 */

const STORAGE_KEYS = {
  CURRENT_USER: 'sai_current_user_v1',
  THEME: 'sai_theme',
};

export function getStoredData(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

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

export const storage = {
  getCurrentUser: () => getStoredData(STORAGE_KEYS.CURRENT_USER, null),
  setCurrentUser: (user) => setStoredData(STORAGE_KEYS.CURRENT_USER, user),
  clearCurrentUser: () => setStoredData(STORAGE_KEYS.CURRENT_USER, null),
};
