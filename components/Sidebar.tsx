import React, { useState, useEffect } from 'react';
import type { ViewName, MenuItem } from '../types';

const menuItems: MenuItem[] = [
  { id: 'Profil', label: 'Profil', icon: 'account_circle' },
  { id: 'Dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'Kontakte', label: 'Kontakte', icon: 'people' },
  { id: 'Mail Vorlagen', label: 'Mail Vorlagen', icon: 'drafts' },
  { id: 'Notizen', label: 'Notizen', icon: 'note_alt' },
  { id: 'Evidenzfälle', label: 'Evidenzfälle', icon: 'gavel' },
  { id: 'WiWo-Terminpflege', label: 'WiWo-Terminpflege', icon: 'event_note' },
];

interface SidebarProps {
  activeView: ViewName;
  setActiveView: (view: ViewName) => void;
  onAddCaseClick: () => void;
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

const DateTimeWidget: React.FC = () => {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        // Update every second for the clock
        const timerId = setInterval(() => {
            setNow(new Date());
        }, 1000); 

        return () => {
            clearInterval(timerId); // Cleanup on unmount
        };
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
        <div className="text-center py-2 w-full">
            <p className="text-4xl font-bold text-neutral-100 tracking-wider">{formattedTime}</p>
            <p className="mt-2 text-lg font-medium text-neutral-300">{formattedDate}</p>
        </div>
    );
};

export const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, onAddCaseClick, onFavoritesClick, onExportClick, onImportClick, onDeleteClick }) => {
  return (
    <aside className="w-80 bg-neutral-800 flex flex-col h-screen flex-shrink-0">
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-6 pt-6">
        <div className="mb-8 bg-neutral-900 p-4 rounded-2xl">
          <DateTimeWidget />
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

        <div className="mt-6 flex flex-col space-y-2">
            <p className="text-xs text-neutral-400 uppercase font-bold mb-1">Werkzeuge</p>
            <div className="grid grid-cols-3 gap-2">
                <button
                    onClick={onExportClick}
                    className="flex flex-col items-center justify-center p-3 rounded-lg cursor-pointer transition-colors duration-200 text-neutral-300 hover:text-white hover:bg-neutral-700/50"
                    title="Backup erstellen"
                >
                    <i className="material-icons">download</i>
                    <span className="font-medium text-xs mt-1">Export</span>
                </button>
                <button
                    onClick={onImportClick}
                    className="flex flex-col items-center justify-center p-3 rounded-lg cursor-pointer transition-colors duration-200 text-neutral-300 hover:text-white hover:bg-neutral-700/50"
                    title="Backup importieren"
                >
                    <i className="material-icons">upload</i>
                    <span className="font-medium text-xs mt-1">Import</span>
                </button>
                <button
                    onClick={onDeleteClick}
                    className="flex flex-col items-center justify-center p-3 rounded-lg cursor-pointer transition-colors duration-200 text-red-400 hover:text-white hover:bg-red-500/30"
                    title="Daten löschen"
                >
                    <i className="material-icons">delete_sweep</i>
                     <span className="font-medium text-xs mt-1">Löschen</span>
                </button>
            </div>
        </div>
      </div>

      <div className="px-6 pb-6 pt-4 flex-shrink-0">
        <button 
          onClick={onAddCaseClick}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl">
           <i className="material-icons mr-2">gavel</i>
           <span>Neue Evidenz</span>
        </button>
      </div>
    </aside>
  );
};