import React, { useEffect, useState, useCallback } from 'react';
import { AlertTriangle, X } from 'lucide-react';

/**
 * Modal de confirmation réutilisable.
 * Animations — philosophie Emil Kowalski :
 * - Entrance : 150ms ease-out (plus rapide que Modal standard)
 * - Exit : 100ms ease-out
 * - Close button : scale(0.9) on :active
 * - Confirm/Cancel buttons : scale(0.97) on :active
 *
 * @param {boolean} open - Affiche ou masque la modal
 * @param {string} title - Titre de la confirmation
 * @param {string} message - Message descriptif
 * @param {string} confirmLabel - Texte du bouton confirmer (défaut: "Supprimer")
 * @param {string} confirmColor - Classe Tailwind du bouton confirmer (défaut: rouge)
 * @param {function} onConfirm - Callback appelé au clic sur confirmer
 * @param {function} onCancel - Callback appelé au clic sur annuler / overlay
 */
export const ConfirmModal = ({
  open,
  title = 'Confirmer l\'action',
  message,
  confirmLabel = 'Supprimer',
  confirmColor = 'bg-[#E53935] hover:bg-[#C62828]',
  onConfirm,
  onCancel,
}) => {
  const [mounted, setMounted] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (open) {
      setShouldRender(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setMounted(true);
        });
      });
    }
  }, [open]);

  const handleClose = useCallback(() => {
    setMounted(false);
    setTimeout(() => {
      setShouldRender(false);
      onCancel();
    }, 100);
  }, [onCancel]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    if (open) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, handleClose]);

  if (!shouldRender) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xs"
        style={{
          transition: 'opacity 150ms var(--ease-out)',
          opacity: mounted ? 1 : 0,
        }}
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className="relative bg-white dark:bg-[#1c2128] rounded-2xl shadow-2xl border border-[#E0E0E0] dark:border-[#30363D] w-full max-w-sm p-6"
        style={{
          transition: 'transform 150ms var(--ease-out), opacity 150ms var(--ease-out)',
          transform: mounted ? 'scale(1)' : 'scale(0.95)',
          opacity: mounted ? 1 : 0,
        }}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="btn-press absolute top-3 right-3 p-1 rounded-lg text-[#5A5A5A] dark:text-[#8B949E] hover:bg-gray-100 dark:hover:bg-[#22272e] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon */}
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-[#E53935]/10">
          <AlertTriangle className="w-6 h-6 text-[#E53935]" />
        </div>

        {/* Title */}
        <h3 className="text-center text-base font-bold text-[#1A1A1A] dark:text-white mb-2">
          {title}
        </h3>

        {/* Message */}
        <p className="text-center text-sm text-[#5A5A5A] dark:text-[#8B949E] mb-6 leading-relaxed">
          {message}
        </p>

        {/* Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleClose}
            className="btn-press flex-1 px-4 py-2.5 text-sm font-semibold text-[#5A5A5A] dark:text-[#8B949E] bg-gray-100 dark:bg-[#22272e] hover:bg-gray-200 dark:hover:bg-[#2d333b] rounded-xl transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={() => { onConfirm(); handleClose(); }}
            className={`btn-press flex-1 px-4 py-2.5 text-sm font-bold text-white rounded-xl transition-colors ${confirmColor}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
