import React, { useState, useEffect, useCallback, useRef } from 'react';

// Helper function to format a date object into an iCalendar-compatible UTC string
const toIcsDate = (date: Date): string => {
  return date.toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z';
};

// Helper function to fold long lines according to RFC 5545
const foldLine = (line: string): string => {
  const maxLen = 72; // Conservative line length
  let result = '';
  while (line.length > maxLen) {
    result += line.substring(0, maxLen) + '\r\n ';
    line = line.substring(maxLen);
  }
  result += line;
  return result;
};

// Helper function to trigger file download
const downloadFile = (filename: string, content: string) => {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

interface ParsedData {
  objBez: string;
  mietername: string;
  datum: string;
  zeit: string;
}

export const Wohnungswirtschaft: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [fwwNumber, setFwwNumber] = useState('');
  const [transformedObjBez, setTransformedObjBez] = useState('');
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  
  const copyTimeoutRef = useRef<number | null>(null);
  const transformedInputRef = useRef<HTMLInputElement>(null);

  const parseContractText = useCallback((text: string): ParsedData | null => {
    if (!text.trim()) return null;

    const objBezRegex = /Obj\.bez\.:\s*([\d\s]+)\s*-\s*(.+)/;
    const mieternameRegex = /Mietername:\s*(.*)/;
    const datumRegex = /\s*(\d{2}\.\d{2}\.\d{4})/;
    const zeitRegex = /\s*(\d{2}:\d{2})\s*Uhr/;

    const objBezMatch = text.match(objBezRegex);
    const mieternameMatch = text.match(mieternameRegex);
    const datumMatch = text.match(datumRegex);
    const zeitMatch = text.match(zeitRegex);

    if (objBezMatch && mieternameMatch && datumMatch && zeitMatch) {
      return {
        objBez: `984/${objBezMatch[1].trim()}/${objBezMatch[2].trim()}`,
        mietername: mieternameMatch[1].trim(),
        datum: datumMatch[1].trim(),
        zeit: zeitMatch[1].trim(),
      };
    }
    return null;
  }, []);

  useEffect(() => {
    const data = parseContractText(inputText);
    setParsedData(data);
    if (data) {
      setTransformedObjBez(data.objBez);
      setError(null);
    } else {
      setTransformedObjBez('');
      if (inputText.trim()) {
        setError("Die Daten konnten nicht aus dem Text extrahiert werden. Bitte überprüfen Sie das Format.");
      } else {
        setError(null);
      }
    }
  }, [inputText, parseContractText]);

  const handleCopyClick = useCallback(() => {
    if (!transformedObjBez || !navigator.clipboard) return;

    transformedInputRef.current?.select(); // Select text

    navigator.clipboard.writeText(transformedObjBez).then(() => {
      setIsCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = window.setTimeout(() => setIsCopied(false), 2000);
    });
  }, [transformedObjBez]);

  const handleClearClick = () => {
    setInputText('');
    setFwwNumber('');
    setError(null);
  };

  const handleGenerateClick = () => {
    if (!parsedData) {
      setError("Die Daten sind ungültig. Bitte füllen Sie das Vertragstextfeld korrekt aus.");
      return;
    }

    const [day, month, year] = parsedData.datum.split('.');
    const [hours, minutes] = parsedData.zeit.split(':');
    const startDate = new Date(`${year}-${month}-${day}T${hours}:${minutes}:00`);
    
    if (isNaN(startDate.getTime())) {
        setError("Das extrahierte Datum oder die Zeit ist ungültig.");
        return;
    }

    const endDate = new Date(startDate.getTime() + 25 * 60 * 1000);

    const uid = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}@unicorn.app`;
    const dtstamp = toIcsDate(new Date());

    let description = inputText.replace(/\r\n/g, '\n');
    let htmlDescription = description.replace(/\n/g, '<br>');

    if(fwwNumber.trim()){
      description = `${fwwNumber.trim()}\n------\n${description}`;
      htmlDescription = `<div style="font-size:50px; font-weight:bold; color:red;">${fwwNumber.trim()}</div><div>------</div>${htmlDescription}`;
    }
    
    description = description.replace(/\n/g, '\\n');

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//UnicornApp//ICS Generator//DE',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${toIcsDate(startDate)}`,
      `DTEND:${toIcsDate(endDate)}`,
      foldLine(`SUMMARY:${parsedData.mietername}`),
      foldLine(`DESCRIPTION:${description}`),
      foldLine(`X-ALT-DESC;FMTTYPE=text/html:<html><body>${htmlDescription}</body></html>`),
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const filename = `Mietvertrag_${parsedData.mietername.replace(/\s+/g, '_')}.ics`;
    downloadFile(filename, icsContent);
  };
  
   useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="w-full h-full flex items-center justify-center p-4 sm:p-8 bg-neutral-900 overflow-y-auto custom-scrollbar">
        <div className="w-full max-w-2xl">
            <div className="bg-neutral-800 rounded-xl border border-neutral-700 shadow-2xl shadow-orange-900/10">
                <div className="p-6">
                    <h1 className="text-2xl font-bold text-orange-400">ICS Kalenderdatei-Generator</h1>
                </div>

                <div className="p-6 space-y-5">
                    <div>
                        <label htmlFor="contract-text" className="block text-sm font-medium text-neutral-300 mb-1">Mailtext</label>
                        <textarea
                            id="contract-text"
                            rows={9}
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            className="w-full bg-neutral-900 border border-neutral-600 rounded-md p-3 text-neutral-200 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none custom-scrollbar transition"
                            placeholder="Fügen Sie hier den Text ein..."
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-1">
                             <label htmlFor="transformed-obj" className="block text-sm font-medium text-neutral-300">Transformierte Obj.bez.</label>
                             {isCopied && <span className="text-sm text-green-400 transition-opacity duration-300">Kopiert!</span>}
                        </div>
                        <input
                            id="transformed-obj"
                            type="text"
                            readOnly
                            ref={transformedInputRef}
                            value={transformedObjBez}
                            onClick={handleCopyClick}
                            className="w-full bg-neutral-700/50 border border-neutral-600 rounded-md p-3 text-neutral-200 font-mono text-sm cursor-pointer focus:outline-none"
                            placeholder="Wird automatisch generiert..."
                            title="Klicken zum Kopieren"
                        />
                    </div>
                    
                    <div>
                        <label htmlFor="fww-number" className="block text-sm font-medium text-neutral-300 mb-1">FWW-Kdnr u. GP</label>
                         <input
                            id="fww-number"
                            type="text"
                            value={fwwNumber}
                            onChange={(e) => setFwwNumber(e.target.value)}
                            className="w-full bg-neutral-900 border border-neutral-600 rounded-md p-3 text-neutral-200 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
                            placeholder="Nur Nummer eingeben..."
                        />
                    </div>

                    {error && (
                        <div className="bg-red-900/50 border border-red-700 text-red-300 text-sm rounded-md p-3" role="alert">
                            {error}
                        </div>
                    )}
                </div>

                <div className="border-t border-neutral-700 p-6">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={handleGenerateClick}
                            disabled={!parsedData}
                            className="w-full sm:w-auto flex-grow flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-orange-600 hover:bg-orange-700 text-white font-semibold transition shadow disabled:bg-neutral-600 disabled:cursor-not-allowed"
                        >
                            <i className="material-icons">download</i>
                            <span>.ics Datei generieren</span>
                        </button>
                         <button
                            onClick={handleClearClick}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-red-600/80 hover:bg-red-600 text-white font-semibold transition shadow"
                         >
                            <i className="material-icons">delete</i>
                            <span>Löschen</span>
                         </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};