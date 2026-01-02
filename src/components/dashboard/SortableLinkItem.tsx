import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ToolLink, ToolGroup } from '../../../types';
import { LinkItem } from './LinkItem';

interface SortableLinkItemProps {
    link: ToolLink;
    group: ToolGroup;
    isFavorite: boolean;
    isEditMode: boolean;
    onEdit: (data: { link: ToolLink; group: ToolGroup }) => void;
    onDelete: (groupId: string, url: string) => void;
    onToggleFavorite: (link: ToolLink) => void;
}

export const SortableLinkItem: React.FC<SortableLinkItemProps> = ({ link, group, isFavorite, isEditMode, onEdit, onDelete, onToggleFavorite }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: link.url, data: { type: 'link', link, group, isFavorite }, disabled: !isEditMode });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const data = { link, group };

    const handleClick = (e: React.MouseEvent) => {
        // In Edit Mode, clicking the tile background should not open the link.
        if (isEditMode) {
            e.preventDefault();
            return;
        }

        if (e.defaultPrevented) return;
        e.preventDefault();
        window.open(data.link.url, '_blank', 'noopener,noreferrer');
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`transition-opacity duration-300 ${isDragging ? 'opacity-30' : ''}`}
        >
            <div className="relative cursor-pointer" onClick={handleClick}>
                <div {...(isEditMode ? { ...attributes, ...listeners } : {})} className={isEditMode ? 'touch-none cursor-grab active:cursor-grabbing' : ''}>
                    <LinkItem
                        data={data}
                        isFavorite={isFavorite}
                        isEditMode={isEditMode}
                        onToggleFavorite={() => onToggleFavorite(link)}
                        onEdit={() => onEdit(data)}
                        onDelete={() => onDelete(group.id, link.url)}
                    />
                </div>
            </div>
        </div>
    );
};
