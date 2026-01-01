import React, { createContext, useContext, useCallback, useMemo, useState } from 'react';
import { useLocalStorage } from '../src/hooks/useLocalStorage';
import { Evidenzfall, EvidenzContextType } from '../types';

export const EvidenzContext = createContext<EvidenzContextType | null>(null);

export const useEvidenz = () => {
    const context = useContext(EvidenzContext);
    if (!context) throw new Error('useEvidenz must be used within a EvidenzProvider');
    return context;
}

export const EvidenzProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [faelle, setFaelle] = useLocalStorage<Evidenzfall[]>('faelle', []);
    const [archivedFaelle, setArchivedFaelle] = useLocalStorage<Evidenzfall[]>('archived-faelle', []);

    const addCase = useCallback((gpvk: string, telefonnummer: string, description: string) => {
        setFaelle(current => [{ id: Date.now().toString(), gpvk, telefonnummer, description, column: 'neu' }, ...current]);
    }, [setFaelle]);

    const updateCases = useCallback((updatedCases: Evidenzfall[]) => {
        setFaelle(updatedCases);
    }, [setFaelle]);

    const updateCase = useCallback((id: string, data: { gpvk: string, telefonnummer: string, description: string }) => {
        setFaelle(prev => prev.map(f => f.id === id ? { ...f, ...data } : f));
    }, [setFaelle]);

    const archiveCase = useCallback((id: string) => {
        setFaelle(currentFaelle => {
            const fallToArchive = currentFaelle.find(f => f.id === id);
            if (fallToArchive) setArchivedFaelle(currentArchived => [...currentArchived, fallToArchive]);
            return currentFaelle.filter(f => f.id !== id);
        });
    }, [setFaelle, setArchivedFaelle]);

    const restoreCase = useCallback((id: string) => {
        setArchivedFaelle(currentArchived => {
            const fallToRestore = currentArchived.find(f => f.id === id);
            if (fallToRestore) setFaelle(currentFaelle => [{ ...fallToRestore, column: 'neu' }, ...currentFaelle]);
            return currentArchived.filter(f => f.id !== id);
        });
    }, [setArchivedFaelle, setFaelle]);

    const deleteCasePermanently = useCallback((id: string) => {
        // This function was originally just setting an item to delete in App.tsx.
        // However, the interface implies it should delete it. 
        // But looking at App.tsx, `deleteCasePermanently` set `itemToDelete`.
        // The actual deletion happened in `handleConfirmDelete`.
        // The requirement says "Verschiebe alle zugehörigen Funktionen ... in diesen Provider".
        // If I move the logic here, I need to handle the deletion logic.
        // But `deleteCasePermanently` in `App.tsx` (line 370) calls `setItemToDelete`.
        // The user probably wants the logic that MODIFIES the state to be here.
        // `handleConfirmDelete` in `App.tsx` (line 538) does: `setArchivedFaelle(prev => prev.filter(f => f.id !== itemToDelete.id));`
        // Wait, `deleteCasePermanently` in App.tsx (line 370) was passed to `EvidenzContext`. 
        // And `handleConfirmDelete` used `setArchivedFaelle` directly.

        // Let's implement the direct deletion here for the provider method, 
        // assuming the confirm modal logic might stay in App or be adapted.
        // Re-reading `App.tsx` logic:
        // Case 1: `deleteCasePermanently` (line 370) -> `setItemToDelete`.
        // Case 2: `handleConfirmDelete` (line 520) switch `evidenzfall` -> `setArchivedFaelle(...)`.

        // The requested refactor is to move functions.
        // If I move `deleteCasePermanently`, it should probably perform the action.
        // But if the UI relies on a confirmation modal that is local to App.tsx...
        // The ConfirmationModal is in App.tsx.

        // However, `ContactsContext` has `deleteContact` which directly updates state:
        // `const deleteContact = useCallback((id: string) => { setContacts(prev => prev.filter(c => c.id !== id)); }, [setContacts]);`

        // In App.tsx line 108: `const { contacts, deleteContact: deleteContactAction, setContacts } = useContacts();`
        // And line 525: `deleteContactAction(itemToDelete.id);`

        // So keeping the pattern:
        // `deleteCasePermanently` in the Provider should physically delete the item.
        // `App.tsx` will still handle the modal, and call this function when confirmed.

        setArchivedFaelle(prev => prev.filter(f => f.id !== id));
    }, [setArchivedFaelle]);

    const clearArchivedCases = useCallback(() => {
        setArchivedFaelle([]);
    }, [setArchivedFaelle]);

    const value = useMemo(() => ({
        faelle,
        archivedFaelle,
        addCase,
        updateCases,
        updateCase,
        archiveCase,
        restoreCase,
        deleteCasePermanently,
        clearArchivedCases,
        setFaelle,
        setArchivedFaelle
    }), [faelle, archivedFaelle, addCase, updateCases, updateCase, archiveCase, restoreCase, deleteCasePermanently, clearArchivedCases, setFaelle, setArchivedFaelle]);

    return (
        <EvidenzContext.Provider value={value}>
            {children}
        </EvidenzContext.Provider>
    );
};
