import React, { useState, useCallback, useEffect } from 'react';

// ── Default options ─────────────────────────────────────────────────────────

const defaultKontaktartOptions = [
  { value: 'tel', label: 'Telefon', icon: 'call' },
  { value: 'mail', label: 'Mail', icon: 'mail' },
  { value: 'persönlich', label: 'Persönlich', icon: 'person' },
];

const defaultSdOptions = [
  { value: 'aktuell', label: 'aktuell' },
  { value: 'nicht aktuell', label: 'nicht aktuell' },
  { value: 'vergessen', label: 'vergessen' },
  { value: 'aktualisiert', label: 'aktualisiert' },
];

const defaultIdOptions = [
  { value: 'gp', label: 'GP' },
  { value: 'vk', label: 'VK' },
];

// ── localStorage helpers ────────────────────────────────────────────────────

interface CustomOption { value: string; label: string; icon?: string }

function loadCustomOptions(key: string): CustomOption[] {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch { return []; }
}

function saveCustomOptions(key: string, options: CustomOption[]) {
  localStorage.setItem(key, JSON.stringify(options));
}

// ── Add-button inline input ─────────────────────────────────────────────────

const AddOptionInput: React.FC<{
  onAdd: (label: string) => void;
  onCancel: () => void;
}> = ({ onAdd, onCancel }) => {
  const [value, setValue] = useState('');
  return (
    <div className="flex gap-2">
      <input
        autoFocus
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && value.trim()) onAdd(value.trim());
          if (e.key === 'Escape') onCancel();
        }}
        placeholder="Name..."
        className="flex-1 bg-neutral-900 border border-neutral-600 rounded-lg px-3 py-2 text-neutral-200 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 transition placeholder:text-neutral-600"
      />
      <button
        onClick={() => value.trim() && onAdd(value.trim())}
        className="px-2.5 rounded-lg border border-green-600 text-green-400 hover:bg-green-500/10 transition"
      >
        <i className="material-icons" style={{ fontSize: '18px' }}>check</i>
      </button>
      <button
        onClick={onCancel}
        className="px-2.5 rounded-lg border border-neutral-600 text-neutral-400 hover:bg-neutral-700 transition"
      >
        <i className="material-icons" style={{ fontSize: '18px' }}>close</i>
      </button>
    </div>
  );
};

// ── Component ───────────────────────────────────────────────────────────────

export const HkGenerator: React.FC = () => {
  const [kontaktart, setKontaktart] = useState('tel');
  const [telefonnummer, setTelefonnummer] = useState('');
  const [sdStatus, setSdStatus] = useState('aktuell');
  const [idMethode, setIdMethode] = useState('gp');
  const [anliegen, setAnliegen] = useState('');
  const [kuerzel, setKuerzel] = useState(() => localStorage.getItem('hk-kuerzel') || '');
  const [copied, setCopied] = useState(false);

  // Custom options from localStorage
  const [customKontaktart, setCustomKontaktart] = useState<CustomOption[]>(() => loadCustomOptions('hk-custom-kontaktart'));
  const [customSd, setCustomSd] = useState<CustomOption[]>(() => loadCustomOptions('hk-custom-sd'));
  const [customId, setCustomId] = useState<CustomOption[]>(() => loadCustomOptions('hk-custom-id'));

  // Adding state
  const [addingTo, setAddingTo] = useState<'kontaktart' | 'sd' | 'id' | null>(null);

  // Per-field enable/disable
  const [fieldEnabled, setFieldEnabled] = useState<{ kontaktart: boolean; sd: boolean; id: boolean }>(() => {
    try {
      const saved = localStorage.getItem('hk-field-enabled');
      return saved ? JSON.parse(saved) : { kontaktart: true, sd: true, id: true };
    } catch { return { kontaktart: true, sd: true, id: true }; }
  });

  // Tab: 'generator' or 'history'
  const [tab, setTab] = useState<'generator' | 'history'>('generator');
  const [historySearch, setHistorySearch] = useState('');
  const [toggledDays, setToggledDays] = useState<Set<string>>(new Set());

  // Merged options
  const allKontaktart = [...defaultKontaktartOptions, ...customKontaktart];
  const allSd = [...defaultSdOptions, ...customSd];
  const allId = [...defaultIdOptions, ...customId];

  // History (migrate old string[] format to new {text, timestamp} format)
  const [history, setHistory] = useState<{ text: string; timestamp: number }[]>(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('hk-history') || '[]');
      if (raw.length > 0 && typeof raw[0] === 'string') {
        return raw.map((text: string) => ({ text, timestamp: Date.now() }));
      }
      return raw;
    } catch { return []; }
  });

  // Persist
  useEffect(() => { localStorage.setItem('hk-kuerzel', kuerzel); }, [kuerzel]);
  useEffect(() => { localStorage.setItem('hk-history', JSON.stringify(history)); }, [history]);
  useEffect(() => { saveCustomOptions('hk-custom-kontaktart', customKontaktart); }, [customKontaktart]);
  useEffect(() => { saveCustomOptions('hk-custom-sd', customSd); }, [customSd]);
  useEffect(() => { saveCustomOptions('hk-custom-id', customId); }, [customId]);
  useEffect(() => { localStorage.setItem('hk-field-enabled', JSON.stringify(fieldEnabled)); }, [fieldEnabled]);

  // ── Add / Remove custom options ───────────────────────────────────────────

  const addCustomOption = useCallback((category: 'kontaktart' | 'sd' | 'id', label: string) => {
    const val = label.toLowerCase().replace(/\s+/g, '_');
    const opt: CustomOption = { value: val, label, icon: 'label' };
    if (category === 'kontaktart') setCustomKontaktart(prev => [...prev, opt]);
    else if (category === 'sd') setCustomSd(prev => [...prev, opt]);
    else setCustomId(prev => [...prev, opt]);
    setAddingTo(null);
  }, []);

  const removeCustomOption = useCallback((category: 'kontaktart' | 'sd' | 'id', value: string) => {
    if (category === 'kontaktart') {
      setCustomKontaktart(prev => prev.filter(o => o.value !== value));
      if (kontaktart === value) setKontaktart('tel');
    } else if (category === 'sd') {
      setCustomSd(prev => prev.filter(o => o.value !== value));
      if (sdStatus === value) setSdStatus('aktuell');
    } else {
      setCustomId(prev => prev.filter(o => o.value !== value));
      if (idMethode === value) setIdMethode('gp');
    }
  }, [kontaktart, sdStatus, idMethode]);

  const isCustom = useCallback((category: 'kontaktart' | 'sd' | 'id', value: string) => {
    if (category === 'kontaktart') return customKontaktart.some(o => o.value === value);
    if (category === 'sd') return customSd.some(o => o.value === value);
    return customId.some(o => o.value === value);
  }, [customKontaktart, customSd, customId]);

  const toggleField = useCallback((field: 'kontaktart' | 'sd' | 'id') => {
    setFieldEnabled(prev => ({ ...prev, [field]: !prev[field] }));
  }, []);

  // ── Build output string ─────────────────────────────────────────────────

  const buildOutput = useCallback((): string => {
    const anliegenTeil = anliegen.trim() || 'kundenanliegen';
    const kuerzelTeil = kuerzel.trim() || 'XX';
    const parts: string[] = [];
    if (fieldEnabled.kontaktart) {
      const tel = telefonnummer.trim();
      const kontaktLabel = allKontaktart.find(o => o.value === kontaktart)?.label.toLowerCase() || kontaktart;
      parts.push(tel ? `lt ${kontaktLabel} ${tel}` : `lt ${kontaktLabel}`);
    }
    if (fieldEnabled.sd) {
      const sdLabel = allSd.find(o => o.value === sdStatus)?.label || sdStatus;
      parts.push(`sd ${sdLabel}`);
    }
    if (fieldEnabled.id) {
      const idLabel = allId.find(o => o.value === idMethode)?.label.toLowerCase() || idMethode;
      parts.push(`id.${idLabel}`);
    }
    if (parts.length > 0) {
      return `${parts.join(' | ')} - ${anliegenTeil} -${kuerzelTeil}`;
    }
    return `${anliegenTeil} -${kuerzelTeil}`;
  }, [kontaktart, telefonnummer, sdStatus, idMethode, anliegen, kuerzel, fieldEnabled, allKontaktart, allSd, allId]);

  const output = buildOutput();

  // ── Copy ────────────────────────────────────────────────────────────────

  const handleCopy = useCallback(() => {
    if (!anliegen.trim()) return;
    navigator.clipboard.writeText(output).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      setHistory(prev => {
        const filtered = prev.filter(h => h.text !== output);
        return [{ text: output, timestamp: Date.now() }, ...filtered].slice(0, 20);
      });
      setTelefonnummer('');
      setAnliegen('');
    });
  }, [output, anliegen]);

  const handleCopyHistoryItem = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
  }, []);

  const clearHistory = useCallback(() => {
    if (window.confirm('Gesamten Verlauf löschen?')) {
      setHistory([]);
    }
  }, []);

  // ── Render ──────────────────────────────────────────────────────────────

  const isReady = anliegen.trim() && kuerzel.trim();

  const sectionHeader = (title: string, category: 'kontaktart' | 'sd' | 'id') => (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <button
          onClick={() => toggleField(category)}
          className={`w-6 h-6 flex items-center justify-center rounded-md transition ${
            fieldEnabled[category]
              ? 'text-orange-400 hover:bg-orange-500/10'
              : 'text-neutral-600 hover:bg-neutral-700'
          }`}
          title={fieldEnabled[category] ? 'Feld deaktivieren' : 'Feld aktivieren'}
        >
          <i className="material-icons" style={{ fontSize: '16px' }}>
            {fieldEnabled[category] ? 'visibility' : 'visibility_off'}
          </i>
        </button>
        <div className={`text-xs font-semibold uppercase tracking-widest transition ${
          fieldEnabled[category] ? 'text-neutral-100' : 'text-neutral-500'
        }`}>
          {title}
        </div>
      </div>
      {fieldEnabled[category] && (
        <button
          onClick={() => setAddingTo(addingTo === category ? null : category)}
          className="w-6 h-6 flex items-center justify-center rounded-md text-neutral-400 hover:text-orange-400 hover:bg-orange-500/10 transition"
          title="Eigenen Eintrag hinzufügen"
        >
          <i className="material-icons" style={{ fontSize: '16px' }}>{addingTo === category ? 'close' : 'add'}</i>
        </button>
      )}
    </div>
  );

  const optionButton = (
    opt: { value: string; label: string; icon?: string },
    selected: string,
    onSelect: (v: string) => void,
    category: 'kontaktart' | 'sd' | 'id',
  ) => (
    <div key={opt.value} className="relative group">
      <button
        onClick={() => onSelect(opt.value)}
        className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 font-medium text-sm text-left transition ${
          selected === opt.value
            ? 'border-orange-500 bg-orange-500/10 text-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.2)]'
            : 'border-neutral-600 text-neutral-400 hover:border-neutral-500 hover:text-neutral-300'
        }`}
      >
        {opt.icon && <i className="material-icons" style={{ fontSize: '18px' }}>{opt.icon}</i>}
        {opt.label}
      </button>
      {isCustom(category, opt.value) && (
        <button
          onClick={(e) => { e.stopPropagation(); removeCustomOption(category, opt.value); }}
          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-neutral-700 text-neutral-400 hover:bg-red-500/20 hover:text-red-400 items-center justify-center transition hidden group-hover:flex"
          title="Entfernen"
        >
          <i className="material-icons" style={{ fontSize: '14px' }}>close</i>
        </button>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full view-pt view-pl">
      <div className="flex-shrink-0 flex justify-between items-start mb-6 view-pr">
        <div>
          <h1 className="text-4xl font-bold text-neutral-100 mb-2">HK Generator</h1>
          <p className="text-neutral-400">Hauptkontakte schnell und einheitlich erstellen.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setTab(t => t === 'generator' ? 'history' : 'generator')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 font-medium text-sm transition ${
              tab === 'history'
                ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                : 'border-neutral-600 text-neutral-400 hover:border-neutral-500 hover:text-neutral-300'
            }`}
            title="Verlauf anzeigen"
          >
            <i className="material-icons" style={{ fontSize: '18px' }}>history</i>
            Verlauf{history.length > 0 ? ` (${history.length})` : ''}
          </button>
        </div>
      </div>

      {tab === 'generator' ? (
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar view-pr view-pb space-y-5">

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

              {/* Kontaktart */}
              <div className={`border rounded-xl p-5 transition ${fieldEnabled.kontaktart ? 'bg-neutral-800 border-neutral-700' : 'bg-neutral-800/50 border-neutral-700/40'}`}>
                {sectionHeader('Kontaktart', 'kontaktart')}
                <div className={`transition-opacity ${!fieldEnabled.kontaktart ? 'opacity-30 pointer-events-none' : ''}`}>
                  <div className={`grid gap-2 ${allKontaktart.length > 3 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    {allKontaktart.map(opt => optionButton(opt, kontaktart, setKontaktart, 'kontaktart'))}
                    {addingTo === 'kontaktart' && (
                      <div className="col-span-full">
                        <AddOptionInput
                          onAdd={label => addCustomOption('kontaktart', label)}
                          onCancel={() => setAddingTo(null)}
                        />
                      </div>
                    )}
                    <div className="col-span-full">
                      <input
                        type="text"
                        value={telefonnummer}
                        onChange={e => setTelefonnummer(e.target.value)}
                        placeholder={
                          kontaktart === 'tel' ? 'Telefonnummer eingeben...'
                          : kontaktart === 'mail' ? 'E-Mail-Adresse eingeben...'
                          : kontaktart === 'persönlich' ? 'Anmerkung (optional)...'
                          : 'Details eingeben...'
                        }
                        className="w-full bg-neutral-900 border border-neutral-600 rounded-lg p-3 text-neutral-200 font-mono text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 transition placeholder:text-neutral-600"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SD-Status */}
              <div className={`border rounded-xl p-5 transition ${fieldEnabled.sd ? 'bg-neutral-800 border-neutral-700' : 'bg-neutral-800/50 border-neutral-700/40'}`}>
                {sectionHeader('Stammdaten-Status', 'sd')}
                <div className={`transition-opacity ${!fieldEnabled.sd ? 'opacity-30 pointer-events-none' : ''}`}>
                  <div className={`grid gap-2 ${allSd.length > 4 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    {allSd.map(opt => optionButton(opt, sdStatus, setSdStatus, 'sd'))}
                    {addingTo === 'sd' && (
                      <div className="col-span-full">
                        <AddOptionInput
                          onAdd={label => addCustomOption('sd', label)}
                          onCancel={() => setAddingTo(null)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Identifikation */}
              <div className={`border rounded-xl p-5 transition ${fieldEnabled.id ? 'bg-neutral-800 border-neutral-700' : 'bg-neutral-800/50 border-neutral-700/40'}`}>
                {sectionHeader('Identifikation', 'id')}
                <div className={`transition-opacity ${!fieldEnabled.id ? 'opacity-30 pointer-events-none' : ''}`}>
                  <div className={`grid gap-2 ${allId.length > 4 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    {allId.map(opt => optionButton(opt, idMethode, setIdMethode, 'id'))}
                    {addingTo === 'id' && (
                      <div className="col-span-full">
                        <AddOptionInput
                          onAdd={label => addCustomOption('id', label)}
                          onCancel={() => setAddingTo(null)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
          </div>

          {/* Anliegen + Kürzel */}
          <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-5">
            <div className="text-xs font-semibold text-neutral-100 uppercase tracking-widest mb-3">
              Anliegen &amp; Kürzel
            </div>
            <div className="flex gap-3">
              <input
                type="text"
                value={anliegen}
                onChange={e => setAnliegen(e.target.value)}
                placeholder="Kundenanliegen eingeben..."
                className="flex-1 bg-neutral-900 border border-neutral-600 rounded-lg p-3 text-neutral-200 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 transition placeholder:text-neutral-600"
              />
              <input
                type="text"
                value={kuerzel}
                onChange={e => setKuerzel(e.target.value)}
                placeholder="Kürzel"
                className="w-24 bg-neutral-900 border border-neutral-600 rounded-lg p-3 text-neutral-200 text-sm text-center font-bold uppercase focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 transition placeholder:text-neutral-600"
              />
            </div>
          </div>

          {/* Preview */}
          <div className={`rounded-xl p-5 border-2 transition ${
            isReady
              ? 'bg-neutral-800 border-orange-500/30'
              : 'bg-neutral-800 border-neutral-700'
          }`}>
            <div className="text-xs font-semibold text-neutral-100 uppercase tracking-widest mb-3">
              Vorschau
            </div>
            <div className={`font-mono text-base p-3 rounded-lg ${
              isReady ? 'bg-neutral-900 text-orange-400' : 'bg-neutral-900 text-neutral-500'
            }`}>
              {output}
            </div>
          </div>

          {/* Copy button */}
          <button
            onClick={handleCopy}
            disabled={!isReady}
            className={`w-full py-4 rounded-xl font-bold text-base tracking-wide transition flex items-center justify-center gap-2 ${
              copied
                ? 'bg-green-600 text-white'
                : 'bg-orange-500 hover:bg-orange-400 text-black hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(249,115,22,0.3)]'
            } disabled:bg-neutral-700 disabled:text-neutral-500 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none`}
          >
            <i className="material-icons text-xl">{copied ? 'check' : 'content_copy'}</i>
            {copied ? 'Kopiert!' : 'In Zwischenablage kopieren'}
          </button>

        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col view-pr view-pb">

          {/* Search + Clear */}
          <div className="flex gap-3 mb-4 flex-shrink-0">
            <div className="relative flex-1">
              <i className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" style={{ fontSize: '20px' }}>search</i>
              <input
                type="text"
                value={historySearch}
                onChange={e => setHistorySearch(e.target.value)}
                placeholder="Verlauf durchsuchen..."
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg py-2.5 pl-10 pr-4 text-neutral-200 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 transition"
              />
            </div>
            {history.length > 0 && (
              <button
                onClick={clearHistory}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-700 text-neutral-400 hover:border-red-500/50 hover:text-red-400 text-sm transition"
              >
                <i className="material-icons" style={{ fontSize: '16px' }}>delete_outline</i>
                Löschen
              </button>
            )}
          </div>

          {/* History list */}
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-1.5">
            {(() => {
              const filtered = historySearch.trim()
                ? history.filter(h => h.text.toLowerCase().includes(historySearch.toLowerCase()))
                : history;

              if (filtered.length === 0) {
                return (
                  <div className="text-center py-16 text-neutral-500">
                    <i className="material-icons text-5xl mb-3">{historySearch ? 'search_off' : 'history'}</i>
                    <p>{historySearch ? 'Keine Treffer.' : 'Noch keine Einträge.'}</p>
                  </div>
                );
              }

              const todayKey = new Date().toLocaleDateString('de-AT');
              const groups: { key: string; dateStr: string; items: { text: string; timestamp: number }[] }[] = [];
              for (const item of filtered) {
                const date = new Date(item.timestamp);
                const key = date.toLocaleDateString('de-AT');
                const dateStr = date.toLocaleDateString('de-AT', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
                if (groups.length === 0 || groups[groups.length - 1].key !== key) {
                  groups.push({ key, dateStr, items: [item] });
                } else {
                  groups[groups.length - 1].items.push(item);
                }
              }

              return groups.map(group => {
                const isToday = group.key === todayKey;
                const isExpanded = isToday ? !toggledDays.has(group.key) : toggledDays.has(group.key);
                return (
                  <div key={group.key}>
                    <button
                      onClick={() => setToggledDays(prev => {
                        const next = new Set(prev);
                        if (next.has(group.key)) next.delete(group.key);
                        else next.add(group.key);
                        return next;
                      })}
                      className="w-full flex items-center gap-3 text-neutral-500 text-xs pt-2 pb-1 cursor-pointer hover:text-neutral-400 transition"
                    >
                      <span className="h-px flex-1 bg-neutral-700" />
                      <i className="material-icons" style={{ fontSize: '14px' }}>
                        {isExpanded ? 'expand_less' : 'expand_more'}
                      </i>
                      <span className="font-semibold uppercase tracking-wider">{group.dateStr}</span>
                      <span className="bg-neutral-700 text-neutral-400 rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums">{group.items.length}</span>
                      <span className="h-px flex-1 bg-neutral-700" />
                    </button>
                    {isExpanded && (
                      <div className="space-y-1.5 mt-1.5">
                        {group.items.map((item, j) => {
                          const timeStr = new Date(item.timestamp).toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' });
                          return (
                            <div
                              key={j}
                              onClick={() => handleCopyHistoryItem(item.text)}
                              className="flex items-start gap-3 p-2.5 rounded-lg bg-neutral-900 border border-neutral-700 cursor-pointer hover:border-orange-500/30 hover:text-orange-400 transition group"
                              title="Klicken zum Kopieren"
                            >
                              <span className="text-xs text-neutral-600 flex-shrink-0 pt-0.5">{timeStr}</span>
                              <span className="font-mono text-sm text-neutral-400 group-hover:text-orange-400 break-all">{item.text}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>

        </div>
      )}
    </div>
  );
};
