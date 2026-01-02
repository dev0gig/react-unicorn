
import React from 'react';
import type { ViewName, Contact, Template, ToolGroup, ToolLink } from '../types';
import { Dashboard } from './content/Dashboard';
import { Kontakte } from './content/Kontakte';
import { MailTemplates } from './content/MailTemplates';

import { Wohnungswirtschaft } from './content/Wohnungswirtschaft';
import { Profile } from './content/Profile';
import { TimeTracker } from './content/TimeTracker';

interface ContentAreaProps {
  activeView: ViewName;
  setActiveView: (view: ViewName) => void;
  onAddContact: () => void;
  onEditContact: (contact: Contact) => void;
  onAddTemplate: () => void;
  onEditTemplate: (template: Template, category: string) => void;
  onOpenSignatureModal: () => void;
  onAddLink: (link: ToolLink | null, groupId?: string) => void;
  onEditTile: (data: { link: ToolLink; group: ToolGroup }) => void;
  onAddGroup: () => void;
  onEditGroup: (group: ToolGroup) => void;
  onOpenReorderGroupsModal: () => void;
  onOpenResetTimeTrackerModal: () => void;
  onColumnCountChange: (count: number) => void;
  timeTrackerResetTrigger: number;
}

export const ContentArea: React.FC<ContentAreaProps> = (props) => {
  const {
    activeView, setActiveView, onAddContact,
    onEditContact, onAddTemplate, onEditTemplate,
    onOpenSignatureModal, onAddLink, onEditTile, onAddGroup, onEditGroup,
    onOpenReorderGroupsModal, onOpenResetTimeTrackerModal, onColumnCountChange, timeTrackerResetTrigger,
  } = props;

  const renderContent = () => {
    switch (activeView) {
      case 'Dienstplan':
        return <Profile />;
      case 'Dashboard':
        return <Dashboard
          onAddLink={onAddLink}
          onEditTile={onEditTile}
          onAddGroup={onAddGroup}
          onEditGroup={onEditGroup}
          onOpenReorderGroupsModal={onOpenReorderGroupsModal}
          onColumnCountChange={onColumnCountChange}
        />;
      case 'Kontakte':
        return <Kontakte onAdd={onAddContact} onEdit={onEditContact} />;
      case 'Mail Vorlagen':
        return <MailTemplates onAdd={onAddTemplate} onEdit={onEditTemplate} onOpenSignatureModal={onOpenSignatureModal} />;

      case 'WiWo-Terminpflege':
        return <Wohnungswirtschaft />;
      case 'Zeiterfassung':
        return <TimeTracker onOpenResetModal={onOpenResetTimeTrackerModal} resetTrigger={timeTrackerResetTrigger} />;
      default:
        return <Profile />;
    }
  };

  return (
    <div className="w-full flex-1 min-h-0">
      {renderContent()}
    </div>
  );
};
