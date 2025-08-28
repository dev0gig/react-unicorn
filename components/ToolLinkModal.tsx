import React, { useState, useEffect } from 'react';
import { useDashboard } from '../App';
import type { ToolLink } from '../types';

interface ToolLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  linkToEdit: { link: ToolLink, groupId: string } | null;
}

export const ToolLinkModal: React.FC<ToolLinkModalProps> = ({ isOpen, onClose, linkToEdit }) => {
  const { toolGroups, addLink } = useDashboard();
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  
  useEffect(() => {
    if (isOpen) {
        setError('');
        setName('');
        setUrl('');
    }
  }, [isOpen]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim() || !linkToEdit?.groupId) {
        return;
    };

    try {
        new URL(url);
    } catch (_) {
        setError('Bitte geben Sie eine gültige URL ein.');
        return;
    }
    
    addLink(linkToEdit.groupId, { name: name.trim(), url: url.trim() });
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
  
  const currentGroupTitle = toolGroups.find(g => g.id === linkToEdit.groupId)?.title;

  const headerTitle = currentGroupTitle ? `Link zu "${currentGroupTitle}" hinzufügen` 
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
                    Link hinzufügen
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};