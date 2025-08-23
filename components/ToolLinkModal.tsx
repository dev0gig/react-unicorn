import React, { useState, useEffect } from 'react';
import { useDashboard } from '../App';
import type { ToolLink } from '../types';

interface ToolLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  linkToEdit: { link: ToolLink, groupTitle: string } | null;
}

export const ToolLinkModal: React.FC<ToolLinkModalProps> = ({ isOpen, onClose, linkToEdit }) => {
  const { toolGroups, addLinkAndMaybeGroup, updateLink } = useDashboard();
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [selectedGroupTitle, setSelectedGroupTitle] = useState('');
  const [isNewGroup, setIsNewGroup] = useState(false);
  const [newGroupTitle, setNewGroupTitle] = useState('');
  const [newGroupIcon, setNewGroupIcon] = useState('');
  const [error, setError] = useState('');
  
  const isEditMode = !!linkToEdit?.link?.name;

  useEffect(() => {
    if (isOpen && linkToEdit) {
        setError('');
        setName(linkToEdit.link.name);
        setUrl(linkToEdit.link.url);
        setSelectedGroupTitle(linkToEdit.groupTitle);

        const creatingNew = !isEditMode && (!linkToEdit.groupTitle || toolGroups.length === 0);
        setIsNewGroup(creatingNew);
        if (creatingNew) {
            setSelectedGroupTitle('__NEW__');
        }

        if (!creatingNew) {
            setNewGroupTitle('');
            setNewGroupIcon('');
        }
    }
  }, [isOpen, linkToEdit, isEditMode, toolGroups]);
  
  const handleGroupSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setError('');
    setSelectedGroupTitle(value);
    if (value === '__NEW__') {
        setIsNewGroup(true);
    } else {
        setIsNewGroup(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim() || !linkToEdit) return;

    try {
        new URL(url);
    } catch (_) {
        setError('Bitte geben Sie eine gültige URL ein.');
        return;
    }

    if (isEditMode) {
        updateLink(linkToEdit.groupTitle, linkToEdit.link, { name, url });
    } else {
        if (isNewGroup) {
            if (!newGroupTitle.trim() || !newGroupIcon.trim()) {
                setError('Titel und Icon für die neue Gruppe sind erforderlich.');
                return;
            }
            if (toolGroups.some(g => g.title.toLowerCase() === newGroupTitle.toLowerCase())) {
                setError('Eine Gruppe mit diesem Titel existiert bereits.');
                return;
            }
            addLinkAndMaybeGroup({ name, url }, newGroupTitle, newGroupIcon);
        } else {
            if (!selectedGroupTitle) {
                setError('Bitte wählen Sie eine Gruppe aus.');
                return;
            }
            addLinkAndMaybeGroup({ name, url }, selectedGroupTitle);
        }
    }
    onClose();
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

  if (!linkToEdit) return null;

  const headerTitle = isEditMode ? 'Link bearbeiten' 
    : linkToEdit.groupTitle ? `Link zu "${linkToEdit.groupTitle}" hinzufügen` 
    : 'Neuen Link hinzufügen';

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
                 <i className="material-icons text-2xl text-orange-400 mr-3">add_link</i>
                 <h2 className="text-xl font-bold text-neutral-100">{headerTitle}</h2>
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
                <label htmlFor="link-name" className="block text-sm font-medium text-neutral-300 mb-1">Name des Links</label>
                <input
                  id="link-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg py-2 px-3 text-neutral-200 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all duration-200"
                  placeholder="z.B. Google"
                />
              </div>
               <div>
                <label htmlFor="link-url" className="block text-sm font-medium text-neutral-300 mb-1">URL</label>
                <input
                  id="link-url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg py-2 px-3 text-neutral-200 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all duration-200"
                  placeholder="https://www.google.com"
                />
              </div>
              
              {!isEditMode && (
                  <div>
                    <label htmlFor="link-group" className="block text-sm font-medium text-neutral-300 mb-1">Gruppe</label>
                    <select
                        id="link-group"
                        value={selectedGroupTitle}
                        onChange={handleGroupSelect}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg py-2 px-3 text-neutral-200 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    >
                        <option value="" disabled>-- Gruppe auswählen --</option>
                        {toolGroups.map(g => <option key={g.title} value={g.title}>{g.title}</option>)}
                        <option value="__NEW__">-- Neue Gruppe erstellen --</option>
                    </select>
                  </div>
              )}

              {isNewGroup && !isEditMode && (
                  <div className="p-3 bg-neutral-700/50 rounded-lg space-y-3 border border-neutral-600">
                     <h4 className="font-semibold text-neutral-200">Neue Gruppe</h4>
                     <div>
                        <label htmlFor="new-group-title" className="block text-sm font-medium text-neutral-300 mb-1">Titel der Gruppe</label>
                        <input id="new-group-title" type="text" value={newGroupTitle} onChange={e => {setNewGroupTitle(e.target.value); setError('')}} className="w-full bg-neutral-900 border border-neutral-600 rounded-lg py-2 px-3 text-neutral-200 focus:outline-none focus:ring-1 focus:ring-orange-500" />
                     </div>
                     <div>
                        <label htmlFor="new-group-icon" className="block text-sm font-medium text-neutral-300 mb-1">Icon</label>
                        <input id="new-group-icon" type="text" value={newGroupIcon} onChange={e => {setNewGroupIcon(e.target.value); setError('')}} className="w-full bg-neutral-900 border border-neutral-600 rounded-lg py-2 px-3 text-neutral-200 focus:outline-none focus:ring-1 focus:ring-orange-500" placeholder="z.B. 'home' oder 'work'"/>
                        <a href="https://fonts.google.com/icons?selected=Material+Icons" target="_blank" rel="noopener noreferrer" className="text-xs text-orange-400 hover:underline mt-1 block">
                          Verfügbare Icons finden
                        </a>
                     </div>
                  </div>
              )}

              {error && <p className="text-red-400 text-sm">{error}</p>}

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
                    {isEditMode ? 'Speichern' : 'Link hinzufügen'}
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};