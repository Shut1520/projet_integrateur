/**
 * Service d'accès à l'API SAI (Frontend).
 * Encapsule toutes les requêtes HTTP vers le backend FastAPI via Axios.
 * Gère automatiquement : l'ajout du token JWT, la déconnexion sur 401,
 * et la normalisation des réponses (tableau ou objet).
 */
import axios from 'axios';
import { storage } from './storage';

/**
 * Axios Instance configured for SAI API communication.
 * Le proxy Vite redirige /api vers le backend FastAPI (localhost:8000).
 */
export const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

/**
 * Interceptor : ajoute automatiquement le token JWT à chaque requête sortante
 * si l'utilisateur est authentifié.
 */
apiClient.interceptors.request.use((config) => {
  const user = storage.getCurrentUser();
  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

/**
 * Interceptor de réponse : déconnecte automatiquement si le backend renvoie 401
 * (token expiré ou invalide).
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const user = storage.getCurrentUser();
      if (user?.token) {
        localStorage.removeItem('sai_current_user_v1');
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Helper : normalise la réponse backend.
 * Le backend retourne soit un tableau, soit { data: [...] }, soit { items: [...] }.
 */
function asArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

/**
 * Service d'accès à l'API SAI. Toutes les méthodes appellent le backend FastAPI.
 * En cas d'erreur réseau (backend injoignable), les erreurs sont propagées pour
 * que l'UI puisse afficher un toast.
 */
export const apiService = {
  // ─── Parcelles (UC14) ───
  async getParcelles() {
    const response = await apiClient.get('/parcelles');
    return asArray(response.data);
  },

  async createParcelle(parcelle) {
    const response = await apiClient.post('/parcelles', parcelle);
    return response.data;
  },

  async updateParcelle(id, data) {
    const response = await apiClient.put(`/parcelles/${id}`, data);
    return response.data;
  },

  async deleteParcelle(id) {
    await apiClient.delete(`/parcelles/${id}`);
  },

  // ─── Capteurs (UC12) ───
  async getCapteurs() {
    const response = await apiClient.get('/capteurs');
    return asArray(response.data);
  },

  async createCapteur(capteur) {
    const response = await apiClient.post('/capteurs', capteur);
    return response.data;
  },

  async updateCapteur(id, data) {
    const response = await apiClient.put(`/capteurs/${id}`, data);
    return response.data;
  },

  async deleteCapteur(id) {
    await apiClient.delete(`/capteurs/${id}`);
  },

  // ─── Mesures ───
  async getMesures(params = {}) {
    const response = await apiClient.get('/mesures', { params });
    return asArray(response.data);
  },

  // ─── Actionneurs (UC13) ───
  async getActionneurs() {
    const response = await apiClient.get('/actionneurs');
    return asArray(response.data);
  },

  async createActionneur(actionneur) {
    const response = await apiClient.post('/actionneurs', actionneur);
    return response.data;
  },

  async updateActionneur(id, data) {
    const response = await apiClient.put(`/actionneurs/${id}`, data);
    return response.data;
  },

  async deleteActionneur(id) {
    await apiClient.delete(`/actionneurs/${id}`);
  },

  /**
   * Commande manuelle d'un actionneur (UC4 / UC5).
   * @param {number} id - Identifiant de l'actionneur
   * @param {string} typeAction - 'on' | 'off' | 'programmer'
   * @param {string|number} valeurParametre - Durée en secondes (si typeAction = 'programmer')
   */
  async commanderActionneur(id, typeAction, valeurParametre = null) {
    const payload = { type_action: typeAction };
    if (valeurParametre !== null) payload.valeur_parametre = String(valeurParametre);
    const response = await apiClient.post(`/commandes`, {
      id_actionneur: id,
      ...payload,
      source: 'web',
    });
    return response.data;
  },

  // ─── Commandes ───
  async getCommandes(params = {}) {
    const response = await apiClient.get('/commandes', { params });
    return asArray(response.data);
  },

  // ─── Alertes ───
  async getAlertes(params = {}) {
    const response = await apiClient.get('/alertes', { params });
    return asArray(response.data);
  },

  async reconnaitreAlerte(id) {
    const response = await apiClient.put(`/alertes/${id}/reconnaitre`);
    return response.data;
  },

  async resoudreAlerte(id) {
    const response = await apiClient.put(`/alertes/${id}/resoudre`);
    return response.data;
  },

  // ─── Seuils (UC7) ───
  async getSeuils() {
    const response = await apiClient.get('/seuils');
    return asArray(response.data);
  },

  async createSeuil(seuil) {
    const response = await apiClient.post('/seuils', seuil);
    return response.data;
  },

  async updateSeuil(id, data) {
    const response = await apiClient.put(`/seuils/${id}`, data);
    return response.data;
  },

  async deleteSeuil(id) {
    await apiClient.delete(`/seuils/${id}`);
  },

  // ─── Utilisateurs (UC8) ───
  async getUsers() {
    const response = await apiClient.get('/utilisateurs');
    return asArray(response.data);
  },

  async createUser(user) {
    const response = await apiClient.post('/utilisateurs', user);
    return response.data;
  },

  async updateUser(id, data) {
    const response = await apiClient.put(`/utilisateurs/${id}`, data);
    return response.data;
  },

  async deleteUser(id) {
    await apiClient.delete(`/utilisateurs/${id}`);
  },

  // ─── Tokens API (CLI) ───
  async getTokens() {
    const response = await apiClient.get('/tokens');
    return asArray(response.data);
  },

  async createToken(data) {
    const response = await apiClient.post('/tokens', data);
    return response.data;
  },

  async revokeToken(id) {
    await apiClient.delete(`/tokens/${id}`);
  },
};
