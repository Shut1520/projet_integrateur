/**
 * Barre de navigation inférieure pour mobile.
 * Affiche les raccourcis vers les pages principales en bas de l'écran.
 * Visible uniquement sur les écrans < lg ( responsive mobile).
 */
import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Sprout,
  Zap,
  History,
  Sliders,
} from 'lucide-react';

/**
 * Navigation inférieure sticky — réservée aux petits écrans.
 * Utilise NavLink de react-router-router pour la surbrillance
 * automatique de l'onglet actif.
 */
export const BottomNav = () => {
  const navItems = [
    { to: '/dashboard', label: 'Bord', icon: LayoutDashboard },
    { to: '/parcelles', label: 'Parcelles', icon: Sprout },
    { to: '/actionneurs', label: 'Contrôle', icon: Zap },
    { to: '/history', label: 'Historique', icon: History },
    { to: '/thresholds', label: 'Seuils', icon: Sliders },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-[#161B22]/95 backdrop-blur-md border-t border-[#E0E0E0] dark:border-[#30363D] z-40 px-2 py-2">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all hover-lift ${
                  isActive
                    ? 'text-[#2E7D32] dark:text-[#66BB6A] font-bold'
                    : 'text-[#5A5A5A] dark:text-[#8B949E]'
                }`
              }
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
