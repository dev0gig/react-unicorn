import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { useLocalStorage } from '../src/hooks/useLocalStorage';
import { Signature, SignaturesContextType } from '../types';

const SignaturesContext = createContext<SignaturesContextType | null>(null);

export const useSignatures = () => {
    const context = useContext(SignaturesContext);
    if (!context) throw new Error('useSignatures must be used within a SignaturesProvider');
    return context;
};

export const SignaturesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [signatures, setSignatures] = useLocalStorage<Signature[]>('signatures', []);
    const [activeSignatureId, setActiveSignatureId] = useLocalStorage<string | null>('active-signature-id', null);

    const addSignature = useCallback((title: string, content: string) => {
        setSignatures(prev => [...prev, { id: Date.now().toString(), title, content }]);
    }, [setSignatures]);

    const updateSignature = useCallback((id: string, title: string, content: string) => {
        setSignatures(prev => prev.map(s => s.id === id ? { ...s, title, content } : s));
    }, [setSignatures]);

    const deleteSignature = useCallback((id: string) => {
        setSignatures(prev => prev.filter(s => s.id !== id));
        if (activeSignatureId === id) {
            setActiveSignatureId(null);
        }
    }, [setSignatures, activeSignatureId, setActiveSignatureId]);

    const value = useMemo(() => ({
        signatures,
        activeSignatureId,
        addSignature,
        updateSignature,
        deleteSignature,
        setActiveSignatureId,
        setSignatures
    }), [signatures, activeSignatureId, addSignature, updateSignature, deleteSignature, setActiveSignatureId, setSignatures]);

    return (
        <SignaturesContext.Provider value={value}>
            {children}
        </SignaturesContext.Provider>
    );
};
