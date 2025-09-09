import React, { useState, useEffect, useMemo, useRef } from 'react';

const InputField: React.FC<{
    id: string;
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
}> = ({ id, label, value, onChange, placeholder }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-neutral-300 mb-1.5">{label}</label>
        <input
            id={id}
            type="text"
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            autoComplete="off"
            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg py-2 px-3 text-neutral-200 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all"
        />
    </div>
);

const TextareaField: React.FC<{
    id: string;
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    placeholder?: string;
    rows?: number;
}> = ({ id, label, value, onChange, placeholder, rows = 3 }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-neutral-300 mb-1.5">{label}</label>
        <textarea
            id={id}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            rows={rows}
            autoComplete="off"
            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg py-2 px-3 text-neutral-200 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all resize-y custom-scrollbar"
        />
    </div>
);

const DropdownField: React.FC<{
    id: string;
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    options: string[];
}> = ({ id, label, value, onChange, options }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-neutral-300 mb-1.5">{label}</label>
        <select
            id={id}
            value={value}
            onChange={onChange}
            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg py-2 px-3 text-neutral-200 focus:outline-none focus:ring-1 focus:ring-orange-500"
        >
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
    </div>
);

const STORAGE_KEY = 'unicorn-hk-generator-data';

export const TextGenerator: React.FC = () => {
    const [formData, setFormData] = useState(() => {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
            try {
                return JSON.parse(savedData);
            } catch (e) {
                console.error("Failed to parse HK Generator data from localStorage", e);
            }
        }
        // Migration from old initials storage for backward compatibility
        const savedInitials = localStorage.getItem('unicorn-hk-initials');
        return {
            contactMethod: 'Mail',
            idThrough: '',
            ticketNumber: '',
            sdStatus: 'SD aktuell',
            customerIssue: '',
            suggestion: '',
            initials: savedInitials || '',
        };
    });

    const [isCopied, setIsCopied] = useState(false);
    const copyTimeoutRef = useRef<number | null>(null);
    
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    }, [formData]);

    const generatedText = useMemo(() => {
        const { contactMethod, idThrough, ticketNumber, sdStatus, customerIssue, suggestion, initials } = formData;
        const parts = [];
        if (contactMethod) parts.push(contactMethod);
        if (ticketNumber.trim()) parts.push(ticketNumber.trim());
        if (idThrough.trim()) parts.push(`ID durch ${idThrough.trim()}`);
        if (sdStatus) parts.push(sdStatus);

        const issueAndSuggestion = [];
        if (customerIssue.trim()) issueAndSuggestion.push(customerIssue.trim());
        if (suggestion.trim()) issueAndSuggestion.push(suggestion.trim());
        
        if (issueAndSuggestion.length > 0) {
            parts.push(issueAndSuggestion.join(' ; '));
        }
        
        let result = parts.join(' | ');

        if (initials.trim()) {
            result += ` <${initials.trim()}>`;
        }
        
        return result.trim();
    }, [formData]);

    const handleCopy = () => {
        if (!generatedText || !navigator.clipboard) return;
        navigator.clipboard.writeText(generatedText).then(() => {
            setIsCopied(true);
            if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
            copyTimeoutRef.current = window.setTimeout(() => setIsCopied(false), 2000);
        });
    };
    
    const handleReset = () => {
        setFormData((prev: any) => ({
            contactMethod: 'Mail',
            idThrough: '',
            ticketNumber: '',
            sdStatus: 'SD aktuell',
            customerIssue: '',
            suggestion: '',
            initials: prev.initials, // Keep initials
        }));
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        // Convert kebab-case id to camelCase state key (e.g., 'contact-method' -> 'contactMethod')
        const key = id.replace(/-(\w)/g, (_, letter) => letter.toUpperCase());
        setFormData((prev: any) => ({ ...prev, [key]: value }));
    };

    useEffect(() => {
        return () => {
            if (copyTimeoutRef.current) {
                clearTimeout(copyTimeoutRef.current);
            }
        };
    }, []);

    return (
        <div className="flex flex-col h-full pt-8 pl-8">
            <div className="flex-shrink-0 flex justify-between items-start mb-8 pr-8">
                <div>
                    <h1 className="text-4xl font-bold text-neutral-100 mb-2">HK - Generator</h1>
                    <p className="text-neutral-400">Erstellen Sie schnell formatierte Textbausteine für Ihre Notizen.</p>
                </div>
            </div>
            
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-0 pr-8 pb-8">
                {/* Input Column */}
                <div className="bg-neutral-800 rounded-2xl p-6 shadow-lg flex flex-col space-y-4">
                     <h2 className="text-xl font-bold text-orange-400 border-b border-neutral-700 pb-2">Eingabefelder</h2>
                     <DropdownField
                        id="contact-method"
                        label="Kontaktaufnahme"
                        value={formData.contactMethod}
                        onChange={handleChange}
                        options={['Mail', 'Persönlich', 'Telefonisch']}
                     />
                     <InputField
                        id="ticket-number"
                        label="Ticketnummer"
                        value={formData.ticketNumber}
                        onChange={handleChange}
                        placeholder="z.B. T123456"
                     />
                     <InputField
                        id="id-through"
                        label="ID durch"
                        value={formData.idThrough}
                        onChange={handleChange}
                        placeholder="GP, VK, Ausweis..."
                     />
                     <DropdownField
                        id="sd-status"
                        label="SD geprüft"
                        value={formData.sdStatus}
                        onChange={handleChange}
                        options={['SD aktuell', 'SD vergessen', 'SD nicht geprüft', 'SD Prüf. nicht möglich']}
                     />
                     <TextareaField
                        id="customer-issue"
                        label="Kundenanliegen"
                        value={formData.customerIssue}
                        onChange={handleChange}
                        placeholder="Was ist das Problem des Kunden?"
                     />
                     <TextareaField
                        id="suggestion"
                        label="Vorschlag / Lösung"
                        value={formData.suggestion}
                        onChange={handleChange}
                        placeholder="Was wurde vorgeschlagen oder getan?"
                     />
                     <InputField
                        id="initials"
                        label="Kürzel"
                        value={formData.initials}
                        onChange={handleChange}
                        placeholder="Ihre Initialen"
                     />
                </div>
                
                {/* Output Column */}
                <div className="bg-neutral-800 rounded-2xl p-6 shadow-lg flex flex-col">
                    <h2 className="text-xl font-bold text-orange-400 border-b border-neutral-700 pb-2 mb-4">Generierter Text</h2>
                    <div className="flex-grow bg-neutral-900 rounded-lg p-4">
                        <textarea
                            readOnly
                            value={generatedText}
                            className="w-full h-full bg-transparent text-neutral-300 resize-none focus:outline-none custom-scrollbar"
                            placeholder="Hier erscheint der generierte Text..."
                        />
                    </div>
                    <div className="flex gap-4 mt-4">
                        <button
                            onClick={handleCopy}
                            disabled={!generatedText}
                            className="flex-1 flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors shadow-md disabled:bg-neutral-600 disabled:cursor-not-allowed"
                        >
                           <i className="material-icons mr-2">{isCopied ? 'check' : 'content_copy'}</i>
                           <span>{isCopied ? 'Kopiert!' : 'Kopieren'}</span>
                        </button>
                        <button
                            onClick={handleReset}
                            className="flex-1 flex items-center justify-center bg-neutral-700 hover:bg-neutral-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors shadow-md"
                        >
                           <i className="material-icons mr-2">refresh</i>
                           <span>Zurücksetzen</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};