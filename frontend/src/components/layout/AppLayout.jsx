/**
 * Mise en page principale de l'application.
 * Compose la sidebar (desktop + mobile), la barre du haut, le contenu principal
 * et la barre de navigation inférieure (mobile uniquement).
 */
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';

/**
 * Composant de mise en page globale.
 * Gère l'état d'ouverture du menu mobile et orchestre
 * les zones latérales, supérieure et le contenu principal via <Outlet />.
 */
export const AppLayout = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F5F7F2] dark:bg-[#0D1117] text-[#1A1A1A] dark:text-[#F0F0F0] flex flex-col font-sans transition-colors duration-200">
      <div className="flex flex-1 min-h-0">
        {/* Desktop & Mobile Sidebar */}
        <Sidebar
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)} />

          <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 lg:pb-8">
            {children || <Outlet />}
          </main>
        </div>
      </div>

      {/* Mobile Sticky Navigation Footer */}
      <BottomNav />
    </div>
  );
};

