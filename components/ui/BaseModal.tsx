import React, { useEffect } from 'react';

interface BaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    icon?: string;
    children: React.ReactNode;
}

export const BaseModal: React.FC<BaseModalProps> = ({ isOpen, onClose, title, icon, children }) => {
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

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-neutral-800 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col border border-neutral-700"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex items-center justify-between p-4 border-b border-neutral-700 flex-shrink-0">
                    <div className="flex items-center">
                        {icon && <i className="material-icons text-2xl text-orange-400 mr-3">{icon}</i>}
                        <h2 className="text-xl font-bold text-neutral-100">{title}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full text-neutral-400 hover:bg-neutral-700 hover:text-white transition-colors"
                        aria-label="Schließen"
                    >
                        <i className="material-icons">close</i>
                    </button>
                </header>

                {children}
            </div>
        </div>
    );
};
