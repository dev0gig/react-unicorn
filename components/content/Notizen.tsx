import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import JSZip from 'jszip';
import { useNotes } from '../../App';
import type { Note } from '../../types';

interface NotizenProps {
    highlightedNoteId: string | null;
    setHighlightedNoteId: (id: string | null) => void;
}

const applyFormatting = (e: React.KeyboardEvent<HTMLTextAreaElement>, setContent: (value: string) => void) => {
    const shortcuts: { [key: string]: string } = {
        '*': '**', // Bold
        '_': '*',   // Italic
        '~': '~~', // Strikethrough
        '=': '==', // Highlight
    };
    
    const key = e.key;
    if (key in shortcuts) {
        const textarea = e.currentTarget;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;

        if (start !== end) { // If text is selected
            e.preventDefault();
            
            const wrapper = shortcuts[key];
            const selectedText = textarea.value.substring(start, end);
            const newValue = 
                textarea.value.substring(0, start) +
                wrapper +
                selectedText +
                wrapper +
                textarea.value.substring(end);
            
            setContent(newValue);
        }
    }
};

const NoteItem: React.FC<{
  note: Note;
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
}> = ({ note, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(note.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [isEditing]);
  
  // Update internal state if note from context changes (e.g., after import)
  useEffect(() => {
    setEditedContent(note.content);
  }, [note.content]);

  const processedContent = useMemo(() => {
      // Replace ==highlight== with <mark>highlight</mark> for rendering
      let content = note.content.replace(/==(.*?)==/g, '<mark>$1</mark>');
      // Replace #tag with a styled span, only if it's preceded by a space or at the start of the line and not ## or #<space>.
      const tagRegex = /(^|\s)#(?![\s#])([^\s.,;!?:)]+)/g;
      content = content.replace(tagRegex, (match, whitespace, tagName) => {
        return `${whitespace}<span class="note-tag">#${tagName}</span>`;
      });
      return content;
  }, [note.content]);
  
  const handleSave = () => {
    if (note.content !== editedContent) {
      onUpdate(note.id, editedContent);
    }
    setIsEditing(false);
  };
  
  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setEditedContent(e.target.value);
      e.target.style.height = 'auto';
      e.target.style.height = `${e.target.scrollHeight}px`;
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      applyFormatting(e, setEditedContent);
  };

  const formattedDate = new Date(note.lastModified).toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div
      className="bg-neutral-800 p-4 rounded-lg hover:bg-neutral-700/50 transition-colors duration-200"
    >
      {isEditing ? (
        <div className="flex flex-col gap-2">
            <textarea
                ref={textareaRef}
                value={editedContent}
                onChange={handleTextareaInput}
                onKeyDown={handleKeyDown}
                className="w-full p-2 border border-orange-500 rounded-lg focus:ring-1 focus:ring-orange-500 focus:outline-none bg-neutral-700 placeholder-neutral-500 text-neutral-200 resize-y custom-scrollbar"
            />
            <div className="flex justify-end gap-2">
                <button onClick={() => setIsEditing(false)} className="py-1 px-3 rounded-lg text-neutral-300 hover:bg-neutral-600 transition-colors">Abbrechen</button>
                <button onClick={handleSave} className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-1 px-3 rounded-lg transition-all">Speichern</button>
            </div>
        </div>
      ) : (
        <>
            <div className="markdown-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{processedContent}</ReactMarkdown>
            </div>
            <div className="flex justify-between items-center mt-3 pt-2 border-t border-neutral-700/50">
                <span className="text-xs text-neutral-500">{formattedDate}</span>
                <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsEditing(true);
                      }}
                      className="p-1 rounded-full text-neutral-500 hover:text-orange-400 hover:bg-orange-500/10 transition-colors"
                      aria-label="Notiz bearbeiten"
                    >
                      <i className="material-icons text-lg">edit</i>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(note.id);
                      }}
                      className="p-1 rounded-full text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      aria-label="Notiz löschen"
                    >
                      <i className="material-icons text-lg">delete_outline</i>
                    </button>
                </div>
            </div>
        </>
      )}
    </div>
  );
};


export const Notizen: React.FC<NotizenProps> = ({ highlightedNoteId, setHighlightedNoteId }) => {
    const { notes, addNote, updateNote, deleteNote } = useNotes();
    const [isCreatingNewNote, setIsCreatingNewNote] = useState(false);
    const [newNoteContent, setNewNoteContent] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const importFileRef = useRef<HTMLInputElement>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const noteRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
    const notesPerPage = 20;

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedTag]);

    const sortedNotes = useMemo(() => {
        return [...notes].sort((a, b) => b.lastModified - a.lastModified);
    }, [notes]);
    
    const searchedNotes = useMemo(() => {
        if (!searchTerm.trim()) {
            return sortedNotes;
        }
        const searchTermLower = searchTerm.toLowerCase();
        return sortedNotes.filter(note => 
            note.content.toLowerCase().includes(searchTermLower)
        );
    }, [sortedNotes, searchTerm]);

    const filteredNotes = useMemo(() => {
        if (!selectedTag) {
            return searchedNotes;
        }
        
        return searchedNotes.filter(note => {
            const tagRegex = /(^|\s)#(?![\s#])([^\s.,;!?:)]+)/g;
            const matches = note.content.matchAll(tagRegex);
            for (const match of matches) {
                if (`#${match[2]}` === selectedTag) {
                    return true;
                }
            }
            return false;
        });
    }, [searchedNotes, selectedTag]);

    useEffect(() => {
        if (highlightedNoteId) {
            const noteIndex = filteredNotes.findIndex(n => n.id === highlightedNoteId);
            if (noteIndex > -1) {
                const targetPage = Math.floor(noteIndex / notesPerPage) + 1;

                if (currentPage !== targetPage) {
                    setCurrentPage(targetPage);
                    return; 
                }

                const element = noteRefs.current.get(highlightedNoteId);
                if (element) {
                    setTimeout(() => {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        element.classList.add('highlight-note');
                        
                        setTimeout(() => {
                            element.classList.remove('highlight-note');
                            setHighlightedNoteId(null);
                        }, 3000);
                    }, 50);
                } else {
                    setHighlightedNoteId(null);
                }

            } else {
                setHighlightedNoteId(null);
            }
        }
    }, [highlightedNoteId, currentPage, filteredNotes, notesPerPage, setHighlightedNoteId]);


    const triggerImport = () => {
        importFileRef.current?.click();
    };

    const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files) return;

        for (const file of files) {
            if (file.name.endsWith('.md')) {
                const fileName = file.name.replace('.md', '');
                // Improved parsing: looks for YYYY-MM-DD at the start and ignores the rest.
                const dateStringMatch = fileName.match(/^(\d{4}-\d{2}-\d{2})/);
                let noteDate: Date;

                if (dateStringMatch) {
                    const dateString = dateStringMatch[0];
                    const [year, month, day] = dateString.split('-').map(Number);
                    // Create date in local timezone to avoid timezone shift issues.
                    noteDate = new Date(year, month - 1, day);
                } else {
                    console.warn(`Skipping file with invalid name format: ${file.name}`);
                    continue;
                }

                if (isNaN(noteDate.getTime())) {
                    console.warn(`Skipping file with invalid date: ${file.name}`);
                    continue;
                }

                const content = await file.text();
                if (content.trim()) {
                    addNote(content, noteDate.getTime());
                }
            }
        }
        if (event.target) event.target.value = '';
    };

    const handleExportNotes = async () => {
        if (notes.length === 0) {
            alert("Keine Notizen zum Exportieren vorhanden.");
            return;
        }
    
        const zip = new JSZip();
        const dateCounts: Map<string, number> = new Map();
    
        // Sort notes by creation date to ensure consistent naming
        const notesToExport = [...notes].sort((a, b) => a.createdAt - b.createdAt);

        notesToExport.forEach(note => {
            const date = new Date(note.createdAt);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const dateString = `${year}-${month}-${day}`;
    
            const count = dateCounts.get(dateString) || 0;
            
            // First file of the day is 'YYYY-MM-DD.md', subsequent files are 'YYYY-MM-DD-1.md', '-2.md' etc.
            const filename = count > 0 ? `${dateString}-${count}.md` : `${dateString}.md`;
            
            dateCounts.set(dateString, count + 1);
            
            zip.file(filename, note.content);
        });
    
        try {
            const blob = await zip.generateAsync({ type: "blob" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            const timestamp = new Date().toISOString().split('T')[0];
            link.download = `unicorn-notes-export-${timestamp}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        } catch (error) {
            console.error("Fehler beim Erstellen der ZIP-Datei:", error);
            alert("Beim Exportieren der Notizen ist ein Fehler aufgetreten.");
        }
    };


    const handleSaveNewNote = () => {
        if (newNoteContent.trim() === '') return;
        addNote(newNoteContent.trim());
        setNewNoteContent('');
        setIsCreatingNewNote(false);
    };
    
    const handleDiscardNewNote = () => {
        setNewNoteContent('');
        setIsCreatingNewNote(false);
    };
    
    const availableTags = useMemo(() => {
        const tagRegex = /(^|\s)#(?![\s#])([^\s.,;!?:)]+)/g;
        const tagCounts: Record<string, number> = {};
        
        searchedNotes.forEach(note => {
            const matches = note.content.matchAll(tagRegex);
            if (matches) {
                 for (const match of matches) {
                    const tagName = `#${match[2]}`;
                    if (tagName.length > 1) { // at least # and one char
                        tagCounts[tagName] = (tagCounts[tagName] || 0) + 1;
                    }
                }
            }
        });
        
        return Object.entries(tagCounts)
            .sort(([, countA], [, countB]) => countB - countA)
            .map(([tag]) => tag);
    }, [searchedNotes]);

    const paginatedNotes = useMemo(() => {
        const startIndex = (currentPage - 1) * notesPerPage;
        return filteredNotes.slice(startIndex, startIndex + notesPerPage);
    }, [filteredNotes, currentPage, notesPerPage]);

    const totalPages = Math.ceil(filteredNotes.length / notesPerPage);

    return (
        <div className="flex flex-col h-full pt-8 pl-8">
            <div className="flex-shrink-0 flex justify-between items-start mb-6 pr-8">
                <div>
                    <h1 className="text-4xl font-bold text-neutral-100 mb-2">Notizen</h1>
                    <p className="text-neutral-400">Halten Sie hier schnelle Gedanken und wichtige Informationen fest.</p>
                </div>
                <button
                    onClick={() => setIsCreatingNewNote(true)}
                    className="flex items-center bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors shadow-md hover:shadow-lg"
                >
                    <i className="material-icons mr-2 text-base">add_circle</i>
                    Neue Notiz
                </button>
            </div>
            
            <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-6 min-h-0 pr-8 pb-8">
                
                {/* LEFT COLUMN - NOTES */}
                <div className="md:col-span-2 flex flex-col min-h-0">
                    <div className="flex-shrink-0">
                        {isCreatingNewNote && (
                            <div className="mb-4 bg-neutral-800 p-4 rounded-lg border border-orange-500">
                                 <textarea
                                    value={newNoteContent}
                                    onChange={(e) => setNewNoteContent(e.target.value)}
                                    placeholder="Schreiben Sie Ihre Notiz hier... Markdown wird unterstützt."
                                    className="w-full h-32 p-2 bg-neutral-700 text-neutral-200 rounded-lg focus:outline-none resize-y custom-scrollbar"
                                />
                                <div className="flex justify-end gap-2 mt-2">
                                    <button onClick={handleDiscardNewNote} className="py-1 px-3 rounded-lg text-neutral-300 hover:bg-neutral-600">Verwerfen</button>
                                    <button onClick={handleSaveNewNote} className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-1 px-3 rounded-lg">Speichern</button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex-grow overflow-y-auto custom-scrollbar pr-4 -mr-4 min-h-0">
                        <div className="space-y-4">
                            {paginatedNotes.length > 0 ? paginatedNotes.map(note => (
                                <div key={note.id} ref={el => {
                                    if (el) {
                                        noteRefs.current.set(note.id, el);
                                    } else {
                                        noteRefs.current.delete(note.id);
                                    }
                                }}>
                                   <NoteItem note={note} onUpdate={updateNote} onDelete={deleteNote} />
                                </div>
                            )) : (
                                 <div className="text-center py-10 px-4 text-neutral-500 h-full flex flex-col items-center justify-center">
                                    <i className="material-icons text-5xl mb-2">{notes.length === 0 ? 'note_add' : 'search_off'}</i>
                                    <p>{notes.length === 0 ? 'Noch keine Notizen vorhanden.' : 'Keine passenden Notizen gefunden.'}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {totalPages > 1 && (
                        <div className="flex justify-center items-center pt-4 flex-shrink-0">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-700"
                            >
                                <i className="material-icons">chevron_left</i>
                            </button>
                            <span className="text-neutral-400 mx-4">
                                Seite {currentPage} von {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-700"
                            >
                                <i className="material-icons">chevron_right</i>
                            </button>
                        </div>
                    )}
                </div>

                {/* RIGHT COLUMN - TOOLS */}
                <div className="md:col-span-1 flex flex-col gap-4 bg-neutral-800 rounded-2xl p-4 shadow-lg min-h-0">
                    <h3 className="text-lg font-semibold text-neutral-200 px-1 flex-shrink-0">Werkzeuge</h3>
                    
                    <div className="relative flex-shrink-0">
                        <i className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 z-10">search</i>
                        <input
                            type="text"
                            placeholder="Notizen durchsuchen..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg py-2.5 pl-10 pr-10 text-neutral-200 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-neutral-500 hover:text-white hover:bg-neutral-700 transition-colors"
                                aria-label="Suche zurücksetzen"
                            >
                                <i className="material-icons text-lg">close</i>
                            </button>
                        )}
                    </div>

                    <div className="flex-shrink-0 flex gap-2">
                        <button
                            onClick={triggerImport}
                            className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg text-neutral-300 hover:text-white bg-neutral-700/50 hover:bg-neutral-700 transition-colors"
                            title="Markdown-Dateien importieren"
                        >
                            <i className="material-icons text-base">file_upload</i>
                            <span>Import</span>
                        </button>
                        <button
                            onClick={handleExportNotes}
                            className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg text-neutral-300 hover:text-white bg-neutral-700/50 hover:bg-neutral-700 transition-colors"
                            title="Alle Notizen als .md-Dateien (ZIP) exportieren"
                            aria-label="Alle Notizen als ZIP-Archiv exportieren"
                        >
                            <i className="material-icons text-base">file_download</i>
                            <span>Export</span>
                        </button>
                        <input type="file" ref={importFileRef} onChange={handleFileImport} multiple accept=".md" className="hidden" />
                    </div>

                    <hr className="border-neutral-700 flex-shrink-0" />
                    
                    <div className="flex flex-col flex-grow min-h-0">
                        <div className="flex justify-between items-center mb-2 px-1 flex-shrink-0">
                           <h4 className="text-base font-semibold text-neutral-300">Tag-Wolke</h4>
                           {selectedTag && (
                               <button onClick={() => setSelectedTag(null)} className="text-xs text-orange-400 hover:underline">
                                 Filter zurücksetzen
                               </button>
                           )}
                        </div>
                        <div className="flex-grow overflow-y-auto custom-scrollbar pr-1 -mr-1">
                           <div className="flex flex-wrap gap-2">
                                {availableTags.length > 0 ? (
                                    <>
                                        <button
                                            onClick={() => setSelectedTag(null)}
                                            className={`px-3 py-1 text-sm rounded-full transition-colors ${!selectedTag ? 'bg-orange-500 text-white' : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'}`}
                                        >
                                            Alle
                                        </button>
                                        {availableTags.map(tag => (
                                            <button
                                                key={tag}
                                                onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                                                className={`px-3 py-1 text-sm rounded-full transition-colors ${selectedTag === tag ? 'bg-orange-500 text-white' : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'}`}
                                            >
                                                {tag}
                                            </button>
                                        ))}
                                    </>
                                ) : (
                                    <p className="text-xs text-neutral-500 w-full px-1">{searchTerm.trim() ? 'Keine Tags für diese Suche gefunden.' : 'Keine Tags in Notizen gefunden.'}</p>
                                )}
                           </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};