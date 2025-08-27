import React, { useState, useEffect, createContext, useContext, useCallback, useMemo, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { ContentArea } from './components/ContentArea';
import { ViewName, ToolLink, ToolGroup, FavoritesContextType, Evidenzfall, EvidenzContextType, Note, NotesContextType, Contact, ContactsContextType, TemplateGroup, TemplatesContextType, Template, Signature, SignaturesContextType, DashboardContextType, TileConfig, ScheduleContextType, ScheduleEvent } from './types';
import { AddCaseModal } from './components/AddCaseModal';
import { FavoritesModal } from './components/FavoritesModal';
import { ExportModal } from './components/ExportModal';
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

// Initial Data
import { initialContacts } from './data/initialContacts';
import { initialTemplateGroups } from './data/initialTemplates';
import { initialNotes } from './data/initialNotes';
import { initialToolGroups } from './data/initialDashboard';

// Contexts
export const FavoritesContext = createContext<FavoritesContextType | null>(null);
export const EvidenzContext = createContext<EvidenzContextType | null>(null);
export const NotesContext = createContext<NotesContextType | null>(null);
export const ContactsContext = createContext<ContactsContextType | null>(null);
export const TemplatesContext = createContext<TemplatesContextType | null>(null);
export const SignaturesContext = createContext<SignaturesContextType | null>(null);
export const DashboardContext = createContext<DashboardContextType | null>(null);
export const ScheduleContext = createContext<ScheduleContextType | null>(null);

const GROUP_COLORS = [
    '#4c0519', // rose-950
    '#431407', // orange-950
    '#022c22', // emerald-950
    '#082f49', // sky-950
    '#1e1b4b', // indigo-950
    '#3b0764', // purple-950
    '#1e293b', // slate-800
    '#042f2e', // teal-950
    '#422006', // amber-950
    '#500724', // pink-950
];


// Hooks
export const useFavorites = () => {
    const context = useContext(FavoritesContext);
    if (!context) throw new Error('useFavorites must be used within a FavoritesProvider');
    return context;
};

export const useEvidenz = () => {
    const context = useContext(EvidenzContext);
    if (!context) throw new Error('useEvidenz must be used within a EvidenzProvider');
    return context;
}

export const useNotes = () => {
    const context = useContext(NotesContext);
    if (!context) throw new Error('useNotes must be used within a NotesProvider');
    return context;
}

export const useContacts = () => {
    const context = useContext(ContactsContext);
    if (!context) throw new Error('useContacts must be used within a ContactsProvider');
    return context;
}

export const useTemplates = () => {
    const context = useContext(TemplatesContext);
    if (!context) throw new Error('useTemplates must be used within a TemplatesProvider');
    return context;
}

export const useSignatures = () => {
    const context = useContext(SignaturesContext);
    if (!context) throw new Error('useSignatures must be used within a SignaturesProvider');
    return context;
}

export const useDashboard = () => {
    const context = useContext(DashboardContext);
    if (!context) throw new Error('useDashboard must be used within a DashboardProvider');
    return context;
}

export const useSchedule = () => {
    const context = useContext(ScheduleContext);
    if (!context) throw new Error('useSchedule must be used within a ScheduleProvider');
    return context;
}


function App(): React.ReactNode {
  const [activeView, setActiveView] = useState<ViewName>('Profil');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // States
  const [favorites, setFavorites] = useState<ToolLink[]>(() => JSON.parse(localStorage.getItem('unicorn-favorites') || '[]'));
  const [toolGroups, setToolGroups] = useState<ToolGroup[]>(() => JSON.parse(localStorage.getItem('unicorn-dashboard') || JSON.stringify(initialToolGroups)));
  const [faelle, setFaelle] = useState<Evidenzfall[]>(() => JSON.parse(localStorage.getItem('unicorn-faelle') || '[]'));
  const [archivedFaelle, setArchivedFaelle] = useState<Evidenzfall[]>(() => JSON.parse(localStorage.getItem('unicorn-archived-faelle') || '[]'));
  const [notes, setNotes] = useState<Note[]>(() => JSON.parse(localStorage.getItem('unicorn-notes') || JSON.stringify(initialNotes)));
  const [contacts, setContacts] = useState<Contact[]>(() => JSON.parse(localStorage.getItem('unicorn-contacts') || JSON.stringify(initialContacts)));
  const [templateGroups, setTemplateGroups] = useState<TemplateGroup[]>(() => JSON.parse(localStorage.getItem('unicorn-templates') || JSON.stringify(initialTemplateGroups)));
  const [signatures, setSignatures] = useState<Signature[]>(() => JSON.parse(localStorage.getItem('unicorn-signatures') || '[]'));
  const [activeSignatureId, setActiveSignatureId] = useState<string | null>(() => JSON.parse(localStorage.getItem('unicorn-active-signature-id') || 'null'));
  const [tileConfigs, setTileConfigs] = useState<TileConfig[]>(() => {
    const savedConfigs: any[] = JSON.parse(localStorage.getItem('unicorn-tile-configs') || '[]');
    // Ensure all tiles are 1x1, migrating old data if necessary
    return savedConfigs.map(c => ({ ...c, size: '1x1' }));
  });
  const [schedule, setSchedule] = useState<Record<string, ScheduleEvent[]>>(() => {
    const savedSchedule = localStorage.getItem('unicorn-schedule');
    if (!savedSchedule) return {};
    const parsed = JSON.parse(savedSchedule);
    // Revive date objects from strings
    Object.keys(parsed).forEach(dateKey => {
        parsed[dateKey] = parsed[dateKey].map((event: any) => ({
            ...event,
            dtstart: new Date(event.dtstart),
            dtend: new Date(event.dtend),
        }));
    });
    return parsed;
  });


  // Modal States
  const [isAddCaseModalOpen, setIsAddCaseModalOpen] = useState(false);
  const [caseToEdit, setCaseToEdit] = useState<Evidenzfall | null>(null);
  const [isFavoritesModalOpen, setIsFavoritesModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
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
  const [linkToEdit, setLinkToEdit] = useState<{ link: ToolLink, groupTitle: string } | null>(null);
  const [tileToEdit, setTileToEdit] = useState<{ link: ToolLink; group: ToolGroup } | null>(null);
  const [isDashboardHelpModalOpen, setIsDashboardHelpModalOpen] = useState(false);
  const [isToolGroupModalOpen, setIsToolGroupModalOpen] = useState(false);
  const [groupToEdit, setGroupToEdit] = useState<ToolGroup | null>(null);
  const [infoModal, setInfoModal] = useState<{ isOpen: boolean; title: string; message: string; isError?: boolean } | null>(null);


  // Effects for localStorage persistence
  useEffect(() => { localStorage.setItem('unicorn-favorites', JSON.stringify(favorites)); }, [favorites]);
  useEffect(() => { localStorage.setItem('unicorn-dashboard', JSON.stringify(toolGroups)); }, [toolGroups]);
  useEffect(() => { localStorage.setItem('unicorn-tile-configs', JSON.stringify(tileConfigs)); }, [tileConfigs]);
  useEffect(() => { localStorage.setItem('unicorn-faelle', JSON.stringify(faelle)); }, [faelle]);
  useEffect(() => { localStorage.setItem('unicorn-archived-faelle', JSON.stringify(archivedFaelle)); }, [archivedFaelle]);
  useEffect(() => { localStorage.setItem('unicorn-notes', JSON.stringify(notes)); }, [notes]);
  useEffect(() => { localStorage.setItem('unicorn-contacts', JSON.stringify(contacts)); }, [contacts]);
  useEffect(() => { localStorage.setItem('unicorn-templates', JSON.stringify(templateGroups)); }, [templateGroups]);
  useEffect(() => { localStorage.setItem('unicorn-signatures', JSON.stringify(signatures)); }, [signatures]);
  useEffect(() => { localStorage.setItem('unicorn-active-signature-id', JSON.stringify(activeSignatureId)); }, [activeSignatureId]);
  useEffect(() => { localStorage.setItem('unicorn-schedule', JSON.stringify(schedule)); }, [schedule]);

    // Sync tile configs with tool groups
    useEffect(() => {
        const allLinks = toolGroups.flatMap(g => g.links);
        const allLinkUrls = new Set(allLinks.map(l => l.url));
        const currentConfigIds = new Set(tileConfigs.map(c => c.id));

        const configsToAdd = allLinks
            .filter(l => !currentConfigIds.has(l.url))
            .map(l => ({ id: l.url, size: '1x1' as const }));
        
        const hasChanged = configsToAdd.length > 0 || tileConfigs.some(c => !allLinkUrls.has(c.id));

        if (hasChanged) {
            setTileConfigs(prev => [
                ...prev.filter(c => allLinkUrls.has(c.id)),
                ...configsToAdd
            ]);
        }
    }, [toolGroups, tileConfigs]);


  // --- Context Values & Functions ---

  // Schedule
  const importSchedule = useCallback((icsContent: string) => {
    try {
        const events: ScheduleEvent[] = [];
        const lines = icsContent.replace(/\r\n /g, '').split(/\r\n/);
        let currentEvent: Partial<ScheduleEvent> | null = null;
        
        const parseIcsDate = (dateStr: string): Date | null => {
            // This parser handles floating local times and UTC times ending in 'Z'.
            // It does not parse TZID timezone identifiers.
            const isUtc = dateStr.endsWith('Z');
            const cleanDateStr = isUtc ? dateStr.slice(0, -1) : dateStr;
            
            const match = cleanDateStr.match(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/);
            if (!match) return null;

            const [, year, month, day, hour, minute, second] = match.map(Number);
            
            if (isUtc) {
                // Create a Date object from UTC components.
                return new Date(Date.UTC(year, month - 1, day, hour, minute, second));
            } else {
                // Create a Date object from local time components for floating times.
                return new Date(year, month - 1, day, hour, minute, second);
            }
        };

        lines.forEach(line => {
            if (line.startsWith('BEGIN:VEVENT')) {
                currentEvent = {};
            } else if (line.startsWith('END:VEVENT')) {
                if (currentEvent && currentEvent.summary && currentEvent.dtstart && currentEvent.dtend) {
                    events.push(currentEvent as ScheduleEvent);
                }
                currentEvent = null;
            } else if (currentEvent) {
                if (line.startsWith('SUMMARY:')) {
                    currentEvent.summary = line.substring(8);
                } else if (line.startsWith('DTSTART;')) { // Handles DTSTART;TZID=...
                    const dateStr = line.split(':')[1];
                    currentEvent.dtstart = parseIcsDate(dateStr) || undefined;
                } else if (line.startsWith('DTSTART:')) {
                    currentEvent.dtstart = parseIcsDate(line.substring(8)) || undefined;
                } else if (line.startsWith('DTEND;')) { // Handles DTEND;TZID=...
                    const dateStr = line.split(':')[1];
                    currentEvent.dtend = parseIcsDate(dateStr) || undefined;
                } else if (line.startsWith('DTEND:')) {
                    currentEvent.dtend = parseIcsDate(line.substring(6)) || undefined;
                }
            }
        });

        if (events.length === 0) {
            throw new Error("Keine Termine in der Datei gefunden. Bitte prüfen Sie das Format der Datei.");
        }

        const newSchedule: Record<string, ScheduleEvent[]> = {};
        events.forEach(event => {
            const d = event.dtstart;
            const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            if (!newSchedule[dateKey]) {
                newSchedule[dateKey] = [];
            }
            newSchedule[dateKey].push(event);
            newSchedule[dateKey].sort((a,b) => a.dtstart.getTime() - b.dtstart.getTime());
        });
        
        setSchedule(newSchedule);
        setInfoModal({ 
            isOpen: true, 
            title: "Import erfolgreich", 
            message: `${events.length} Termine wurden erfolgreich importiert. Vorherige Einträge wurden gelöscht.`,
            isError: false,
        });
    } catch (e) {
        console.error("ICS Import failed:", e);
        setInfoModal({ 
            isOpen: true, 
            title: "Import fehlgeschlagen",
            message: e instanceof Error ? e.message : 'Beim Verarbeiten der .ics-Datei ist ein unerwarteter Fehler aufgetreten.',
            isError: true,
        });
    }
  }, []);
  const clearSchedule = useCallback(() => {
    setSchedule({});
  }, []);
  const scheduleContextValue = useMemo(() => ({ schedule, importSchedule, clearSchedule }), [schedule, importSchedule, clearSchedule]);

  // Dashboard
  const addGroup = useCallback((title: string, icon: string) => {
    setToolGroups(prev => {
        const color = GROUP_COLORS[prev.length % GROUP_COLORS.length];
        return [...prev, { title, icon, color, links: [] }];
    });
  }, []);
  const updateGroup = useCallback((oldTitle: string, newTitle: string, newIcon: string) => {
      setToolGroups(prev => prev.map(g => (g.title === oldTitle ? { ...g, title: newTitle, icon: newIcon } : g)));
  }, []);
  const deleteGroup = useCallback((title: string) => setItemToDelete({ type: 'toolGroup', title }), []);
  const addLink = useCallback((groupTitle: string, link: ToolLink) => setToolGroups(prev => prev.map(g => g.title === groupTitle ? { ...g, links: [...g.links, link] } : g)), []);
  const addLinkAndMaybeGroup = useCallback((link: ToolLink, groupTitle: string, newGroupIcon?: string) => {
    setToolGroups(prev => {
        const groupExists = prev.some(g => g.title === groupTitle);
        if (groupExists) {
            return prev.map(g => g.title === groupTitle ? { ...g, links: [...g.links, link] } : g);
        } else if (newGroupIcon) {
            const color = GROUP_COLORS[prev.length % GROUP_COLORS.length];
            const newGroup: ToolGroup = { title: groupTitle, icon: newGroupIcon, color, links: [link] };
            return [...prev, newGroup];
        }
        return prev;
    });
  }, []);
  const updateLink = useCallback((groupTitle: string, linkToUpdate: ToolLink, newLink: ToolLink, newGroupTitle?: string) => {
    const destinationGroupTitle = newGroupTitle || groupTitle;

    // If not moving group, just update in place
    if (destinationGroupTitle === groupTitle) {
        setToolGroups(prev => prev.map(g => {
            if (g.title === groupTitle) {
                return { ...g, links: g.links.map(l => l.url === linkToUpdate.url ? newLink : l) };
            }
            return g;
        }));
    } else { // Moving group
        setToolGroups(prev => {
            const linkData = newLink; // The link to move is the updated one
            
            const groupsAfterRemoval = prev.map(g => {
                if (g.title === groupTitle) {
                    return { ...g, links: g.links.filter(l => l.url !== linkToUpdate.url) };
                }
                return g;
            });

            return groupsAfterRemoval.map(g => {
                if (g.title === destinationGroupTitle) {
                    return { ...g, links: [...g.links, linkData] };
                }
                return g;
            });
        });
    }

    if (linkToUpdate.url !== newLink.url) {
      setTileConfigs(prev => prev.map(c => c.id === linkToUpdate.url ? { ...c, id: newLink.url } : c));
    }
  }, []);
  const deleteLink = useCallback((groupTitle: string, url: string) => setItemToDelete({ type: 'toolLink', groupTitle, url }), []);
  const reorderGroups = useCallback((groups: ToolGroup[]) => {
      setToolGroups(groups);
  }, []);
  const reorderLinks = useCallback((groupTitle: string, reorderedLinks: ToolLink[]) => {
    setToolGroups(prev =>
        prev.map(g => (g.title === groupTitle ? { ...g, links: reorderedLinks } : g))
    );
  }, []);
  const reorderTiles = useCallback((items: TileConfig[]) => {
      setTileConfigs(items);
  }, []);
  const dashboardContextValue = useMemo(() => ({ toolGroups, addGroup, updateGroup, deleteGroup, addLink, addLinkAndMaybeGroup, updateLink, deleteLink, reorderGroups, reorderLinks, tileConfigs, reorderTiles }), [toolGroups, addGroup, updateGroup, deleteGroup, addLink, addLinkAndMaybeGroup, updateLink, deleteLink, reorderGroups, reorderLinks, tileConfigs, reorderTiles]);


  // Favorites
  const addFavorite = useCallback((link: ToolLink) => setFavorites(current => current.some(fav => fav.url === link.url) ? current : [...current, link]), []);
  const removeFavorite = useCallback((url: string) => setFavorites(current => current.filter(fav => fav.url !== url)), []);
  const isFavorite = useCallback((url: string) => favorites.some(fav => fav.url === url), [favorites]);
  const favoritesContextValue = useMemo(() => ({ favorites, addFavorite, removeFavorite, isFavorite }), [favorites, addFavorite, removeFavorite, isFavorite]);

  // Evidenz
  const addCase = useCallback((gpvk: string, telefonnummer: string, description: string) => setFaelle(current => [{ id: Date.now().toString(), gpvk, telefonnummer, description, column: 'neu' }, ...current]), []);
  const updateCases = useCallback((updatedCases: Evidenzfall[]) => setFaelle(updatedCases), []);
  const updateCase = useCallback((id: string, data: { gpvk: string, telefonnummer: string, description: string }) => {
      setFaelle(prev => prev.map(f => f.id === id ? { ...f, ...data } : f));
  }, []);
  const archiveCase = useCallback((id: string) => {
    setFaelle(currentFaelle => {
      const fallToArchive = currentFaelle.find(f => f.id === id);
      if (fallToArchive) setArchivedFaelle(currentArchived => [...currentArchived, fallToArchive]);
      return currentFaelle.filter(f => f.id !== id);
    });
  }, []);
  const restoreCase = useCallback((id: string) => {
    setArchivedFaelle(currentArchived => {
        const fallToRestore = currentArchived.find(f => f.id === id);
        if (fallToRestore) setFaelle(currentFaelle => [{ ...fallToRestore, column: 'neu' }, ...currentFaelle]);
        return currentArchived.filter(f => f.id !== id);
    });
  }, []);
  const deleteCasePermanently = useCallback((id: string) => {
    setItemToDelete({ type: 'evidenzfall', id });
  }, []);
  const evidenzContextValue = useMemo(() => ({ faelle, archivedFaelle, addCase, updateCases, updateCase, archiveCase, restoreCase, deleteCasePermanently }), [faelle, archivedFaelle, addCase, updateCases, updateCase, archiveCase, restoreCase, deleteCasePermanently]);

  // Notes
  const addNote = useCallback((content: string, customDate?: number) => {
    const timestamp = customDate || Date.now();
    const newNote: Note = { id: `${timestamp}-${Math.random().toString(36).substring(2, 9)}`, content, createdAt: timestamp, lastModified: timestamp };
    setNotes(prev => [newNote, ...prev]);
  }, []);
  const updateNote = useCallback((id: string, content: string) => setNotes(prev => prev.map(note => note.id === id ? { ...note, content, lastModified: Date.now() } : note)), []);
  const deleteNote = useCallback((id: string) => setItemToDelete({ type: 'note', id }), []);
  const notesContextValue = useMemo(() => ({ notes, addNote, updateNote, deleteNote }), [notes, addNote, updateNote, deleteNote]);
  
  // Contacts
  const addContact = useCallback((contactData: Omit<Contact, 'id'>) => setContacts(prev => [{ id: Date.now().toString(), ...contactData }, ...prev]), []);
  const updateContact = useCallback((contactData: Contact) => setContacts(prev => prev.map(c => c.id === contactData.id ? contactData : c)), []);
  const deleteContact = useCallback((id: string) => setItemToDelete({ type: 'contact', id }), []);
  const contactsContextValue = useMemo(() => ({ contacts, addContact, updateContact, deleteContact }), [contacts, addContact, updateContact, deleteContact]);
  
  // Templates
  const addTemplate = useCallback((category: string, title: string, content: string) => {
    setTemplateGroups(prev => {
        const categoryExists = prev.some(g => g.category === category);
        const newTemplate = { id: Date.now().toString(), title, content };
        if (categoryExists) {
            return prev.map(g => g.category === category ? { ...g, templates: [...g.templates, newTemplate] } : g);
        } else {
            return [...prev, { category, templates: [newTemplate] }];
        }
    });
  }, []);
  const updateTemplate = useCallback((category: string, template: Omit<Template, 'id'>, templateId: string) => {
      setTemplateGroups(prev => prev.map(g => {
          if (g.category === category) {
              return { ...g, templates: g.templates.map(t => t.id === templateId ? { ...template, id: templateId } : t) };
          }
          return g;
      }));
  }, []);
  const deleteTemplate = useCallback((category: string, templateId: string) => setItemToDelete({ type: 'template', id: templateId, category }), []);
  const getCategories = useCallback(() => templateGroups.map(g => g.category), [templateGroups]);
  const templatesContextValue = useMemo(() => ({ templateGroups, addTemplate, updateTemplate, deleteTemplate, getCategories }), [templateGroups, addTemplate, updateTemplate, deleteTemplate, getCategories]);

  // Signatures
  const addSignature = useCallback((title: string, content: string) => {
    setSignatures(prev => [...prev, {id: Date.now().toString(), title, content }]);
  }, []);
  const updateSignature = useCallback((id: string, title: string, content: string) => {
      setSignatures(prev => prev.map(s => s.id === id ? { ...s, title, content } : s));
  }, []);
  const deleteSignature = useCallback((id: string) => setItemToDelete({ type: 'signature', id }), []);
  const signaturesContextValue = useMemo(() => ({ signatures, activeSignatureId, addSignature, updateSignature, deleteSignature, setActiveSignatureId }), [signatures, activeSignatureId, addSignature, updateSignature, deleteSignature, setActiveSignatureId]);


  // --- Backup & Restore Logic ---
  const handleExport = (options: any) => {
    const exportData: any = {
      metadata: { appName: 'Unicorn Backup', exportDate: new Date().toISOString() },
      data: {}
    };

    if (options.dashboard) {
        exportData.data.toolGroups = toolGroups;
        exportData.data.tileConfigs = tileConfigs;
    }
    if (options.favorites) exportData.data.favorites = favorites;
    if (options.faelle) {
      exportData.data.faelle = faelle;
      exportData.data.archivedFaelle = archivedFaelle;
    }
    if (options.notes) exportData.data.notes = notes;
    if (options.contacts) exportData.data.contacts = contacts;
    if (options.templates) exportData.data.templateGroups = templateGroups;
    if (options.signatures) {
        exportData.data.signatures = signatures;
        exportData.data.activeSignatureId = activeSignatureId;
    }


    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `unicorn-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setIsExportModalOpen(false);
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
    if(event.target) event.target.value = '';
  };
  
  const confirmImport = () => {
    if (!dataToImport) return;
    
    if (dataToImport.toolGroups) {
      const importedGroups: ToolGroup[] = dataToImport.toolGroups;
      const newToolGroups = importedGroups.map((group, index) => ({
        ...group,
        color: GROUP_COLORS[index % GROUP_COLORS.length]
      }));
      setToolGroups(newToolGroups);
    }
    if (dataToImport.tileConfigs) {
        const importedConfigs: any[] = dataToImport.tileConfigs;
        setTileConfigs(importedConfigs.map(c => ({ ...c, size: '1x1' })));
    }
    if (dataToImport.favorites) setFavorites(dataToImport.favorites);
    if (dataToImport.faelle) setFaelle(dataToImport.faelle);
    if (dataToImport.archivedFaelle) setArchivedFaelle(dataToImport.archivedFaelle);
    if (dataToImport.notes) setNotes(dataToImport.notes);
    if (dataToImport.contacts) setContacts(dataToImport.contacts);
    if (dataToImport.templateGroups) setTemplateGroups(dataToImport.templateGroups);
    if (dataToImport.signatures) setSignatures(dataToImport.signatures);
    if (dataToImport.activeSignatureId) setActiveSignatureId(dataToImport.activeSignatureId);
    
    setDataToImport(null);
    setIsImportConfirmOpen(false);
  }

  // --- Deletion Logic ---
  const handleConfirmDelete = () => {
      if (!itemToDelete) return;
      
      switch(itemToDelete.type) {
          case 'note':
              setNotes(prev => prev.filter(note => note.id !== itemToDelete.id));
              break;
          case 'contact':
              setContacts(prev => prev.filter(c => c.id !== itemToDelete.id));
              break;
          case 'template':
              if (itemToDelete.category) {
                  setTemplateGroups(currentGroups => currentGroups.map(group => {
                        if (group.category === itemToDelete.category) {
                            return { ...group, templates: group.templates.filter(t => t.id !== itemToDelete.id) };
                        }
                        return group;
                    }).filter(group => group.templates.length > 0)
                  );
              }
              break;
           case 'evidenzfall':
                setArchivedFaelle(prev => prev.filter(f => f.id !== itemToDelete.id));
                break;
            case 'signature':
                setSignatures(prev => prev.filter(s => s.id !== itemToDelete.id));
                if (activeSignatureId === itemToDelete.id) {
                    setActiveSignatureId(null);
                }
                break;
            case 'toolGroup':
                setToolGroups(prev => prev.filter(g => g.title !== itemToDelete.title));
                break;
            case 'toolLink':
                 setToolGroups(prev => prev.map(g => {
                    if (g.title === itemToDelete.groupTitle) {
                        return { ...g, links: g.links.filter(l => l.url !== itemToDelete.url) };
                    }
                    return g;
                }));
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
      setTileConfigs([]);
    }
    if (categoriesToDelete.favorites) setFavorites([]);
    if (categoriesToDelete.faelle) {
      setFaelle([]);
      setArchivedFaelle([]);
    }
    if (categoriesToDelete.notes) setNotes([]);
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
  const openToolLinkModal = (link: ToolLink | null, groupTitle?: string) => {
    setLinkToEdit({ 
        link: link || { name: '', url: '' }, 
        groupTitle: groupTitle || '' 
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
    <DashboardContext.Provider value={dashboardContextValue}>
    <FavoritesContext.Provider value={favoritesContextValue}>
      <EvidenzContext.Provider value={evidenzContextValue}>
        <NotesContext.Provider value={notesContextValue}>
            <ContactsContext.Provider value={contactsContextValue}>
                <TemplatesContext.Provider value={templatesContextValue}>
                    <SignaturesContext.Provider value={signaturesContextValue}>
                        <ScheduleContext.Provider value={scheduleContextValue}>
                            <div className="flex h-screen bg-neutral-900 font-['Ubuntu'] text-neutral-200 antialiased overflow-x-hidden">
                                <Sidebar 
                                    activeView={activeView} 
                                    setActiveView={setActiveView} 
                                    onAddCaseClick={() => openCaseModal()}
                                    onFavoritesClick={() => setIsFavoritesModalOpen(true)}
                                    onExportClick={() => setIsExportModalOpen(true)}
                                    onImportClick={triggerImport}
                                    onDeleteClick={() => setIsDeleteModalOpen(true)}
                                />
                                <main className="flex-1 flex flex-col relative min-w-0 overflow-hidden">
                                    <ContentArea 
                                        activeView={activeView} 
                                        onAddContact={() => openContactModal()}
                                        onEditContact={openContactModal}
                                        onAddTemplate={() => openTemplateModal()}
                                        onEditTemplate={openTemplateModal}
                                        onEditCase={openCaseModal}
                                        onOpenSignatureModal={() => setIsSignatureModalOpen(true)}
                                        onAddLink={openToolLinkModal}
                                        onEditTile={openTileEditModal}
                                        onAddGroup={() => openGroupModal(null)}
                                        onEditGroup={openGroupModal}
                                        onOpenHelp={() => setIsDashboardHelpModalOpen(true)}
                                    />
                                </main>
                                <AddCaseModal isOpen={isAddCaseModalOpen} onClose={() => setIsAddCaseModalOpen(false)} caseToEdit={caseToEdit} />
                                <FavoritesModal isOpen={isFavoritesModalOpen} onClose={() => setIsFavoritesModalOpen(false)} />
                                <ExportModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} onExport={handleExport} />
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
                                    onDelete={deleteGroup} 
                                />
                                <DashboardHelpModal isOpen={isDashboardHelpModalOpen} onClose={() => setIsDashboardHelpModalOpen(false)} />
                                
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
                                <input type="file" accept=".json" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                            </div>
                        </ScheduleContext.Provider>
                    </SignaturesContext.Provider>
                </TemplatesContext.Provider>
            </ContactsContext.Provider>
        </NotesContext.Provider>
      </EvidenzContext.Provider>
    </FavoritesContext.Provider>
    </DashboardContext.Provider>
  );
}

export default App;