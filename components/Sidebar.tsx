import React, { useState, useEffect, useRef, memo } from 'react';
import type { ViewName, MenuItem } from '../types';
import { useContacts, useEvidenz, useTemplates } from '../App';

// --- WEATHER CONSTANTS for new widget ---
const WEATHER_CODES: { [key: number]: { text: string; icon: string; } } = {
    0: { text: 'Klarer Himmel', icon: 'wb_sunny' },
    1: { text: 'Leicht bewölkt', icon: 'wb_cloudy' },
    2: { text: 'Teilweise bewölkt', icon: 'wb_cloudy' },
    3: { text: 'Bedeckt', icon: 'cloud' },
    45: { text: 'Nebel', icon: 'dehaze' },
    48: { text: 'Reifnebel', icon: 'ac_unit' },
    51: { text: 'Nieselregen', icon: 'grain' },
    53: { text: 'Nieselregen', icon: 'grain' },
    55: { text: 'Nieselregen', icon: 'grain' },
    61: { text: 'Regen', icon: 'water_drop' },
    63: { text: 'Regen', icon: 'water_drop' },
    65: { text: 'Regen', icon: 'water_drop' },
    80: { text: 'Schauer', icon: 'water_drop' },
    81: { text: 'Schauer', icon: 'water_drop' },
    82: { text: 'Schauer', icon: 'water_drop' },
    71: { text: 'Schneefall', icon: 'ac_unit' },
    73: { text: 'Schneefall', icon: 'ac_unit' },
    75: { text: 'Schneefall', icon: 'ac_unit' },
    95: { text: 'Gewitter', icon: 'thunderstorm' },
    96: { text: 'Gewitter', icon: 'thunderstorm' },
    99: { text: 'Gewitter', icon: 'thunderstorm' },
};
const UNKNOWN_WEATHER = { text: 'Unbekannt', icon: 'help_outline' };


const menuItems: MenuItem[] = [
  { id: 'Dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'Kontakte', label: 'Kontakte', icon: 'people' },
  { id: 'Mail Vorlagen', label: 'Mail Vorlagen', icon: 'drafts' },
  { id: 'Evidenzfälle', label: 'Evidenzfälle', icon: 'gavel' },
  { id: 'HK - Generator', label: 'HK - Generator', icon: 'text_fields' },
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
         className="absolute inset-0 bg-orange-500 rounded-lg shadow-lg"
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

const SidebarWeatherWidget: React.FC = () => {
    const [weather, setWeather] = useState<{ temp: number; code: number } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchWeather = async () => {
            setLoading(true);
            try {
                const lat = 48.21, lon = 16.37; // Vienna
                const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`;
                const response = await fetch(url);
                if (!response.ok) return;
                const data = await response.json();
                setWeather({
                    temp: Math.round(data.current.temperature_2m),
                    code: data.current.weather_code,
                });
            } catch (err) {
                console.error("Failed to fetch sidebar weather", err);
            } finally {
                setLoading(false);
            }
        };
        fetchWeather();
    }, []);
    
    if (loading) return <div className="text-center text-neutral-400">Wetter wird geladen...</div>;
    if (!weather) return null;

    const weatherInfo = WEATHER_CODES[weather.code] || UNKNOWN_WEATHER;

    return (
        <div className="flex items-center justify-between text-center">
            <div className="text-left">
                <p className="font-semibold text-neutral-100">Wien</p>
                <p className="text-xs text-neutral-400">{weatherInfo.text}</p>
            </div>
            <div className="flex items-center gap-2">
                <i className="material-icons text-3xl text-orange-400">{weatherInfo.icon}</i>
                <span className="text-2xl font-bold text-neutral-100">{weather.temp}°</span>
            </div>
        </div>
    );
};


export const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, onFavoritesClick, onExportClick, onImportClick, onDeleteClick }) => {
  const { contacts } = useContacts();
  const { faelle } = useEvidenz();
  const { templateGroups } = useTemplates();
  
  const counts: Record<string, number> = {
    'Kontakte': contacts.length,
    'Evidenzfälle': faelle.filter(f => f.column !== 'fertig').length,
    'Mail Vorlagen': templateGroups.reduce((sum, group) => sum + group.templates.length, 0),
  };

  return (
    <aside className="w-80 bg-neutral-800 flex flex-col h-screen flex-shrink-0">
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-6 pt-6">
        <div className="mb-8 bg-neutral-900 p-4 rounded-2xl relative">
          <DateTimeWidget 
            onExportClick={onExportClick}
            onImportClick={onImportClick}
            onDeleteClick={onDeleteClick}
          />
          <hr className="border-neutral-700 my-4" />
          <SidebarWeatherWidget />
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