import React, { useEffect } from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: React.ReactNode;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, children }) => {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <div
            className="bg-neutral-800 rounded-2xl shadow-2xl w-full max-w-md flex flex-col border border-neutral-700"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-center p-4 border-b border-neutral-700 flex-shrink-0">
              <i className="material-icons text-2xl text-red-400 mr-3">warning_amber</i>
              <h2 className="text-xl font-bold text-neutral-100">{title}</h2>
            </header>
            
            <div className="p-6 text-neutral-300">
              {children}
            </div>

            <footer className="flex justify-end items-center p-4 bg-neutral-900/50 rounded-b-2xl">
              <button
                onClick={onClose}
                className="mr-3 py-2 px-4 rounded-lg text-neutral-300 hover:bg-neutral-700 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={onConfirm}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition-all duration-200"
              >
                Löschen
              </button>
            </footer>
          </div>
        </div>
      )}
    </>
  );
};