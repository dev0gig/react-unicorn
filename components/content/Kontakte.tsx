import React, { useState, useMemo, useEffect } from 'react';
import { useContacts } from '../../App';
import type { Contact } from '../../types';

interface KontakteProps {
    onAdd: () => void;
    onEdit: (contact: Contact) => void;
}

const InfoLine: React.FC<{ icon: string; text: string; href?: string }> = ({ icon, text, href }) => {
    if (!text || text.trim() === '-') return null;

    const content = href ? (
        <a href={href} className="text-orange-400 hover:underline whitespace-pre-wrap break-words">{text}</a>
    ) : (
        <p className="whitespace-pre-wrap break-words">{text}</p>
    );

    return (
        <div className="flex items-start text-neutral-300 mb-3">
            <i className="material-icons text-xl mr-4 mt-0.5 text-neutral-500 flex-shrink-0">{icon}</i>
            <div className="min-w-0">{content}</div>
        </div>
    );
};


export const Kontakte: React.FC<KontakteProps> = ({ onAdd, onEdit }) => {
    const { contacts, deleteContact } = useContacts();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedContactId, setSelectedContactId] = useState<string | null>(null);

    const sortedContacts = useMemo(() =>
        [...contacts].sort((a, b) => a.name.localeCompare(b.name)),
        [contacts]);

    const filteredContacts = useMemo(() =>
        sortedContacts.filter(contact =>
            contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            contact.nummer.toLowerCase().includes(searchTerm.toLowerCase()) ||
            contact.mail.toLowerCase().includes(searchTerm.toLowerCase())
        ), [sortedContacts, searchTerm]);

    useEffect(() => {
        if (!selectedContactId && filteredContacts.length > 0) {
            setSelectedContactId(filteredContacts[0].id);
        } else {
            const isSelectedContactInList = filteredContacts.some(c => c.id === selectedContactId);
            if (!isSelectedContactInList) {
                setSelectedContactId(filteredContacts.length > 0 ? filteredContacts[0].id : null);
            }
        }
    }, [filteredContacts, selectedContactId]);

    const selectedContact = useMemo(() =>
        contacts.find(contact => contact.id === selectedContactId),
        [contacts, selectedContactId]);

    return (
        <div className="flex flex-col h-full pt-8 pl-8">
            <div className="flex-shrink-0 flex justify-between items-start mb-8 pr-8">
                <div>
                    <h1 className="text-4xl font-bold text-neutral-100 mb-2">Kontakte</h1>
                    <p className="text-neutral-400">Verwalten Sie Ihre geschäftlichen und privaten Kontakte.</p>
                </div>
                <button
                    onClick={onAdd}
                    className="flex items-center bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors shadow-md hover:shadow-lg">
                    <i className="material-icons mr-2 text-base">add</i>
                    Neuer Kontakt
                </button>
            </div>

            <div className="flex-grow flex flex-col md:flex-row gap-6 min-h-0 pr-8 pb-8">

                <div className="md:w-1/3 flex flex-col bg-neutral-800 rounded-2xl p-4 shadow-lg min-h-0">
                    <div className="relative mb-4 flex-shrink-0">
                        <i className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 z-10">search</i>
                        <input
                            type="text"
                            placeholder="Kontakte suchen..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg py-2.5 pl-10 pr-4 text-neutral-200 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all duration-200"
                        />
                    </div>
                    <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar min-h-0">
                        {filteredContacts.length > 0 ? (
                            <ul className="space-y-2">
                                {filteredContacts.map(contact => (
                                    <li
                                        key={contact.id}
                                        onClick={() => setSelectedContactId(contact.id)}
                                        className={`flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 ${selectedContactId === contact.id ? 'bg-orange-500/20' : 'hover:bg-neutral-700/50'}`}
                                        aria-current={selectedContactId === contact.id}
                                    >
                                        <div className="flex-shrink-0 w-10 h-10 bg-neutral-700 rounded-full flex items-center justify-center">
                                            {contact.logoUrl && contact.logoUrl.trim() !== '-' ? (
                                                <img src={contact.logoUrl} alt={`${contact.name} logo`} className="w-full h-full rounded-full object-cover" />
                                            ) : (
                                                <i className="material-icons text-2xl text-neutral-500">business</i>
                                            )}
                                        </div>
                                        <span className="ml-3 font-medium text-neutral-200 truncate">{contact.name}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-center py-10 px-4 text-neutral-500">
                                <i className="material-icons text-5xl mb-2">search_off</i>
                                <p>Keine Kontakte gefunden.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="md:w-2/3 bg-neutral-800 rounded-2xl shadow-lg overflow-y-auto custom-scrollbar relative">
                    {selectedContact ? (
                        <>
                            <div className="absolute top-4 right-4 flex gap-2">
                                <button
                                    onClick={() => onEdit(selectedContact)}
                                    className="p-2 rounded-full text-neutral-400 hover:bg-neutral-700 hover:text-white transition-colors"
                                    title="Kontakt bearbeiten"
                                >
                                    <i className="material-icons">edit</i>
                                </button>
                                <button
                                    onClick={() => {
                                        if (window.confirm('Möchten Sie diesen Kontakt wirklich löschen?')) {
                                            deleteContact(selectedContact.id);
                                        }
                                    }}
                                    className="p-2 rounded-full text-neutral-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                                    title="Kontakt löschen"
                                >
                                    <i className="material-icons">delete</i>
                                </button>
                            </div>
                            <div className="p-8">
                                <div className="flex flex-col sm:flex-row items-center mb-8">
                                    <div className="flex-shrink-0 w-28 h-28 bg-neutral-700 rounded-full flex items-center justify-center border-4 border-neutral-600 mb-4 sm:mb-0 sm:mr-6">
                                        {selectedContact.logoUrl && selectedContact.logoUrl.trim() !== '-' ? (
                                            <img src={selectedContact.logoUrl} alt={`${selectedContact.name} logo`} className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            <i className="material-icons text-6xl text-neutral-500">business</i>
                                        )}
                                    </div>
                                    <h2 className="text-3xl font-bold text-neutral-100 text-center sm:text-left">{selectedContact.name}</h2>
                                </div>
                                <div className="space-y-3">
                                    <InfoLine icon="call" text={selectedContact.nummer} />
                                    <InfoLine icon="email" text={selectedContact.mail} href={selectedContact.mail && selectedContact.mail.trim() !== '-' ? `mailto:${selectedContact.mail}` : undefined} />
                                    <InfoLine icon="location_on" text={selectedContact.adresse} />
                                    {selectedContact.notizen && selectedContact.notizen.trim() !== '' && selectedContact.notizen.trim() !== '-' && (
                                        <>
                                            <hr className="border-neutral-700 my-4" />
                                            <InfoLine icon="sticky_note_2" text={selectedContact.notizen} />
                                        </>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-neutral-600 p-8">
                            <i className="material-icons text-7xl mb-4">contacts</i>
                            <h3 className="text-xl font-semibold">Kein Kontakt ausgewählt</h3>
                            <p className="text-neutral-500 text-center">Suchen und wählen Sie einen Kontakt aus der Liste, um die Details anzuzeigen.</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};