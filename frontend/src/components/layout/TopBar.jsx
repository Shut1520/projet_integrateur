/**
 * Barre supérieure (TopBar) de l'application.
 * Contient la barre de recherche, le bouton de bascule thème clair/sombre,
 * le panneau de notifications (alertes actives) et le lien vers le profil.
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { apiService } from '../../services/api';
import {
  Search,
  Bell,
  Sun,
  Moon,
  Menu,
  CheckCircle,
  AlertTriangle,
  X,
  User as UserIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Composant TopBar — barre d'en-tête sticky.
 * Récupère les alertes non résolues toutes les 5 secondes
 * et affiche un badge animé quand des alertes sont présentes.
 */
export const TopBar = ({ onToggleMobileMenu }) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [alertes, setAlertes] = useState([]);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Récupération des alertes actives avec polling toutes les 5 secondes
  useEffect(() => {
    async function fetchAlertes() {
      try {
        const data = await apiService.getAlertes();
        const list = Array.isArray(data) ? data : [];
        setAlertes(list.filter((a) => !a.resolu));
      } catch (err) {
        console.error(err);
      }
    }
    fetchAlertes();
    const interval = setInterval(fetchAlertes, 5000);
    return () => clearInterval(interval);
  }, []);

  /**
   * Marque une alerte comme résolue côté backend
   * et la retire immédiatement de l'affichage local.
   */
  const handleDismiss = async (id) => {
    await apiService.dismissAlerte(id);
    setAlertes((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <header className="h-16 bg-white dark:bg-[#161B22] border-b border-[#E0E0E0] dark:border-[#30363D] sticky top-0 z-30 px-4 md:px-6 flex items-center justify-between">
      {/* Left: Mobile Toggle & Search Bar */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-xl text-[#5A5A5A] dark:text-[#8B949E] hover:bg-[#f2f4ef] dark:hover:bg-[#22272e]"
          aria-label="Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative w-full max-w-md focus-halo rounded-xl">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5A5A5A] dark:text-[#8B949E]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher parcelle, capteur, actionneur..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl bg-[#f8faf5] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D] text-[#1A1A1A] dark:text-white placeholder-[#5A5A5A] dark:placeholder-[#8B949E] focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Dark / Light Toggle */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Passer au mode clair' : 'Passer au mode sombre'}
          className="p-2 rounded-xl text-[#5A5A5A] dark:text-[#8B949E] hover:bg-[#f2f4ef] dark:hover:bg-[#22272e] transition-colors"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-amber-400" />
          ) : (
            <Moon className="w-5 h-5 text-[#5A5A5A]" />
          )}
        </button>

        {/* Notifications Popup Trigger */}
        <div className="relative">
          <button
            onClick={() => setShowAlertModal(!showAlertModal)}
            className="p-2 rounded-xl text-[#5A5A5A] dark:text-[#8B949E] hover:bg-[#f2f4ef] dark:hover:bg-[#22272e] transition-colors relative"
            title="Alertes actives"
          >
            <Bell className="w-5 h-5" />
            {alertes.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#E53935] rounded-full ring-2 ring-white dark:ring-[#161B22] animate-pulse" />
            )}
          </button>

          {/* Notifications Dropdown Modal */}
          {showAlertModal && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#161B22] border border-[#E0E0E0] dark:border-[#30363D] rounded-2xl shadow-xl z-50 p-4 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-3 border-b border-[#E0E0E0] dark:border-[#30363D] mb-3">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#E53935]" />
                  <h3 className="font-bold text-sm text-[#1A1A1A] dark:text-white">
                    Alertes Actives ({alertes.length})
                  </h3>
                </div>
                <button
                  onClick={() => setShowAlertModal(false)}
                  className="text-[#5A5A5A] dark:text-[#8B949E] hover:text-[#1A1A1A] dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {alertes.length === 0 ? (
                <div className="py-6 text-center text-[#5A5A5A] dark:text-[#8B949E]">
                  <CheckCircle className="w-8 h-8 text-[#43A047] mx-auto mb-2" />
                  <p className="text-xs font-medium">Aucune alerte en cours</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                  {alertes.map((a) => (
                    <div
                      key={a.id}
                      className="p-3 rounded-xl bg-[#E53935]/5 border border-[#E53935]/20 flex items-start gap-2.5"
                    >
                      <AlertTriangle className="w-4 h-4 text-[#E53935] shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-[#E53935]">{a.titre}</p>
                          <span className="text-[10px] text-[#5A5A5A] dark:text-[#8B949E]">
                            {a.timestamp}
                          </span>
                        </div>
                        <p className="text-xs text-[#1A1A1A] dark:text-gray-200 mt-1 leading-snug">
                          {a.message}
                        </p>
                        <button
                          onClick={() => handleDismiss(a.id)}
                          className="mt-2 text-[11px] font-semibold text-[#2E7D32] dark:text-[#66BB6A] hover:underline"
                        >
                          Marquer comme résolu
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Profile Link Header Avatar */}
        <Link
          to="/profile"
          className="flex items-center gap-2 pl-2 border-l border-[#E0E0E0] dark:border-[#30363D]"
        >
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.nom}
              className="w-8 h-8 rounded-full object-cover border border-[#E0E0E0]"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#2E7D32]/10 text-[#2E7D32] flex items-center justify-center font-bold text-xs">
              <UserIcon className="w-4 h-4" />
            </div>
          )}
          <span className="hidden sm:inline-block text-xs font-semibold text-[#1A1A1A] dark:text-white truncate max-w-[120px]">
            {user?.nom}
          </span>
        </Link>
      </div>
    </header>
  );
};
