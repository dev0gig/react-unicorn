import React from 'react';
import { useModal } from '../../contexts/ModalContext';

// Import all Modal components
// Assuming components are in the root components directory, relative to src/components/managers is ../../../components

import { FavoritesModal } from '../../../components/FavoritesModal';
import { ConfirmationModal } from '../../../components/ConfirmationModal';
import { ContactModal } from '../../../components/ContactModal';
import { TemplateModal } from '../../../components/TemplateModal';
import { SignatureModal } from '../../../components/SignatureModal';
import { DeleteModal } from '../../../components/DeleteModal';
import { ToolLinkModal } from '../../../components/ToolLinkModal';
import { TileEditModal } from '../../../components/TileEditModal';
import { ToolGroupModal } from '../../../components/ToolGroupModal';
import { InfoModal } from '../../../components/InfoModal';
import { ReorderGroupsModal } from '../../../components/ReorderGroupsModal';

export const GlobalModalManager: React.FC = () => {
    const { activeModal, modalProps, closeModal } = useModal();

    if (!activeModal) return null;

    const commonProps = {
        isOpen: true,
        onClose: closeModal,
        ...modalProps
    };

    switch (activeModal) {

        case 'FAVORITES':
            return <FavoritesModal {...commonProps} />;
        case 'CONTACT':
            return <ContactModal {...commonProps} />;
        case 'TEMPLATE':
            return <TemplateModal {...commonProps} />;
        case 'SIGNATURE':
            return <SignatureModal {...commonProps} />;
        case 'DELETE':
            return <DeleteModal {...commonProps} />;
        case 'TOOL_LINK':
            return <ToolLinkModal {...commonProps} />;
        case 'TILE_EDIT':
            return <TileEditModal {...commonProps} />;
        case 'TOOL_GROUP':
            return <ToolGroupModal {...commonProps} />;
        case 'REORDER_GROUPS':
            return <ReorderGroupsModal {...commonProps} />;
        case 'INFO':
            return <InfoModal {...commonProps} />;
        case 'CONFIRMATION':
            return <ConfirmationModal {...commonProps} />;
        // These share the ConfirmationModal but might have distinct behaviors in logic, handled via props
        case 'IMPORT_CONFIRMATION':
        case 'RESET_TIME_TRACKER':
            return <ConfirmationModal {...commonProps} />;
        default:
            return null;
    }
};
