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

export const TextGenerator: React.FC = () => {
    const [contactMethod, setContactMethod] = useState('Mail');
    const [idThrough, setIdThrough] = useState('');
    const [ticketNumber, setTicketNumber] = useState('');
    const [sdStatus, setSdStatus] = useState('SD aktuell');
    const [customerIssue, setCustomerIssue] = useState('');
    const [suggestion, setSuggestion] = useState('');
    const [initials, setInitials] = useState(() => localStorage.getItem('unicorn-hk-initials') || '');

    const [isCopied, setIsCopied] = useState(false);
    const copyTimeoutRef = useRef<number | null>(null);
    
    useEffect(() => {
        localStorage.setItem('unicorn-hk-initials', initials);
    }, [initials]);

    const generatedText = useMemo(() => {
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
    }, [contactMethod, idThrough, ticketNumber, sdStatus, customerIssue, suggestion, initials]);

    const handleCopy = () => {
        if (!generatedText || !navigator.clipboard) return;
        navigator.clipboard.writeText(generatedText).then(() => {
            setIsCopied(true);
            if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
            copyTimeoutRef.current = window.setTimeout(() => setIsCopied(false), 2000);
        });
    };
    
    const handleReset = () => {
        setContactMethod('Mail');
        setIdThrough('');
        setTicketNumber('');
        setSdStatus('SD aktuell');
        setCustomerIssue('');
        setSuggestion('');
        // Initials are intentionally not reset to persist them.
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
                        value={contactMethod}
                        onChange={(e) => setContactMethod(e.target.value)}
                        options={['Mail', 'Persönlich', 'Telefonisch']}
                     />
                     <InputField
                        id="ticket-number"
                        label="Ticketnummer"
                        value={ticketNumber}
                        onChange={(e) => setTicketNumber(e.target.value)}
                        placeholder="z.B. T123456"
                     />
                     <InputField
                        id="id-through"
                        label="ID durch"
                        value={idThrough}
                        onChange={(e) => setIdThrough(e.target.value)}
                        placeholder="GP, VK, Ausweis..."
                     />
                     <DropdownField
                        id="sd-status"
                        label="SD geprüft"
                        value={sdStatus}
                        onChange={(e) => setSdStatus(e.target.value)}
                        options={['SD aktuell', 'SD vergessen', 'SD nicht geprüft']}
                     />
                     <TextareaField
                        id="customer-issue"
                        label="Kundenanliegen"
                        value={customerIssue}
                        onChange={(e) => setCustomerIssue(e.target.value)}
                        placeholder="Was ist das Problem des Kunden?"
                     />
                     <TextareaField
                        id="suggestion"
                        label="Vorschlag / Lösung"
                        value={suggestion}
                        onChange={(e) => setSuggestion(e.target.value)}
                        placeholder="Was wurde vorgeschlagen oder getan?"
                     />
                     <InputField
                        id="initials"
                        label="Kürzel"
                        value={initials}
                        onChange={(e) => setInitials(e.target.value)}
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