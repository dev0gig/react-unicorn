import React, { useState, useEffect, useRef, memo } from 'react';
import type { ViewName, MenuItem } from '../types';
import { useContacts, useTemplates } from '../App';
import { DateTimeWidget } from './widgets/DateTimeWidget';
import { WeatherWidget } from './widgets/WeatherWidget';




const menuItems: MenuItem[] = [
    { id: 'Dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'Kontakte', label: 'Kontakte', icon: 'people' },
    { id: 'Mail Vorlagen', label: 'Mail Vorlagen', icon: 'drafts' },
    { id: 'WiWo-Terminpflege', label: 'WiWo-Terminpflege', icon: 'event_note' },
    { id: 'Dienstplan', label: 'Dienstplan', icon: 'calendar_month' },
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

// Memoized NavItem to prevent re-renders when the Sidebar parent re-renders (e.g. due to clock)
const NavItem = memo(({ item, isActive, onClick, count }: {
    item: MenuItem;
    isActive: boolean;
    onClick: () => void;
    count?: number;
}) => (
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
                className="absolute inset-0 bg-gradient-to-r from-orange-600 to-orange-500 rounded-lg shadow-lg"
            />
        )}
        <i className="material-icons mr-4 z-10">{item.icon}</i>
        <span className="font-medium z-10">{item.label}</span>
        {typeof count === 'number' && count > 0 && (
            <span className="ml-auto text-sm font-semibold bg-neutral-700 text-neutral-300 px-2 py-0.5 rounded-full z-10">
                {count}
            </span>
        )}
    </li>
));




export const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, onFavoritesClick, onExportClick, onImportClick, onDeleteClick }) => {
    const { contacts } = useContacts();
    const { templateGroups } = useTemplates();

    const counts: Record<string, number> = {
        'Kontakte': contacts.length,
        'Mail Vorlagen': templateGroups.reduce((sum, group) => sum + group.templates.length, 0),
    };

    return (
        <aside className="w-80 bg-gradient-to-b from-neutral-800/90 to-neutral-900/90 backdrop-blur-md flex flex-col h-screen flex-shrink-0 border-r border-neutral-700/50 shadow-2xl">
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-6 pt-6">
                <div className="mb-8 bg-white/5 p-4 rounded-2xl relative border border-white/10 shadow-inner backdrop-blur-sm">
                    <DateTimeWidget
                        onExportClick={onExportClick}
                        onImportClick={onImportClick}
                        onDeleteClick={onDeleteClick}
                    />
                    <hr className="border-neutral-700 my-4" />
                    <WeatherWidget />
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
                                count={counts[item.id]}
                            />
                        ))}
                    </ul>
                </nav>
            </div>


        </aside>
    );
};