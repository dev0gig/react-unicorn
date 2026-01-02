import React, { useState, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { AppProviders } from './src/providers/AppProviders';
import { ContentArea } from './components/ContentArea';
import { Snowfall } from './components/Snowfall';
import { ViewName, ToolLink, ToolGroup, Contact, Template, ScheduleEvent } from './types';
import { useLocalStorage } from './src/hooks/useLocalStorage';
import { initialToolGroups } from './data/initialDashboard';

// Contexts
import { useContacts } from './contexts/ContactsContext';
export { useContacts } from './contexts/ContactsContext';

import { useDashboard } from './contexts/DashboardContext';
export { useDashboard } from './contexts/DashboardContext';
import { useTemplates } from './contexts/TemplatesContext';
export { useTemplates } from './contexts/TemplatesContext';
import { useSignatures } from './contexts/SignaturesContext';
export { useSignatures } from './contexts/SignaturesContext';
import { useSchedule } from './contexts/ScheduleContext';
export { useSchedule } from './contexts/ScheduleContext';
import { useNotes } from './contexts/NotesContext';
export { useNotes } from './contexts/NotesContext';
import { useFavorites } from './contexts/FavoritesContext';
export { useFavorites } from './contexts/FavoritesContext';
import { useModal } from './src/contexts/ModalContext';
import { GlobalModalManager } from './src/components/managers/GlobalModalManager';
import { useDataPersistence } from './src/hooks/useDataPersistence';

function AppContent() {
    const [activeView, setActiveView] = useState<ViewName>('Dashboard');
    const { handleExport, triggerImport, handleFileChange, fileInputRef } = useDataPersistence();

    // Context Hooks
    const { contacts, deleteContact: deleteContactAction, setContacts } = useContacts();

    const { toolGroups, deleteGroup: deleteGroupAction, deleteLink, setToolGroups } = useDashboard();
    const { templateGroups, setTemplateGroups, deleteTemplate: deleteTemplateAction } = useTemplates();
    const { signatures, activeSignatureId, setSignatures, setActiveSignatureId, deleteSignature: deleteSignatureAction } = useSignatures();
    const { schedule, setSchedule, clearSchedule } = useSchedule();
    const { notes, deleteNote: deleteNoteAction, setNotes } = useNotes();
    const { favorites, setFavorites } = useFavorites();
    const { openModal, closeModal } = useModal();

    // States
    const [showSnow, setShowSnow] = useLocalStorage<boolean>('show-snow', false);
    const [dashboardColumnCount, setDashboardColumnCount] = useState(1);
    const [timeTrackerResetTrigger, setTimeTrackerResetTrigger] = useState(0);

    // --- Deletion Logic ---
    const handleConfirmBulkDelete = (categoriesToDelete: any) => {
        if (!categoriesToDelete) return;

        if (categoriesToDelete.dashboard) {
            setToolGroups(initialToolGroups);
        }
        if (categoriesToDelete.favorites) setFavorites([]);

        if (categoriesToDelete.contacts) setContacts([]);
        if (categoriesToDelete.templates) setTemplateGroups([]);
        if (categoriesToDelete.signatures) {
            setSignatures([]);
            setActiveSignatureId(null);
        }
        if (categoriesToDelete.schedule) {
            clearSchedule();
        }
        closeModal();
    };

    const handleDeleteDataRequest = (options: any) => {
        openModal('CONFIRMATION', {
            title: "Daten endgültig löschen",
            onConfirm: () => handleConfirmBulkDelete(options),
            children: <p>Möchten Sie die ausgewählten Daten wirklich endgültig löschen? Diese Aktion kann nicht rückgängig gemacht werden.</p>
        });
    };

    const handleConfirmResetTimeTracker = () => {
        setTimeTrackerResetTrigger(c => c + 1);
        closeModal();
    };

    return (
        <div className="flex h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-neutral-800 via-neutral-900 to-neutral-950 font-['Ubuntu'] text-neutral-200 antialiased overflow-x-hidden">
            {showSnow && <Snowfall />}
            <Sidebar
                activeView={activeView}
                setActiveView={setActiveView}
                onFavoritesClick={() => openModal('FAVORITES')}
                onExportClick={handleExport}
                onImportClick={triggerImport}
                onDeleteClick={() => openModal('DELETE', { onDelete: handleDeleteDataRequest })}
                showSnow={showSnow}
                onToggleSnow={() => setShowSnow(prev => !prev)}
            />
            <main className="flex-1 flex flex-col relative min-w-0 overflow-hidden">
                <ContentArea
                    activeView={activeView}
                    setActiveView={setActiveView}
                    onAddContact={() => openModal('CONTACT')}
                    onEditContact={(contact) => openModal('CONTACT', { contact })}
                    onAddTemplate={() => openModal('TEMPLATE')}
                    onEditTemplate={(template, category) => openModal('TEMPLATE', { templateToEdit: { template, category } })}

                    onOpenSignatureModal={() => openModal('SIGNATURE')}
                    onAddLink={(link, groupId) => openModal('TOOL_LINK', {
                        linkToEdit: {
                            link: link || { name: '', url: '' },
                            groupId: groupId || ''
                        }
                    })}
                    onEditTile={(data) => openModal('TILE_EDIT', { tileToEdit: data })}
                    onAddGroup={() => openModal('TOOL_GROUP', { groupToEdit: null })}
                    onEditGroup={(group) => openModal('TOOL_GROUP', {
                        groupToEdit: group,
                        onDelete: (id) => openModal('CONFIRMATION', {
                            title: 'Eintrag löschen',
                            onConfirm: () => { deleteGroupAction(id); closeModal(); },
                            children: <p>Möchten Sie diesen Eintrag wirklich endgültig löschen? Diese Aktion kann nicht rückgängig gemacht werden.</p>
                        })
                    })}
                    onOpenReorderGroupsModal={() => openModal('REORDER_GROUPS', { columnCount: dashboardColumnCount })}
                    onColumnCountChange={setDashboardColumnCount}
                    onOpenResetTimeTrackerModal={() => openModal('RESET_TIME_TRACKER', {
                        title: "Zeiterfassung zurücksetzen",
                        onConfirm: handleConfirmResetTimeTracker,
                        children: <p>Möchten Sie wirklich alle Felder der Zeiterfassung leeren und zurücksetzen? Diese Aktion kann nicht rückgängig gemacht werden.</p>
                    })}
                    timeTrackerResetTrigger={timeTrackerResetTrigger}

                />
            </main>
            <GlobalModalManager />
            <input type="file" accept=".json" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
        </div>
    );
}

function App() {
    return (
        <AppProviders>
            <AppContent />
        </AppProviders>
    );
}

export default App;