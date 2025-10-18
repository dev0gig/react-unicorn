import React, { useState, useEffect, useRef } from 'react';
import type { ViewName, MenuItem } from '../types';

const menuItems: MenuItem[] = [
  { id: 'Profil', label: 'Profil', icon: 'account_circle' },
  { id: 'Dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'Kontakte', label: 'Kontakte', icon: 'people' },
  { id: 'Mail Vorlagen', label: 'Mail Vorlagen', icon: 'drafts' },
  { id: 'Notizen', label: 'Notizen', icon: 'note_alt' },
  { id: 'Evidenzfälle', label: 'Evidenzfälle', icon: 'gavel' },
  { id: 'HK - Generator', label: 'HK - Generator', icon: 'text_fields' },
  { id: 'WiWo-Terminpflege', label: 'WiWo-Terminpflege', icon: 'event_note' },
  { id: 'Zeiterfassung', label: 'Zeiterfassung', icon: 'timer' },
];

interface SidebarProps {
  activeView: ViewName;
  setActiveView: (view: ViewName) => void;
  onFavoritesClick: () => void;
  onExportClick: () => void;
  onImportClick: () => void;
  onDeleteClick: () => void;
}

const NavItem: React.FC<{
  item: MenuItem;
  isActive: boolean;
  onClick: () => void;
}> = ({ item, isActive, onClick }) => (
  <li
    onClick={onClick}
    className={`relative flex items-center p-3 my-1 rounded-lg cursor-pointer transition-colors duration-200 
                ${isActive 
                    ? 'text-white' 
                    : 'text-neutral-400 hover:text-neutral-100'
                }`}
  >
    {isActive && (
       <div
         className="absolute inset-0 bg-orange-500 rounded-lg shadow-lg"
       />
    )}
    <i className="material-icons mr-4 z-10">{item.icon}</i>
    <span className="font-medium z-10">{item.label}</span>
  </li>
);

const DateTimeWidget: React.FC<{
    onExportClick: () => void;
    onImportClick: () => void;
    onDeleteClick: () => void;
}> = ({ onExportClick, onImportClick, onDeleteClick }) => {
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
        <div className="relative text-center py-2 w-full">
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

export const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, onFavoritesClick, onExportClick, onImportClick, onDeleteClick }) => {
  return (
    <aside className="w-80 bg-neutral-800 flex flex-col h-screen flex-shrink-0">
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-6 pt-6">
        <div className="mb-8 bg-neutral-900 p-4 rounded-2xl relative">
          <DateTimeWidget 
            onExportClick={onExportClick}
            onImportClick={onImportClick}
            onDeleteClick={onDeleteClick}
          />
        </div>

        <div className="mb-8">
            <button
                onClick={onFavoritesClick}
                className="w-full flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors duration-200 text-neutral-300 hover:text-white hover:bg-neutral-700/50"
            >
                <div className="flex items-center gap-3">
                <i className="material-icons text-yellow-400">star</i>
                <span className="font-medium">Favoriten</span>
                </div>
                <i className="material-icons text-sm text-neutral-400 group-hover:translate-x-0.5 transition-transform">arrow_forward_ios</i>
            </button>
        </div>
      
        <nav>
            <p className="text-xs text-neutral-400 uppercase font-bold mb-3">Menü</p>
            <ul>
            {menuItems.map((item) => (
                <NavItem
                key={item.id}
                item={item}
                isActive={activeView === item.id}
                onClick={() => setActiveView(item.id)}
                />
            ))}
            </ul>
        </nav>
      </div>
    </aside>
  );
};
