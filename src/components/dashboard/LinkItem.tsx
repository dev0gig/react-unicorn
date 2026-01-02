import React from 'react';
import { ToolLink, ToolGroup } from '../../../types';

// Feste Farbpalette: 7 dezente, dunkle Farben
const INITIAL_COLORS = [
    '#4a5568', // Grau-Blau
    '#5a67d8', // Indigo
    '#319795', // Teal
    '#38a169', // Grün
    '#d69e2e', // Gelb/Gold
    '#dd6b20', // Orange
    '#e53e3e', // Rot
];

// Deterministische Farbzuweisung basierend auf dem Link-Namen
const getColorForName = (name: string): string => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        const char = name.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    const index = Math.abs(hash) % INITIAL_COLORS.length;
    return INITIAL_COLORS[index];
};

// Initiale des Link-Namens (erster Buchstabe)
const getInitial = (name: string): string => {
    const trimmed = name.trim();
    if (!trimmed) return '?';
    return trimmed.charAt(0).toUpperCase();
};

interface LinkItemProps {
    data: { link: ToolLink; group: ToolGroup };
    isFavorite: boolean;
    isEditMode: boolean;
    onToggleFavorite?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
}

export const LinkItem: React.FC<LinkItemProps> = ({ data, isFavorite, isEditMode, onToggleFavorite, onEdit, onDelete }) => {
    return (
        <div
            className={`group relative flex items-center justify-center w-full min-h-[3rem] py-2 px-3 rounded-lg bg-neutral-800/60 border border-neutral-700 transition-all duration-200 overflow-hidden ${isEditMode ? 'ring-2 ring-orange-500 bg-neutral-800' : 'hover:bg-neutral-700 hover:border-orange-500/50'}`}
        >
            {/* Link Name */}
            <span className="font-medium text-neutral-200 text-center text-sm leading-tight">{data.link.name}</span>

            {/* Favorit-Stern (immer sichtbar wenn Favorit) */}
            {isFavorite && !isEditMode && (
                <i className="material-icons text-yellow-400 text-sm ml-2 absolute right-2" title="Favorit">star</i>
            )}

            {/* Edit Mode: Aktions-Buttons rechtsbündig */}
            {isEditMode && (
                <div className="absolute right-1 flex items-center gap-0.5 animate-fade-in-fast">
                    <button
                        onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(); }}
                        className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-neutral-600 text-white transition-all"
                        title={isFavorite ? 'Von Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
                    >
                        <i className="material-icons text-sm" style={{ color: isFavorite ? '#fbbf24' : '#9ca3af' }}>{isFavorite ? 'star' : 'star_border'}</i>
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit?.(); }}
                        className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-neutral-600 text-white transition-all"
                        title="Bearbeiten"
                    >
                        <i className="material-icons text-sm">edit</i>
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
                        className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-600 text-red-400 hover:text-white transition-all"
                        title="Löschen"
                    >
                        <i className="material-icons text-sm">delete</i>
                    </button>
                </div>
            )}
        </div>
    );
};
