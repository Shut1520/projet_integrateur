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
import React, { useEffect, useState, useCallback, useRef } from 'react';
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
  const modalRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  // Ref pour onClose afin que handleClose soit stable (pas de re-render du parent)
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Fermeture animée : d'abord monter l'animation de sortie, puis retirer du DOM
  const handleClose = useCallback(() => {
    setMounted(false);
    setTimeout(() => {
      setShouldRender(false);
      onCloseRef.current();
    }, 150); // Durée sortie = 150ms (plus rapide que l'entrée)
  }, []);

  // Gérer l'ouverture ET la fermeture via le prop isOpen
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Laisser le DOM se peindre avant de déclencher l'animation d'entrée
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setMounted(true);
        });
      });
    } else if (shouldRender) {
      // Fermeture animée quand le parent passe isOpen à false
      setMounted(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Focus trap + fermeture par Échap + blocage scroll body
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose();
        return;
      }
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
      // Focus premier champ de saisie, sinon premier élément focusable
      requestAnimationFrame(() => {
        const inputEl = modalRef.current?.querySelector('input, select, textarea');
        if (inputEl) {
          inputEl.focus();
        } else {
          const focusable = modalRef.current?.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusable?.length) focusable[0].focus();
        }
      });
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
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
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
        ref={modalRef}
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
          <h3 id="modal-title" className="font-bold text-base text-[#1A1A1A] dark:text-white">{title}</h3>
          <button
            onClick={handleClose}
            aria-label="Fermer"
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
