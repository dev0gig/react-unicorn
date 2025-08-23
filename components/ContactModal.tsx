import React, { useState, useEffect } from 'react';
import { useContacts } from '../App';
import type { Contact } from '../types';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: Contact | null;
}

export const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose, contact }) => {
  const { addContact, updateContact } = useContacts();
  const [formData, setFormData] = useState({
      name: '',
      nummer: '',
      adresse: '',
      mail: '',
      notizen: '',
      logoUrl: ''
  });

  const isEditMode = contact !== null;

  useEffect(() => {
    if (isOpen) {
      if (isEditMode) {
        setFormData({
            name: contact.name,
            nummer: contact.nummer,
            adresse: contact.adresse,
            mail: contact.mail,
            notizen: contact.notizen,
            logoUrl: contact.logoUrl || ''
        });
      } else {
        setFormData({ name: '', nummer: '', adresse: '', mail: '', notizen: '', logoUrl: '' });
      }
    }
  }, [isOpen, contact, isEditMode]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
      if (isEditMode) {
        updateContact({ ...formData, id: contact.id });
      } else {
        addContact(formData);
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
                 <i className="material-icons text-2xl text-orange-400 mr-3">person_add</i>
                 <h2 className="text-xl font-bold text-neutral-100">{isEditMode ? 'Kontakt bearbeiten' : 'Neuen Kontakt anlegen'}</h2>
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
                <label htmlFor="contact-name" className="block text-sm font-medium text-neutral-300 mb-1">Name</label>
                <input id="contact-name" type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full bg-neutral-900 border border-neutral-700 rounded-lg py-2 px-3 text-neutral-200 focus:outline-none focus:ring-1 focus:ring-orange-500" placeholder="Name der Firma oder Person" />
              </div>
               <div>
                <label htmlFor="contact-nummer" className="block text-sm font-medium text-neutral-300 mb-1">Telefonnummer</label>
                <input id="contact-nummer" type="text" name="nummer" value={formData.nummer} onChange={handleChange} className="w-full bg-neutral-900 border border-neutral-700 rounded-lg py-2 px-3 text-neutral-200 focus:outline-none focus:ring-1 focus:ring-orange-500" placeholder="Telefonnummer" />
              </div>
              <div>
                <label htmlFor="contact-mail" className="block text-sm font-medium text-neutral-300 mb-1">E-Mail</label>
                <input id="contact-mail" type="email" name="mail" value={formData.mail} onChange={handleChange} className="w-full bg-neutral-900 border border-neutral-700 rounded-lg py-2 px-3 text-neutral-200 focus:outline-none focus:ring-1 focus:ring-orange-500" placeholder="E-Mail Adresse" />
              </div>
              <div>
                <label htmlFor="contact-adresse" className="block text-sm font-medium text-neutral-300 mb-1">Adresse</label>
                <textarea id="contact-adresse" name="adresse" value={formData.adresse} onChange={handleChange} rows={2} className="w-full bg-neutral-900 border border-neutral-700 rounded-lg py-2 px-3 text-neutral-200 focus:outline-none focus:ring-1 focus:ring-orange-500 resize-none custom-scrollbar" placeholder="Adresse" />
              </div>
              <div>
                <label htmlFor="contact-notizen" className="block text-sm font-medium text-neutral-300 mb-1">Notizen</label>
                <textarea id="contact-notizen" name="notizen" value={formData.notizen} onChange={handleChange} rows={3} className="w-full bg-neutral-900 border border-neutral-700 rounded-lg py-2 px-3 text-neutral-200 focus:outline-none focus:ring-1 focus:ring-orange-500 resize-none custom-scrollbar" placeholder="Zusätzliche Notizen" />
              </div>
               <div>
                <label htmlFor="contact-logoUrl" className="block text-sm font-medium text-neutral-300 mb-1">Logo URL</label>
                <input id="contact-logoUrl" type="text" name="logoUrl" value={formData.logoUrl} onChange={handleChange} className="w-full bg-neutral-900 border border-neutral-700 rounded-lg py-2 px-3 text-neutral-200 focus:outline-none focus:ring-1 focus:ring-orange-500" placeholder="URL zum Firmenlogo (optional)" />
              </div>
              <div className="flex justify-end pt-2">
                 <button type="button" onClick={onClose} className="mr-3 py-2 px-4 rounded-lg text-neutral-300 hover:bg-neutral-700 transition-colors">
                    Abbrechen
                 </button>
                 <button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-6 rounded-lg transition-all">
                    {isEditMode ? 'Speichern' : 'Anlegen'}
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};