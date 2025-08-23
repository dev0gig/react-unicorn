import React, { useState, useEffect } from 'react';
import { useTemplates } from '../App';
import type { Template } from '../types';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateToEdit: { template: Template, category: string } | null;
}

export const TemplateModal: React.FC<TemplateModalProps> = ({ isOpen, onClose, templateToEdit }) => {
  const { addTemplate, updateTemplate, getCategories } = useTemplates();
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const isEditMode = templateToEdit !== null;
  const existingCategories = getCategories();

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && templateToEdit) {
        setCategory(templateToEdit.category);
        setTitle(templateToEdit.template.title);
        setContent(templateToEdit.template.content);
      } else {
        setCategory('');
        setTitle('');
        setContent('');
      }
    }
  }, [isOpen, templateToEdit, isEditMode]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (category.trim() && title.trim() && content.trim()) {
      if (isEditMode && templateToEdit) {
        updateTemplate(templateToEdit.category, { title, content }, templateToEdit.template.id);
      } else {
        addTemplate(category, title, content);
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
            className="bg-neutral-800 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col border border-neutral-700"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-center justify-between p-4 border-b border-neutral-700 flex-shrink-0">
              <div className="flex items-center">
                 <i className="material-icons text-2xl text-orange-400 mr-3">post_add</i>
                 <h2 className="text-xl font-bold text-neutral-100">{isEditMode ? 'Vorlage bearbeiten' : 'Neue Vorlage erstellen'}</h2>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-full text-neutral-400 hover:bg-neutral-700 hover:text-white transition-colors"
                aria-label="Schließen"
              >
                <i className="material-icons">close</i>
              </button>
            </header>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div>
                <label htmlFor="template-category" className="block text-sm font-medium text-neutral-300 mb-1">Kategorie</label>
                <input id="template-category" type="text" list="categories" value={category} onChange={(e) => setCategory(e.target.value)} required readOnly={isEditMode} className="w-full bg-neutral-900 border border-neutral-700 rounded-lg py-2 px-3 text-neutral-200 focus:outline-none focus:ring-1 focus:ring-orange-500 read-only:bg-neutral-800 read-only:cursor-not-allowed" placeholder="Bestehende auswählen oder neue eingeben" />
                 <datalist id="categories">
                    {existingCategories.map(cat => <option key={cat} value={cat} />)}
                 </datalist>
              </div>
               <div>
                <label htmlFor="template-title" className="block text-sm font-medium text-neutral-300 mb-1">Titel</label>
                <input id="template-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full bg-neutral-900 border border-neutral-700 rounded-lg py-2 px-3 text-neutral-200 focus:outline-none focus:ring-1 focus:ring-orange-500" placeholder="Titel der Vorlage" />
              </div>
              <div>
                <label htmlFor="template-content" className="block text-sm font-medium text-neutral-300 mb-1">Inhalt</label>
                <textarea id="template-content" value={content} onChange={(e) => setContent(e.target.value)} required rows={10} className="w-full bg-neutral-900 border border-neutral-700 rounded-lg py-2 px-3 text-neutral-200 focus:outline-none focus:ring-1 focus:ring-orange-500 resize-y custom-scrollbar" placeholder="Inhalt der Mail-Vorlage..." />
              </div>
              <div className="flex justify-end pt-2">
                 <button type="button" onClick={onClose} className="mr-3 py-2 px-4 rounded-lg text-neutral-300 hover:bg-neutral-700 transition-colors">
                    Abbrechen
                 </button>
                 <button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-6 rounded-lg transition-all">
                    {isEditMode ? 'Speichern' : 'Erstellen'}
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};