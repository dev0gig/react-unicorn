import React, { useState, useMemo } from 'react';
import ReactDOM from 'react-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Evidenzfall, KanbanColumnId } from '../../types';
import { useEvidenz } from '../../App';

const CaseCard: React.FC<{ fall: Evidenzfall; onArchive: (id: string) => void; onEdit: (fall: Evidenzfall) => void; isOverlay?: boolean }> = ({ fall, onArchive, onEdit, isOverlay = false }) => {
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


const columnColors: Record<KanbanColumnId, string> = {
  neu: 'bg-red-700',
  inBearbeitung: 'bg-amber-600',
  fertig: 'bg-green-700',
};

const KanbanColumn: React.FC<{ id: KanbanColumnId; title: string; faelle: Evidenzfall[]; children: React.ReactNode; }> = ({ id, title, faelle, children }) => {
  const { setNodeRef } = useSortable({ id, data: { type: 'column' } });

  return (
    <div ref={setNodeRef} className="bg-neutral-800/50 rounded-xl flex flex-col h-full overflow-hidden">
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

interface EvidenzfaelleProps {
  onEdit: (fall: Evidenzfall) => void;
}

export const Evidenzfaelle: React.FC<EvidenzfaelleProps> = ({ onEdit }) => {
  const { faelle, archivedFaelle, updateCases, archiveCase, restoreCase, deleteCasePermanently } = useEvidenz();
  const [activeFall, setActiveFall] = useState<Evidenzfall | null>(null);
  const [showArchive, setShowArchive] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor));

  const columns: KanbanColumnId[] = ['neu', 'inBearbeitung', 'fertig'];
  
  const faelleByColumn = useMemo(() => {
    return columns.reduce((acc, columnId) => {
      acc[columnId] = faelle.filter(f => f.column === columnId);
      return acc;
    }, {} as Record<KanbanColumnId, Evidenzfall[]>);
  }, [faelle, columns]);
  
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
    if (over.data.current?.type === 'column') {
        const newColumnId = overId as KanbanColumnId;
        if (activeItem.column !== newColumnId) {
            const updatedFaelle = faelle.map(f => f.id === activeId ? { ...f, column: newColumnId } : f);
            updateCases(updatedFaelle);
        }
    }
    // Dropped on another card
    else if (over.data.current?.type === 'case') {
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

  return (
    <div className="flex flex-col h-full pt-8 pl-8">
      <div className="flex justify-between items-center mb-8 flex-shrink-0 pr-8">
        <div>
          <h1 className="text-4xl font-bold text-neutral-100 mb-2">Evidenzfälle</h1>
          <p className="text-neutral-400">Verwalten Sie Ihre Fälle per Drag-and-Drop.</p>
        </div>
        <button 
          onClick={() => setShowArchive(!showArchive)}
          className="flex items-center bg-neutral-700 hover:bg-neutral-600 text-neutral-200 font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          <i className="material-icons mr-2 text-base">{showArchive ? 'table_rows' : 'archive'}</i>
          {showArchive ? 'Board anzeigen' : `Archiv anzeigen (${archivedFaelle.length})`}
        </button>
      </div>

      <div className="flex-grow min-h-0 pr-8 pb-8">
        {showArchive ? (
            <div className="bg-neutral-800 p-6 rounded-2xl shadow-lg overflow-y-auto custom-scrollbar h-full">
                {archivedFaelle.length > 0 ? (
                    <ul className="space-y-3">
                        {archivedFaelle.map(fall => (
                            <li key={fall.id} className="bg-neutral-900/80 p-4 rounded-lg flex justify-between items-center">
                                <div className="min-w-0">
                                    <h4 className="font-bold text-neutral-200 break-words">{fall.gpvk}</h4>
                                    <div className="text-sm text-neutral-400 mt-1 space-y-1 break-words">
                                        {fall.telefonnummer && <p>{fall.telefonnummer}</p>}
                                        {fall.description && <p className="whitespace-pre-wrap">{fall.description}</p>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <button
                                        onClick={() => restoreCase(fall.id)}
                                        className="flex items-center text-sm bg-orange-500/80 hover:bg-orange-500 text-white font-semibold py-1.5 px-3 rounded-md transition-colors"
                                    >
                                        <i className="material-icons mr-1 text-base">unarchive</i>
                                        Wiederherstellen
                                    </button>
                                    <button
                                        onClick={() => deleteCasePermanently(fall.id)}
                                        title="Endgültig löschen"
                                        className="p-2 rounded-full text-neutral-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                                    >
                                        <i className="material-icons text-base">delete_forever</i>
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center py-10 px-4 text-neutral-500 h-full flex flex-col items-center justify-center">
                        <i className="material-icons text-5xl mb-2">inbox</i>
                        <p>Das Archiv ist leer.</p>
                    </div>
                )}
            </div>
        ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
                <SortableContext items={columns} strategy={horizontalListSortingStrategy}>
                {columns.map(columnId => (
                    <KanbanColumn key={columnId} id={columnId} title={columnId.charAt(0).toUpperCase() + columnId.slice(1).replace('inBearbeitung', 'In Bearbeitung')} faelle={faelleByColumn[columnId]}>
                    <SortableContext items={faelleByColumn[columnId]?.map(f => f.id) ?? []} strategy={verticalListSortingStrategy}>
                        {faelleByColumn[columnId]?.map(fall => <CaseCard key={fall.id} fall={fall} onArchive={archiveCase} onEdit={onEdit} />)}
                    </SortableContext>
                    </KanbanColumn>
                ))}
                </SortableContext>
            </div>
            {ReactDOM.createPortal(
                <DragOverlay>
                {activeFall ? <CaseCard fall={activeFall} onArchive={() => {}} onEdit={() => {}} isOverlay /> : null}
                </DragOverlay>,
                document.body
            )}
            </DndContext>
        )}
      </div>
    </div>
  );
};