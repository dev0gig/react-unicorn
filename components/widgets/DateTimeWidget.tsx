import React, { useState, useEffect, useRef } from 'react';

interface DateTimeWidgetProps {
    onExportClick: () => void;
    onImportClick: () => void;
    onDeleteClick: () => void;
}

export const DateTimeWidget: React.FC<DateTimeWidgetProps> = ({ onExportClick, onImportClick, onDeleteClick }) => {
    const [now, setNow] = useState(new Date());
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const timerId = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const formattedTime = now.toLocaleTimeString('de-DE', {
        hour: '2-digit',
        minute: '2-digit',
    });

    const formattedDate = now.toLocaleDateString('de-DE', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    });

    return (
        <div className="relative text-center w-full">
            <p className="text-4xl font-bold text-neutral-100 tracking-wider">{formattedTime}</p>
            <p className="mt-2 text-lg font-medium text-neutral-300">{formattedDate}</p>

            <div className="absolute top-0 right-0" ref={menuRef}>
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="w-10 h-10 flex items-center justify-center rounded-full text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors"
                    title="Werkzeuge"
                >
                    <i className="material-icons">settings</i>
                </button>

                {isMenuOpen && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-neutral-800 border border-neutral-700 rounded-lg shadow-2xl z-20 p-2 animate-fade-in-fast">
                        <button
                            onClick={() => { onExportClick(); setIsMenuOpen(false); }}
                            className="w-full text-left text-neutral-200 px-3 py-2 rounded-md hover:bg-orange-500 hover:text-white transition-colors flex items-center gap-3"
                        >
                            <i className="material-icons text-base">download</i>
                            <span>Backup erstellen</span>
                        </button>
                        <button
                            onClick={() => { onImportClick(); setIsMenuOpen(false); }}
                            className="w-full text-left text-neutral-200 px-3 py-2 rounded-md hover:bg-orange-500 hover:text-white transition-colors flex items-center gap-3"
                        >
                            <i className="material-icons text-base">upload</i>
                            <span>Backup importieren</span>
                        </button>
                        <hr className="border-neutral-700 my-1" />
                        <button
                            onClick={() => { onDeleteClick(); setIsMenuOpen(false); }}
                            className="w-full text-left text-red-400 px-3 py-2 rounded-md hover:bg-red-500 hover:text-white transition-colors flex items-center gap-3"
                        >
                            <i className="material-icons text-base">delete_sweep</i>
                            <span>Daten löschen</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
