import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

const ToastContext = createContext(undefined);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    const duration = toast.duration || 4000;

    setToasts((prev) => [...prev, { ...toast, id }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      {/* Toast Render Container */}
      <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-2xl border shadow-xl flex items-start gap-3 transition-all duration-300 animate-in slide-in-from-bottom-3 ${
              toast.type === 'success'
                ? 'bg-white dark:bg-[#161B22] border-[#43A047] text-[#1A1A1A] dark:text-white'
                : toast.type === 'error'
                ? 'bg-white dark:bg-[#161B22] border-[#E53935] text-[#1A1A1A] dark:text-white'
                : 'bg-white dark:bg-[#161B22] border-[#2563EB] text-[#1A1A1A] dark:text-white'
            }`}
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
              className="text-[#5A5A5A] dark:text-[#8B949E] hover:text-[#1A1A1A] dark:hover:text-white p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast doit être utilisé dans ToastProvider');
  }
  return context;
};
