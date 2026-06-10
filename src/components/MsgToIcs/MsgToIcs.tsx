import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { AppointmentType, ParsedFields } from './types';
import { extractTextFromMsg } from './oleParser';
import { parseMailText, cleanEmailText, isStornoSubject, formatObjbez } from './mailParser';
import { generateAndDownloadIcs } from './icsGenerator';

// ── Toast System ──────────────────────────────────────────────────────────────

interface ToastData {
  id: string;
  type: 'success' | 'error' | 'info';
  title?: string;
  message: string;
}

const ToastItem: React.FC<{ item: ToastData; onClose: (id: string) => void }> = ({ item, onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const rafId = requestAnimationFrame(() => setVisible(true));
    const exitTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onClose(item.id), 350);
    }, 5000);
    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(exitTimer);
    };
  }, [item.id, onClose]);

  const dismiss = useCallback(() => {
    setVisible(false);
    setTimeout(() => onClose(item.id), 350);
  }, [item.id, onClose]);

  const cfg =
    item.type === 'success'
      ? { wrap: 'bg-green-950/95 border-green-600/50', icon: '✅', head: 'text-green-300', body: 'text-green-100' }
      : item.type === 'error'
      ? { wrap: 'bg-red-950/95 border-red-600/50', icon: '⚠️', head: 'text-red-300', body: 'text-red-100' }
      : { wrap: 'bg-blue-950/95 border-blue-600/50', icon: 'ℹ️', head: 'text-blue-300', body: 'text-blue-100' };

  return (
    <div
      className={`transition-all duration-300 ease-out ${
        visible ? 'translate-x-0 opacity-100' : 'translate-x-[120%] opacity-0'
      } ${cfg.wrap} border rounded-xl px-4 py-3 shadow-2xl flex items-start gap-3 w-80`}
    >
      <span className="text-base leading-none mt-0.5 flex-shrink-0">{cfg.icon}</span>
      <div className="flex-1 min-w-0">
        {item.title && (
          <div className={`text-xs font-bold uppercase tracking-widest mb-0.5 ${cfg.head}`}>
            {item.title}
          </div>
        )}
        <div className={`text-sm leading-snug whitespace-pre-line ${cfg.body}`}>{item.message}</div>
      </div>
      <button
        onClick={dismiss}
        className="text-neutral-500 hover:text-neutral-200 transition text-sm flex-shrink-0 ml-1 leading-none"
      >
        ✕
      </button>
    </div>
  );
};

const ToastContainer: React.FC<{ toasts: ToastData[]; onClose: (id: string) => void }> = ({
  toasts,
  onClose,
}) => (
  <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 items-end pointer-events-none">
    {toasts.map((t) => (
      <div key={t.id} className="pointer-events-auto">
        <ToastItem item={t} onClose={onClose} />
      </div>
    ))}
  </div>
);

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
    className={`bg-neutral-900 border rounded-lg p-3 ${fullWidth ? 'col-span-2' : ''} ${
      highlight ? 'border-blue-500/30 bg-blue-950/20' : 'border-neutral-700'
    } ${onClick ? 'cursor-pointer' : ''}`}
    onClick={onClick}
  >
    <div className={`text-xs uppercase tracking-widest mb-1 ${highlight ? 'text-blue-400' : 'text-neutral-500'}`}>
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
  const [zaehlerpunkt, setZaehlerpunkt] = useState('');
  const [selectedType, setSelectedType] = useState<AppointmentType>('FWW');
  const [isStorno, setIsStorno] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [copyFlash, setCopyFlash] = useState(false);
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const toastIdRef = useRef(0);

  // Derive parsed fields live from mailText
  const parsed: ParsedFields = mailText.trim()
    ? parseMailText(mailText)
    : { objbez: null, name: null, date: null, time: null, address: null };
  const formattedObjbez = parsed.objbez ? formatObjbez(parsed.objbez) : null;

  // ── Toast helpers ──────────────────────────────────────────────────────────

  const addToast = useCallback((type: ToastData['type'], message: string, title?: string) => {
    const id = `t${++toastIdRef.current}`;
    setToasts((prev) => [...prev, { id, type, message, title }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ── Parse analysis ─────────────────────────────────────────────────────────

  const fireParseToast = useCallback(
    (body: string) => {
      if (!body.trim()) return;
      const result = parseMailText(body);
      const missing: string[] = [];
      if (!result.name) missing.push('Mietername');
      if (!result.date) missing.push('Datum');
      if (!result.time) missing.push('Uhrzeit');
      if (!result.address) missing.push('Adresse');
      if (!result.objbez) missing.push('Obj.bez.');

      if (missing.length === 0) {
        addToast('success', 'Alle Felder wurden erfolgreich erkannt.', 'Mail geparst ✓');
      } else {
        addToast('error', `Nicht erkannt: ${missing.join(', ')}`, 'Fehlende Felder');
      }
    },
    [addToast],
  );

  // ── File handling ──────────────────────────────────────────────────────────

  const applyExtractedText = useCallback(
    (body: string, subject?: string) => {
      setMailText(body);
      if (subject !== undefined) {
        setIsStorno(isStornoSubject(subject));
      }
      fireParseToast(body);
    },
    [fireParseToast],
  );

  const handleFile = useCallback(
    (file: File) => {
      setFileName(file.name);
      // Neue Mail eingefügt → alle manuellen Eingabefelder leeren
      setKundennummer('');
      setZaehlerpunkt('');
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

  // ── Textarea blur → parse toast for manual input ───────────────────────────

  const handleMailTextBlur = useCallback(() => {
    // Only fire for manually typed text; file loads already trigger via applyExtractedText
    if (!fileName) fireParseToast(mailText);
  }, [mailText, fileName, fireParseToast]);

  // ── ICS generation ────────────────────────────────────────────────────────

  const handleGenerate = useCallback(() => {
    if (!mailText.trim()) {
      addToast('error', 'Bitte zuerst den Mail-Text eingeben oder eine Datei hochladen.');
      return;
    }
    if (!isStorno && !kundennummer.trim()) {
      addToast('error', 'Bitte die Kundennummer eingeben.', 'Pflichtfeld fehlt');
      return;
    }

    const error = generateAndDownloadIcs({
      parsed,
      kundennummer: kundennummer.trim(),
      zaehlerpunkt: zaehlerpunkt.trim(),
      selectedType,
      isStorno,
      mailBody: mailText,
    });

    if (error) {
      addToast('error', error, 'Fehler');
    } else {
      addToast(
        'success',
        `${isStorno ? 'STORNO' : `Kunde: ${kundennummer.trim()} · ${selectedType}`}\nMieter: ${parsed.name}\n${parsed.date} um ${parsed.time} Uhr (25 min)`,
        'ICS erstellt ✓',
      );

      // Individual info toast per cleared field (staggered)
      const cleared = [
        mailText.trim() ? 'Mail-Text' : null,
        kundennummer.trim() ? 'Kundennummer' : null,
        zaehlerpunkt.trim() ? 'Zählerpunkt' : null,
        fileName ? 'Dateiname' : null,
        isStorno ? 'Storno-Status' : null,
      ].filter(Boolean) as string[];

      cleared.forEach((field, i) => {
        setTimeout(() => addToast('info', `${field} wurde geleert`, 'Geleert'), (i + 1) * 220);
      });

      setMailText('');
      setKundennummer('');
      setZaehlerpunkt('');
      setFileName(null);
      setIsStorno(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [mailText, kundennummer, zaehlerpunkt, isStorno, selectedType, parsed, fileName, addToast]);

  // ── Field status (live) ────────────────────────────────────────────────────

  const fieldStatus = [
    { label: 'Mail-Text', filled: !!mailText.trim(), required: true },
    ...(!isStorno
      ? [
          { label: 'Kundennummer', filled: !!kundennummer.trim(), required: true },
          { label: 'Zählerpunkt', filled: !!zaehlerpunkt.trim(), required: false },
        ]
      : []),
  ];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="w-full h-full overflow-hidden" style={{ backgroundColor: 'var(--bg-page)' }}>
      <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 overflow-y-auto lg:overflow-hidden custom-scrollbar">

        {/* ── Spalte 1: Mail-Inhalt (genau halbiert) ── */}
        <div className="flex flex-col gap-4 min-h-0">

          {/* Obere Hälfte: Datei einfügen */}
          <div className="flex-1 min-h-0 bg-neutral-800 border border-neutral-700 rounded-xl p-5 flex flex-col gap-3">
            <div className="text-xs font-semibold text-neutral-100 uppercase tracking-widest flex-shrink-0">
              Mail-Inhalt — Datei einfügen
            </div>
            <div
              className={`flex-1 min-h-0 border-2 border-dashed rounded-lg cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
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
              <div className="text-3xl">📎</div>
              <div className="text-neutral-500 text-sm leading-relaxed text-center">
                <span className="text-neutral-300 font-medium">.msg / .eml Datei hier ablegen</span>
                <br />oder klicken zum Auswählen
              </div>
            </div>
            {fileName && (
              <div className="flex items-center gap-3 px-3 py-2 bg-green-950/30 border border-green-700/40 rounded-lg text-sm flex-shrink-0">
                <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)] flex-shrink-0" />
                <span className="text-neutral-300 truncate">{fileName}</span>
              </div>
            )}
          </div>

          {/* Untere Hälfte: Text einfügen */}
          <div className="flex-1 min-h-0 bg-neutral-800 border border-neutral-700 rounded-xl p-5 flex flex-col gap-3">
            <div className="flex items-center gap-3 text-neutral-600 text-xs tracking-widest flex-shrink-0">
              <span className="flex-1 h-px bg-neutral-700" />
              ODER TEXT DIREKT EINFÜGEN
              <span className="flex-1 h-px bg-neutral-700" />
            </div>
            <textarea
              value={mailText}
              onChange={(e) => {
                setMailText(e.target.value);
                setIsStorno(false);
                if (fileName) setFileName(null);
              }}
              onBlur={handleMailTextBlur}
              placeholder=" Obj.bez.: 0821302 - 003 012&#10;Mietername: DEMIR HASAN&#10;Adresse: 21.,JUSTGASSE 13/3/12&#10;Datum Mietvertragsabschluss: 11.03.2026&#10;Zeit Mietvertragsabschluss: 10:00 Uhr"
              className="flex-1 min-h-0 bg-neutral-900 border border-neutral-600 rounded-lg p-3 text-neutral-200 font-mono text-sm resize-none focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 transition custom-scrollbar placeholder:text-neutral-700"
            />
          </div>
        </div>

        {/* ── Spalte 2: Erkannte Felder + Kundennummer (gleiche Gesamthöhe) ── */}
        <div className="flex flex-col gap-4 min-h-0 mt-4 lg:mt-0">

          {/* Erkannte Felder — natürliche Höhe */}
          <div className="flex-shrink-0 bg-neutral-800 border border-neutral-700 rounded-xl p-5">
            <div className="text-xs font-semibold text-neutral-100 uppercase tracking-widest mb-4">
              Erkannte Felder
            </div>
            <div className="grid grid-cols-2 gap-3">
              <ParsedField label="Obj.bez." value={parsed.objbez} fullWidth />
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

          {/* Kundennummer / Storno — füllt verbleibende Höhe */}
          {isStorno ? (
            <div className="flex-1 min-h-0 bg-red-950/30 border-2 border-red-500/50 rounded-xl p-5 flex items-center gap-4">
              <span className="text-3xl font-bold text-red-400 tracking-widest" style={{ textShadow: '0 0 24px rgba(239,68,68,0.4)' }}>
                STORNO
              </span>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Storno erkannt im Betreff.<br />
                Kein Termin wird erstellt — nur ICS zum Löschen.
              </p>
            </div>
          ) : (
            <div className="flex-1 min-h-0 bg-neutral-800 border border-neutral-700 rounded-xl p-5 flex flex-col justify-center gap-6">
              <div>
                <div className="text-xs font-semibold text-neutral-100 uppercase tracking-widest mb-3">
                  Kundennummer
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={kundennummer}
                    onChange={(e) => setKundennummer(e.target.value)}
                    inputMode="numeric"
                    placeholder="z.B. 4351404105"
                    className="flex-1 bg-neutral-900 border-2 border-red-500/40 rounded-lg p-3 text-red-400 font-bold text-lg focus:outline-none focus:border-red-500/80 focus:ring-2 focus:ring-red-500/20 transition placeholder:text-red-900 placeholder:text-sm placeholder:font-normal"
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
              <div>
                <div className="text-xs font-semibold text-neutral-100 uppercase tracking-widest mb-3">
                  Zählerpunkt
                </div>
                <input
                  type="text"
                  value={zaehlerpunkt}
                  onChange={(e) => setZaehlerpunkt(e.target.value)}
                  placeholder="z.B. AT0010000000000000000000000123456"
                  className="w-full bg-neutral-900 border-2 border-red-500/40 rounded-lg p-3 text-red-400 font-bold text-lg focus:outline-none focus:border-red-500/80 focus:ring-2 focus:ring-red-500/20 transition placeholder:text-red-900 placeholder:text-sm placeholder:font-normal"
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Spalte 3: Feldstatus (Inhalt unten) + ICS-Button ── */}
        <div className="flex flex-col gap-4 min-h-0 mt-4 lg:mt-0">

          {/* Feldstatus — füllt den Platz, Items von unten */}
          <div className="flex-1 min-h-0 bg-neutral-800/60 border border-neutral-700 rounded-xl p-5 flex flex-col">
            <div className="text-xs font-semibold text-neutral-400 uppercase tracking-widest flex-shrink-0">
              Feldstatus
            </div>
            <div className="flex-1 flex flex-col justify-end gap-2">
              {fieldStatus.map((f) => (
                <div
                  key={f.label}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm font-medium transition ${
                    f.filled
                      ? 'bg-green-950/40 border-green-700/40 text-green-300'
                      : f.required
                      ? 'bg-red-950/40 border-red-700/40 text-red-300'
                      : 'bg-neutral-900/60 border-neutral-700 text-neutral-400'
                  }`}
                >
                  <span className="font-bold text-base leading-none w-4 text-center flex-shrink-0">
                    {f.filled ? '✓' : f.required ? '✗' : '○'}
                  </span>
                  <span className="flex-1">{f.label}</span>
                  {!f.filled && (
                    <span className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded ${
                      f.required ? 'bg-red-900/50 text-red-400' : 'bg-neutral-800 text-neutral-500'
                    }`}>
                      {f.required ? 'Pflicht' : 'Optional'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ICS Button */}
          <button
            onClick={handleGenerate}
            disabled={isStorno}
            className="flex-shrink-0 w-full py-5 rounded-xl bg-orange-500 hover:bg-orange-400 text-black font-bold text-base tracking-wide transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(249,115,22,0.3)] disabled:bg-neutral-700 disabled:text-neutral-500 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none flex items-center justify-center gap-2"
          >
            <i className="material-icons text-xl">event</i>
            ICS Datei generieren &amp; herunterladen
          </button>
        </div>

      </div>

      {/* Toast container — fixed top-right */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
};
