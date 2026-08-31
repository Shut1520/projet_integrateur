/**
 * Page 404 — Page introuvable.
 * Affichée quand l'utilisateur navigue vers une URL inexistante.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Home } from 'lucide-react';

export const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
      <AlertTriangle className="w-16 h-16 text-[var(--color-warning)]" />
      <div>
        <h1 className="text-4xl font-bold text-[var(--color-text-primary)] mb-2">404</h1>
        <p className="text-lg text-[var(--color-text-secondary)]">Page introuvable</p>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          La page que vous recherchez n'existe pas ou a été déplacée.
        </p>
      </div>
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--color-primary)] text-white font-medium hover:opacity-90 transition-opacity"
      >
        <Home className="w-4 h-4" />
        Retour au tableau de bord
      </button>
    </div>
  );
};
