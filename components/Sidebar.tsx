import React, { useState, useEffect, memo } from 'react';
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
    { id: 'E-Mobility', label: 'E-Mobility', icon: 'ev_station' },
    { id: 'HK Generator', label: 'HK Generator', icon: 'description' },
    { id: 'Tarif Kalkulator', label: 'Tarif Kalkulator', icon: 'calculate' },
];

interface SidebarProps {
    activeView: ViewName;
    setActiveView: (view: ViewName) => void;
    onFavoritesClick: () => void;
    onExportClick: () => void;
    onImportClick: () => void;
    onDeleteClick: () => void;
}

const NavItem = memo(({ item, isActive, onClick, count, isCollapsed }: {
    item: MenuItem;
    isActive: boolean;
    onClick: () => void;
    count?: number;
    isCollapsed: boolean;
}) => (
    <li
        onClick={onClick}
        title={isCollapsed ? item.label : undefined}
        className={`relative flex items-center rounded-lg cursor-pointer transition-colors duration-200 my-1
                ${isCollapsed ? 'justify-center w-10 h-10 mx-auto p-0' : 'p-3'}
                ${isActive
                ? 'text-white'
                : 'text-neutral-400 hover:text-neutral-100'
            }`}
    >
        {isActive && (
            <div className="absolute inset-0 bg-orange-500 rounded-lg" />
        )}
        <i className={`material-icons z-10 ${!isCollapsed ? 'mr-4' : ''}`}>{item.icon}</i>
        {!isCollapsed && (
            <>
                <span className="font-medium z-10">{item.label}</span>
                {typeof count === 'number' && count > 0 && (
                    <span className="ml-auto text-sm font-semibold bg-neutral-700 text-neutral-300 px-2 py-0.5 rounded-full z-10">
                        {count}
                    </span>
                )}
            </>
        )}
        {isCollapsed && typeof count === 'number' && count > 0 && (
            <span className="absolute top-1 right-1 text-xs font-bold bg-orange-500 text-white w-4 h-4 flex items-center justify-center rounded-full z-10 leading-none">
                {count > 9 ? '9+' : count}
            </span>
        )}
    </li>
));




export const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, onFavoritesClick, onExportClick, onImportClick, onDeleteClick }) => {
    const { contacts } = useContacts();
    const { templateGroups } = useTemplates();
    const [isCollapsed, setIsCollapsed] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.altKey && e.key === 's') {
                e.preventDefault();
                setIsCollapsed(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const counts: Record<string, number> = {
        'Kontakte': contacts.length,
        'Mail Vorlagen': templateGroups.reduce((sum, group) => sum + group.templates.length, 0),
    };

    return (
        <aside
            className={`bg-neutral-800 flex flex-col h-screen flex-shrink-0 border-r border-neutral-700 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-16' : 'w-80'}`}
        >
            <div className={`flex-1 min-h-0 overflow-x-hidden ${isCollapsed ? 'overflow-y-hidden' : 'overflow-y-auto custom-scrollbar'}`}>
                {isCollapsed ? (
                    <div className="flex flex-col items-center pt-4 gap-1">
                        <button
                            title="Einstellungen"
                            onClick={onExportClick}
                            className="w-10 h-10 flex items-center justify-center rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-neutral-700/50 transition-colors duration-200"
                        >
                            <i className="material-icons text-xl">settings</i>
                        </button>
                        <hr className="w-8 border-neutral-700 my-2" />
                        <button
                            onClick={onFavoritesClick}
                            title="Favoriten"
                            className="w-10 h-10 flex items-center justify-center rounded-lg cursor-pointer transition-colors duration-200 text-yellow-400 hover:text-yellow-300 hover:bg-neutral-700/50"
                        >
                            <i className="material-icons">star</i>
                        </button>
                        <hr className="w-8 border-neutral-700 my-2" />
                        <ul className="flex flex-col items-center gap-1 w-full">
                            {menuItems.map((item) => (
                                <NavItem
                                    key={item.id}
                                    item={item}
                                    isActive={activeView === item.id}
                                    onClick={() => setActiveView(item.id)}
                                    count={counts[item.id]}
                                    isCollapsed={isCollapsed}
                                />
                            ))}
                        </ul>
                    </div>
                ) : (
                    <div className="px-6 pt-6">
                        <div className="mb-8 bg-neutral-900 p-4 rounded-2xl relative border border-neutral-700">
                            <DateTimeWidget
                                onExportClick={onExportClick}
                                onImportClick={onImportClick}
                                onDeleteClick={onDeleteClick}
                            />
                            <hr className="border-neutral-700 my-4" />
                            <WeatherWidget />
                        </div>
                        <div className="mb-4">
                            <button
                                onClick={onFavoritesClick}
                                className="w-full flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors duration-200 text-neutral-300 hover:text-white hover:bg-neutral-700/50"
                            >
                                <div className="flex items-center gap-3">
                                    <i className="material-icons text-yellow-400">star</i>
                                    <span className="font-medium">Favoriten</span>
                                </div>
                                <i className="material-icons text-sm text-neutral-400">arrow_forward_ios</i>
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
                                        isCollapsed={isCollapsed}
                                    />
                                ))}
                            </ul>
                        </nav>
                    </div>
                )}
            </div>

            {/* Toggle button at bottom */}
            <div className={`flex ${isCollapsed ? 'justify-center' : 'justify-end'} px-3 py-3 border-t border-neutral-700`}>
                <button
                    onClick={() => setIsCollapsed(prev => !prev)}
                    title={isCollapsed ? 'Sidebar aufklappen (Alt+S)' : 'Sidebar zuklappen (Alt+S)'}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-neutral-700/50 transition-colors duration-200"
                >
                    <i className="material-icons text-xl">
                        {isCollapsed ? 'chevron_right' : 'chevron_left'}
                    </i>
                </button>
            </div>
        </aside>
    );
};
