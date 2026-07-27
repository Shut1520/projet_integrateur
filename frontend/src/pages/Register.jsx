/**
 * Page d'inscription (Register).
 * Permet de créer un nouveau compte utilisateur avec choix du rôle,
 * validation du mot de passe (longueur + confirmation) et inscription automatique.
 */
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Leaf, Mail, Lock, User as UserIcon, Shield, ArrowRight } from 'lucide-react';

/**
 * Composant page d'inscription.
 * Valide les champs côté client (nom, email, mot de passe, confirmation)
 * avant d'appeler register() qui enchaîne inscription + connexion automatique.
 */
export const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { addToast } = useToast();

  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('agriculteur');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  /**
   * Soumission du formulaire d'inscription.
   * Vérifie la cohérence des mots de passe et la longueur minimale
   * avant d'appeler l'API register().
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nom || !email || !password) {
      addToast({ type: 'error', title: 'Erreur', message: 'Veuillez remplir tous les champs.' });
      return;
    }
    if (password.length < 6) {
      addToast({ type: 'error', title: 'Erreur', message: 'Le mot de passe doit contenir au moins 6 caractères.' });
      return;
    }
    if (password !== confirmPassword) {
      addToast({ type: 'error', title: 'Erreur', message: 'Les mots de passe ne correspondent pas.' });
      return;
    }
    setSubmitting(true);
    try {
      await register({ nom, email, password, role });
      addToast({ type: 'success', title: 'Compte créé', message: 'Bienvenue sur la plateforme SAI !' });
      navigate('/dashboard');
    } catch (err) {
      const message =
        err.response?.status === 409
          ? 'Un compte existe déjà avec cet email.'
          : err.response?.status === 422
          ? 'Données invalides. Vérifiez les champs.'
          : 'Impossible de créer le compte. Vérifiez votre connexion.';
      addToast({ type: 'error', title: 'Erreur', message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7F2] dark:bg-[#0D1117] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#161B22] border border-[#E0E0E0] dark:border-[#30363D] rounded-3xl p-8 shadow-xl">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#2E7D32] flex items-center justify-center text-white mx-auto mb-3 shadow-lg shadow-[#2E7D32]/25">
            <Leaf className="w-6 h-6 fill-current" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#1A1A1A] dark:text-white tracking-tight">
            Inscription SAI
          </h1>
          <p className="text-xs text-[#5A5A5A] dark:text-[#8B949E] mt-1 font-medium">
            Créez votre compte d'exploitation agricole
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-[#1A1A1A] dark:text-white mb-1">
              Nom complet
            </label>
            <div className="relative focus-halo rounded-xl">
              <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5A5A5A] dark:text-[#8B949E]" />
              <input
                type="text"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Ex: Sophie Martin"
                required
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-[#F5F7F2] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D] text-[#1A1A1A] dark:text-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1A1A1A] dark:text-white mb-1">
              Adresse Email Professionnelle
            </label>
            <div className="relative focus-halo rounded-xl">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5A5A5A] dark:text-[#8B949E]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="s.martin@sai.agri"
                required
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-[#F5F7F2] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D] text-[#1A1A1A] dark:text-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1A1A1A] dark:text-white mb-1">
              Rôle sur la plateforme
            </label>
            <div className="relative focus-halo rounded-xl">
              <Shield className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5A5A5A] dark:text-[#8B949E]" />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-[#F5F7F2] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D] text-[#1A1A1A] dark:text-white focus:outline-none"
              >
                <option value="agriculteur">Agriculteur</option>
                <option value="admin">Administrateur</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1A1A1A] dark:text-white mb-1">
              Mot de passe
            </label>
            <div className="relative focus-halo rounded-xl">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5A5A5A] dark:text-[#8B949E]" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-[#F5F7F2] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D] text-[#1A1A1A] dark:text-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1A1A1A] dark:text-white mb-1">
              Confirmer le mot de passe
            </label>
            <div className="relative focus-halo rounded-xl">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5A5A5A] dark:text-[#8B949E]" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-[#F5F7F2] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D] text-[#1A1A1A] dark:text-white focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 bg-[#2E7D32] hover:bg-[#256629] text-white font-bold text-sm rounded-xl shadow-md shadow-[#2E7D32]/20 flex items-center justify-center gap-2 transition-all mt-2 disabled:opacity-50"
          >
            {submitting ? (
              <span>Création en cours...</span>
            ) : (
              <>
                <span>S'inscrire</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-[#E0E0E0] dark:border-[#30363D] text-center">
          <p className="text-xs text-[#5A5A5A] dark:text-[#8B949E]">
            Déjà inscrit ?{' '}
            <Link
              to="/login"
              className="font-bold text-[#2E7D32] dark:text-[#66BB6A] hover:underline"
            >
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
