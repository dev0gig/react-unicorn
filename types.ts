
export type ViewName = 'Dienstplan' | 'Dashboard' | 'Kontakte' | 'Mail Vorlagen' | 'Evidenzfälle' | 'HK - Generator' | 'WiWo-Terminpflege' | 'Zeiterfassung';

export interface MenuItem {
  id: ViewName;
  label: string;
  icon: string;
}

export interface ToolLink {
  name: string;
  url: string;
}

export interface ToolGroup {
  id: string;
  title: string;
  icon: string;
  links: ToolLink[];
  color?: string;
}

export interface DashboardContextType {
  toolGroups: ToolGroup[];
  addGroup: (title: string, icon: string) => void;
  updateGroup: (groupId: string, newTitle: string, newIcon: string) => void;
  deleteGroup: (groupId: string) => void;
  addLink: (groupId: string, link: ToolLink) => void;
  updateLink: (originalGroupId: string, linkToUpdate: ToolLink, newLink: ToolLink, newGroupId?: string) => void;
  deleteLink: (groupId: string, url: string) => void;
  reorderGroups: (groups: ToolGroup[]) => void;
}


export interface FavoritesContextType {
  favorites: ToolLink[];
  addFavorite: (link: ToolLink) => void;
  removeFavorite: (url: string) => void;
  isFavorite: (url: string) => boolean;
}

export type KanbanColumnId = 'neu' | 'inBearbeitung' | 'fertig';

export interface Evidenzfall {
  id: string;
  gpvk: string;
  telefonnummer: string;
  description: string;
  column: KanbanColumnId;
}

export interface EvidenzContextType {
  faelle: Evidenzfall[];
  archivedFaelle: Evidenzfall[];
  addCase: (gpvk: string, telefonnummer: string, description: string) => void;
  updateCases: (updatedCases: Evidenzfall[]) => void;
  updateCase: (id: string, data: { gpvk: string, telefonnummer: string, description: string }) => void;
  archiveCase: (id: string) => void;
  restoreCase: (id: string) => void;
  deleteCasePermanently: (id: string) => void;
  clearArchivedCases: () => void;
}

export interface Contact {
  id: string;
  name: string;
  nummer: string;
  adresse: string;
  mail: string;
  notizen: string;
  logoUrl?: string;
}

export interface ContactsContextType {
    contacts: Contact[];
    addContact: (contactData: Omit<Contact, 'id'>) => void;
    updateContact: (contactData: Contact) => void;
    deleteContact: (id: string) => void;
}

export interface Template {
  id: string;
  title: string;
  content: string;
}

export interface TemplateGroup {
  category: string;
  templates: Template[];
}

export interface TemplatesContextType {
    templateGroups: TemplateGroup[];
    addTemplate: (category: string, title: string, content: string) => void;
    updateTemplate: (category: string, template: Omit<Template, 'id'>, templateId: string) => void;
    deleteTemplate: (category: string, templateId: string) => void;
    getCategories: () => string[];
}

export interface Signature {
  id: string;
  title: string;
  content: string;
}

export interface SignaturesContextType {
  signatures: Signature[];
  activeSignatureId: string | null;
  addSignature: (title: string, content: string) => void;
  updateSignature: (id:string, title: string, content: string) => void;
  deleteSignature: (id: string) => void;
  setActiveSignatureId: (id: string | null) => void;
}

export interface ScheduleEvent {
  summary: string;
  dtstart: Date;
  dtend: Date;
}

export interface ScheduleContextType {
  schedule: Record<string, ScheduleEvent[]>;
  importSchedule: (icsContent: string) => void;
  clearSchedule: () => void;
}

// Types for Time Tracker
export interface Break {
  id: string;
  start: string; // "HH:mm"
  end: string;   // "HH:mm"
}

export type PhaseType = 'work' | 'break';

export interface WorkPhase {
  type: PhaseType;
  name: string;
  start: string; // "HH:mm"
  end: string;   // "HH:mm"
  duration: number; // in minutes
}

export interface Note {
  id: string;
  content: string;
  lastModified: number;
  createdAt: number;
}

export interface NotesContextType {
  notes: Note[];
  addNote: (content: string, date?: number) => void;
  updateNote: (id: string, content: string) => void;
  deleteNote: (id: string) => void;
}
