import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import {
  DndContext,
  closestCenter,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useEvidenz } from '../../App';
import { Evidenzfall } from '../../types';
import { CaseCard } from '../../src/components/evidenz/CaseCard';
import { KanbanColumn } from '../../src/components/evidenz/KanbanColumn';
import { useKanbanBoard } from '../../src/hooks/useKanbanBoard';

interface EvidenzfaelleProps {
  onEdit: (fall: Evidenzfall) => void;
  onAddCaseClick: () => void;
  onOpenClearArchiveModal: () => void;
}

export const Evidenzfaelle: React.FC<EvidenzfaelleProps> = ({ onEdit, onAddCaseClick, onOpenClearArchiveModal }) => {
  // We keep archive logic here as requested in plan, or if it wasn't moved to hook.
  // The hook handles active board state.
  const { archivedFaelle, archiveCase, restoreCase, deleteCasePermanently } = useEvidenz();
  const [showArchive, setShowArchive] = useState(false);

  const {
    columns,
    faelleByColumn,
    activeFall,
    sensors,
    handleDragStart,
    handleDragEnd,
  } = useKanbanBoard();

  return (
    <div className="flex flex-col h-full pt-8 pl-8">
      <div className="flex justify-between items-center mb-8 flex-shrink-0 pr-8">
        <div>
          <h1 className="text-4xl font-bold text-neutral-100 mb-2">Evidenzfälle</h1>
          <p className="text-neutral-400">Verwalten Sie Ihre Fälle per Drag-and-Drop.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onAddCaseClick}
            className="flex items-center bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors shadow-md hover:shadow-lg"
          >
            <i className="material-icons mr-2 text-base">add</i>
            Neue Evidenz
          </button>
          {showArchive && archivedFaelle.length > 0 && (
            <button
              onClick={onOpenClearArchiveModal}
              className="flex items-center bg-red-600/80 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              <i className="material-icons mr-2 text-base">delete_sweep</i>
              Archiv leeren
            </button>
          )}
          <button
            onClick={() => setShowArchive(!showArchive)}
            className="flex items-center bg-neutral-700 hover:bg-neutral-600 text-neutral-200 font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            <i className="material-icons mr-2 text-base">{showArchive ? 'table_rows' : 'archive'}</i>
            {showArchive ? 'Board anzeigen' : `Archiv anzeigen (${archivedFaelle.length})`}
          </button>
        </div>
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
                {activeFall ? <CaseCard fall={activeFall} onArchive={() => { }} onEdit={() => { }} isOverlay /> : null}
              </DragOverlay>,
              document.body
            )}
          </DndContext>
        )}
      </div>
    </div>
  );
};