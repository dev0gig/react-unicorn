import React, { useRef } from 'react';
import { useContacts } from '../../contexts/ContactsContext';

import { useDashboard } from '../../contexts/DashboardContext';
import { useTemplates } from '../../contexts/TemplatesContext';
import { useSignatures } from '../../contexts/SignaturesContext';
import { useSchedule } from '../../contexts/ScheduleContext';
import { useNotes } from '../../contexts/NotesContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import { useModal } from '../contexts/ModalContext';
import { ScheduleEvent } from '../../types';

export const useDataPersistence = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Context Hooks
    const { contacts, setContacts } = useContacts();

    const { toolGroups, setToolGroups } = useDashboard();
    const { templateGroups, setTemplateGroups } = useTemplates();
    const { signatures, activeSignatureId, setSignatures, setActiveSignatureId } = useSignatures();
    const { schedule, setSchedule } = useSchedule();
    const { notes, setNotes } = useNotes();
    const { favorites, setFavorites } = useFavorites();
    const { openModal, closeModal } = useModal();

    const handleExport = () => {
        const exportData: any = {
            metadata: { appName: 'Unicorn Backup', exportDate: new Date().toISOString() },
            data: {
                toolGroups,
                favorites,
                contacts,
                templateGroups,
                signatures,
                activeSignatureId,
                notes,
                schedule
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

    const confirmImport = (dataToImport: any) => {
        if (!dataToImport) return;

        if (dataToImport.toolGroups) {
            let importedGroups: any[] = dataToImport.toolGroups;
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
        closeModal();
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
                        openModal('IMPORT_CONFIRMATION', {
                            title: "Backup importieren",
                            onConfirm: () => confirmImport(parsedData.data),
                            children: <p>Möchten Sie dieses Backup wirklich importieren? Alle vorhandenen Daten in den entsprechenden Kategorien werden überschrieben.Diese Aktion kann nicht rückgängig gemacht werden.</p>
                        });
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

    const triggerImport = () => {
        fileInputRef.current?.click();
    };

    return {
        handleExport,
        triggerImport,
        handleFileChange,
        fileInputRef
    };
};
