import React, { useState, useEffect } from 'react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: ExportOptions) => void;
}

interface ExportOptions {
    dashboard: boolean;
    favorites: boolean;
    faelle: boolean;
    notes: boolean;
    contacts: boolean;
    templates: boolean;
    signatures: boolean;
}

const Checkbox: React.FC<{ label: string; checked: boolean; onChange: (checked: boolean) => void; }> = ({ label, checked, onChange }) => (
    <label className="flex items-center space-x-3 p-3 bg-neutral-900/50 rounded-lg cursor-pointer hover:bg-neutral-700/50 transition-colors">
        <div className={`w-5 h-5 border-2 rounded flex-shrink-0 flex items-center justify-center ${checked ? 'bg-orange-500 border-orange-500' : 'border-neutral-600'}`}>
            {checked && <i className="material-icons text-white text-sm">check</i>}
        </div>
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="sr-only" />
        <span className="text-neutral-200">{label}</span>
    </label>
);


export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, onExport }) => {
  const [options, setOptions] = useState<ExportOptions>({
    dashboard: true,
    favorites: true,
    faelle: true,
    notes: true,
    contacts: true,
    templates: true,
    signatures: true,
  });

  const handleOptionChange = (key: keyof ExportOptions, value: boolean) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };
  
  const handleSelectAll = (checked: boolean) => {
      setOptions({ dashboard: checked, favorites: checked, faelle: checked, notes: checked, contacts: checked, templates: checked, signatures: checked });
  }

  const allSelected = Object.values(options).every(Boolean);
  const isAnySelected = Object.values(options).some(Boolean);

  const handleSubmit = () => {
    if (isAnySelected) {
      onExport(options);
    } else {
      alert("Bitte wählen Sie mindestens eine Kategorie zum Exportieren aus.");
    }
  };
  
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <div
            className="bg-neutral-800 rounded-2xl shadow-2xl w-full max-w-md flex flex-col border border-neutral-700"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-center justify-between p-4 border-b border-neutral-700 flex-shrink-0">
              <div className="flex items-center">
                 <i className="material-icons text-2xl text-orange-400 mr-3">download</i>
                 <h2 className="text-xl font-bold text-neutral-100">Backup erstellen (Export)</h2>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-full text-neutral-400 hover:bg-neutral-700 hover:text-white transition-colors"
                aria-label="Schließen"
              >
                <i className="material-icons">close</i>
              </button>
            </header>
            
            <div className="p-6 space-y-4">
                <p className="text-neutral-300">Wählen Sie die Daten aus, die Sie in einer JSON-Datei sichern möchten.</p>
                
                <div className="space-y-2">
                    <Checkbox label="Dashboard" checked={options.dashboard} onChange={(c) => handleOptionChange('dashboard', c)} />
                    <Checkbox label="Favoriten" checked={options.favorites} onChange={(c) => handleOptionChange('favorites', c)} />
                    <Checkbox label="Evidenzfälle (inkl. Archiv)" checked={options.faelle} onChange={(c) => handleOptionChange('faelle', c)} />
                    <Checkbox label="Notizen" checked={options.notes} onChange={(c) => handleOptionChange('notes', c)} />
                    <Checkbox label="Kontakte" checked={options.contacts} onChange={(c) => handleOptionChange('contacts', c)} />
                    <Checkbox label="Mail Vorlagen" checked={options.templates} onChange={(c) => handleOptionChange('templates', c)} />
                    <Checkbox label="Signaturen" checked={options.signatures} onChange={(c) => handleOptionChange('signatures', c)} />
                </div>

                <div className="pt-2">
                    <Checkbox label="Alles auswählen" checked={allSelected} onChange={handleSelectAll} />
                </div>
            </div>

            <footer className="flex justify-end items-center p-4 bg-neutral-900/50 rounded-b-2xl">
              <button
                onClick={onClose}
                className="mr-3 py-2 px-4 rounded-lg text-neutral-300 hover:bg-neutral-700 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleSubmit}
                disabled={!isAnySelected}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-6 rounded-lg transition-all duration-200 flex items-center disabled:bg-neutral-600 disabled:cursor-not-allowed"
              >
                <i className="material-icons mr-2 text-base">file_download</i>
                Exportieren
              </button>
            </footer>
          </div>
        </div>
      )}
    </>
  );
};