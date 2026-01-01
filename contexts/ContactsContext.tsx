import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { useLocalStorage } from '../src/hooks/useLocalStorage';
import { initialContacts } from '../data/initialContacts';
import { Contact, ContactsContextType } from '../types';

export const ContactsContext = createContext<ContactsContextType | null>(null);

export const useContacts = () => {
    const context = useContext(ContactsContext);
    if (!context) throw new Error('useContacts must be used within a ContactsProvider');
    return context;
};

export const ContactsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [contacts, setContacts] = useLocalStorage<Contact[]>('contacts', initialContacts);

    const addContact = useCallback((contactData: Omit<Contact, 'id'>) => {
        setContacts(prev => [{ id: Date.now().toString(), ...contactData }, ...prev]);
    }, [setContacts]);

    const updateContact = useCallback((contactData: Contact) => {
        setContacts(prev => prev.map(c => c.id === contactData.id ? contactData : c));
    }, [setContacts]);

    const deleteContact = useCallback((id: string) => {
        setContacts(prev => prev.filter(c => c.id !== id));
    }, [setContacts]);

    const value = useMemo(() => ({
        contacts,
        addContact,
        updateContact,
        deleteContact,
        setContacts
    }), [contacts, addContact, updateContact, deleteContact, setContacts]);

    return (
        <ContactsContext.Provider value={value}>
            {children}
        </ContactsContext.Provider>
    );
};
