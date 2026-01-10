import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDashboard } from '../App';
import type { ToolGroup } from '../types';

interface ReorderGroupsModalProps {
  isOpen: boolean;
  onClose: () => void;
  columnCount: number;
}

// A simple, non-sortable component for the drag overlay
const GroupItem: React.FC<{ group: ToolGroup }> = ({ group }) => {
  return (
    <div className="p-4 rounded-lg bg-neutral-700 flex items-center gap-3 shadow-2xl scale-105 opacity-95">
      <i className="material-icons text-orange-500">{group.icon}</i>
      <span className="font-semibold text-neutral-100 truncate">{group.title}</span>
    </div>
  );
};

const SortableGroup: React.FC<{ group: ToolGroup }> = ({ group }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: group.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    // Hide the original item while dragging, as the overlay will represent it
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="p-4 rounded-lg bg-neutral-700/50 flex items-center gap-3 cursor-grab active:cursor-grabbing touch-none transition-shadow shadow-md"
    >
      <i className="material-icons text-orange-500">{group.icon}</i>
      <span className="font-semibold text-neutral-100 truncate">{group.title}</span>
    </div>
  );
};

export const ReorderGroupsModal: React.FC<ReorderGroupsModalProps> = ({ isOpen, onClose, columnCount }) => {
  const { toolGroups, reorderGroups } = useDashboard();
  const [items, setItems] = useState<ToolGroup[]>([]);
  const [activeGroup, setActiveGroup] = useState<ToolGroup | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8,
    },
  }));

  const gridColsClass = useMemo(() => {
    switch (columnCount) {
      case 4:
        return 'grid-cols-4';
      case 3:
        return 'grid-cols-3';
      case 2:
        return 'grid-cols-2';
      default:
        return 'grid-cols-1';
    }
  }, [columnCount]);

  useEffect(() => {
    if (isOpen) {
      setItems(toolGroups);
    }
  }, [isOpen, toolGroups]);

  const handleDone = useCallback(() => {
    if (JSON.stringify(items) !== JSON.stringify(toolGroups)) {
      reorderGroups(items);
    }
    onClose();
  }, [items, reorderGroups, onClose, toolGroups]);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleDone();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, handleDone]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const group = items.find(item => item.id === active.id);
    if (group) {
      setActiveGroup(group);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveGroup(null);
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setItems((currentItems) => {
        const oldIndex = currentItems.findIndex((item) => item.id === active.id);
        const newIndex = currentItems.findIndex((item) => item.id === over.id);
        if (oldIndex > -1 && newIndex > -1) {
          return arrayMove(currentItems, oldIndex, newIndex);
        }
        return currentItems;
      });
    }
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={handleDone}
        >
          <div
            className="bg-neutral-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col border border-neutral-700"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-center justify-between p-4 border-b border-neutral-700 flex-shrink-0">
              <div className="flex items-center">
                <i className="material-icons text-2xl text-orange-400 mr-3">view_quilt</i>
                <h2 className="text-xl font-bold text-neutral-100">Dashboard-Gruppen anordnen</h2>
              </div>
              <button
                onClick={handleDone}
                className="p-1 rounded-full text-neutral-400 hover:bg-neutral-700 hover:text-white transition-colors"
                aria-label="Schließen"
              >
                <i className="material-icons">close</i>
              </button>
            </header>

            <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={items.map(item => item.id)} strategy={rectSortingStrategy}>
                  <div className={`grid ${gridColsClass} gap-4`}>
                    {items.map(group => (
                      <SortableGroup key={group.id} group={group} />
                    ))}
                  </div>
                </SortableContext>
                {ReactDOM.createPortal(
                  <DragOverlay>
                    {activeGroup ? <GroupItem group={activeGroup} /> : null}
                  </DragOverlay>,
                  document.body
                )}
              </DndContext>
              {items.length === 0 && (
                <div className="text-center py-10 px-4 text-neutral-500 h-full flex flex-col items-center justify-center">
                  <i className="material-icons text-5xl mb-2">category</i>
                  <p>Keine Gruppen zum Anordnen vorhanden.</p>
                </div>
              )}
            </div>

            <footer className="flex justify-end items-center p-4 bg-neutral-900/50 rounded-b-2xl">
              <button
                onClick={handleDone}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-6 rounded-lg transition-all"
              >
                Fertig
              </button>
            </footer>

          </div>
        </div>
      )}
    </>
  );
};
