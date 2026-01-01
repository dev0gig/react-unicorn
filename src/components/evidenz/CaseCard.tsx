import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Evidenzfall } from '../../../types';

interface CaseCardProps {
    fall: Evidenzfall;
    onArchive: (id: string) => void;
    onEdit: (fall: Evidenzfall) => void;
    isOverlay?: boolean;
}

export const CaseCard: React.FC<CaseCardProps> = ({ fall, onArchive, onEdit, isOverlay = false }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: fall.id, data: { ...fall, type: 'case' } });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const processedDescription = useMemo(() => {
        if (!fall.description) return '';
        // Replace ==highlight== with <mark>highlight</mark> for rendering
        return fall.description.replace(/==(.*?)==/g, '<mark>$1</mark>');
    }, [fall.description]);

    const shadow = isOverlay ? 'shadow-2xl scale-105' : 'shadow-md';

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`bg-neutral-800 p-4 rounded-lg ${shadow} touch-none border border-transparent hover:border-orange-500/50 transition-all duration-200 flex flex-col gap-2 ${isDragging ? 'opacity-50' : ''}`}
        >
            <div className="flex justify-between items-start gap-2">
                <div className="flex-grow min-w-0">
                    <h4 className="font-bold text-neutral-100 break-words">{fall.gpvk}</h4>
                </div>
                <div className="flex-shrink-0 flex items-center gap-1">
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit(fall); }}
                        className="p-1 rounded-full text-neutral-500 hover:bg-neutral-700 hover:text-orange-400 transition-colors"
                        aria-label="Fall bearbeiten"
                    >
                        <i className="material-icons text-lg">edit</i>
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onArchive(fall.id);
                        }}
                        className="p-1 rounded-full text-neutral-500 hover:bg-neutral-700 hover:text-orange-400 transition-colors"
                        aria-label="Fall archivieren"
                    >
                        <i className="material-icons text-lg">archive</i>
                    </button>
                    <div
                        {...attributes}
                        {...listeners}
                        className="p-1 cursor-grab active:cursor-grabbing text-neutral-500"
                        aria-label="Fall verschieben"
                    >
                        <i className="material-icons text-xl">drag_indicator</i>
                    </div>
                </div>
            </div>
            {fall.telefonnummer && (
                <p className="text-sm text-neutral-400 flex items-center gap-1.5">
                    <i className="material-icons text-base">phone</i>
                    <span>{fall.telefonnummer}</span>
                </p>
            )}
            {fall.description && (
                <div className="text-sm markdown-content">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                        {processedDescription}
                    </ReactMarkdown>
                </div>
            )}
        </div>
    );
};
