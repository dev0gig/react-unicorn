import React, { useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
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
}

const SortableGroup: React.FC<{ group: ToolGroup }> = ({ group }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: group.title });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`p-4 rounded-lg bg-neutral-700/50 flex items-center gap-3 cursor-grab active:cursor-grabbing touch-none transition-shadow ${
        isDragging ? 'shadow-2xl z-10' : 'shadow-md'
      }`}
    >
      <i className="material-icons text-orange-400">{group.icon}</i>
      <span className="font-semibold text-neutral-100 truncate">{group.title}</span>
    </div>
  );
};

export const ReorderGroupsModal: React.FC<ReorderGroupsModalProps> = ({ isOpen, onClose }) => {
  const { toolGroups, reorderGroups } = useDashboard();
  const [items, setItems] = useState<ToolGroup[]>([]);
  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => {
    if (isOpen) {
      setItems(toolGroups);
    }
  }, [isOpen, toolGroups]);

  const handleDone = useCallback(() => {
    reorderGroups(items);
    onClose();
  }, [items, reorderGroups, onClose]);

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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setItems((currentItems) => {
        const oldIndex = currentItems.findIndex((item) => item.title === active.id);
        const newIndex = currentItems.findIndex((item) => item.title === over.id);
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
            className="bg-neutral-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col border border-neutral-700"
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
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext items={items.map(item => item.title)} strategy={rectSortingStrategy}>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {items.map(group => (
                                <SortableGroup key={group.title} group={group} />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
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