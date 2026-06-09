
import React from 'react';
import type { ViewName, Contact, Template, ToolGroup, ToolLink } from '../types';
import { Dashboard } from './content/Dashboard';
import { Kontakte } from './content/Kontakte';
import { MailTemplates } from './content/MailTemplates';

import { MsgToIcs } from '../src/components/MsgToIcs';

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
  onColumnCountChange: (count: number) => void;
}

export const ContentArea: React.FC<ContentAreaProps> = (props) => {
  const {
    activeView, setActiveView, onAddContact,
    onEditContact, onAddTemplate, onEditTemplate,
    onOpenSignatureModal, onAddLink, onEditTile, onAddGroup, onEditGroup,
    onOpenReorderGroupsModal, onColumnCountChange,
  } = props;

  const renderContent = () => {
    switch (activeView) {
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
        return <MsgToIcs />;
      default:
        return <Dashboard
          onAddLink={onAddLink}
          onEditTile={onEditTile}
          onAddGroup={onAddGroup}
          onEditGroup={onEditGroup}
          onOpenReorderGroupsModal={onOpenReorderGroupsModal}
          onColumnCountChange={onColumnCountChange}
        />;
    }
  };

  return (
    <div className="w-full flex-1 min-h-0">
      {renderContent()}
    </div>
  );
};
