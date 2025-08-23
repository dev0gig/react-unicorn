import React, { useState, useEffect } from 'react';
import { useSignatures } from '../App';
import type { Signature } from '../types';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SignatureModal: React.FC<SignatureModalProps> = ({ isOpen, onClose }) => {
  const { signatures, addSignature, updateSignature, deleteSignature } = useSignatures();
  
  const [editingSignature, setEditingSignature] = useState<Signature | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

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

  useEffect(() => {
    if (!isOpen) {
        // Reset form when modal is closed
        setEditingSignature(null);
        setTitle('');
        setContent('');
    }
  }, [isOpen]);

  const handleEdit = (signature: Signature) => {
    setEditingSignature(signature);
    setTitle(signature.title);
    setContent(signature.content);
    document.getElementById('sig-title')?.focus();
  };

  const handleCancelEdit = () => {
    setEditingSignature(null);
    setTitle('');
    setContent('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && content.trim()) {
      if (editingSignature) {
        updateSignature(editingSignature.id, title, content);
      } else {
        addSignature(title, content);
      }
      handleCancelEdit();
    }
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <div
            className="bg-neutral-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col border border-neutral-700"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-center justify-between p-4 border-b border-neutral-700 flex-shrink-0">
              <div className="flex items-center">
                 <i className="material-icons text-2xl text-orange-400 mr-3">edit_note</i>
                 <h2 className="text-xl font-bold text-neutral-100">Signaturen verwalten</h2>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-full text-neutral-400 hover:bg-neutral-700 hover:text-white transition-colors"
                aria-label="Schließen"
              >
                <i className="material-icons">close</i>
              </button>
            </header>

            <div className="flex-1 p-6 flex flex-col gap-6 min-h-0">
                {/* Form Section */}
                <div className="flex flex-col">
                     <h3 className="text-lg font-semibold mb-3 text-neutral-200">{editingSignature ? 'Signatur bearbeiten' : 'Neue Signatur erstellen'}</h3>
                     <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
                        <div>
                            <label htmlFor="sig-title" className="block text-sm font-medium text-neutral-300 mb-1">Titel</label>
                            <input
                                id="sig-title"
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg py-2 px-3 text-neutral-200 focus:outline-none focus:ring-1 focus:ring-orange-500"
                                placeholder="z.B. Standard Signatur"
                            />
                        </div>
                        <div>
                            <label htmlFor="sig-content" className="block text-sm font-medium text-neutral-300 mb-1">Inhalt</label>
                            <textarea
                                id="sig-content"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                required
                                rows={6}
                                className="w-full flex-1 bg-neutral-900 border border-neutral-700 rounded-lg py-2 px-3 text-neutral-200 focus:outline-none focus:ring-1 focus:ring-orange-500 resize-y custom-scrollbar"
                                placeholder="Fügen Sie hier Ihre vollständige Signatur ein..."
                            />
                        </div>
                        <div className="flex justify-end items-center gap-3">
                           {editingSignature && (
                               <button type="button" onClick={handleCancelEdit} className="py-2 px-4 rounded-lg text-neutral-300 hover:bg-neutral-700 transition-colors">
                                  Abbrechen
                               </button>
                           )}
                           <button
                                type="submit"
                                className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-6 rounded-lg transition-all flex items-center gap-2"
                           >
                               <i className="material-icons">{editingSignature ? 'save' : 'add'}</i>
                               <span>{editingSignature ? 'Speichern' : 'Hinzufügen'}</span>
                           </button>
                        </div>
                    </form>
                </div>

                {/* List Section */}
                <div className="flex flex-col min-h-0">
                    <h3 className="text-lg font-semibold mb-3 text-neutral-200">Gespeicherte Signaturen</h3>
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 -mr-2 border-t border-neutral-700 pt-4">
                        {signatures.length > 0 ? (
                        <ul className="space-y-2">
                            {signatures.map((sig) => (
                            <li
                                key={sig.id}
                                className={`group flex items-center justify-between p-3 rounded-lg transition-colors ${editingSignature?.id === sig.id ? 'bg-orange-500/20' : 'bg-neutral-900/50 hover:bg-neutral-700/50'}`}
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="text-neutral-200 truncate font-medium">{sig.title}</p>
                                    <p className="text-neutral-400 text-sm truncate">{sig.content.split('\n')[0] || sig.content}</p>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0 ml-4">
                                    <button
                                        onClick={() => handleEdit(sig)}
                                        className="p-1 rounded-full text-neutral-400 hover:text-orange-400 hover:bg-neutral-600 transition-colors"
                                        aria-label="Signatur bearbeiten"
                                    >
                                        <i className="material-icons text-lg">edit</i>
                                    </button>
                                    <button
                                        onClick={() => deleteSignature(sig.id)}
                                        className="p-1 rounded-full text-neutral-400 hover:text-red-400 hover:bg-red-500/20 transition-colors"
                                        aria-label="Signatur löschen"
                                    >
                                        <i className="material-icons text-lg">delete</i>
                                    </button>
                                </div>
                            </li>
                            ))}
                        </ul>
                        ) : (
                        <div className="text-center py-10 px-4 text-neutral-500 h-full flex flex-col items-center justify-center">
                            <i className="material-icons text-5xl mb-3">note_add</i>
                            <h3 className="text-lg font-semibold">Keine Signaturen</h3>
                            <p>Fügen Sie oben eine neue Signatur hinzu.</p>
                        </div>
                        )}
                    </div>
                </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};