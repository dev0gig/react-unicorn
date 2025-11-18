import React, { useEffect } from 'react';

interface DashboardHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpItem: React.FC<{ icon: string; title: string; children: React.ReactNode; }> = ({ icon, title, children }) => (
    <div className="flex items-start gap-4">
        <i className="material-icons text-2xl text-orange-400 mt-1 flex-shrink-0">{icon}</i>
        <div>
            <h4 className="font-bold text-neutral-100">{title}</h4>
            <div className="text-neutral-300 text-sm">{children}</div>
        </div>
    </div>
);

export const DashboardHelpModal: React.FC<DashboardHelpModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
        window.addEventListener('keydown', handleEsc);
    }
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <div
            className="bg-neutral-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col border border-neutral-700"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-center justify-between p-4 border-b border-neutral-700 flex-shrink-0">
              <div className="flex items-center">
                 <i className="material-icons text-2xl text-orange-400 mr-3">help_outline</i>
                 <h2 className="text-xl font-bold text-neutral-100">Dashboard-Anleitung</h2>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-full text-neutral-400 hover:bg-neutral-700 hover:text-white transition-colors"
                aria-label="Schließen"
              >
                <i className="material-icons">close</i>
              </button>
            </header>

            <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                <HelpItem icon="apps" title="Grundlagen">
                    <p>Das Dashboard zeigt Ihre Links in thematischen Gruppen an. Ein Klick auf einen Link öffnet diesen in einem neuen Tab.</p>
                </HelpItem>

                <HelpItem icon="mouse" title="Interaktion mit Links">
                     <p>Fahren Sie mit der Maus über einen Link, um rechts ein Menü mit Aktionen anzuzeigen:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                        <li><strong>Favoriten:</strong> Link zu Ihren Favoriten hinzufügen oder entfernen.</li>
                        <li><strong>Bearbeiten:</strong> Name, URL und Gruppenzugehörigkeit des Links ändern.</li>
                        <li><strong>Löschen:</strong> Den Link dauerhaft entfernen.</li>
                    </ul>
                </HelpItem>

                <HelpItem icon="category" title="Gruppen verwalten">
                    <p>Fahren Sie mit der Maus über eine Gruppenüberschrift, um Verwaltungsoptionen anzuzeigen:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                        <li><strong>Hinzufügen:</strong> Klicken Sie auf das <i className="material-icons text-sm align-middle">add</i> Icon, um einen neuen Link zur Gruppe hinzuzufügen.</li>
                        <li><strong>Bearbeiten:</strong> Klicken Sie auf das <i className="material-icons text-sm align-middle">edit</i> Icon, um Titel und Icon der Gruppe zu ändern oder die gesamte Gruppe zu löschen.</li>
                         <li><strong>Neue Gruppe:</strong> Nutzen Sie den Button <span className="inline-flex items-center bg-neutral-700 px-2 py-0.5 rounded-md text-sm font-semibold"><i className="material-icons text-sm mr-1">create_new_folder</i>Neue Gruppe</span> oben rechts, um eine neue Gruppe zu erstellen.</li>
                    </ul>
                </HelpItem>

                <HelpItem icon="drag_handle" title="Anordnen per Drag & Drop">
                     <p>Sie können einzelne Links per Drag & Drop innerhalb ihrer Gruppe neu anordnen oder sie in eine andere Gruppe ziehen, um sie neu zuzuordnen.</p>
                </HelpItem>
                
                 <HelpItem icon="star" title="Favoriten verwalten">
                    <p>Fügen Sie Ihre wichtigsten Links über das Hover-Menü zu den Favoriten hinzu. Sie können Ihre Favoriten jederzeit über den <span className="inline-flex items-center text-yellow-400 text-sm font-medium">Favoriten</span>-Button in der linken Seitenleiste aufrufen.</p>
                </HelpItem>

            </div>

            <footer className="flex justify-end items-center p-4 bg-neutral-900/50 rounded-b-2xl">
              <button
                onClick={onClose}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-6 rounded-lg transition-all"
              >
                Verstanden
              </button>
            </footer>
          </div>
        </div>
      )}
    </>
  );
};