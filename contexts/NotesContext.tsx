import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { useLocalStorage } from '../src/hooks/useLocalStorage';
import { Note, NotesContextType } from '../types';
import { initialNotes } from '../data/initialNotes';

const NotesContext = createContext<NotesContextType | null>(null);

export const useNotes = () => {
    const context = useContext(NotesContext);
    if (!context) throw new Error('useNotes must be used within a NotesProvider');
    return context;
};

export const NotesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [notes, setNotes] = useLocalStorage<Note[]>('notes', initialNotes);

    const addNote = useCallback((content: string, date?: number) => {
        setNotes(prev => [{ id: Date.now().toString(), content, lastModified: Date.now(), createdAt: date || Date.now() }, ...prev]);
    }, [setNotes]);

    const updateNote = useCallback((id: string, content: string) => {
        setNotes(prev => prev.map(n => n.id === id ? { ...n, content, lastModified: Date.now() } : n));
    }, [setNotes]);

    const deleteNote = useCallback((id: string) => {
        setNotes(prev => prev.filter(n => n.id !== id));
    }, [setNotes]);

    const value = useMemo(() => ({
        notes,
        addNote,
        updateNote,
        deleteNote,
        setNotes
    }), [notes, addNote, updateNote, deleteNote, setNotes]);

    return (
        <NotesContext.Provider value={value}>
            {children}
        </NotesContext.Provider>
    );
};
