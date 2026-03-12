import React, { useState, useCallback, useRef } from 'react';
import type { AppointmentType, ParsedFields } from './types';
import { extractTextFromMsg } from './oleParser';
import { parseMailText, cleanEmailText, isStornoSubject, formatObjbez } from './mailParser';
import { generateAndDownloadIcs } from './icsGenerator';

// ── Parsed preview field ─────────────────────────────────────────────────────

interface ParsedFieldProps {
  label: string;
  value: string | null;
  fullWidth?: boolean;
  onClick?: () => void;
  highlight?: boolean;
}

const ParsedField: React.FC<ParsedFieldProps> = ({ label, value, fullWidth, onClick, highlight }) => (
  <div
    className={`bg-neutral-900 border rounded-lg p-3 ${
      fullWidth ? 'col-span-2' : ''
    } ${highlight ? 'border-blue-500/30 bg-blue-950/20' : 'border-neutral-700'} ${
      onClick ? 'cursor-pointer' : ''
    }`}
    onClick={onClick}
  >
    <div
      className={`text-xs uppercase tracking-widest mb-1 ${
        highlight ? 'text-blue-400' : 'text-neutral-500'
      }`}
    >
      {label}
    </div>
    <div
      className={`text-sm font-mono font-medium ${
        value ? (highlight ? 'text-blue-300' : 'text-orange-400') : 'text-red-400 italic'
      }`}
    >
      {value || 'Nicht gefunden'}
    </div>
  </div>
);

// ── Main component ───────────────────────────────────────────────────────────

export const MsgToIcs: React.FC = () => {
  const [mailText, setMailText] = useState('');
  const [kundennummer, setKundennummer] = useState('');
  const [selectedType, setSelectedType] = useState<AppointmentType>('FWW');
  const [isStorno, setIsStorno] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [copyFlash, setCopyFlash] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derive parsed fields live from mailText
  const parsed: ParsedFields = mailText.trim() ? parseMailText(mailText) : { objbez: null, name: null, date: null, time: null, address: null };
  const formattedObjbez = parsed.objbez ? formatObjbez(parsed.objbez) : null;

  // ── File handling ──────────────────────────────────────────────────────────

  const applyExtractedText = useCallback((body: string, subject?: string) => {
    setMailText(body);
    if (subject !== undefined) {
      setIsStorno(isStornoSubject(subject));
    }
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      setFileName(file.name);
      setStatus(null);
      const ext = file.name.split('.').pop()?.toLowerCase();
      const reader = new FileReader();

      if (ext === 'msg') {
        reader.onload = (e) => {
          const result = extractTextFromMsg(e.target!.result as ArrayBuffer);
          if (result && typeof result === 'object') {
            applyExtractedText(result.body, result.subject);
          } else {
            applyExtractedText((result as string) || '');
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        reader.onload = (e) => {
          applyExtractedText(cleanEmailText(e.target!.result as string));
        };
        reader.readAsText(file, 'utf-8');
      }
    },
    [applyExtractedText],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    },
    [handleFile],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.[0]) handleFile(e.target.files[0]);
    },
    [handleFile],
  );

  // ── Copy obj.bez ──────────────────────────────────────────────────────────

  const handleCopyObjbez = useCallback(() => {
    if (!formattedObjbez) return;
    navigator.clipboard.writeText(formattedObjbez).then(() => {
      setCopyFlash(true);
      setTimeout(() => setCopyFlash(false), 600);
    });
  }, [formattedObjbez]);

  // ── ICS generation ────────────────────────────────────────────────────────

  const handleGenerate = useCallback(() => {
    if (!mailText.trim()) {
      setStatus({ type: 'error', msg: '⚠️ Bitte zuerst den Mail-Text eingeben oder eine Datei hochladen.' });
      return;
    }
    if (!isStorno && !kundennummer.trim()) {
      setStatus({ type: 'error', msg: '⚠️ Bitte die Kundennummer eingeben.' });
      return;
    }

    const error = generateAndDownloadIcs({
      parsed,
      kundennummer: kundennummer.trim(),
      selectedType,
      isStorno,
      mailBody: mailText,
    });

    if (error) {
      setStatus({ type: 'error', msg: `⚠️ ${error}` });
    } else {
      setStatus({
        type: 'success',
        msg: `✅ ICS erstellt!\n  ${isStorno ? '⚠️ STORNO' : `Kunde: ${kundennummer.trim()} - ${selectedType}`}\n  Mieter: ${parsed.name}\n  Am: ${parsed.date} um ${parsed.time} Uhr  (25 min)`,
      });
    }
  }, [mailText, kundennummer, isStorno, selectedType, parsed]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="w-full h-full overflow-y-auto custom-scrollbar p-4 sm:p-8" style={{ backgroundColor: 'var(--bg-page)' }}>
      <div className="max-w-5xl mx-auto space-y-5">

        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-neutral-100 mb-2">WiWo-Terminpflege</h1>
          <p className="text-neutral-400">Outlook-Mails automatisch in Kalendertermine umwandeln.</p>
        </div>

        {/* ① Kundennummer / Storno */}
        {isStorno ? (
          <div className="bg-red-950/30 border-2 border-red-500/50 rounded-xl p-5 flex items-center gap-4">
            <span className="text-3xl font-bold text-red-400 tracking-widest" style={{ textShadow: '0 0 24px rgba(239,68,68,0.4)' }}>
              STORNO
            </span>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Storno erkannt im Betreff.<br />
              Kein Termin wird erstellt — nur ICS zum Löschen.
            </p>
          </div>
        ) : (
          <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-5">
            <div className="text-xs font-semibold text-neutral-100 uppercase tracking-widest mb-3">
              ① Kundennummer — manuell eingeben
            </div>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={kundennummer}
                onChange={(e) => setKundennummer(e.target.value)}
                inputMode="numeric"
                placeholder="z.B. 4351404105"
                className="flex-1 bg-neutral-900 border-2 border-red-500/40 rounded-lg p-3 text-red-400 font-bold text-xl focus:outline-none focus:border-red-500/80 focus:ring-2 focus:ring-red-500/20 transition placeholder:text-red-900 placeholder:text-sm placeholder:font-normal"
              />
              <span className="text-red-400 font-bold text-2xl select-none">-</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedType('EC')}
                  className={`px-4 py-2 rounded-lg border-2 font-bold text-sm transition ${
                    selectedType === 'EC'
                      ? 'border-red-500 bg-red-500/10 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.2)]'
                      : 'border-red-500/20 text-red-500/40 hover:border-red-500/50 hover:text-red-500/60'
                  }`}
                >
                  EC
                </button>
                <button
                  onClick={() => setSelectedType('FWW')}
                  className={`px-4 py-2 rounded-lg border-2 font-bold text-sm transition ${
                    selectedType === 'FWW'
                      ? 'border-red-500 bg-red-500/10 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.2)]'
                      : 'border-red-500/20 text-red-500/40 hover:border-red-500/50 hover:text-red-500/60'
                  }`}
                >
                  FWW
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ② + ③ Two-column row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* ② Mail Input */}
          <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-5 flex flex-col gap-4">
            <div className="text-xs font-semibold text-neutral-100 uppercase tracking-widest">
              ② Mail-Inhalt — Datei oder Text einfügen
            </div>

            {/* Dropzone */}
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition relative ${
                isDragging
                  ? 'border-orange-400 bg-orange-400/5'
                  : 'border-neutral-600 hover:border-orange-400/50 hover:bg-orange-400/5'
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".msg,.eml,.txt"
                className="hidden"
                onChange={handleFileInput}
              />
              <div className="text-2xl mb-2">📎</div>
              <div className="text-neutral-500 text-sm leading-relaxed">
                <span className="text-neutral-300 font-medium">.msg / .eml Datei hier ablegen</span>
                <br />oder klicken zum Auswählen
              </div>
            </div>

            {/* File loaded indicator */}
            {fileName && (
              <div className="flex items-center gap-3 px-3 py-2 bg-green-950/30 border border-green-700/40 rounded-lg text-sm">
                <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)] flex-shrink-0" />
                <span className="text-neutral-300 truncate">{fileName}</span>
              </div>
            )}

            {/* Divider */}
            <div className="flex items-center gap-3 text-neutral-600 text-xs tracking-widest">
              <span className="flex-1 h-px bg-neutral-700" />
              ODER TEXT DIREKT EINFÜGEN
              <span className="flex-1 h-px bg-neutral-700" />
            </div>

            {/* Textarea */}
            <textarea
              value={mailText}
              onChange={(e) => {
                setMailText(e.target.value);
                setIsStorno(false);
              }}
              rows={8}
              placeholder=" Obj.bez.: 0821302 - 003 012&#10;Mietername: DEMIR HASAN&#10;Adresse: 21.,JUSTGASSE 13/3/12&#10;Datum Mietvertragsabschluss: 11.03.2026&#10;Zeit Mietvertragsabschluss: 10:00 Uhr"
              className="w-full flex-1 bg-neutral-900 border border-neutral-600 rounded-lg p-3 text-neutral-200 font-mono text-sm resize-y focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 transition custom-scrollbar placeholder:text-neutral-700"
            />
          </div>

          {/* ③ Erkannte Felder */}
          <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-5">
            <div className="text-xs font-semibold text-neutral-100 uppercase tracking-widest mb-4">
              ③ Erkannte Felder
            </div>
            <div className="grid grid-cols-2 gap-3">
              <ParsedField label="Obj.bez." value={parsed.objbez} fullWidth />

              {/* Formatted obj.bez — click to copy */}
              <div
                className={`col-span-2 border rounded-lg p-3 cursor-pointer transition ${
                  copyFlash
                    ? 'bg-green-900/30 border-green-500/50'
                    : 'bg-blue-950/20 border-blue-500/30 hover:bg-blue-950/30'
                }`}
                onClick={handleCopyObjbez}
                title="Klicken zum Kopieren"
              >
                <div className="text-xs uppercase tracking-widest mb-1 text-blue-400">
                  Obj.bez. formatiert — klicken zum Kopieren
                </div>
                <div className={`text-sm font-mono font-medium ${formattedObjbez ? 'text-blue-300' : 'text-neutral-600 italic'}`}>
                  {formattedObjbez || '—'}
                </div>
              </div>

              <ParsedField label="Titel (Mietername)" value={parsed.name} />
              <ParsedField label="Datum" value={parsed.date} />
              <ParsedField label="Uhrzeit (Start)" value={parsed.time} />
              <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-3">
                <div className="text-xs uppercase tracking-widest mb-1 text-neutral-500">Dauer (fix)</div>
                <div className="text-sm font-mono font-medium text-orange-400">25 Minuten</div>
              </div>
              <ParsedField label="Adresse / Ort" value={parsed.address} fullWidth />
            </div>
          </div>
        </div>

        {/* Status */}
        {status && (
          <div
            className={`rounded-lg px-4 py-3 text-sm whitespace-pre-line ${
              status.type === 'error'
                ? 'bg-red-950/40 border border-red-700/50 text-red-300'
                : 'bg-green-950/40 border border-green-700/50 text-green-300'
            }`}
          >
            {status.msg}
          </div>
        )}

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={isStorno}
          className="w-full py-4 rounded-xl bg-orange-500 hover:bg-orange-400 text-black font-bold text-base tracking-wide transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(249,115,22,0.3)] disabled:bg-neutral-700 disabled:text-neutral-500 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none flex items-center justify-center gap-2"
        >
          <i className="material-icons text-xl">event</i>
          ICS Datei generieren &amp; herunterladen
        </button>

        {/* Footer */}
        <p className="text-center text-xs text-neutral-600 pb-4">
          Alle Daten bleiben lokal in deinem Browser · Keine Serververbindung · Wiener Wohnen
        </p>

      </div>
    </div>
  );
};
