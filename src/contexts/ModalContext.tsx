import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

export type ModalType =
    | 'FAVORITES'
    | 'CONTACT'
    | 'TEMPLATE'
    | 'SIGNATURE'
    | 'DELETE'
    | 'TOOL_LINK'
    | 'TILE_EDIT'
    | 'TOOL_GROUP'
    | 'REORDER_GROUPS'
    | 'INFO'
    | 'CONFIRMATION'
    | 'IMPORT_CONFIRMATION'
    | 'RESET_TIME_TRACKER';

export interface ModalContextType {
    activeModal: ModalType | null;
    modalProps: any;
    openModal: (type: ModalType, props?: any) => void;
    closeModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error('useModal must be used within a ModalProvider');
    }
    return context;
};

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [activeModal, setActiveModal] = useState<ModalType | null>(null);
    const [modalProps, setModalProps] = useState<any>({});

    const openModal = useCallback((type: ModalType, props: any = {}) => {
        setActiveModal(type);
        setModalProps(props);
    }, []);

    const closeModal = useCallback(() => {
        setActiveModal(null);
        setModalProps({});
    }, []);

    return (
        <ModalContext.Provider value={{ activeModal, modalProps, openModal, closeModal }}>
            {children}
        </ModalContext.Provider>
    );
};
