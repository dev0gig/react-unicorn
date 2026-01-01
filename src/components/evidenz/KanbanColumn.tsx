import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { Evidenzfall, KanbanColumnId } from '../../../types';

interface KanbanColumnProps {
    id: KanbanColumnId;
    title: string;
    faelle: Evidenzfall[];
    children: React.ReactNode;
}

const columnColors: Record<KanbanColumnId, string> = {
    neu: 'bg-red-700',
    inBearbeitung: 'bg-amber-600',
    fertig: 'bg-green-700',
};

export const KanbanColumn: React.FC<KanbanColumnProps> = ({ id, title, faelle, children }) => {
    const { setNodeRef } = useSortable({ id, data: { type: 'column' } });

    return (
        <div ref={setNodeRef} className="bg-neutral-800/50 rounded-xl border border-neutral-700 flex flex-col h-full overflow-hidden">
            <div className={`flex items-center justify-between p-3 flex-shrink-0 ${columnColors[id]}`}>
                <h3 className="font-bold text-lg text-white">{title}</h3>
                <span className="bg-black/20 text-white text-xs font-semibold px-2 py-1 rounded-full">{faelle.length}</span>
            </div>
            <div className="flex-grow space-y-4 overflow-y-auto custom-scrollbar p-4">
                {children}
            </div>
        </div>
    );
};
