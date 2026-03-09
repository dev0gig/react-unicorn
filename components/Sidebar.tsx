import React, { useState, useEffect, useRef, memo } from 'react';
import type { ViewName, MenuItem } from '../types';
import { useContacts, useTemplates } from '../App';
import { useTheme } from '../contexts/ThemeContext';
import { DateTimeWidget } from './widgets/DateTimeWidget';
import { WeatherWidget } from './widgets/WeatherWidget';




const menuItems: MenuItem[] = [
    { id: 'Dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'Kontakte', label: 'Kontakte', icon: 'people' },
    { id: 'Mail Vorlagen', label: 'Mail Vorlagen', icon: 'drafts' },
    { id: 'WiWo-Terminpflege', label: 'WiWo-Terminpflege', icon: 'event_note' },
    { id: 'Dienstplan', label: 'Dienstplan', icon: 'calendar_month' },
    { id: 'Zeiterfassung', label: 'Zeiterfassung', icon: 'timer' },
    { id: 'E-Mobility', label: 'E-Mobility', icon: 'ev_station' },
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
                className="absolute inset-0 bg-orange-500 rounded-lg"
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
    const { theme, setTheme } = useTheme();

    const counts: Record<string, number> = {
        'Kontakte': contacts.length,
        'Mail Vorlagen': templateGroups.reduce((sum, group) => sum + group.templates.length, 0),
    };

    return (
        <aside className="w-80 bg-neutral-800 flex flex-col h-screen flex-shrink-0 border-r border-neutral-700">
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-6 pt-6">
                <div className="mb-8 bg-neutral-900 p-4 rounded-2xl relative border border-neutral-700">
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

            <div className="px-6 py-4 border-t border-neutral-700/50 flex-shrink-0">
                <div className="flex items-center justify-center bg-neutral-800/60 rounded-full p-0.5">
                    {([
                        { id: 'dark', icon: 'dark_mode', title: 'Dark' },
                        { id: 'sepia', icon: 'auto_stories', title: 'Sepia' },
                        { id: 'light', icon: 'light_mode', title: 'Light' },
                    ] as const).map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setTheme(t.id)}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-full text-xs font-medium transition-all duration-200 ${
                                theme === t.id
                                    ? 'bg-neutral-700 text-white shadow-sm'
                                    : 'text-neutral-500 hover:text-neutral-300'
                            }`}
                            title={t.title}
                        >
                            <i className="material-icons" style={{ fontSize: '14px' }}>{t.icon}</i>
                            <span>{t.title}</span>
                        </button>
                    ))}
                </div>
            </div>

        </aside>
    );
};