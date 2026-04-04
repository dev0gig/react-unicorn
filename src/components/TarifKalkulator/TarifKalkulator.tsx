import React, { useState, useCallback, useEffect, useRef } from 'react';

// ══════════════════════════════════════
// TARIF-KONSTANTEN (brutto = inkl. 7% GA + 20% USt.)
// Preisblatt: Jänner–März 2026
// ══════════════════════════════════════

interface TarifMeta {
  gueltig_von: string;
  gueltig_bis: string;
  label: string;
  anbieter: string;
  produkt: string;
}

interface StromTarif {
  gp_brutto: number;
  gp_netto: number;
  vp_brutto_ohne: number;
  vp_brutto_mit: number;
  vp_netto_ohne: number;
  vp_netto_mit: number;
}

interface Tarif {
  strom: StromTarif;
  gas: StromTarif;
}

const INITIAL_META: TarifMeta = {
  gueltig_von: '2026-01-01',
  gueltig_bis: '2026-03-31',
  label: 'Jän–Mär 2026',
  anbieter: 'Wien Energie',
  produkt: 'OPTIMA Entspannt plus',
};

const makeTarif = (): Tarif => ({
  strom: {
    gp_brutto: 75.2663,
    gp_netto: 75.2663 / 1.07 / 1.20,
    vp_brutto_ohne: 15.5101,
    vp_brutto_mit: 14.0977,
    vp_netto_ohne: 15.5101 / 1.07 / 1.20,
    vp_netto_mit: 14.0977 / 1.07 / 1.20,
  },
  gas: {
    gp_brutto: 105.2476,
    gp_netto: 105.2476 / 1.07 / 1.20,
    vp_brutto_ohne: 6.3440,
    vp_brutto_mit: 5.9588,
    vp_netto_ohne: 6.3440 / 1.07 / 1.20,
    vp_netto_mit: 5.9588 / 1.07 / 1.20,
  },
});

// ── Validation helper ──
const isValidNumber = (v: string) => v === '' || /^\d*[.,]?\d*$/.test(v);

// ── Formatierung ──

const eur = (v: number) => v.toFixed(2).replace('.', ',') + ' €';
const ct = (v: number) => v.toFixed(4).replace('.', ',') + ' Ct/kWh';

const fmtDate = (d: Date) =>
  d.toLocaleDateString('de-AT', { day: '2-digit', month: '2-digit', year: 'numeric' });

// ── Sub-Components ──

const Toggle: React.FC<{
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  sub: string;
  accent?: 'orange' | 'blue';
}> = ({ checked, onChange, label, sub, accent = 'orange' }) => {
  const bg = checked
    ? accent === 'orange' ? 'bg-orange-500/25' : 'bg-blue-500/25'
    : 'bg-neutral-600';
  const knob = checked
    ? accent === 'orange' ? 'bg-orange-400 translate-x-[18px]' : 'bg-blue-400 translate-x-[18px]'
    : 'bg-neutral-400 translate-x-0';
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-neutral-700 last:border-b-0">
      <div>
        <div className="text-sm text-neutral-300">{label}</div>
        <div className="text-xs text-neutral-500 font-mono mt-0.5">{sub}</div>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-[22px] rounded-full flex-shrink-0 transition-colors cursor-pointer ${bg}`}
      >
        <span className={`absolute top-[3px] left-[3px] w-4 h-4 rounded-full transition-transform ${knob}`} />
      </button>
    </div>
  );
};

const ResultRow: React.FC<{
  label: string;
  sub?: string;
  value: string;
  valueSub?: string;
  isTotal?: boolean;
  accent?: 'orange' | 'blue';
  hidden?: boolean;
}> = ({ label, sub, value, valueSub, isTotal, accent, hidden }) => {
  if (hidden) return null;
  const totalBg = isTotal ? 'bg-neutral-700/50 py-4' : '';
  const labelCls = isTotal ? 'font-bold text-neutral-100 text-sm' : 'text-neutral-400 text-sm';
  const valueCls = isTotal
    ? `text-xl font-medium ${accent === 'orange' ? 'text-orange-400' : accent === 'blue' ? 'text-blue-400' : 'text-neutral-100'}`
    : 'text-neutral-200 text-sm';
  return (
    <div className={`flex justify-between items-center px-5 py-2.5 border-b border-neutral-700 last:border-b-0 hover:bg-neutral-700/30 transition-colors ${totalBg}`}>
      <div className={labelCls}>
        {label}
        {sub && <span className="block text-xs text-neutral-500 font-mono mt-0.5">{sub}</span>}
      </div>
      <div className={`font-mono text-right ${valueCls}`}>
        {value}
        {valueSub && <span className="block text-xs text-neutral-500">{valueSub}</span>}
      </div>
    </div>
  );
};

const DividerRow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="px-5 py-1.5 bg-neutral-900 text-xs tracking-wider uppercase text-neutral-500 font-mono">
    {children}
  </div>
);

// ── Field Row (extracted for stable ref → no focus loss) ──

const FieldRow: React.FC<{
  label: string; sub: string; field: string; value: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  unit: string; readonly?: boolean; inputCls: string; hasError?: boolean;
}> = ({ label, sub, value, onChange, unit, readonly: ro, inputCls, hasError }) => (
  <div className="flex items-center justify-between gap-4 py-1.5">
    <label className="flex-1 text-sm text-neutral-300 leading-snug">
      {label}
      <small className="block text-xs text-neutral-500 font-mono mt-0.5">{sub}</small>
      {hasError && <small className="block text-xs text-red-400 mt-0.5">Bitte nur Zahlen</small>}
    </label>
    <div className="relative flex items-center flex-shrink-0">
      <input
        type="text"
        inputMode="decimal"
        className={inputCls}
        value={value}
        onChange={onChange}
        readOnly={ro}
        tabIndex={ro ? -1 : undefined}
      />
      <span className="absolute right-2 text-xs text-neutral-500 font-mono pointer-events-none">{unit}</span>
    </div>
  </div>
);

// ── Settings Modal ──

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  tarif: Tarif;
  onApply: (t: Tarif) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ open, onClose, tarif, onApply }) => {
  const [sGp, setSGp] = useState('');
  const [sVpOhne, setSVpOhne] = useState('');
  const [sRabatt, setSRabatt] = useState('');
  const [gGp, setGGp] = useState('');
  const [gVpOhne, setGVpOhne] = useState('');
  const [gRabatt, setGRabatt] = useState('');
  const [changed, setChanged] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      setSGp(tarif.strom.gp_brutto.toFixed(4));
      setSVpOhne(tarif.strom.vp_brutto_ohne.toFixed(4));
      setSRabatt((tarif.strom.vp_brutto_ohne - tarif.strom.vp_brutto_mit).toFixed(4));
      setGGp(tarif.gas.gp_brutto.toFixed(4));
      setGVpOhne(tarif.gas.vp_brutto_ohne.toFixed(4));
      setGRabatt((tarif.gas.vp_brutto_ohne - tarif.gas.vp_brutto_mit).toFixed(4));
      setChanged(new Set());
    }
  }, [open, tarif]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const mark = (field: string, setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
    setChanged(prev => new Set(prev).add(field));
  };

  const sVpMit = Math.max(0, (parseFloat(sVpOhne) || 0) - (parseFloat(sRabatt) || 0)).toFixed(4);
  const gVpMit = Math.max(0, (parseFloat(gVpOhne) || 0) - (parseFloat(gRabatt) || 0)).toFixed(4);

  const allFields = [sGp, sVpOhne, sRabatt, gGp, gVpOhne, gRabatt];
  const hasAnyError = allFields.some(v => !isValidNumber(v));

  const handleApply = () => {
    if (hasAnyError) return;
    const GA = 1.07;
    const UST = 1.20;
    const sGpN = parseFloat(sGp);
    const sVpON = parseFloat(sVpOhne);
    const sR = parseFloat(sRabatt);
    const gGpN = parseFloat(gGp);
    const gVpON = parseFloat(gVpOhne);
    const gR = parseFloat(gRabatt);

    if ([sGpN, sVpON, sR, gGpN, gVpON, gR].some(v => isNaN(v) || v < 0)) return;

    const sVpM = parseFloat((sVpON - sR).toFixed(4));
    const gVpM = parseFloat((gVpON - gR).toFixed(4));

    onApply({
      strom: {
        gp_brutto: sGpN,
        gp_netto: sGpN / GA / UST,
        vp_brutto_ohne: sVpON,
        vp_brutto_mit: sVpM,
        vp_netto_ohne: sVpON / GA / UST,
        vp_netto_mit: sVpM / GA / UST,
      },
      gas: {
        gp_brutto: gGpN,
        gp_netto: gGpN / GA / UST,
        vp_brutto_ohne: gVpON,
        vp_brutto_mit: gVpM,
        vp_netto_ohne: gVpON / GA / UST,
        vp_netto_mit: gVpM / GA / UST,
      },
    });
    onClose();
  };

  if (!open) return null;

  const inputCls = (field: string, value: string, readonly = false) => {
    const err = !readonly && !isValidNumber(value);
    return `w-28 bg-neutral-900 border rounded-lg px-2 py-1.5 pr-8 text-right font-mono text-sm text-neutral-200 outline-none transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
      readonly ? 'border-transparent bg-neutral-950 text-neutral-500 cursor-default' :
      err ? 'border-red-500 focus:border-red-400' :
      changed.has(field) ? 'border-orange-500/60 focus:border-orange-500' : 'border-neutral-600 focus:border-neutral-500'
    }`;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-neutral-800 border border-neutral-700 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-700 sticky top-0 bg-neutral-800 z-10">
          <h3 className="text-base font-bold text-neutral-100 flex items-center gap-2">
            <i className="material-icons text-lg text-neutral-400">settings</i>
            Preisbestandteile bearbeiten
          </h3>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-100 transition-colors p-1 rounded-lg">
            <i className="material-icons text-xl">close</i>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-6">
          {/* Strom Section */}
          <div>
            <div className="text-xs tracking-wider uppercase text-neutral-500 font-mono mb-3 pb-2 border-b border-neutral-700 flex items-center gap-2">
              <i className="material-icons text-sm text-orange-400">bolt</i>
              Strom — Brutto (inkl. 7% GA + 20% USt.)
            </div>
            <FieldRow label="Grundpreis" sub="EUR/Jahr brutto" field="s-gp" value={sGp} onChange={mark('s-gp', setSGp)} unit="€/J" inputCls={inputCls('s-gp', sGp)} hasError={!isValidNumber(sGp)} />
            <FieldRow label="Verbrauchspreis — ohne Bindung" sub="Ct/kWh brutto" field="s-vp-ohne" value={sVpOhne} onChange={mark('s-vp-ohne', setSVpOhne)} unit="Ct" inputCls={inputCls('s-vp-ohne', sVpOhne)} hasError={!isValidNumber(sVpOhne)} />
            <FieldRow label="Cent-Rabatt (Bindung)" sub="wird vom VP abgezogen" field="s-rabatt" value={sRabatt} onChange={mark('s-rabatt', setSRabatt)} unit="Ct" inputCls={inputCls('s-rabatt', sRabatt)} hasError={!isValidNumber(sRabatt)} />
            <FieldRow label="Verbrauchspreis — mit Bindung" sub="berechnet: VP ohne − Rabatt" field="s-vp-mit" value={sVpMit} unit="Ct" readonly inputCls={inputCls('s-vp-mit', sVpMit, true)} />
          </div>

          {/* Gas Section */}
          <div>
            <div className="text-xs tracking-wider uppercase text-neutral-500 font-mono mb-3 pb-2 border-b border-neutral-700 flex items-center gap-2">
              <i className="material-icons text-sm text-blue-400">local_fire_department</i>
              Erdgas — Brutto (inkl. 7% GA + 20% USt.)
            </div>
            <FieldRow label="Grundpreis" sub="EUR/Jahr brutto" field="g-gp" value={gGp} onChange={mark('g-gp', setGGp)} unit="€/J" inputCls={inputCls('g-gp', gGp)} hasError={!isValidNumber(gGp)} />
            <FieldRow label="Verbrauchspreis — ohne Bindung" sub="Ct/kWh brutto" field="g-vp-ohne" value={gVpOhne} onChange={mark('g-vp-ohne', setGVpOhne)} unit="Ct" inputCls={inputCls('g-vp-ohne', gVpOhne)} hasError={!isValidNumber(gVpOhne)} />
            <FieldRow label="Cent-Rabatt (Bindung)" sub="wird vom VP abgezogen" field="g-rabatt" value={gRabatt} onChange={mark('g-rabatt', setGRabatt)} unit="Ct" inputCls={inputCls('g-rabatt', gRabatt)} hasError={!isValidNumber(gRabatt)} />
            <FieldRow label="Verbrauchspreis — mit Bindung" sub="berechnet: VP ohne − Rabatt" field="g-vp-mit" value={gVpMit} unit="Ct" readonly inputCls={inputCls('g-vp-mit', gVpMit, true)} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 justify-end px-6 py-4 border-t border-neutral-700 sticky bottom-0 bg-neutral-800">
          <button onClick={onClose} className="px-4 py-2 rounded-lg font-mono text-sm border border-neutral-600 bg-neutral-700 text-neutral-300 hover:text-neutral-100 hover:border-neutral-500 transition-colors">
            Abbrechen
          </button>
          <button onClick={handleApply} disabled={hasAnyError} className={`px-4 py-2 rounded-lg font-mono text-sm border transition-colors ${hasAnyError ? 'border-neutral-600 bg-neutral-700 text-neutral-500 cursor-not-allowed' : 'border-orange-500/40 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 hover:border-orange-500'}`}>
            <i className="material-icons text-sm mr-1 align-middle">check</i>
            Übernehmen
          </button>
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════

type TabType = 'strom' | 'gas';

export const TarifKalkulator: React.FC = () => {
  const [tab, setTab] = useState<TabType>('strom');
  const [tarif, setTarif] = useState<Tarif>(makeTarif);
  const [meta, setMeta] = useState<TarifMeta>({ ...INITIAL_META });
  const [isCustom, setIsCustom] = useState(false);
  const [lastImported, setLastImported] = useState<{ tarif: Tarif; meta: TarifMeta } | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
  const toastTimer = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Strom options
  const [stromBindung, setStromBindung] = useState(false);
  const [stromGaRate, setStromGaRate] = useState(7);
  const [stromUst, setStromUst] = useState(true);

  // Gas options
  const [gasBindung, setGasBindung] = useState(false);
  const [gasGaRate, setGasGaRate] = useState(7);
  const [gasUst, setGasUst] = useState(true);


  const showToast = useCallback((msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type });
    clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3000);
  }, []);

  // ── Badge validity ──
  const badgeInfo = (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const von = new Date(meta.gueltig_von);
    const bis = new Date(meta.gueltig_bis);
    const isValid = today >= von && today <= bis;
    return {
      text: `${fmtDate(von)} – ${fmtDate(bis)}`,
      isValid,
    };
  })();

  // ── Kalkulation Strom ──
  const calcStrom = () => {
    const T = tarif.strom;
    const gp = T.gp_netto;
    const vpBase = T.vp_netto_ohne;
    const vpFinal = stromBindung ? T.vp_netto_mit : T.vp_netto_ohne;
    const rabattN = T.vp_netto_ohne - T.vp_netto_mit;

    const gaF = 1 + stromGaRate / 100;
    const ustF = stromUst ? 1.20 : 1.00;

    return {
      gpNetto: eur(gp),
      gpGa: eur(gp * (stromGaRate / 100)),
      gpUst: eur(gp * gaF * 0.20),
      gpBrutto: eur(gp * gaF * ustF) + '/Jahr',
      vpNetto: ct(vpBase),
      vpGa: ct(vpBase * (stromGaRate / 100)),
      vpUst: ct(vpBase * gaF * 0.20),
      vpBrutto: ct(vpFinal * gaF * ustF),
      vpLabel: stromBindung
        ? `mit 12-Mon.-Bindung · Rabatt: −${ct(rabattN * gaF * ustF)}`
        : 'ohne Bindung',
      showGA: stromGaRate > 0,
      showUST: stromUst,
    };
  };

  // ── Kalkulation Gas ──
  const calcGas = () => {
    const T = tarif.gas;
    const gp = T.gp_netto;
    const vpBase = T.vp_netto_ohne;
    const vpFinal = gasBindung ? T.vp_netto_mit : T.vp_netto_ohne;
    const rabattN = T.vp_netto_ohne - T.vp_netto_mit;

    const gaF = 1 + gasGaRate / 100;
    const ustF = gasUst ? 1.20 : 1.00;

    const vpFinalBrutto = vpFinal * gaF * ustF;
    const rabattBrutto = rabattN * gaF * ustF;

    return {
      gpNetto: eur(gp),
      gpGa: eur(gp * (gasGaRate / 100)),
      gpUst: eur(gp * gaF * 0.20),
      gpBrutto: eur(gp * gaF * ustF) + '/Jahr',
      vpNetto: ct(vpBase),
      vpGa: ct(vpBase * (gasGaRate / 100)),
      vpUst: ct(vpBase * gaF * 0.20),
      vpBrutto: ct(vpFinalBrutto),
      vpLabel: gasBindung
        ? `mit 12-Mon.-Bindung · Rabatt: −${ct(rabattBrutto)}`
        : 'ohne Bindung',
      showGA: gasGaRate > 0,
      showUST: gasUst,
    };
  };

  const strom = calcStrom();
  const gas = calcGas();

  // ── Import ──
  const importTarif = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      let data: any;
      try {
        data = JSON.parse(ev.target?.result as string);
      } catch {
        showToast('Ungültiges JSON — Datei konnte nicht geparst werden.', 'err');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      const gp_s = data?.strom?.grundpreis?.brutto_eur_jahr;
      const vp_s_ohne = data?.strom?.verbrauchspreis?.ohne_bindung?.brutto_ct_kwh;
      const s_rabatt = data?.strom?.verbrauchspreis?.mit_bindung?.rabatt_ct_kwh;
      const gp_g = data?.gas?.grundpreis?.brutto_eur_jahr;
      const vp_g_ohne = data?.gas?.verbrauchspreis?.ohne_bindung?.brutto_ct_kwh;
      const g_rabatt = data?.gas?.verbrauchspreis?.mit_bindung?.rabatt_ct_kwh;

      const errors: string[] = [];
      if (typeof gp_s !== 'number' || gp_s <= 0) errors.push('strom.grundpreis');
      if (typeof vp_s_ohne !== 'number' || vp_s_ohne <= 0) errors.push('strom.vp');
      if (typeof s_rabatt !== 'number' || s_rabatt < 0) errors.push('strom.rabatt');
      if (typeof gp_g !== 'number' || gp_g <= 0) errors.push('gas.grundpreis');
      if (typeof vp_g_ohne !== 'number' || vp_g_ohne <= 0) errors.push('gas.vp');
      if (typeof g_rabatt !== 'number' || g_rabatt < 0) errors.push('gas.rabatt');

      if (errors.length > 0) {
        showToast(`Fehlende/ungültige Felder: ${errors.join(', ')}`, 'err');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      const GA = 1.07;
      const UST = 1.20;
      const vp_s_mit = parseFloat((vp_s_ohne - s_rabatt).toFixed(4));
      const vp_g_mit = parseFloat((vp_g_ohne - g_rabatt).toFixed(4));

      const importedTarif: Tarif = {
        strom: {
          gp_brutto: gp_s, gp_netto: gp_s / GA / UST,
          vp_brutto_ohne: vp_s_ohne, vp_brutto_mit: vp_s_mit,
          vp_netto_ohne: vp_s_ohne / GA / UST, vp_netto_mit: vp_s_mit / GA / UST,
        },
        gas: {
          gp_brutto: gp_g, gp_netto: gp_g / GA / UST,
          vp_brutto_ohne: vp_g_ohne, vp_brutto_mit: vp_g_mit,
          vp_netto_ohne: vp_g_ohne / GA / UST, vp_netto_mit: vp_g_mit / GA / UST,
        },
      };

      const importMeta = data._meta;
      const importedMeta: TarifMeta = {
        gueltig_von: importMeta?.gueltig_von && importMeta.gueltig_von !== 'manuell' ? importMeta.gueltig_von : new Date().toISOString().slice(0, 10),
        gueltig_bis: importMeta?.gueltig_bis && importMeta.gueltig_bis !== 'manuell' ? importMeta.gueltig_bis : new Date().toISOString().slice(0, 10),
        label: importMeta?.label || 'Importiert',
        anbieter: importMeta?.anbieter || 'Unbekannt',
        produkt: importMeta?.produkt || 'Importierter Tarif',
      };

      setTarif(importedTarif);
      setMeta(importedMeta);
      setLastImported({ tarif: importedTarif, meta: importedMeta });
      setIsCustom(true);
      showToast(`Tarif aus "${file.name}" importiert & übernommen.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  // ── Export ──
  const exportTarif = () => {
    const now = new Date().toISOString().slice(0, 10);
    const payload = {
      _meta: {
        schema_version: '1.0',
        erstellt_am: now,
        gueltig_von: meta.gueltig_von,
        gueltig_bis: meta.gueltig_bis,
        label: meta.label,
        anbieter: meta.anbieter,
        produkt: meta.produkt,
        hinweis: 'Exportiert aus TarifKalkulator. Alle Brutto-Werte inkl. 7% GA + 20% USt.',
      },
      abgaben: { gebrauchsabgabe_pct: 7.0, umsatzsteuer_pct: 20.0 },
      strom: {
        produkt: 'Strom OPTIMA Entspannt plus',
        preisgarantie_monate: 12,
        grundpreis: { brutto_eur_jahr: tarif.strom.gp_brutto, einheit: 'EUR/Jahr', inkl: '7% GA + 20% USt.' },
        verbrauchspreis: {
          ohne_bindung: { brutto_ct_kwh: tarif.strom.vp_brutto_ohne, einheit: 'Ct/kWh' },
          mit_bindung: {
            rabatt_ct_kwh: parseFloat((tarif.strom.vp_brutto_ohne - tarif.strom.vp_brutto_mit).toFixed(4)),
            bindungsdauer_monate: 12,
            einheit: 'Ct/kWh',
          },
        },
      },
      gas: {
        produkt: 'Erdgas OPTIMA Entspannt plus',
        preisgarantie_monate: 12,
        grundpreis: { brutto_eur_jahr: tarif.gas.gp_brutto, einheit: 'EUR/Jahr', inkl: '7% GA + 20% USt.' },
        verbrauchspreis: {
          ohne_bindung: { brutto_ct_kwh: tarif.gas.vp_brutto_ohne, einheit: 'Ct/kWh' },
          mit_bindung: {
            rabatt_ct_kwh: parseFloat((tarif.gas.vp_brutto_ohne - tarif.gas.vp_brutto_mit).toFixed(4)),
            bindungsdauer_monate: 12,
            einheit: 'Ct/kWh',
          },
        },
      },
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wien-energie-tarif-${now}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Tarif exportiert als wien-energie-tarif-${now}.json`);
  };

  // ── Reset ──
  const resetTarif = () => {
    if (lastImported) {
      setTarif(lastImported.tarif);
      setMeta(lastImported.meta);
      setIsCustom(true);
      showToast('Auf letzten Import zurückgesetzt.');
    } else {
      setTarif(makeTarif());
      setMeta({ ...INITIAL_META });
      setIsCustom(false);
      showToast('Auf Standardtarif 2026 zurückgesetzt.');
    }
  };

  // ── Settings apply ──
  const applySettings = (newTarif: Tarif) => {
    setTarif(newTarif);
    setIsCustom(true);
    showToast('Preise aktualisiert');
  };

  // ── GA Select ──
  const GaSelect: React.FC<{ value: number; onChange: (v: number) => void }> = ({ value, onChange }) => (
    <select
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value))}
      className="bg-neutral-700 border border-neutral-600 rounded-lg text-neutral-200 font-mono text-sm px-2 py-1 cursor-pointer outline-none focus:border-neutral-500 transition-colors"
    >
      <option value={7}>7 %</option>
      <option value={6}>6 %</option>
      <option value={0}>keine</option>
    </select>
  );

  return (
    <div className="flex flex-col h-full view-pt view-pl">
      {/* Header */}
      <header className="flex-shrink-0 flex justify-between items-start mb-6 view-pr">
        <div>
          <h1 className="text-4xl font-bold text-neutral-100">
            Tarif<span className="text-orange-400">Kalkulator</span>
          </h1>
          <p className="text-neutral-400 mt-1">{meta.anbieter} · {meta.produkt} · {meta.label}</p>
        </div>
      </header>

      {/* Scrollable Content */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar view-pr view-pb">
        {/* Tabs */}
        <div className="flex gap-3 mb-4">
          <button
            onClick={() => setTab('strom')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-base font-semibold transition-all cursor-pointer ${
              tab === 'strom'
                ? 'bg-orange-500/10 border-orange-500 text-orange-400'
                : 'bg-neutral-800 border-neutral-700 text-neutral-500 hover:border-neutral-600 hover:text-neutral-300'
            }`}
          >
            <i className="material-icons text-lg">bolt</i> Strom
          </button>
          <button
            onClick={() => setTab('gas')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-base font-semibold transition-all cursor-pointer ${
              tab === 'gas'
                ? 'bg-blue-500/10 border-blue-500 text-blue-400'
                : 'bg-neutral-800 border-neutral-700 text-neutral-500 hover:border-neutral-600 hover:text-neutral-300'
            }`}
          >
            <i className="material-icons text-lg">local_fire_department</i> Erdgas
          </button>
        </div>

        {/* IO Bar */}
        <div className="bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 flex items-center gap-3 flex-wrap mb-4">
          <span className="font-mono text-xs tracking-wider uppercase text-neutral-500 flex-shrink-0">Tarif-Daten</span>
          <span
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-md font-mono text-xs border ${
              badgeInfo.isValid
                ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-400'
                : 'border-red-400/40 bg-red-400/10 text-red-400'
            }`}
            title={badgeInfo.isValid ? 'Tarif aktuell gültig' : 'Tarif abgelaufen oder noch nicht aktiv'}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${badgeInfo.isValid ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
            {badgeInfo.text}
          </span>
          <span className="flex-1" />
          <input type="file" ref={fileInputRef} accept=".json" className="hidden" onChange={importTarif} />
          <button onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs border border-neutral-600 bg-neutral-700 text-neutral-300 hover:border-neutral-500 hover:text-neutral-100 transition-colors">
            <i className="material-icons text-sm">upload</i> JSON importieren
          </button>
          <button onClick={exportTarif} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs border border-orange-500/35 bg-orange-500/10 text-orange-400 hover:bg-orange-500/15 hover:border-orange-500 transition-colors">
            <i className="material-icons text-sm">download</i> JSON exportieren
          </button>
          <button onClick={() => setSettingsOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs border border-neutral-600 bg-neutral-700 text-neutral-300 hover:border-neutral-500 hover:text-neutral-100 transition-colors">
            <i className="material-icons text-sm">settings</i> Preise
          </button>
          {isCustom && (
            <button onClick={resetTarif} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs border border-red-500/30 bg-red-500/5 text-red-400 hover:bg-red-500/15 transition-colors">
              <i className="material-icons text-sm">close</i> Reset
            </button>
          )}
        </div>

        {/* ═══ STROM PANEL ═══ */}
        {tab === 'strom' && (
          <div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              {/* Optionen */}
              <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-5">
                <div className="text-xs tracking-wider uppercase text-neutral-500 font-mono mb-3">Optionen</div>
                <Toggle
                  checked={stromBindung}
                  onChange={setStromBindung}
                  label="12 Monate Vertragsbindung"
                  sub={`Rabatt: −${ct(tarif.strom.vp_brutto_ohne - tarif.strom.vp_brutto_mit)}`}
                  accent="orange"
                />
                <Toggle
                  checked={stromUst}
                  onChange={setStromUst}
                  label="Umsatzsteuer (USt.)"
                  sub="20% auf GA-inkl. Betrag"
                  accent="orange"
                />
              </div>

              {/* Abgaben */}
              <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-5">
                <div className="text-xs tracking-wider uppercase text-neutral-500 font-mono mb-3">Abgaben auf Energiepreis</div>
                <div className="flex items-center justify-between py-2.5 border-b border-neutral-700">
                  <div>
                    <div className="text-sm text-neutral-300">Gebrauchsabgabe Wien</div>
                    <div className="text-xs text-neutral-500 font-mono mt-0.5">nach Wiener Gebrauchsabgabegesetz</div>
                  </div>
                  <GaSelect value={stromGaRate} onChange={setStromGaRate} />
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <div className="text-sm text-neutral-300">Umsatzsteuer</div>
                  <div className="font-mono text-sm text-neutral-200">20,00 %</div>
                </div>
              </div>
            </div>

            {/* Preistabelle */}
            <div className="bg-neutral-800 border border-neutral-700 rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-neutral-700 text-xs tracking-wider uppercase text-neutral-500 font-mono">
                Preisübersicht — Energiepreis
              </div>

              <DividerRow>Grundpreis — Fixkosten pro Jahr</DividerRow>
              <ResultRow label="Netto (exkl. GA & USt.)" value={strom.gpNetto} />
              <ResultRow label={`+ Gebrauchsabgabe (${stromGaRate}%)`} value={strom.gpGa} hidden={!strom.showGA} />
              <ResultRow label="+ Umsatzsteuer (20%)" value={strom.gpUst} hidden={!strom.showUST} />
              <ResultRow label="Grundpreis gesamt" value={strom.gpBrutto} isTotal accent="orange" />

              <DividerRow>Verbrauchspreis — pro kWh</DividerRow>
              <ResultRow label="Netto (exkl. GA & USt.)" value={strom.vpNetto} />
              <ResultRow label={`+ Gebrauchsabgabe (${stromGaRate}%)`} value={strom.vpGa} hidden={!strom.showGA} />
              <ResultRow label="+ Umsatzsteuer (20%)" value={strom.vpUst} hidden={!strom.showUST} />
              <ResultRow label="Verbrauchspreis gesamt" sub={strom.vpLabel} value={strom.vpBrutto} isTotal accent="orange" />
            </div>
          </div>
        )}

        {/* ═══ GAS PANEL ═══ */}
        {tab === 'gas' && (
          <div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              {/* Optionen */}
              <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-5">
                <div className="text-xs tracking-wider uppercase text-neutral-500 font-mono mb-3">Optionen</div>
                <Toggle
                  checked={gasBindung}
                  onChange={setGasBindung}
                  label="12 Monate Vertragsbindung"
                  sub={`Rabatt: −${ct(tarif.gas.vp_brutto_ohne - tarif.gas.vp_brutto_mit)}`}
                  accent="blue"
                />

                <Toggle
                  checked={gasUst}
                  onChange={setGasUst}
                  label="Umsatzsteuer (USt.)"
                  sub="20% auf GA-inkl. Betrag"
                  accent="blue"
                />
              </div>

              {/* Abgaben */}
              <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-5">
                <div className="text-xs tracking-wider uppercase text-neutral-500 font-mono mb-3">Abgaben auf Energiepreis</div>
                <div className="flex items-center justify-between py-2.5 border-b border-neutral-700">
                  <div>
                    <div className="text-sm text-neutral-300">Gebrauchsabgabe Wien</div>
                    <div className="text-xs text-neutral-500 font-mono mt-0.5">nach Wiener Gebrauchsabgabegesetz</div>
                  </div>
                  <GaSelect value={gasGaRate} onChange={setGasGaRate} />
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <div className="text-sm text-neutral-300">Umsatzsteuer</div>
                  <div className="font-mono text-sm text-neutral-200">20,00 %</div>
                </div>
              </div>
            </div>

            {/* Preistabelle */}
            <div className="bg-neutral-800 border border-neutral-700 rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-neutral-700 text-xs tracking-wider uppercase text-neutral-500 font-mono">
                Preisübersicht — Energiepreis
              </div>

              <DividerRow>Grundpreis — Fixkosten pro Jahr</DividerRow>
              <ResultRow label="Netto (exkl. GA & USt.)" value={gas.gpNetto} />
              <ResultRow label={`+ Gebrauchsabgabe (${gasGaRate}%)`} value={gas.gpGa} hidden={!gas.showGA} />
              <ResultRow label="+ Umsatzsteuer (20%)" value={gas.gpUst} hidden={!gas.showUST} />
              <ResultRow label="Grundpreis gesamt" value={gas.gpBrutto} isTotal accent="blue" />

              <DividerRow>Verbrauchspreis — pro kWh</DividerRow>
              <ResultRow label="Netto (exkl. GA & USt.)" value={gas.vpNetto} />
              <ResultRow label={`+ Gebrauchsabgabe (${gasGaRate}%)`} value={gas.vpGa} hidden={!gas.showGA} />
              <ResultRow label="+ Umsatzsteuer (20%)" value={gas.vpUst} hidden={!gas.showUST} />
              <ResultRow label="Verbrauchspreis gesamt" sub={gas.vpLabel} value={gas.vpBrutto} isTotal accent="blue" />
            </div>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} tarif={tarif} onApply={applySettings} />

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 px-4 py-2.5 rounded-lg font-mono text-sm shadow-xl z-50 border transition-all ${
          toast.type === 'ok'
            ? 'bg-neutral-700 border-emerald-400/40 text-emerald-400'
            : 'bg-neutral-700 border-red-400/40 text-red-400'
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
};

export default TarifKalkulator;
