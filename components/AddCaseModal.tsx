import React, { useState, useEffect } from 'react';
import { useEvidenz } from '../App';
import type { Evidenzfall } from '../types';

interface AddCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseToEdit: Evidenzfall | null;
}

export const AddCaseModal: React.FC<AddCaseModalProps> = ({ isOpen, onClose, caseToEdit }) => {
  const { addCase, updateCase } = useEvidenz();
  const [gpvk, setGpvk] = useState('');
  const [telefonnummer, setTelefonnummer] = useState('');
  const [description, setDescription] = useState('');
  
  const isEditMode = caseToEdit !== null;

  useEffect(() => {
    if (isOpen) {
      if (isEditMode) {
        setGpvk(caseToEdit.gpvk);
        setTelefonnummer(caseToEdit.telefonnummer);
        setDescription(caseToEdit.description);
      } else {
        setGpvk('');
        setTelefonnummer('');
        setDescription('');
      }
    }
  }, [isOpen, caseToEdit, isEditMode]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (gpvk.trim()) {
       if (isEditMode) {
          updateCase(caseToEdit.id, { gpvk, telefonnummer, description });
       } else {
          addCase(gpvk, telefonnummer, description);
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
                 <i className="material-icons text-2xl text-orange-400 mr-3">gavel</i>
                 <h2 className="text-xl font-bold text-neutral-100">{isEditMode ? 'Evidenzfall bearbeiten' : 'Neuen Evidenzfall anlegen'}</h2>
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
                <label htmlFor="case-gpvk" className="block text-sm font-medium text-neutral-300 mb-1">GP / VK Nr.</label>
                <input
                  id="case-gpvk"
                  type="text"
                  value={gpvk}
                  onChange={(e) => setGpvk(e.target.value)}
                  required
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg py-2 px-3 text-neutral-200 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all duration-200"
                  placeholder="Geschäftspartner- oder Vertragskontonummer"
                />
              </div>
               <div>
                <label htmlFor="case-telefonnummer" className="block text-sm font-medium text-neutral-300 mb-1">Telefonnummer</label>
                <input
                  id="case-telefonnummer"
                  type="text"
                  value={telefonnummer}
                  onChange={(e) => setTelefonnummer(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg py-2 px-3 text-neutral-200 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all duration-200"
                  placeholder="Telefonnummer (optional)"
                />
              </div>
              <div>
                <label htmlFor="case-description" className="block text-sm font-medium text-neutral-300 mb-1">Beschreibung</label>
                <textarea
                  id="case-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg py-2 px-3 text-neutral-200 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all duration-200 resize-none custom-scrollbar"
                  placeholder="Kurze Beschreibung des Falls..."
                />
                <p className="text-xs text-neutral-500 mt-1.5">Markdown wird unterstützt. Für Hervorhebungen `==Text==` verwenden.</p>
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
                    {isEditMode ? 'Speichern' : 'Fall anlegen'}
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};