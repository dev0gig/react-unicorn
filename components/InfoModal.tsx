import React, { useEffect } from 'react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  isError?: boolean;
}

export const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose, title, message, isError = false }) => {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const icon = isError ? 'warning_amber' : 'check_circle';
  const iconColor = isError ? 'text-red-400' : 'text-green-400';
  const buttonColor = isError ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-500 hover:bg-orange-600';

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-neutral-800 rounded-2xl shadow-2xl w-full max-w-md flex flex-col border border-neutral-700"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center p-4 border-b border-neutral-700 flex-shrink-0">
          <i className={`material-icons text-2xl ${iconColor} mr-3`}>{icon}</i>
          <h2 className="text-xl font-bold text-neutral-100">{title}</h2>
        </header>
        
        <div className="p-6 text-neutral-300">
          <p>{message}</p>
        </div>

        <footer className="flex justify-end items-center p-4 bg-neutral-900/50 rounded-b-2xl">
          <button
            onClick={onClose}
            className={`${buttonColor} text-white font-bold py-2 px-6 rounded-lg transition-all duration-200`}
          >
            OK
          </button>
        </footer>
      </div>
    </div>
  );
};
