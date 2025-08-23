import React, { useState, useEffect } from 'react';
import { useDashboard } from '../App';
import type { ToolLink, ToolGroup } from '../types';

interface TileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  tileToEdit: { link: ToolLink, group: ToolGroup } | null;
}

export const TileEditModal: React.FC<TileEditModalProps> = ({ isOpen, onClose, tileToEdit }) => {
  const { updateLink, updateGroup } = useDashboard();
  
  const [formData, setFormData] = useState({
    linkName: '',
    linkUrl: '',
    groupTitle: '',
    icon: '',
  });

  useEffect(() => {
    if (isOpen && tileToEdit) {
        setFormData({
            linkName: tileToEdit.link.name,
            linkUrl: tileToEdit.link.url,
            groupTitle: tileToEdit.group.title,
            icon: tileToEdit.group.icon,
        });
    }
  }, [isOpen, tileToEdit]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tileToEdit) return;

    const { linkName, linkUrl, groupTitle, icon } = formData;
    if (linkName.trim() && linkUrl.trim() && groupTitle.trim() && icon.trim()) {
        const originalGroupTitle = tileToEdit.group.title;

        const linkChanged = linkName !== tileToEdit.link.name || linkUrl !== tileToEdit.link.url;
        const groupChanged = groupTitle !== tileToEdit.group.title || icon !== tileToEdit.group.icon;

        if (linkChanged) {
            updateLink(originalGroupTitle, tileToEdit.link, { name: linkName, url: linkUrl });
        }
        if (groupChanged) {
            updateGroup(originalGroupTitle, groupTitle, icon);
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
              <p className="text-sm text-neutral-400">Gruppeneigenschaften (wirkt sich auf alle Kacheln in dieser Gruppe aus)</p>
               <div>
                <label htmlFor="tile-group-title" className="block text-sm font-medium text-neutral-300 mb-1">Titel der Gruppe</label>
                <input
                  id="tile-group-title"
                  name="groupTitle"
                  type="text"
                  value={formData.groupTitle}
                  onChange={handleChange}
                  required
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg py-2 px-3 text-neutral-200 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
               <div>
                <label htmlFor="tile-group-icon" className="block text-sm font-medium text-neutral-300 mb-1">Icon der Gruppe</label>
                <input
                  id="tile-group-icon"
                  name="icon"
                  type="text"
                  value={formData.icon}
                  onChange={handleChange}
                  required
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg py-2 px-3 text-neutral-200 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  placeholder="Material Icon Name"
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