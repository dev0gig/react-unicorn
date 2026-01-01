import React from 'react';
import { ToolLink, ToolGroup } from '../../../types';

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
            className={`relative flex flex-col w-full h-20 rounded-lg bg-neutral-800 border border-neutral-600 transition-all duration-200 overflow-hidden ${isEditMode ? 'ring-2 ring-orange-500 shadow-lg bg-neutral-800' : 'hover:bg-neutral-700'}`}
        >
            {isEditMode ? (
                /* EDIT MODE LAYOUT */
                <div className="flex flex-col h-full w-full animate-fade-in-fast">
                    {/* Title Area - Always readable */}
                    <div className="px-2 pt-1 pb-1 text-[10px] uppercase tracking-wider text-neutral-400 font-semibold truncate border-b border-neutral-700/50 text-center select-none">
                        {data.link.name}
                    </div>

                    {/* Action Buttons Area - Center aligned with more space */}
                    <div className="flex-grow flex items-center justify-center gap-3 bg-neutral-900/30">
                        <button
                            onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(); }}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-700 hover:bg-neutral-600 text-white transition-all shadow-sm hover:scale-110"
                            title={isFavorite ? 'Von Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
                        >
                            <i className="material-icons text-base" style={{ color: isFavorite ? '#fbbf24' : '#9ca3af' }}>{isFavorite ? 'star' : 'star_border'}</i>
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit?.(); }}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-700 hover:bg-neutral-600 text-white transition-all shadow-sm hover:scale-110"
                            title="Bearbeiten"
                        >
                            <i className="material-icons text-base">edit</i>
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-700 hover:bg-red-600 text-red-400 hover:text-white transition-all shadow-sm hover:scale-110"
                            title="Löschen"
                        >
                            <i className="material-icons text-base">delete</i>
                        </button>
                    </div>
                </div>
            ) : (
                /* NORMAL MODE LAYOUT */
                <div className="flex flex-col justify-end h-full p-3">
                    {isFavorite && (
                        <i className="material-icons text-yellow-400 text-lg absolute top-2 left-2" title="Favorit">star</i>
                    )}
                    <div className="min-w-0">
                        <span className="font-medium text-neutral-200 break-words line-clamp-2">{data.link.name}</span>
                    </div>
                </div>
            )}
        </div>
    );
};
