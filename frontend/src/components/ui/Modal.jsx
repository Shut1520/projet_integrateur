/**
 * Composant Modal réutilisable.
 * Superposition modale avec en-tête titre, bouton de fermeture,
 * scroll interne et fermeture par la touche Échap.
 *
 * Animations — philosophie Emil Kowalski :
 * - Entrance : scale(0.95) + opacity → scale(1) + opacity 1, 200ms ease-out
 * - Exit : scale(1) + opacity → scale(0.95) + opacity 0, 150ms ease-out
 * - Backdrop : fade in/out
 * - Close button : scale(0.9) on :active
 */
import React, { useEffect, useState, useCallback } from 'react';
import { X } from 'lucide-react';

/**
 * Modale générique.
 * @param {boolean} isOpen - Contrôle l'affichage
 * @param {Function} onClose - Callback de fermeture
 * @param {string} title - Titre affiché dans l'en-tête
 * @param {ReactNode} children - Contenu du corps de la modale
 * @param {string} maxWidth - Classe Tailwind de largeur maximale (défaut : max-w-lg)
 */
export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-lg',
}) => {
  const [mounted, setMounted] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  // Gérer l'entrée avec un léger délai pour déclencher la transition
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Laisser le DOM se peindre avant de déclencher l'animation d'entrée
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setMounted(true);
        });
      });
    }
  }, [isOpen]);

  // Fermeture animée : d'abord monter l'animation de sortie, puis retirer du DOM
  const handleClose = useCallback(() => {
    setMounted(false);
    setTimeout(() => {
      setShouldRender(false);
      onClose();
    }, 150); // Durée sortie = 150ms (plus rapide que l'entrée)
  }, [onClose]);

  // Fermeture par la touche Échap et blocage du scroll body quand ouverte
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleClose]);

  if (!shouldRender) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        transition: 'opacity 200ms var(--ease-out)',
        opacity: mounted ? 1 : 0,
      }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-xs"
        style={{
          transition: 'opacity 200ms var(--ease-out)',
          opacity: mounted ? 1 : 0,
        }}
        onClick={handleClose}
      />

      {/* Modal Content */}
      <div
        className={`relative bg-white dark:bg-[#161B22] border border-[#E0E0E0] dark:border-[#30363D] w-full ${maxWidth} rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]`}
        onClick={(e) => e.stopPropagation()}
        style={{
          transition: 'transform 200ms var(--ease-out), opacity 200ms var(--ease-out)',
          transform: mounted ? 'scale(1)' : 'scale(0.95)',
          opacity: mounted ? 1 : 0,
        }}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#E0E0E0] dark:border-[#30363D] flex items-center justify-between shrink-0">
          <h3 className="font-bold text-base text-[#1A1A1A] dark:text-white">{title}</h3>
          <button
            onClick={handleClose}
            className="btn-press p-1.5 rounded-lg text-[#5A5A5A] dark:text-[#8B949E] hover:text-[#1A1A1A] dark:hover:text-white hover:bg-[#f2f4ef] dark:hover:bg-[#22272e] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
};
