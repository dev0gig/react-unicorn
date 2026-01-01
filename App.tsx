import React, { useState, useEffect, createContext, useContext, useCallback, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { Sidebar } from './components/Sidebar';
import { ContentArea } from './components/ContentArea';
import { Snowfall } from './components/Snowfall';
import { ViewName, FavoritesContextType, EvidenzContextType, TemplatesContextType, Template, SignaturesContextType, DashboardContextType, ScheduleContextType, ScheduleEvent, NotesContextType } from './types';
import { ToolLink, ToolGroup, Evidenzfall, Contact, TemplateGroup, Signature, Note } from './types';
import { useLocalStorage } from './src/hooks/useLocalStorage';
import { loadFromStorage, saveToStorage } from './utils/storage';
import { AddCaseModal } from './components/AddCaseModal';
import { FavoritesModal } from './components/FavoritesModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { ContactModal } from './components/ContactModal';
import { TemplateModal } from './components/TemplateModal';
import { SignatureModal } from './components/SignatureModal';
import { DeleteModal } from './components/DeleteModal';
import { ToolLinkModal } from './components/ToolLinkModal';
import { TileEditModal } from './components/TileEditModal';
import { ToolGroupModal } from './components/ToolGroupModal';
import { DashboardHelpModal } from './components/DashboardHelpModal';
import { InfoModal } from './components/InfoModal';
import { ReorderGroupsModal } from './components/ReorderGroupsModal';

// Contexts
import { ContactsProvider, useContacts } from './contexts/ContactsContext';
export { useContacts } from './contexts/ContactsContext';
import { EvidenzProvider, useEvidenz } from './contexts/EvidenzContext';
export { useEvidenz } from './contexts/EvidenzContext';
import { DashboardProvider, useDashboard } from './contexts/DashboardContext';
export { useDashboard } from './contexts/DashboardContext';
import { TemplatesProvider, useTemplates } from './contexts/TemplatesContext';
export { useTemplates } from './contexts/TemplatesContext';
import { SignaturesProvider, useSignatures } from './contexts/SignaturesContext';
export { useSignatures } from './contexts/SignaturesContext';
import { ScheduleProvider, useSchedule } from './contexts/ScheduleContext';
export { useSchedule } from './contexts/ScheduleContext';
import { NotesProvider, useNotes } from './contexts/NotesContext';
export { useNotes } from './contexts/NotesContext';
import { FavoritesProvider, useFavorites } from './contexts/FavoritesContext';
export { useFavorites } from './contexts/FavoritesContext';

// Initial Data
// initialTemplateGroups removed (moved to context)
// initialToolGroups removed (logic moved to context)
// initialNotes removed (moved to context)

// Contexts
export const FavoritesContext = createContext<FavoritesContextType | null>(null);
// EvidenzContext removed (now imported)
// ContactsContext removed (now imported)
// TemplatesContext removed (now imported)
// SignaturesContext removed (now imported)
// DashboardContext removed (now imported)
// ScheduleContext removed (now imported)
// NotesContext removed (now imported)

import { initialToolGroups } from './data/initialDashboard';


// Hooks
// useFavorites exported from module via re-export

// useEvidenz exported from module via re-export

// useContacts exported from module via re-export

// useTemplates exported from module via re-export
// useSignatures exported from module via re-export

// useDashboard exported from module via re-export

// useSchedule exported from module via re-export
// useNotes exported from module via re-export


function AppContent() {
    const [activeView, setActiveView] = useState<ViewName>('Dashboard');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Context Hooks
    const { contacts, deleteContact: deleteContactAction, setContacts } = useContacts();
    const { faelle, archivedFaelle, setFaelle, setArchivedFaelle, deleteCasePermanently, clearArchivedCases } = useEvidenz();
    const { toolGroups, deleteGroup: deleteGroupAction, deleteLink, setToolGroups } = useDashboard();
    const { templateGroups, setTemplateGroups, deleteTemplate: deleteTemplateAction } = useTemplates();
    const { signatures, activeSignatureId, setSignatures, setActiveSignatureId, deleteSignature: deleteSignatureAction } = useSignatures();
    const { schedule, importSchedule, clearSchedule, setSchedule } = useSchedule();
    const { notes, addNote, updateNote, deleteNote: deleteNoteAction, setNotes } = useNotes();
    const { favorites, addFavorite, removeFavorite, isFavorite, setFavorites } = useFavorites();

    // States
    const [showSnow, setShowSnow] = useLocalStorage<boolean>('show-snow', false);
    // toolGroups state removed
    // Contacts state removed
    // Templates state removed
    // Signatures state removed
    // Schedule state removed
    // Notes state removed


    // Modal States
    const [isAddCaseModalOpen, setIsAddCaseModalOpen] = useState(false);
    const [caseToEdit, setCaseToEdit] = useState<Evidenzfall | null>(null);
    const [isFavoritesModalOpen, setIsFavoritesModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isImportConfirmOpen, setIsImportConfirmOpen] = useState(false);
    const [dataToImport, setDataToImport] = useState<any>(null);
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const [contactToEdit, setContactToEdit] = useState<Contact | null>(null);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [templateToEdit, setTemplateToEdit] = useState<{ template: Template, category: string } | null>(null);
    const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<any | null>(null);
    const [categoriesToDelete, setCategoriesToDelete] = useState<any>(null);
    const [isToolLinkModalOpen, setToolLinkModalOpen] = useState(false);
    const [linkToEdit, setLinkToEdit] = useState<{ link: ToolLink, groupId: string } | null>(null);
    const [tileToEdit, setTileToEdit] = useState<{ link: ToolLink; group: ToolGroup } | null>(null);
    const [isDashboardHelpModalOpen, setIsDashboardHelpModalOpen] = useState(false);
    const [isToolGroupModalOpen, setIsToolGroupModalOpen] = useState(false);
    const [groupToEdit, setGroupToEdit] = useState<ToolGroup | null>(null);
    const [infoModal, setInfoModal] = useState<{ isOpen: boolean; title: string; message: string; isError?: boolean } | null>(null);
    const [isResetTimeTrackerConfirmOpen, setIsResetTimeTrackerConfirmOpen] = useState(false);
    const [timeTrackerResetTrigger, setTimeTrackerResetTrigger] = useState(0);
    const [isReorderGroupsModalOpen, setIsReorderGroupsModalOpen] = useState(false);
    const [dashboardColumnCount, setDashboardColumnCount] = useState(1);
    const [isClearArchiveConfirmOpen, setIsClearArchiveConfirmOpen] = useState(false);


    // Effects for localStorage persistence
    // All persistence moved to Contexts


    // --- Context Values & Functions ---

    // Schedule
    // Schedule logic removed, using useSchedule hook

    // Dashboard logic moved to DashboardContext

    // Favorites logic removed, using useFavorites hook

    // Evidenz logic removed, using useEvidenz hook

    // Contacts logic removed, using useContacts hook

    // Templates logic removed, using useTemplates hook

    // Signatures logic removed, using useSignatures hook

    // Notes logic removed, using useNotes hook

    // --- Backup & Restore Logic ---
    const handleExport = () => {
        const exportData: any = {
            metadata: { appName: 'Unicorn Backup', exportDate: new Date().toISOString() },
            data: {
                toolGroups,
                favorites,
                faelle,
                archivedFaelle,
                contacts,
                templateGroups,
                signatures,
                activeSignatureId,
                notes, // Auto-export notes
                schedule // Auto-export schedule
            }
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `unicorn-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const triggerImport = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text === 'string') {
                    const parsedData = JSON.parse(text);
                    if (parsedData?.metadata?.appName === 'Unicorn Backup' && parsedData.data) {
                        setDataToImport(parsedData.data);
                        setIsImportConfirmOpen(true);
                    } else {
                        alert('Dies ist keine gültige Unicorn-Backup-Datei.');
                    }
                }
            } catch (error) {
                alert('Fehler beim Lesen der Backup-Datei.');
                console.error("Import failed:", error);
            }
        };
        reader.readAsText(file);
        if (event.target) event.target.value = '';
    };

    const confirmImport = () => {
        if (!dataToImport) return;

        if (dataToImport.toolGroups) {
            let importedGroups: any[] = dataToImport.toolGroups;
            // Migration for imported groups to add IDs and colors (Need to access colors or duplicate logic?)
            // We moved GROUP_COLORS to DashboardContext, so we cannot access it here directly without exporting it or moving constants.
            // For now, let's just assume we can't easily re-color without the constant.
            // Wait, we can export GROUP_COLORS from DashboardContext.tsx or types.ts?
            // User requested "Move functions... export hook".
            // I should have exported GROUP_COLORS or kept it in a shared file.
            // For now, let's assume we proceed with the migration logic as best effort or fix import in Context?
            // Actually, we can just define a fallback constant here or move constants.
            // But let's look at what we can do.
            // I will define the colors here again or change the architecture.
            // Simplest: Define colors here for migration.
            const GROUP_COLORS_LOCAL = [
                '#4c0519', '#431407', '#022c22', '#082f49', '#1e1b4b',
                '#3b0764', '#1e293b', '#042f2e', '#422006', '#500724',
            ];

            const newToolGroups = importedGroups.map((group, index) => ({
                ...group,
                id: group.id || `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                color: GROUP_COLORS_LOCAL[index % GROUP_COLORS_LOCAL.length]
            }));
            setToolGroups(newToolGroups);
        }
        if (dataToImport.favorites) setFavorites(dataToImport.favorites);
        if (dataToImport.faelle) setFaelle(dataToImport.faelle);
        if (dataToImport.archivedFaelle) setArchivedFaelle(dataToImport.archivedFaelle);
        if (dataToImport.contacts) setContacts(dataToImport.contacts);
        if (dataToImport.templateGroups) setTemplateGroups(dataToImport.templateGroups);
        if (dataToImport.signatures) setSignatures(dataToImport.signatures);
        if (dataToImport.activeSignatureId) setActiveSignatureId(dataToImport.activeSignatureId);
        if (dataToImport.notes) setNotes(dataToImport.notes);
        if (dataToImport.schedule) {
            // Restore Dates for schedule
            const restoredSchedule: Record<string, ScheduleEvent[]> = {};
            Object.keys(dataToImport.schedule).forEach(dateKey => {
                restoredSchedule[dateKey] = dataToImport.schedule[dateKey].map((event: any) => ({
                    ...event,
                    dtstart: new Date(event.dtstart),
                    dtend: new Date(event.dtend),
                }));
            });
            setSchedule(restoredSchedule);
        }

        setDataToImport(null);
        setIsImportConfirmOpen(false);
    }

    // --- Deletion Logic ---
    const handleConfirmDelete = () => {
        if (!itemToDelete) return;

        switch (itemToDelete.type) {
            case 'contact':
                deleteContactAction(itemToDelete.id);
                break;
            case 'template':
                if (itemToDelete.category) {
                    deleteTemplateAction(itemToDelete.category, itemToDelete.id);
                }
                break;
            case 'evidenzfall':
                deleteCasePermanently(itemToDelete.id);
                break;
            case 'signature':
                deleteSignatureAction(itemToDelete.id);
                break;
            case 'toolGroup':
                deleteGroupAction(itemToDelete.id);
                break;
            case 'toolLink':
                deleteLink(itemToDelete.groupId, itemToDelete.url);
                break;
            case 'note':
                deleteNoteAction(itemToDelete.id);
                break;
        }
        setItemToDelete(null);
    };

    const handleDeleteDataRequest = (options: any) => {
        setCategoriesToDelete(options);
        setIsDeleteModalOpen(false); // Close the selection modal
    };

    const handleConfirmBulkDelete = () => {
        if (!categoriesToDelete) return;

        if (categoriesToDelete.dashboard) {
            setToolGroups(initialToolGroups);
        }
        if (categoriesToDelete.favorites) setFavorites([]);
        if (categoriesToDelete.faelle) {
            setFaelle([]);
            setArchivedFaelle([]);
        }
        if (categoriesToDelete.contacts) setContacts([]);
        if (categoriesToDelete.templates) setTemplateGroups([]);
        if (categoriesToDelete.signatures) {
            setSignatures([]);
            setActiveSignatureId(null);
        }
        if (categoriesToDelete.schedule) {
            clearSchedule();
        }

        setCategoriesToDelete(null);
    };

    const handleConfirmResetTimeTracker = () => {
        setTimeTrackerResetTrigger(c => c + 1);
        setIsResetTimeTrackerConfirmOpen(false);
    };


    // --- Modal Openers ---
    const openCaseModal = (fall: Evidenzfall | null = null) => {
        setCaseToEdit(fall);
        setIsAddCaseModalOpen(true);
    };
    const openContactModal = (contact: Contact | null = null) => {
        setContactToEdit(contact);
        setIsContactModalOpen(true);
    };
    const openTemplateModal = (template: Template | null = null, category: string | null = null) => {
        setTemplateToEdit(template && category ? { template, category } : null);
        setIsTemplateModalOpen(true);
    };
    const openToolLinkModal = (link: ToolLink | null, groupId?: string) => {
        setLinkToEdit({
            link: link || { name: '', url: '' },
            groupId: groupId || ''
        });
        setToolLinkModalOpen(true);
    };
    const openTileEditModal = (data: { link: ToolLink; group: ToolGroup }) => {
        setTileToEdit(data);
    };
    const openGroupModal = (group: ToolGroup | null = null) => {
        setGroupToEdit(group);
        setIsToolGroupModalOpen(true);
    };

    return (
        <>
            {/* Context Providers are now wrapped in the App component */}
            <div className="flex h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-neutral-800 via-neutral-900 to-neutral-950 font-['Ubuntu'] text-neutral-200 antialiased overflow-x-hidden">
                {showSnow && <Snowfall />}
                <Sidebar
                    activeView={activeView}
                    setActiveView={setActiveView}
                    onFavoritesClick={() => setIsFavoritesModalOpen(true)}
                    onExportClick={handleExport}
                    onImportClick={triggerImport}
                    onDeleteClick={() => setIsDeleteModalOpen(true)}
                    showSnow={showSnow}
                    onToggleSnow={() => setShowSnow(prev => !prev)}
                />
                <main className="flex-1 flex flex-col relative min-w-0 overflow-hidden">
                    <ContentArea
                        activeView={activeView}
                        setActiveView={setActiveView}
                        onAddContact={() => openContactModal()}
                        onEditContact={openContactModal}
                        onAddTemplate={() => openTemplateModal()}
                        onEditTemplate={openTemplateModal}
                        onEditCase={openCaseModal}
                        onAddCaseClick={() => openCaseModal()}
                        onOpenSignatureModal={() => setIsSignatureModalOpen(true)}
                        onAddLink={openToolLinkModal}
                        onEditTile={openTileEditModal}
                        onAddGroup={() => openGroupModal(null)}
                        onEditGroup={openGroupModal}
                        onOpenHelp={() => setIsDashboardHelpModalOpen(true)}
                        onOpenReorderGroupsModal={() => setIsReorderGroupsModalOpen(true)}
                        onColumnCountChange={setDashboardColumnCount}
                        onOpenResetTimeTrackerModal={() => setIsResetTimeTrackerConfirmOpen(true)}
                        timeTrackerResetTrigger={timeTrackerResetTrigger}
                        onOpenClearArchiveModal={() => setIsClearArchiveConfirmOpen(true)}
                    />
                </main>
                <DeleteModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onDelete={handleDeleteDataRequest} />
                <ContactModal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} contact={contactToEdit} />
                <TemplateModal isOpen={isTemplateModalOpen} onClose={() => setIsTemplateModalOpen(false)} templateToEdit={templateToEdit} />
                <SignatureModal isOpen={isSignatureModalOpen} onClose={() => setIsSignatureModalOpen(false)} />
                <ToolLinkModal isOpen={isToolLinkModalOpen} onClose={() => setToolLinkModalOpen(false)} linkToEdit={linkToEdit} />
                <FavoritesModal isOpen={isFavoritesModalOpen} onClose={() => setIsFavoritesModalOpen(false)} />
                <DeleteModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onDelete={handleDeleteDataRequest} />
                <ContactModal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} contact={contactToEdit} />
                <TemplateModal isOpen={isTemplateModalOpen} onClose={() => setIsTemplateModalOpen(false)} templateToEdit={templateToEdit} />
                <SignatureModal isOpen={isSignatureModalOpen} onClose={() => setIsSignatureModalOpen(false)} />
                <ToolLinkModal isOpen={isToolLinkModalOpen} onClose={() => setToolLinkModalOpen(false)} linkToEdit={linkToEdit} />
                <TileEditModal isOpen={!!tileToEdit} onClose={() => setTileToEdit(null)} tileToEdit={tileToEdit} />
                <ToolGroupModal
                    isOpen={isToolGroupModalOpen}
                    onClose={() => setIsToolGroupModalOpen(false)}
                    groupToEdit={groupToEdit}
                    onDelete={(id) => setItemToDelete({ type: 'toolGroup', id })} // Passes ID to delete confirmation
                />
                <DashboardHelpModal isOpen={isDashboardHelpModalOpen} onClose={() => setIsDashboardHelpModalOpen(false)} />
                <ReorderGroupsModal
                    isOpen={isReorderGroupsModalOpen}
                    onClose={() => setIsReorderGroupsModalOpen(false)}
                    columnCount={dashboardColumnCount}
                />

                <InfoModal
                    isOpen={!!infoModal}
                    onClose={() => setInfoModal(null)}
                    title={infoModal?.title || ''}
                    message={infoModal?.message || ''}
                    isError={infoModal?.isError}
                />
                <ConfirmationModal
                    isOpen={isImportConfirmOpen}
                    onClose={() => setIsImportConfirmOpen(false)}
                    onConfirm={confirmImport}
                    title="Backup importieren"
                >
                    <p>Möchten Sie dieses Backup wirklich importieren? Alle vorhandenen Daten in den entsprechenden Kategorien werden überschrieben. Diese Aktion kann nicht rückgängig gemacht werden.</p>
                </ConfirmationModal>
                <ConfirmationModal
                    isOpen={!!itemToDelete}
                    onClose={() => setItemToDelete(null)}
                    onConfirm={handleConfirmDelete}
                    title="Eintrag löschen"
                >
                    Möchten Sie diesen Eintrag wirklich endgültig löschen? Diese Aktion kann nicht rückgängig gemacht werden.
                </ConfirmationModal>
                <ConfirmationModal
                    isOpen={!!categoriesToDelete}
                    onClose={() => setCategoriesToDelete(null)}
                    onConfirm={handleConfirmBulkDelete}
                    title="Daten endgültig löschen"
                >
                    Möchten Sie die ausgewählten Daten wirklich endgültig löschen? Diese Aktion kann nicht rückgängig gemacht werden.
                </ConfirmationModal>
                <ConfirmationModal
                    isOpen={isResetTimeTrackerConfirmOpen}
                    onClose={() => setIsResetTimeTrackerConfirmOpen(false)}
                    onConfirm={handleConfirmResetTimeTracker}
                    title="Zeiterfassung zurücksetzen"
                >
                    Möchten Sie wirklich alle Felder der Zeiterfassung leeren und zurücksetzen? Diese Aktion kann nicht rückgängig gemacht werden.
                </ConfirmationModal>
                <ConfirmationModal
                    isOpen={isClearArchiveConfirmOpen}
                    onClose={() => setIsClearArchiveConfirmOpen(false)}
                    onConfirm={() => {
                        clearArchivedCases();
                        setIsClearArchiveConfirmOpen(false);
                    }}
                    title="Archiv leeren"
                >
                    Möchten Sie wirklich alle archivierten Fälle endgültig löschen? Diese Aktion kann nicht rückgängig gemacht werden.
                </ConfirmationModal>
                <input type="file" accept=".json" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            </div>
        </>
    );
}

function App() {
    return (
        <ContactsProvider>
            <EvidenzProvider>
                <DashboardProvider>
                    <TemplatesProvider>
                        <SignaturesProvider>
                            <FavoritesProvider>
                                <ScheduleProvider>
                                    <NotesProvider>
                                        <AppContent />
                                    </NotesProvider>
                                </ScheduleProvider>
                            </FavoritesProvider>
                        </SignaturesProvider>
                    </TemplatesProvider>
                </DashboardProvider>
            </EvidenzProvider>
        </ContactsProvider>
    );
}

export default App;