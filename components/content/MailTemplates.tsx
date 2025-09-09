import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useTemplates, useSignatures } from '../../App';
import type { Template } from '../../types';

interface MailTemplatesProps {
    onAdd: () => void;
    onEdit: (template: Template, category: string) => void;
    onOpenSignatureModal: () => void;
}

const Toast: React.FC<{ message: string; onDismiss: () => void; }> = ({ message, onDismiss }) => {
    useEffect(() => {
        const timer = setTimeout(onDismiss, 3000);
        return () => clearTimeout(timer);
    }, [onDismiss]);

    return (
        <div
            className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center justify-center px-6 py-3 bg-green-500 text-white rounded-full shadow-lg z-50 cursor-pointer"
            onClick={onDismiss}
        >
            <i className="material-icons mr-2">check_circle</i>
            <span className="font-semibold">{message}</span>
        </div>
    );
};


export const MailTemplates: React.FC<MailTemplatesProps> = ({ onAdd, onEdit, onOpenSignatureModal }) => {
    const { templateGroups, deleteTemplate } = useTemplates();
    const { signatures, activeSignatureId, setActiveSignatureId } = useSignatures();
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const { selectedTemplate, selectedCategory } = useMemo(() => {
        if (!selectedTemplateId) {
            return { selectedTemplate: null, selectedCategory: null };
        }
        for (const group of templateGroups) {
            const template = group.templates.find(t => t.id === selectedTemplateId);
            if (template) {
                return { selectedTemplate: template, selectedCategory: group.category };
            }
        }
        return { selectedTemplate: null, selectedCategory: null }; // Not found
    }, [selectedTemplateId, templateGroups]);

    const filteredTemplateGroups = useMemo(() => {
        if (!searchTerm.trim()) {
            return templateGroups;
        }
        const lowercasedFilter = searchTerm.toLowerCase();
        return templateGroups
            .map(group => {
                const filteredTemplates = group.templates.filter(
                    template =>
                        template.title.toLowerCase().includes(lowercasedFilter) ||
                        template.content.toLowerCase().includes(lowercasedFilter)
                );
                return filteredTemplates.length > 0 ? { ...group, templates: filteredTemplates } : null;
            })
            .filter((group): group is NonNullable<typeof group> => group !== null);
    }, [searchTerm, templateGroups]);

    useEffect(() => {
        // 1. Check if the current selection is still valid and visible in the filtered list
        const isSelectedVisible = selectedTemplateId && filteredTemplateGroups.some(g => g.templates.some(t => t.id === selectedTemplateId));

        if (isSelectedVisible) {
            return; // Selection is good, do nothing.
        }

        // 2. If not, try to select the first available template in the filtered list
        if (filteredTemplateGroups.length > 0 && filteredTemplateGroups[0].templates.length > 0) {
            const firstGroup = filteredTemplateGroups[0];
            const firstTemplate = firstGroup.templates[0];
            setSelectedTemplateId(firstTemplate.id);
        } else {
            // 3. If there's nothing to select, clear the selection
            setSelectedTemplateId(null);
        }
    }, [filteredTemplateGroups, selectedTemplateId]);

    const handleSelectTemplate = (template: Template, category: string) => {
        setSelectedTemplateId(template.id);
    };

    const handleCopy = () => {
        if (!selectedTemplate) return;
        const { content, title } = selectedTemplate;
        
        const activeSignature = signatures.find(sig => sig.id === activeSignatureId);
        
        let textToCopy = content;
        let toastMsg = `Vorlage "${title}" kopiert!`;

        if (activeSignature && activeSignature.content.trim() !== '') {
            textToCopy += `\n\n${activeSignature.content}`;
            toastMsg = `Vorlage "${title}" inkl. Signatur kopiert!`;
        }

        navigator.clipboard.writeText(textToCopy).then(() => {
            setToastMessage(toastMsg);
        }).catch(err => {
            console.error("Kopieren fehlgeschlagen:", err);
            setToastMessage("Fehler beim Kopieren");
        });
    };

    return (
        <div className="flex flex-col h-full pt-8 pl-8">
            <div className="flex-shrink-0 flex justify-between items-start mb-6 pr-8">
                <div>
                    <h1 className="text-4xl font-bold text-neutral-100 mb-2">Mail Vorlagen</h1>
                    <p className="text-neutral-400">Wählen Sie eine Vorlage. Klicken Sie in die Vorschau, um den Text zu kopieren.</p>
                </div>
                <div className="flex items-center gap-3">
                     <button
                        onClick={onOpenSignatureModal}
                        className="flex items-center bg-neutral-700 hover:bg-neutral-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors shadow-md hover:shadow-lg"
                    >
                        <i className="material-icons mr-2 text-base">edit_note</i>
                        Signaturen
                    </button>
                    <button
                        onClick={onAdd}
                        className="flex items-center bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors shadow-md hover:shadow-lg"
                    >
                        <i className="material-icons mr-2 text-base">add</i>
                        Neue Vorlage
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 flex-shrink-0 pr-8">
                <div className="relative md:col-span-2">
                    <i className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 z-10">search</i>
                    <input
                        type="text"
                        placeholder="Vorlagen suchen..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg py-2.5 pl-10 pr-4 text-neutral-200 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all duration-200"
                    />
                </div>
                <div className="relative md:col-span-1">
                     <i className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 z-10">draw</i>
                    <select
                        id="signature-select"
                        value={activeSignatureId || ''}
                        onChange={e => setActiveSignatureId(e.target.value || null)}
                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg py-2.5 pl-10 pr-4 text-neutral-200 focus:outline-none focus:ring-1 focus:ring-orange-500 appearance-none"
                         aria-label="Aktive Signatur auswählen"
                    >
                        <option value="">Keine Signatur</option>
                        {signatures.map(sig => (
                        <option key={sig.id} value={sig.id}>{sig.title}</option>
                        ))}
                    </select>
                    <i className="material-icons absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 z-10 pointer-events-none">expand_more</i>
                </div>
            </div>


            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-0 pr-8 pb-8">
                <div className="flex flex-col min-h-0">
                    <div className="overflow-y-auto pr-4 custom-scrollbar">
                        <div className="space-y-4">
                            {filteredTemplateGroups.length > 0 ? (
                                filteredTemplateGroups.map(group => (
                                    <div key={group.category} className="bg-neutral-800/50 rounded-lg overflow-hidden transition-colors duration-300 border border-neutral-700">
                                        <div
                                            className="w-full flex items-center justify-between p-4 text-left"
                                        >
                                            <h2 className="text-lg font-bold text-neutral-100">{group.category}</h2>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 p-4 pt-0">
                                            {group.templates.map(template => (
                                                <button
                                                    key={template.id}
                                                    onClick={() => handleSelectTemplate(template, group.category)}
                                                    className={`flex items-center justify-center text-center p-3 h-20 rounded-lg transition-all duration-200 text-sm line-clamp-4 border ${
                                                        selectedTemplateId === template.id
                                                            ? 'bg-neutral-700/50 border-orange-500 text-white font-semibold shadow-lg'
                                                            : 'bg-neutral-800 border-neutral-700 hover:bg-neutral-700 text-neutral-300'
                                                    }`}
                                                    title={template.title}
                                                >
                                                    {template.title}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    )
                                )
                            ) : (
                                <div className="text-center py-10 px-4 text-neutral-500">
                                    <i className="material-icons text-5xl mb-2">search_off</i>
                                    <p>Keine Vorlagen gefunden.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-neutral-800 rounded-2xl p-4 flex flex-col h-full relative">
                    {selectedTemplate && selectedCategory && (
                         <div className="absolute top-3 right-3 flex gap-2 z-10">
                            <button
                                onClick={() => onEdit(selectedTemplate, selectedCategory)}
                                className="p-2 rounded-full text-neutral-400 hover:bg-neutral-700 hover:text-white transition-colors"
                                title="Vorlage bearbeiten"
                            >
                                <i className="material-icons text-lg">edit</i>
                            </button>
                            <button
                                onClick={() => deleteTemplate(selectedCategory, selectedTemplate.id)}
                                className="p-2 rounded-full text-neutral-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                                title="Vorlage löschen"
                            >
                                <i className="material-icons text-lg">delete</i>
                            </button>
                        </div>
                    )}
                    <h3 className="text-lg font-semibold text-neutral-200 mb-3 flex-shrink-0 pr-24">
                        Vorschau: <span className="text-orange-400">{selectedTemplate?.title || 'Keine Auswahl'}</span>
                    </h3>
                    <div className="flex-grow bg-neutral-900 rounded-md overflow-hidden">
                        <textarea
                            readOnly
                            value={selectedTemplate?.content ?? 'Wählen Sie eine Vorlage aus der Liste aus.'}
                            onClick={handleCopy}
                            className="w-full h-full bg-transparent text-neutral-300 p-4 resize-none focus:outline-none cursor-pointer custom-scrollbar"
                            title="Klicken zum Kopieren"
                        />
                    </div>
                </div>
            </div>
            
            {toastMessage && <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />}
        </div>
    );
};
