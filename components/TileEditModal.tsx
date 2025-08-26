import React, { useState, useEffect } from 'react';
import { useDashboard } from '../App';
import type { ToolLink, ToolGroup } from '../types';

interface TileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  tileToEdit: { link: ToolLink, group: ToolGroup } | null;
}

export const TileEditModal: React.FC<TileEditModalProps> = ({ isOpen, onClose, tileToEdit }) => {
  const { toolGroups, updateLink } = useDashboard();
  
  const [formData, setFormData] = useState({
    linkName: '',
    linkUrl: '',
    groupTitle: '',
  });

  useEffect(() => {
    if (isOpen && tileToEdit) {
        setFormData({
            linkName: tileToEdit.link.name,
            linkUrl: tileToEdit.link.url,
            groupTitle: tileToEdit.group.title,
        });
    }
  }, [isOpen, tileToEdit]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tileToEdit) return;

    const { linkName, linkUrl, groupTitle } = formData;
    if (linkName.trim() && linkUrl.trim() && groupTitle.trim()) {
      const originalGroupTitle = tileToEdit.group.title;
      const newLinkData = { name: linkName, url: linkUrl };

      const groupChanged = groupTitle !== originalGroupTitle;
      
      updateLink(originalGroupTitle, tileToEdit.link, newLinkData, groupChanged ? groupTitle : undefined);
      
      onClose();
    }
  };
  
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
        window.addEventListener('keydown', handleEsc);
    }
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

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
                 <i className="material-icons text-2xl text-orange-400 mr-3">edit</i>
                 <h2 className="text-xl font-bold text-neutral-100">Kachel bearbeiten</h2>
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
                <label htmlFor="tile-link-name" className="block text-sm font-medium text-neutral-300 mb-1">Name der Kachel (Link)</label>
                <input
                  id="tile-link-name"
                  name="linkName"
                  type="text"
                  value={formData.linkName}
                  onChange={handleChange}
                  required
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg py-2 px-3 text-neutral-200 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
              <div>
                <label htmlFor="tile-link-url" className="block text-sm font-medium text-neutral-300 mb-1">URL der Kachel (Link)</label>
                <input
                  id="tile-link-url"
                  name="linkUrl"
                  type="url"
                  value={formData.linkUrl}
                  onChange={handleChange}
                  required
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg py-2 px-3 text-neutral-200 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  placeholder="https://beispiel.de"
                />
              </div>
              
              <hr className="border-neutral-700" />
              
              <div>
                <label htmlFor="tile-group-select" className="block text-sm font-medium text-neutral-300 mb-1">Gruppe</label>
                <select
                  id="tile-group-select"
                  name="groupTitle"
                  value={formData.groupTitle}
                  onChange={handleChange}
                  required
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg py-2 px-3 text-neutral-200 focus:outline-none focus:ring-1 focus:ring-orange-500"
                >
                  {toolGroups.map(group => (
                    <option key={group.title} value={group.title}>{group.title}</option>
                  ))}
                </select>
                <p className="text-xs text-neutral-500 mt-1.5">Ändern Sie die Gruppe, um diese Kachel zu verschieben.</p>
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
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-6 rounded-lg transition-all"
                 >
                    Speichern
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};