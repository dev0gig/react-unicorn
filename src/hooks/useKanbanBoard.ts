import { useState, useMemo } from 'react';
import {
    useSensor,
    useSensors,
    PointerSensor,
    DragStartEvent,
    DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { useEvidenz } from '../../contexts/EvidenzContext'; // Adjust path if needed, based on context locations
import { Evidenzfall, KanbanColumnId } from '../../types';
import { isColumn, isCase } from '../utils/dndUtils';

export const useKanbanBoard = () => {
    const { faelle, updateCases } = useEvidenz();
    const [activeFall, setActiveFall] = useState<Evidenzfall | null>(null);

    const sensors = useSensors(useSensor(PointerSensor));

    const columns: KanbanColumnId[] = ['neu', 'inBearbeitung', 'fertig'];

    const faelleByColumn = useMemo(() => {
        return columns.reduce((acc, columnId) => {
            acc[columnId] = faelle.filter(f => f.column === columnId);
            return acc;
        }, {} as Record<KanbanColumnId, Evidenzfall[]>);
    }, [faelle, columns]);

    // ... (keep surrounding code)

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const fall = faelle.find(f => f.id === active.id);
        if (fall) {
            setActiveFall(fall);
        }
        document.body.style.cursor = 'grabbing';
    };

    const handleDragEnd = (event: DragEndEvent) => {
        document.body.style.cursor = '';
        setActiveFall(null);
        const { active, over } = event;

        if (!over || active.id === over.id) return;

        const activeId = active.id.toString();
        const overId = over.id.toString();
        const activeItem = faelle.find(f => f.id === activeId);
        if (!activeItem) return;

        // Dropped on a column
        if (isColumn(over)) {
            const newColumnId = overId as KanbanColumnId;
            if (activeItem.column !== newColumnId) {
                const updatedFaelle = faelle.map(f => f.id === activeId ? { ...f, column: newColumnId } : f);
                updateCases(updatedFaelle);
            }
        }
        // Dropped on another card
        else if (over.data.current?.type === 'case') { // or isCase(over) logic if over is castable
            // Since isCase expects Active type mainly, let's just check type explicitly or use implicit knowledge
            // for now, consistent with what I did in useDashboardLogic
            const overItem = faelle.find(f => f.id === overId);

            if (overItem && activeItem.column === overItem.column) {
                // Reorder within the same column
                const oldIndex = faelle.findIndex(f => f.id === activeId);
                const newIndex = faelle.findIndex(f => f.id === overId);
                updateCases(arrayMove(faelle, oldIndex, newIndex));
            } else if (overItem && activeItem.column !== overItem.column) {
                // Move to a new column and reorder
                const updatedFaelle = faelle.map(f => f.id === activeId ? { ...f, column: overItem.column } : f);
                const oldIndexInNewStructure = updatedFaelle.findIndex(f => f.id === activeId);
                const newIndexInNewStructure = updatedFaelle.findIndex(f => f.id === overId);
                updateCases(arrayMove(updatedFaelle, oldIndexInNewStructure, newIndexInNewStructure));
            }
        }
    };

    return {
        columns,
        faelleByColumn,
        activeFall,
        sensors,
        handleDragStart,
        handleDragEnd,
    };
};
