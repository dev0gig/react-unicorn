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
                    <p>Das Dashboard zeigt Ihre Links als Kacheln an. Ein Klick öffnet den Link in einem neuen Tab.</p>
                </HelpItem>

                <HelpItem icon="mouse" title="Interaktion mit Kacheln">
                    <p>Ein <strong>Rechtsklick</strong> auf eine Kachel öffnet ein Menü mit Aktionen für diesen Link:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                        <li><strong>Favoriten:</strong> Link zu Ihren Favoriten hinzufügen oder entfernen.</li>
                        <li><strong>Bearbeiten:</strong> Name, URL und Gruppenzugehörigkeit des Links ändern.</li>
                        <li><strong>Löschen:</strong> Den Link dauerhaft entfernen.</li>
                        <li><strong>Link hinzufügen:</strong> Einen weiteren Link zur selben Gruppe hinzufügen.</li>
                    </ul>
                </HelpItem>

                <HelpItem icon="add_circle" title="Inhalte hinzufügen">
                    <p>In jeder Gruppenüberschrift finden Sie einen <i className="material-icons text-sm align-middle">add</i> Button, um einen neuen Link direkt zu dieser Gruppe hinzuzufügen.</p>
                </HelpItem>

                <HelpItem icon="category" title="Gruppen verwalten">
                    <p>Die Gruppenliste in der linken Seitenleiste bietet mehrere Verwaltungsoptionen:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                        <li><strong>Hinzufügen:</strong> Erstellen Sie eine neue, leere Gruppe mit dem <i className="material-icons text-sm align-middle">add</i> Button neben der "Gruppen"-Überschrift.</li>
                        <li><strong>Bearbeiten:</strong> Fahren Sie mit der Maus über einen Gruppennamen und klicken Sie auf das erscheinende <i className="material-icons text-sm align-middle">edit</i> Icon, um Titel, Icon und Farbe zu ändern oder die Gruppe zu löschen.</li>
                    </ul>
                </HelpItem>

                <HelpItem icon="drag_handle" title="Anordnen per Drag & Drop">
                    <p>Sie können sowohl einzelne Kacheln (innerhalb ihrer Gruppe) als auch ganze Gruppen in der Seitenleiste per Drag & Drop verschieben. Fahren Sie mit der Maus über eine Gruppe und ziehen Sie sie am erscheinenden <i className="material-icons text-sm align-middle">drag_indicator</i> Icon, um die Reihenfolge zu ändern.</p>
                </HelpItem>
                
                 <HelpItem icon="star" title="Favoriten verwalten">
                    <p>Fügen Sie Ihre wichtigsten Links über das Rechtsklick-Menü zu den Favoriten hinzu. Sie können Ihre Favoriten jederzeit über den <span className="inline-flex items-center text-yellow-400 text-sm font-medium">Favoriten</span>-Button in der linken Seitenleiste aufrufen.</p>
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