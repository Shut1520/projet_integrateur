import React, { createContext, useContext, useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { apiClient } from '../services/api';

const AuthContext = createContext(undefined);

/**
 * AuthContext : gère l'authentification de l'utilisateur via le backend FastAPI.
 *
 * Stocke dans localStorage (sai_current_user_v1) :
 *   {
 *     id: number,
 *     nom: string,
 *     email: string,
 *     role: 'agriculteur' | 'admin',
 *     token: string  (JWT)
 *   }
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Au montage : on relit l'utilisateur depuis le localStorage
  useEffect(() => {
    const storedUser = storage.getCurrentUser();
    if (storedUser && storedUser.token) {
      setUser(storedUser);
    }
    setLoading(false);
  }, []);

  /**
   * Connexion via l'API backend.
   * Appelle POST /api/auth/login avec { email, password }.
   * Stocke le JWT retourné.
   */
  const login = async (email, password) => {
    const response = await apiClient.post('/auth/login', { email, password });
    const { access_token, utilisateur } = response.data;
    const authedUser = { ...utilisateur, token: access_token };
    storage.setCurrentUser(authedUser);
    setUser(authedUser);
    return authedUser;
  };

  /**
   * Inscription via l'API backend.
   * Appelle POST /api/auth/register.
   * Connecte automatiquement l'utilisateur après création.
   */
  const register = async (userData) => {
    const response = await apiClient.post('/auth/register', userData);
    const utilisateur = response.data;
    // On enchaîne avec un login pour récupérer le JWT
    return await login(utilisateur.email, userData.password);
  };

  /**
   * Déconnexion : on efface le token et l'utilisateur du localStorage.
   */
  const logout = () => {
    localStorage.removeItem('sai_current_user_v1');
    setUser(null);
  };

  /**
   * Mise à jour du profil (utilisateur courant uniquement).
   * Les données sensibles (password) ne sont pas modifiables ici.
   */
  const updateUserProfile = (data) => {
    if (!user) return;
    const updated = { ...user, ...data, token: user.token };
    setUser(updated);
    storage.setCurrentUser(updated);
  };

  /**
   * Vérifie si l'utilisateur connecté a un rôle donné.
   */
  const hasRole = (role) => {
    if (!user) return false;
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    return user.role === role;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        register,
        logout,
        updateUserProfile,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans AuthProvider');
  }
  return context;
};
