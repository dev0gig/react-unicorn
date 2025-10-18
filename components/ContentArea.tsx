import React from 'react';
import type { ViewName, Contact, Template, Evidenzfall, ToolGroup, ToolLink } from '../types';
import { Dashboard } from './content/Dashboard';
import { Kontakte } from './content/Kontakte';
import { MailTemplates } from './content/MailTemplates';
import { Notizen } from './content/Notizen';
import { Evidenzfaelle } from './content/Evidenzfaelle';
import { Wohnungswirtschaft } from './content/Wohnungswirtschaft';
import { Profile } from './content/Profile';
import { TextGenerator } from './content/TextGenerator';
import { TimeTracker } from './content/TimeTracker';

interface ContentAreaProps {
  activeView: ViewName;
  setActiveView: (view: ViewName) => void;
  highlightedNoteId: string | null;
  setHighlightedNoteId: (id: string | null) => void;
  onAddContact: () => void;
  onEditContact: (contact: Contact) => void;
  onAddTemplate: () => void;
  onEditTemplate: (template: Template, category: string) => void;
  onEditCase: (fall: Evidenzfall) => void;
  onAddCaseClick: () => void;
  onOpenSignatureModal: () => void;
  onAddLink: (link: ToolLink | null, groupId?: string) => void;
  onEditTile: (data: { link: ToolLink; group: ToolGroup }) => void;
  onAddGroup: () => void;
  onEditGroup: (group: ToolGroup) => void;
  onOpenHelp: () => void;
  onOpenReorderModal: () => void;
  onOpenResetTimeTrackerModal: () => void;
  timeTrackerResetTrigger: number;
}

export const ContentArea: React.FC<ContentAreaProps> = (props) => {
  const { 
    activeView, setActiveView, highlightedNoteId, setHighlightedNoteId, onAddContact, 
    onEditContact, onAddTemplate, onEditTemplate, onEditCase, onAddCaseClick, 
    onOpenSignatureModal, onAddLink, onEditTile, onAddGroup, onEditGroup, 
    onOpenHelp, onOpenReorderModal, onOpenResetTimeTrackerModal, timeTrackerResetTrigger 
  } = props;

  const renderContent = () => {
    switch (activeView) {
      case 'Profil':
        return <Profile setActiveView={setActiveView} setHighlightedNoteId={setHighlightedNoteId} />;
      case 'Dashboard':
        return <Dashboard 
                  onAddLink={onAddLink} 
                  onEditTile={onEditTile}
                  onAddGroup={onAddGroup}
                  onEditGroup={onEditGroup}
                  onOpenHelp={onOpenHelp}
                  onOpenReorderModal={onOpenReorderModal}
               />;
      case 'Kontakte':
        return <Kontakte onAdd={onAddContact} onEdit={onEditContact} />;
      case 'Mail Vorlagen':
        return <MailTemplates onAdd={onAddTemplate} onEdit={onEditTemplate} onOpenSignatureModal={onOpenSignatureModal} />;
      case 'Notizen':
        return <Notizen highlightedNoteId={highlightedNoteId} setHighlightedNoteId={setHighlightedNoteId} />;
      case 'Evidenzfälle':
        return <Evidenzfaelle onEdit={onEditCase} onAddCaseClick={onAddCaseClick} />;
      case 'HK - Generator':
        return <TextGenerator />;
      case 'WiWo-Terminpflege':
        return <Wohnungswirtschaft />;
      case 'Zeiterfassung':
        return <TimeTracker onOpenResetModal={onOpenResetTimeTrackerModal} resetTrigger={timeTrackerResetTrigger} />;
      default:
        return <Profile setActiveView={setActiveView} setHighlightedNoteId={setHighlightedNoteId} />;
    }
  };

  return (
    <div className="w-full flex-1 min-h-0">
      {renderContent()}
    </div>
  );
};
