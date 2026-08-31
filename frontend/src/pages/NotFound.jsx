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
      <AlertTriangle className="w-16 h-16 text-[#FB8C00]" />
      <div>
        <h1 className="text-4xl font-bold text-[#1A1A1A] dark:text-white mb-2">404</h1>
        <p className="text-lg text-[#5A5A5A] dark:text-[#8B949E]">Page introuvable</p>
        <p className="text-sm text-[#5A5A5A] dark:text-[#8B949E] mt-1">
          La page que vous recherchez n'existe pas ou a été déplacée.
        </p>
      </div>
      <button
        onClick={() => navigate('/dashboard')}
        className="btn-press flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2E7D32] hover:bg-[#256629] text-white font-medium shadow-md transition-colors"
      >
        <Home className="w-4 h-4" />
        Retour au tableau de bord
      </button>
    </div>
  );
};
