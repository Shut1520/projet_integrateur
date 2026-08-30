/**
 * Page de connexion (Login).
 * Formulaire email/mot de passe avec validation côté client,
 * gestion des erreurs HTTP spécifiques et redirection vers le dashboard.
 */
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { Eye, EyeOff, Lock, Mail, ArrowRight } from 'lucide-react';
import logoClair from '../assets/SAI_logo/logo_welcome_claire.png';
import logoSombre from '../assets/SAI_logo/logo_welcome_sombre.png';

/**
 * Composant page de connexion.
 * Utilise le contexte Auth pour la mutation login()
 * et le contexte Toast pour les notifications.
 */
export const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { addToast } = useToast();
  const { theme } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  /**
   * Soumission du formulaire de connexion.
   * Valide les champs, appelle login() du contexte auth,
   * et redirige vers /dashboard en cas de succès.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      addToast({ type: 'error', title: 'Erreur', message: 'Veuillez saisir votre email et votre mot de passe.' });
      return;
    }
    setSubmitting(true);
    try {
      await login(email, password);
      addToast({ type: 'success', title: 'Connexion réussie', message: 'Bienvenue sur SAI !' });
      navigate('/dashboard');
    } catch (err) {
      // Messages d'erreur spécifiques selon le code HTTP retourné
      const message =
        err.response?.status === 401
          ? 'Email ou mot de passe incorrect.'
          : err.response?.status === 422
          ? 'Champs invalides. Vérifiez votre saisie.'
          : 'Impossible de joindre le serveur. Vérifiez votre connexion.';
      addToast({ type: 'error', title: 'Échec de la connexion', message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7F2] dark:bg-[#0D1117] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#161B22] border border-[#E0E0E0] dark:border-[#30363D] rounded-3xl p-8 shadow-xl">
        {/* Brand Header */}
          <div className="text-center mb-8">
            <img
              src={theme === 'dark' ? logoSombre : logoClair}
              alt="SAI Logo"
              className=" h-20 object-contain mx-auto mb-3"
            />
          <p className="text-xs text-[#5A5A5A] dark:text-[#8B949E] mt-1 font-medium">
            Connectez-vous pour accéder au tableau de bord d'exploitation
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#1A1A1A] dark:text-white mb-1.5">
              Adresse Email
            </label>
            <div className="relative focus-halo rounded-xl">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5A5A5A] dark:text-[#8B949E]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nom@agri-sai.com"
                required
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-[#F5F7F2] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D] text-[#1A1A1A] dark:text-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-[#1A1A1A] dark:text-white">
                Mot de passe
              </label>
              <button
                type="button"
                onClick={() =>
                  addToast({
                    type: 'info',
                    title: 'Réinitialisation du mot de passe',
                    message: 'Contactez votre administrateur pour réinitialiser votre mot de passe.',
                  })
                }
                className="text-[11px] font-semibold text-[#2E7D32] dark:text-[#66BB6A] hover:underline"
              >
                Mot de passe oublié ?
              </button>
            </div>
            <div className="relative focus-halo rounded-xl">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5A5A5A] dark:text-[#8B949E]" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl bg-[#F5F7F2] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D] text-[#1A1A1A] dark:text-white focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5A5A5A] dark:text-[#8B949E]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 bg-[#2E7D32] hover:bg-[#256629] text-white font-bold text-sm rounded-xl shadow-md shadow-[#2E7D32]/20 flex items-center justify-center gap-2 transition-all mt-2 disabled:opacity-50"
          >
            {submitting ? (
              <span>Connexion en cours...</span>
            ) : (
              <>
                <span>Se connecter</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="mt-6 pt-6 border-t border-[#E0E0E0] dark:border-[#30363D] text-center">
          <p className="text-xs text-[#5A5A5A] dark:text-[#8B949E]">
            Vous n'avez pas de compte ?{' '}
            <Link
              to="/register"
              className="font-bold text-[#2E7D32] dark:text-[#66BB6A] hover:underline"
            >
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
