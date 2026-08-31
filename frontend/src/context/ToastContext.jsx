/**
 * Contexte de notifications toast pour l'application SAI.
 * Permet d'afficher des messages éphémères (succès, erreur, info)
 * en bas à droite de l'écran avec fermeture automatique.
 *
 * Animations — philosophie Emil Kowalski :
 * - Entrance : translateY(8px) + scale(0.95) → 0 + scale(1), 200ms ease-out
 * - Exit : 0 + scale(1) → translateY(8px) + scale(0.95), 200ms ease-out
 * - Pas de keyframes : CSS transitions pour l'interruptibilité
 */
import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

const ToastContext = createContext(undefined);

/**
 * Fournisseur de toasts — gère la file d'attente des notifications.
 * Chaque toast possède un identifiant unique et une durée de vie
 * configurable (4 secondes par défaut).
 */
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  // Suivi des toasts en cours de sortie d'animation
  const exitingRef = useRef(new Set());

  /**
   * Ajoute un toast à la file et planifie sa suppression automatique.
   * @param {Object} toast - { type: 'success'|'error'|'info', title: string, message: string, duration?: number }
   */
  const addToast = useCallback((toast) => {
    const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    const duration = toast.duration || 4000;

    setToasts((prev) => [...prev, { ...toast, id, entering: true }]);

    // Retirer l'état entering après l'animation d'entrée
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setToasts((prev) =>
          prev.map((t) => (t.id === id ? { ...t, entering: false } : t))
        );
      });
    });

    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, []);

  /**
   * Déclenche l'animation de sortie avant de retirer le toast du DOM.
   */
  const removeToast = useCallback((id) => {
    if (exitingRef.current.has(id)) return;
    exitingRef.current.add(id);

    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
    );

    // Retirer du DOM après l'animation de sortie (200ms)
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      exitingRef.current.delete(id);
    }, 200);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      {/* Toast Render Container */}
      <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-2xl border shadow-xl flex items-start gap-3 ${
              toast.type === 'success'
                ? 'bg-white dark:bg-[#161B22] border-[#43A047] text-[#1A1A1A] dark:text-white'
                : toast.type === 'error'
                ? 'bg-white dark:bg-[#161B22] border-[#E53935] text-[#1A1A1A] dark:text-white'
                : 'bg-white dark:bg-[#161B22] border-[#2563EB] text-[#1A1A1A] dark:text-white'
            }`}
            style={{
              transition: 'transform 200ms var(--ease-out), opacity 200ms var(--ease-out)',
              transform: toast.exiting
                ? 'translateY(8px) scale(0.95)'
                : toast.entering
                ? 'translateY(8px) scale(0.95)'
                : 'translateY(0) scale(1)',
              opacity: toast.exiting ? 0 : toast.entering ? 0 : 1,
            }}
          >
            {toast.type === 'success' && (
              <CheckCircle2 className="w-5 h-5 text-[#43A047] shrink-0 mt-0.5" />
            )}
            {toast.type === 'error' && (
              <AlertCircle className="w-5 h-5 text-[#E53935] shrink-0 mt-0.5" />
            )}
            {toast.type === 'info' && (
              <Info className="w-5 h-5 text-[#2563EB] shrink-0 mt-0.5" />
            )}

            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold leading-tight">{toast.title}</h4>
              <p className="text-xs text-[#5A5A5A] dark:text-[#8B949E] mt-0.5 leading-snug">
                {toast.message}
              </p>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              aria-label="Fermer"
              className="btn-press text-[#5A5A5A] dark:text-[#8B949E] hover:text-[#1A1A1A] dark:hover:text-white p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

/**
 * Hook pour accéder au contexte des toasts.
 * Doit être utilisé à l'intérieur d'un <ToastProvider>.
 */
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast doit être utilisé dans ToastProvider');
  }
  return context;
};
