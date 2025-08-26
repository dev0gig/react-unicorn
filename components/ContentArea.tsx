import React from 'react';
import type { ViewName, Contact, Template, Evidenzfall, ToolGroup, ToolLink } from '../types';
import { Dashboard } from './content/Dashboard';
import { Kontakte } from './content/Kontakte';
import { MailTemplates } from './content/MailTemplates';
import { Notizen } from './content/Notizen';
import { Evidenzfaelle } from './content/Evidenzfaelle';
import { Wohnungswirtschaft } from './content/Wohnungswirtschaft';

interface ContentAreaProps {
  activeView: ViewName;
  onAddContact: () => void;
  onEditContact: (contact: Contact) => void;
  onAddTemplate: () => void;
  onEditTemplate: (template: Template, category: string) => void;
  onEditCase: (fall: Evidenzfall) => void;
  onOpenSignatureModal: () => void;
  onAddLink: (link: ToolLink | null, groupTitle?: string) => void;
  onEditTile: (data: { link: ToolLink; group: ToolGroup }) => void;
  onAddGroup: () => void;
  onEditGroup: (group: ToolGroup) => void;
  onOpenHelp: () => void;
}

export const ContentArea: React.FC<ContentAreaProps> = (props) => {
  const { activeView, onAddContact, onEditContact, onAddTemplate, onEditTemplate, onEditCase, onOpenSignatureModal, onAddLink, onEditTile, onAddGroup, onEditGroup, onOpenHelp } = props;
  const renderContent = () => {
    switch (activeView) {
      case 'Dashboard':
        return <Dashboard 
                  onAddLink={onAddLink} 
                  onEditTile={onEditTile}
                  onAddGroup={onAddGroup}
                  onEditGroup={onEditGroup}
                  onOpenHelp={onOpenHelp}
               />;
      case 'Kontakte':
        return <Kontakte onAdd={onAddContact} onEdit={onEditContact} />;
      case 'Mail Vorlagen':
        return <MailTemplates onAdd={onAddTemplate} onEdit={onEditTemplate} onOpenSignatureModal={onOpenSignatureModal} />;
      case 'Notizen':
        return <Notizen />;
      case 'Evidenzfälle':
        return <Evidenzfaelle onEdit={onEditCase} />;
      case 'WiWo-Terminpflege':
        return <Wohnungswirtschaft />;
      default:
        return <Dashboard onAddLink={onAddLink} onEditTile={onEditTile} onAddGroup={onAddGroup} onEditGroup={onEditGroup} onOpenHelp={onOpenHelp} />;
    }
  };

  return (
    <div className="w-full flex-1 min-h-0">
      {renderContent()}
    </div>
  );
};