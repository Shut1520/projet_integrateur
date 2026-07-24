import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-lg',
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`bg-white dark:bg-[#161B22] border border-[#E0E0E0] dark:border-[#30363D] w-full ${maxWidth} rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#E0E0E0] dark:border-[#30363D] flex items-center justify-between shrink-0">
          <h3 className="font-bold text-base text-[#1A1A1A] dark:text-white">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#5A5A5A] dark:text-[#8B949E] hover:text-[#1A1A1A] dark:hover:text-white hover:bg-[#f2f4ef] dark:hover:bg-[#22272e] transition-colors"
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
