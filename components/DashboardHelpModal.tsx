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
                    <p>Ein <strong>Rechtsklick</strong> auf eine Kachel öffnet ein Menü mit allen wichtigen Aktionen:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                        <li><strong>Favoriten:</strong> Links zu Ihren Favoriten hinzufügen oder entfernen.</li>
                        <li><strong>Bearbeiten:</strong> Name und URL des Links sowie Titel und Icon der Gruppe ändern.</li>
                        <li><strong>Löschen:</strong> Den Link dauerhaft entfernen.</li>
                    </ul>
                </HelpItem>

                <HelpItem icon="add_circle" title="Inhalte hinzufügen">
                    <p>Klicken Sie oben rechts auf den Button <span className="inline-flex items-center bg-orange-500/80 text-white text-xs px-1.5 py-0.5 rounded-md">Link hinzufügen</span>. In diesem Dialog können Sie einen Link erstellen und ihn einer bestehenden Gruppe zuweisen oder direkt eine neue Gruppe anlegen.</p>
                    <p className="mt-2">Sie können auch mit der rechten Maustaste auf eine Kachel klicken, um einen Link zur selben Gruppe hinzuzufügen.</p>
                </HelpItem>
                
                <HelpItem icon="drag_indicator" title="Anordnen">
                     <p>Klicken und ziehen Sie eine Kachel, um die Anordnung auf dem Dashboard zu ändern.</p>
                </HelpItem>
                
                <HelpItem icon="emoji_emotions" title="Gruppen-Icons">
                    <p>
                        Beim Anlegen oder Bearbeiten einer Gruppe können Sie einen Icon-Namen festlegen. Eine vollständige Liste finden Sie auf der <a href="https://fonts.google.com/icons?selected=Material+Icons" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline">Google Fonts Webseite</a>.
                    </p>
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