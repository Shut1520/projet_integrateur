/**
 * Barre latérale de navigation (sidebar).
 * Affiche le logo, les liens de navigation adaptés au rôle,
 * et les informations de l'utilisateur connecté avec déconnexion.
 */
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Sprout,
  Zap,
  History,
  Sliders,
  Users,
  User,
  LogOut,
  Leaf,
  X,
  Cpu,
  AlertTriangle,
} from 'lucide-react';
import logo from '../../assets/SAI_logo/logo.png';

/**
 * Composant sidebar responsive.
 * - Sur desktop : affichée en permanence à gauche.
 * - Sur mobile : superposée en overlay avec animation slide-in.
 * Les liens Capteurs et Utilisateurs ne sont visibles que pour les admins.
 */
export const Sidebar = ({ mobileOpen, onCloseMobile }) => {
  const { user, logout } = useAuth();

  // Définition des liens de navigation de base (accessibles à tous les rôles)
  const navigation = [
    { name: 'Tableau de Bord', to: '/dashboard', icon: LayoutDashboard },
    { name: 'Parcelles', to: '/parcelles', icon: Sprout },
    { name: 'Actionneurs', to: '/actionneurs', icon: Zap },
    { name: 'Historique', to: '/history', icon: History },
    { name: 'Alertes', to: '/alertes', icon: AlertTriangle },
    { name: 'Seuils d\'Automate', to: '/thresholds', icon: Sliders },
  ];

  // Les sections admin sont ajoutées uniquement pour les utilisateurs avec le rôle 'admin'
  if (user?.role === 'admin') {
    navigation.push({ name: 'Capteurs', to: '/capteurs', icon: Cpu });
    navigation.push({ name: 'Utilisateurs', to: '/users', icon: Users });
  }

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed lg:relative inset-y-0 left-0 z-50 w-64 bg-white dark:bg-[#161B22] border-r border-[#E0E0E0] dark:border-[#30363D] h-full overflow-hidden flex flex-col justify-between transform transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Brand Logo Header */}
          <div className="h-16 px-6 border-b border-[#E0E0E0] dark:border-[#30363D] flex items-center justify-between">
            <div className="flex items-center gap-1">
              <img src={logo} alt="SAI Logo" className="w-12 h-12 object-contain rounded-xl" />
        <div className="flex flex-col flex-1 min-h-0">
                <span className="font-extrabold text-base text-[#1A1A1A] dark:text-white tracking-tight">
                  SAI
                </span>
                <p className="text-[10px] text-[#5A5A5A] dark:text-[#8B949E] font-medium leading-none">
                  Agri-Intelligent
                </p>
              </div>
            </div>

            <button
              onClick={onCloseMobile}
              className="lg:hidden text-[#5A5A5A] dark:text-[#8B949E] hover:text-[#1A1A1A] dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5 overflow-y-auto flex-1">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#5A5A5A] dark:text-[#8B949E] mb-2">
              Menu Principal
            </p>
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-[#2E7D32] text-white shadow-sm shadow-[#2E7D32]/30'
                        : 'text-[#5A5A5A] dark:text-[#8B949E] hover:bg-[#E8F5E9] dark:hover:bg-[#22272e] hover:text-[#1A1A1A] dark:hover:text-white'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Profile & Logout Bottom Section */}
        <div className="p-4 border-t border-[#E0E0E0] dark:border-[#30363D] flex items-center gap-2">
          <NavLink
            to="/profile"
            onClick={onCloseMobile}
            className={({ isActive }) =>
              `flex-1 flex items-center gap-2.5 p-2.5 rounded-xl transition-all min-w-0 ${
                isActive
                  ? 'bg-[#E8F5E9] dark:bg-[#22272e] border border-[#2E7D32]/30'
                  : 'hover:bg-[#E8F5E9] dark:hover:bg-[#22272e]'
              }`
            }
          >
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.nom}
                className="w-8 h-8 rounded-full object-cover border border-[#E0E0E0] shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#2E7D32]/10 text-[#2E7D32] flex items-center justify-center font-bold text-xs shrink-0">
                <User className="w-4 h-4" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-[#1A1A1A] dark:text-white truncate">
                {user?.nom}
              </p>
              <span className="text-[10px] font-semibold text-[#2E7D32] dark:text-[#66BB6A] block truncate">
                {user?.role === 'admin' ? 'Administrateur' : user?.role === 'agriculteur' ? 'Agriculteur' : user?.role}
              </span>
            </div>
          </NavLink>

          <button
            onClick={logout}
            title="Déconnexion"
            className="shrink-0 p-2.5 rounded-xl text-[#E53935] hover:bg-[#E53935]/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>
    </>
  );
};
