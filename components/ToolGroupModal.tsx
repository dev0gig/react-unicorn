import React, { useState, useEffect } from 'react';
import { useDashboard } from '../App';
import type { ToolGroup } from '../types';

interface ToolGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupToEdit: ToolGroup | null;
}

export const ToolGroupModal: React.FC<ToolGroupModalProps> = ({ isOpen, onClose, groupToEdit }) => {
  const { addGroup, updateGroup } = useDashboard();
  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState('');
  
  const isEditMode = groupToEdit !== null;

  useEffect(() => {
    if (isOpen) {
      if (isEditMode) {
        setTitle(groupToEdit.title);
        setIcon(groupToEdit.icon);
      } else {
        setTitle('');
        setIcon('');
      }
    }
  }, [isOpen, groupToEdit, isEditMode]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && icon.trim()) {
       if (isEditMode) {
          updateGroup(groupToEdit.title, title, icon);
       } else {
          addGroup(title, icon);
       }
      onClose();
    }
  };
  
    useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <div
            className="bg-neutral-800 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col border border-neutral-700"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-center justify-between p-4 border-b border-neutral-700 flex-shrink-0">
              <div className="flex items-center">
                 <i className="material-icons text-2xl text-orange-400 mr-3">category</i>
                 <h2 className="text-xl font-bold text-neutral-100">{isEditMode ? 'Gruppe bearbeiten' : 'Neue Gruppe erstellen'}</h2>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-full text-neutral-400 hover:bg-neutral-700 hover:text-white transition-colors"
                aria-label="Schließen"
              >
                <i className="material-icons">close</i>
              </button>
            </header>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label htmlFor="group-title" className="block text-sm font-medium text-neutral-300 mb-1">Titel der Gruppe</label>
                <input
                  id="group-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg py-2 px-3 text-neutral-200 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all duration-200"
                  placeholder="z.B. Meine Tools"
                />
              </div>
              <div>
                <label htmlFor="group-icon" className="block text-sm font-medium text-neutral-300 mb-1">Icon</label>
                <input
                  id="group-icon"
                  type="text"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  required
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg py-2 px-3 text-neutral-200 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all duration-200"
                  placeholder="Name des Material Icons (z.B. schedule)"
                />
                <a href="https://fonts.google.com/icons?selected=Material+Icons" target="_blank" rel="noopener noreferrer" className="text-xs text-orange-400 hover:underline mt-1 block">
                  Verfügbare Icons finden
                </a>
              </div>
              <div className="flex justify-end pt-2">
                 <button
                    type="button"
                    onClick={onClose}
                    className="mr-3 py-2 px-4 rounded-lg text-neutral-300 hover:bg-neutral-700 transition-colors"
                 >
                    Abbrechen
                 </button>
                 <button
                    type="submit"
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-6 rounded-lg transition-all duration-200"
                 >
                    {isEditMode ? 'Speichern' : 'Gruppe erstellen'}
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};