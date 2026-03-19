import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { loadFromStorage, saveToStorage } from '@/utils/storage';

// ─── Default Settings ────────────────────────────────────────────

const DEFAULT_SETTINGS = {
  kwh_tarife: {
    START: { grundgebuehr: 0, wien_ac: 0.39, wien_dc: 0.39, roaming_ac: 0.54, roaming_dc: 0.59 },
    PLUS: { grundgebuehr: 5.90, wien_ac: 0.36, wien_dc: 0.36, roaming_ac: 0.51, roaming_dc: 0.56 },
    EXPERT: { grundgebuehr: 34.90, wien_ac: 0.30, wien_dc: 0.30, roaming_ac: 0.51, roaming_dc: 0.56 },
  },
  zeit_tarife: {
    wien_netz: {
      START: { grundgebuehr: 0, city_ac11_tag: 0.075, city_ac11_nacht: 0.018, spot_ac37: 0.031, spot_ac11: 0.075, spot_ac22: 0.127, fast_ac43: 0.388, fast_dc50: 0.388 },
      PLUS: { grundgebuehr: 9.90, city_ac11_tag: 0.057, city_ac11_nacht: 0.016, spot_ac37: 0.023, spot_ac11: 0.057, spot_ac22: 0.103, fast_ac43: 0.284, fast_dc50: 0.284 },
      EXPERT: { grundgebuehr: 34.90, city_ac11_tag: 0.039, city_ac11_nacht: 0.016, spot_ac37: 0.016, spot_ac11: 0.039, spot_ac22: 0.052, fast_ac43: 0.142, fast_dc50: 0.142 },
    },
    roaming: {
      START: { grundgebuehr: 0, ac37: 0.078, ac11: 0.129, ac22: 0.207, dc20: 0.207, ac43: 0.698, dc50: 0.698 },
      PLUS: { grundgebuehr: 9.90, ac37: 0.052, ac11: 0.103, ac22: 0.181, dc20: 0.181, ac43: 0.568, dc50: 0.568 },
      EXPERT: { grundgebuehr: 34.90, ac37: 0.026, ac11: 0.078, ac22: 0.155, dc20: 0.155, ac43: 0.465, dc50: 0.465 },
    },
  },
  standzeit: {
    ac_threshold_min: 180,
    dc_threshold_min: 45,
    wien_ac_per_min: 0.05,
    wien_dc_per_min: 0.05,
    roaming_ac_per_min: 0.10,
    roaming_dc_per_min: 0.10,
  },
};

type Settings = typeof DEFAULT_SETTINGS;
type TarifName = 'START' | 'PLUS' | 'EXPERT';
const TARIF_NAMES: TarifName[] = ['START', 'PLUS', 'EXPERT'];

// ─── Station Categories ──────────────────────────────────────────

const WIEN_STATION_OPTIONS = [
  { value: 'city_ac11', label: 'City AC 11kW' },
  { value: 'spot_ac37', label: 'Spot/Parking AC 3,7kW' },
  { value: 'spot_ac11', label: 'Spot/Parking AC 11kW' },
  { value: 'spot_ac22', label: 'Spot/Parking AC 22kW' },
  { value: 'fast_ac43', label: 'Fast AC 43kW' },
  { value: 'fast_dc50', label: 'Fast DC 50kW' },
];

const ROAMING_EXTRA_OPTIONS = [
  { value: 'dc20', label: 'DC 20kW' },
];

const ROAMING_KEY_MAP: Record<string, string> = {
  city_ac11: 'ac11',
  spot_ac37: 'ac37',
  spot_ac11: 'ac11',
  spot_ac22: 'ac22',
  fast_ac43: 'ac43',
  fast_dc50: 'dc50',
  dc20: 'dc20',
};

// ─── Helpers ─────────────────────────────────────────────────────

const fmtEuro = (val: number) =>
  val.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';

const fmtNum = (val: number, decimals = 2) =>
  val.toLocaleString('de-DE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

const fmtDuration = (min: number) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h} h ${m} min` : `${m} min`;
};

function getZeitTarifKey(networkType: string, stationCategory: string, timeOfDay: string): string {
  if (networkType === 'wien') {
    return stationCategory === 'city_ac11' ? `city_ac11_${timeOfDay}` : stationCategory;
  }
  return ROAMING_KEY_MAP[stationCategory] || stationCategory;
}

function setNestedValue(obj: any, path: string[], value: any): any {
  const clone = JSON.parse(JSON.stringify(obj));
  let current = clone;
  for (let i = 0; i < path.length - 1; i++) {
    current = current[path[i]];
  }
  current[path[path.length - 1]] = value;
  return clone;
}

// ─── Settings Field Labels ───────────────────────────────────────

const KWH_FIELD_LABELS: Record<string, string> = {
  grundgebuehr: 'Grundgebühr (€/Mo)',
  wien_ac: 'Wien AC (€/kWh)',
  wien_dc: 'Wien DC (€/kWh)',
  roaming_ac: 'Roaming AC (€/kWh)',
  roaming_dc: 'Roaming DC (€/kWh)',
};

const ZEIT_WIEN_FIELD_LABELS: Record<string, string> = {
  grundgebuehr: 'Grundgebühr (€/Mo)',
  city_ac11_tag: 'City AC 11kW Tag (€/min)',
  city_ac11_nacht: 'City AC 11kW Nacht (€/min)',
  spot_ac37: 'Spot AC 3,7kW (€/min)',
  spot_ac11: 'Spot AC 11kW (€/min)',
  spot_ac22: 'Spot AC 22kW (€/min)',
  fast_ac43: 'Fast AC 43kW (€/min)',
  fast_dc50: 'Fast DC 50kW (€/min)',
};

const ZEIT_ROAMING_FIELD_LABELS: Record<string, string> = {
  grundgebuehr: 'Grundgebühr (€/Mo)',
  ac37: 'AC 3,7kW (€/min)',
  ac11: 'AC 11kW (€/min)',
  ac22: 'AC 22kW (€/min)',
  dc20: 'DC 20kW (€/min)',
  ac43: 'AC 43kW (€/min)',
  dc50: 'DC 50kW (€/min)',
};

const STANDZEIT_FIELD_LABELS: Record<string, string> = {
  ac_threshold_min: 'AC Schwelle (min)',
  dc_threshold_min: 'DC Schwelle (min)',
  wien_ac_per_min: 'Wien AC (€/min)',
  wien_dc_per_min: 'Wien DC (€/min)',
  roaming_ac_per_min: 'Roaming AC (€/min)',
  roaming_dc_per_min: 'Roaming DC (€/min)',
};

// ─── Main Component ──────────────────────────────────────────────

export const EMobilityKalkulator: React.FC = () => {
  // Settings
  const [settings, setSettings] = useState<Settings>(() =>
    loadFromStorage('emobility_settings', DEFAULT_SETTINGS)
  );
  const [showSettings, setShowSettings] = useState(false);
  const [settingsDraft, setSettingsDraft] = useState<Settings>(settings);

  // Input state
  const [chargesPerMonth, setChargesPerMonth] = useState(30);
  const [powerAc, setPowerAc] = useState(11);
  const [powerDc, setPowerDc] = useState(180);
  const [energyKwh, setEnergyKwh] = useState(30);
  const [durationMin, setDurationMin] = useState(164);
  const [durationH, setDurationH] = useState('2');
  const [durationM, setDurationM] = useState('44');
  const isEditingDuration = useRef(false);
  const [lastEdited, setLastEdited] = useState<'kwh' | 'min'>('kwh');
  const [phevMode, setPhevMode] = useState(false);
  const [prevPowerDc, setPrevPowerDc] = useState(180);

  // Context selectors
  const [chargeType, setChargeType] = useState<'AC' | 'DC'>('AC');
  const [networkType, setNetworkType] = useState<'wien' | 'roaming'>('wien');
  const [stationCategory, setStationCategory] = useState('city_ac11');
  const [timeOfDay, setTimeOfDay] = useState<'tag' | 'nacht'>('tag');

  // Expanded rechenweg
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  // Active power
  const activePower = chargeType === 'AC' ? powerAc : powerDc;

  // Two-way binding: energy ↔ duration
  const handleEnergyChange = useCallback((val: number) => {
    setEnergyKwh(val);
    setLastEdited('kwh');
    const ap = chargeType === 'AC' ? powerAc : powerDc;
    if (ap > 0) {
      setDurationMin(Math.round((val / ap) * 60));
    }
  }, [chargeType, powerAc, powerDc]);

  const handleDurationChange = useCallback((val: number) => {
    setDurationMin(val);
    setLastEdited('min');
    const ap = chargeType === 'AC' ? powerAc : powerDc;
    if (ap > 0) {
      setEnergyKwh(+(ap * (val / 60)).toFixed(2));
    }
  }, [chargeType, powerAc, powerDc]);

  // Sync display fields when durationMin changes externally
  useEffect(() => {
    if (!isEditingDuration.current) {
      setDurationH(String(Math.floor(durationMin / 60)));
      setDurationM(String(durationMin % 60));
    }
  }, [durationMin]);

  // Normalize h/min on blur: decimal hours → h+min, minutes ≥60 → extra hours
  const handleDurationBlur = useCallback(() => {
    isEditingDuration.current = false;
    const hParsed = parseFloat(durationH.replace(',', '.')) || 0;
    const mParsed = parseFloat(durationM.replace(',', '.')) || 0;
    const wholeH = Math.floor(hParsed);
    const fracMin = Math.round((hParsed - wholeH) * 60);
    const totalMin = Math.max(0, wholeH * 60 + fracMin + Math.round(mParsed));
    const newH = Math.floor(totalMin / 60);
    const newM = totalMin % 60;
    setDurationH(String(newH));
    setDurationM(String(newM));
    handleDurationChange(totalMin);
  }, [durationH, durationM, handleDurationChange]);

  // Recompute when activePower changes
  useEffect(() => {
    if (activePower === 0) return;
    if (lastEdited === 'kwh') {
      setDurationMin(Math.round((energyKwh / activePower) * 60));
    } else {
      setEnergyKwh(+(activePower * (durationMin / 60)).toFixed(2));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePower]);

  // PHEV mode
  const handlePhevToggle = useCallback(() => {
    if (!phevMode) {
      setPrevPowerDc(powerDc);
      setPowerAc(3.7);
      setPowerDc(0);
      setPhevMode(true);
      setChargeType('AC');
    } else {
      setPowerDc(prevPowerDc);
      setPhevMode(false);
    }
  }, [phevMode, powerDc, prevPowerDc]);

  // Settings handlers
  const openSettings = useCallback(() => {
    setSettingsDraft(JSON.parse(JSON.stringify(settings)));
    setShowSettings(true);
  }, [settings]);

  const saveSettings = useCallback(() => {
    setSettings(settingsDraft);
    saveToStorage('emobility_settings', settingsDraft);
    setShowSettings(false);
  }, [settingsDraft]);

  const resetSettings = useCallback(() => {
    setSettingsDraft(JSON.parse(JSON.stringify(DEFAULT_SETTINGS)));
  }, []);

  const updateDraft = useCallback((path: string[], value: number) => {
    setSettingsDraft(prev => setNestedValue(prev, path, value));
  }, []);

  // Escape key for settings modal
  useEffect(() => {
    if (!showSettings) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowSettings(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showSettings]);

  // Station options based on network and charge type
  const stationOptions = useMemo(() => {
    const allOptions = networkType === 'roaming'
      ? [...WIEN_STATION_OPTIONS, ...ROAMING_EXTRA_OPTIONS]
      : WIEN_STATION_OPTIONS;
    return allOptions.filter(opt =>
      chargeType === 'DC' ? opt.value.includes('dc') : !opt.value.includes('dc')
    );
  }, [networkType, chargeType]);

  // Reset stationCategory if invalid for new network or charge type
  useEffect(() => {
    const validValues = stationOptions.map(o => o.value);
    if (!validValues.includes(stationCategory)) {
      setStationCategory(validValues[0]);
    }
  }, [stationOptions, stationCategory]);

  // Show time_of_day toggle?
  const showTimeOfDay = stationCategory === 'city_ac11' && networkType === 'wien';

  // ─── Calculations ──────────────────────────────────────────────

  const calculations = useMemo(() => {
    const results: {
      kwh: Record<TarifName, { cost: number; baseCost: number; standzeitCost: number; standzeitMinutes: number; standzeitRate: number; grundgebuehrAnteil: number; unitPrice: number; rechenweg: string }>;
      zeit: Record<TarifName, { cost: number; grundgebuehrAnteil: number; unitPrice: number; rechenweg: string }>;
      cheapestKey: string;
      cheapestCost: number;
    } = {
      kwh: {} as any,
      zeit: {} as any,
      cheapestKey: '',
      cheapestCost: Infinity,
    };

    const kwhKey = `${networkType === 'wien' ? 'wien' : 'roaming'}_${chargeType.toLowerCase()}`;
    const standzeitRateKey = `${networkType === 'wien' ? 'wien' : 'roaming'}_${chargeType.toLowerCase()}_per_min`;
    const threshold = chargeType === 'AC' ? settings.standzeit.ac_threshold_min : settings.standzeit.dc_threshold_min;
    const standzeitMinutes = Math.max(0, durationMin - threshold);
    const nachtException = timeOfDay === 'nacht' && networkType === 'wien';

    for (const tarif of TARIF_NAMES) {
      // ── kWh tarif ──
      const kwhUnitPrice = (settings.kwh_tarife[tarif] as any)[kwhKey] as number;
      const kwhBaseCost = energyKwh * kwhUnitPrice;
      const kwhGrundgebuehrAnteil = chargesPerMonth > 0 ? settings.kwh_tarife[tarif].grundgebuehr / chargesPerMonth : 0;
      const standzeitRate = (settings.standzeit as any)[standzeitRateKey] as number;
      const standzeitCost = nachtException ? 0 : standzeitMinutes * standzeitRate;
      const kwhCost = kwhBaseCost + standzeitCost + kwhGrundgebuehrAnteil;

      let kwhRechenweg = `${fmtNum(energyKwh)} kWh × ${fmtNum(kwhUnitPrice, 2)} €/kWh = ${fmtEuro(kwhBaseCost)}`;
      if (standzeitCost > 0) {
        kwhRechenweg += ` | ⚠️ Standzeitgebühr: ${standzeitMinutes} min × ${fmtNum(standzeitRate, 2)} €/min = ${fmtEuro(standzeitCost)}`;
      }
      if (settings.kwh_tarife[tarif].grundgebuehr > 0 && chargesPerMonth > 0) {
        kwhRechenweg += ` | Grundgebühr-Anteil: ${fmtEuro(settings.kwh_tarife[tarif].grundgebuehr)} ÷ ${chargesPerMonth} = ${fmtEuro(kwhGrundgebuehrAnteil)}`;
      }
      kwhRechenweg += ` | Gesamt: ${fmtEuro(kwhCost)}`;

      results.kwh[tarif] = {
        cost: kwhCost, baseCost: kwhBaseCost, standzeitCost, standzeitMinutes, standzeitRate,
        grundgebuehrAnteil: kwhGrundgebuehrAnteil, unitPrice: kwhUnitPrice, rechenweg: kwhRechenweg,
      };

      if (kwhCost < results.cheapestCost) {
        results.cheapestCost = kwhCost;
        results.cheapestKey = `kwh_${tarif}`;
      }

      // ── Zeit tarif ──
      const zeitNetworkKey = networkType === 'wien' ? 'wien_netz' : 'roaming';
      const zeitFieldKey = getZeitTarifKey(networkType, stationCategory, timeOfDay);
      const zeitTarifData = (settings.zeit_tarife as any)[zeitNetworkKey][tarif];
      const zeitUnitPrice = zeitTarifData[zeitFieldKey] as number;
      const zeitGrundgebuehrAnteil = chargesPerMonth > 0 ? zeitTarifData.grundgebuehr / chargesPerMonth : 0;
      const zeitCost = (durationMin * zeitUnitPrice) + zeitGrundgebuehrAnteil;

      let zeitRechenweg = `${durationMin} min × ${fmtNum(zeitUnitPrice, 3)} €/min = ${fmtEuro(durationMin * zeitUnitPrice)}`;
      if (zeitTarifData.grundgebuehr > 0 && chargesPerMonth > 0) {
        zeitRechenweg += ` | Grundgebühr-Anteil: ${fmtEuro(zeitTarifData.grundgebuehr)} ÷ ${chargesPerMonth} = ${fmtEuro(zeitGrundgebuehrAnteil)}`;
      }
      zeitRechenweg += ` | Gesamt: ${fmtEuro(zeitCost)}`;

      results.zeit[tarif] = {
        cost: zeitCost, grundgebuehrAnteil: zeitGrundgebuehrAnteil, unitPrice: zeitUnitPrice, rechenweg: zeitRechenweg,
      };

      if (zeitCost < results.cheapestCost) {
        results.cheapestCost = zeitCost;
        results.cheapestKey = `zeit_${tarif}`;
      }
    }

    return results;
  }, [settings, energyKwh, durationMin, chargesPerMonth, chargeType, networkType, stationCategory, timeOfDay]);

  // Standzeit warning
  const standzeitWarning = useMemo(() => {
    const threshold = chargeType === 'AC' ? settings.standzeit.ac_threshold_min : settings.standzeit.dc_threshold_min;
    const nachtException = timeOfDay === 'nacht' && networkType === 'wien';
    if (durationMin > threshold && !nachtException) {
      const overMinutes = durationMin - threshold;
      const rateKey = `${networkType === 'wien' ? 'wien' : 'roaming'}_${chargeType.toLowerCase()}_per_min`;
      const rate = (settings.standzeit as any)[rateKey] as number;
      return `Standzeitgebühr aktiv ab ${threshold} min (+${overMinutes} min × ${fmtNum(rate, 2)} €/min)`;
    }
    return null;
  }, [durationMin, chargeType, networkType, timeOfDay, settings.standzeit]);

  const toggleCardExpand = useCallback((key: string) => {
    setExpandedCards(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // ─── Render ────────────────────────────────────────────────────

  return (
    <div className="w-full h-full p-4 sm:p-8 bg-neutral-900 overflow-y-auto custom-scrollbar">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-orange-400 flex items-center gap-3">
            <i className="material-icons">ev_station</i>
            E-Mobility Tarifrechner
          </h1>
          <button
            onClick={openSettings}
            className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-700/50 transition-colors"
            title="Einstellungen"
          >
            <i className="material-icons">settings</i>
          </button>
        </div>

        {/* Inputs */}
        <div className="bg-neutral-800 rounded-xl border border-neutral-700 p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Ladevorgänge pro Monat */}
            <div>
              <div className="flex items-center gap-1 mb-1 min-h-[24px]">
                <label className="text-sm font-medium text-neutral-300">Ladevorgänge pro Monat</label>
              </div>
              <input
                type="number"
                min={0}
                value={chargesPerMonth}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setChargesPerMonth(parseInt(e.target.value) || 0)}
                className={`w-full bg-neutral-900 border rounded-md p-3 text-neutral-200 text-sm focus:outline-none focus:ring-2 transition ${chargesPerMonth === 0 ? 'border-red-500 bg-red-900/20 focus:ring-red-500' : 'border-neutral-600 focus:ring-orange-500'}`}
              />
            </div>

            {/* Ladeleistung AC */}
            <div>
              <div className="flex items-center gap-1 mb-1 min-h-[24px]">
                <label className="text-sm font-medium text-neutral-300">Ladeleistung AC (kW)</label>
                <a href="https://ev-database.org/de/" target="_blank" rel="noopener noreferrer" title="Fahrzeugdaten nachschlagen" className="text-neutral-400 hover:text-orange-400 transition-colors">
                  <i className="material-icons text-base">info</i>
                </a>
              </div>
              <input
                type="number"
                min={0}
                step={0.1}
                value={powerAc}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setPowerAc(parseFloat(e.target.value) || 0)}
                disabled={chargeType === 'DC'}
                className={`w-full bg-neutral-900 border rounded-md p-3 text-neutral-200 text-sm focus:outline-none focus:ring-2 transition ${chargeType === 'DC' ? 'opacity-40 pointer-events-none border-neutral-600 focus:ring-orange-500' : powerAc === 0 ? 'border-red-500 bg-red-900/20 focus:ring-red-500' : 'border-neutral-600 focus:ring-orange-500'}`}
              />
            </div>

            {/* Ladeleistung DC */}
            <div>
              <div className="flex items-center gap-1 mb-1 min-h-[24px]">
                <label className="text-sm font-medium text-neutral-300">Ladeleistung DC 10-80% (kW)</label>
                <a href="https://ev-database.org/de/" target="_blank" rel="noopener noreferrer" title="Fahrzeugdaten nachschlagen" className="text-neutral-400 hover:text-orange-400 transition-colors">
                  <i className="material-icons text-base">info</i>
                </a>
              </div>
              <input
                type="number"
                min={0}
                step={1}
                value={powerDc}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setPowerDc(parseFloat(e.target.value) || 0)}
                disabled={chargeType === 'AC' || phevMode}
                className={`w-full bg-neutral-900 border rounded-md p-3 text-neutral-200 text-sm focus:outline-none focus:ring-2 transition ${(chargeType === 'AC' || phevMode) ? 'opacity-40 pointer-events-none border-neutral-600 focus:ring-orange-500' : powerDc === 0 ? 'border-red-500 bg-red-900/20 focus:ring-red-500' : 'border-neutral-600 focus:ring-orange-500'}`}
              />
            </div>

            {/* Geladene Energie */}
            <div>
              <div className="flex items-center gap-1 mb-1 min-h-[24px]">
                <label className="text-sm font-medium text-neutral-300">Geladene Energie (kWh)</label>
              </div>
              <input
                type="number"
                min={0}
                step={1}
                value={energyKwh}
                onFocus={(e) => e.target.select()}
                onChange={(e) => handleEnergyChange(parseFloat(e.target.value) || 0)}
                className={`w-full bg-neutral-900 border rounded-md p-3 text-neutral-200 text-sm focus:outline-none focus:ring-2 transition ${energyKwh === 0 ? 'border-red-500 bg-red-900/20 focus:ring-red-500' : 'border-neutral-600 focus:ring-orange-500'}`}
              />
            </div>

            {/* Ladedauer */}
            <div>
              <div className="flex items-center gap-1 mb-1 min-h-[24px]">
                <label className="text-sm font-medium text-neutral-300">
                  Ladedauer <span className="text-neutral-500">({fmtDuration(durationMin)})</span>
                </label>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={durationH}
                    onFocus={(e) => { isEditingDuration.current = true; e.target.select(); }}
                    onChange={(e) => setDurationH(e.target.value)}
                    onBlur={handleDurationBlur}
                    className={`w-full bg-neutral-900 border rounded-md p-3 pr-8 text-neutral-200 text-sm focus:outline-none focus:ring-2 transition ${durationMin === 0 ? 'border-red-500 bg-red-900/20 focus:ring-red-500' : 'border-neutral-600 focus:ring-orange-500'}`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm pointer-events-none">h</span>
                </div>
                <div className="relative flex-1">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={durationM}
                    onFocus={(e) => { isEditingDuration.current = true; e.target.select(); }}
                    onChange={(e) => setDurationM(e.target.value)}
                    onBlur={handleDurationBlur}
                    className={`w-full bg-neutral-900 border rounded-md p-3 pr-12 text-neutral-200 text-sm focus:outline-none focus:ring-2 transition ${durationMin === 0 ? 'border-red-500 bg-red-900/20 focus:ring-red-500' : 'border-neutral-600 focus:ring-orange-500'}`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm pointer-events-none">min</span>
                </div>
              </div>
            </div>

            {/* PHEV Button */}
            <div className="flex items-end">
              <button
                onClick={handlePhevToggle}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-md font-semibold transition shadow text-sm ${
                  phevMode
                    ? 'bg-orange-600 text-white'
                    : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
                }`}
              >
                <i className="material-icons text-base">electric_car</i>
                PHEV / Hybrid
              </button>
            </div>
          </div>

          {(activePower === 0 || chargesPerMonth === 0 || energyKwh === 0 || durationMin === 0) && (
            <div className="mt-3 bg-red-900/50 border border-red-700 text-red-300 text-sm rounded-md p-3">
              {activePower === 0 && <div>Ladeleistung darf nicht 0 sein.</div>}
              {chargesPerMonth === 0 && <div>Ladevorgänge pro Monat darf nicht 0 sein.</div>}
              {energyKwh === 0 && <div>Geladene Energie darf nicht 0 sein.</div>}
              {durationMin === 0 && <div>Ladedauer darf nicht 0 sein.</div>}
            </div>
          )}
        </div>

        {/* Context Selectors */}
        <div className="bg-neutral-800 rounded-xl border border-neutral-700 p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Charge Type Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-400">Ladeart:</span>
              <div className="flex rounded-lg overflow-hidden border border-neutral-600">
                {(['AC', 'DC'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => { if (!phevMode || t === 'AC') setChargeType(t); }}
                    disabled={phevMode && t === 'DC'}
                    className={`px-4 py-1.5 text-sm font-medium transition ${
                      chargeType === t
                        ? 'bg-orange-600 text-white'
                        : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
                    } ${phevMode && t === 'DC' ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Network Type */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-400">Netz:</span>
              <select
                value={networkType}
                onChange={(e) => setNetworkType(e.target.value as 'wien' | 'roaming')}
                className="bg-neutral-700 border border-neutral-600 rounded-md px-3 py-1.5 text-sm text-neutral-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="wien">Wien Energie Netz</option>
                <option value="roaming">Partnernetz (Roaming)</option>
              </select>
            </div>

            {/* Station Category */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-400">Station:</span>
              <select
                value={stationCategory}
                onChange={(e) => setStationCategory(e.target.value)}
                className="bg-neutral-700 border border-neutral-600 rounded-md px-3 py-1.5 text-sm text-neutral-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {stationOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Time of Day Toggle */}
            {showTimeOfDay && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-400">Tageszeit:</span>
                <div className="flex rounded-lg overflow-hidden border border-neutral-600">
                  {[{ value: 'tag' as const, label: 'Tag (8–22 Uhr)' }, { value: 'nacht' as const, label: 'Nacht (22–8 Uhr)' }].map(t => (
                    <button
                      key={t.value}
                      onClick={() => setTimeOfDay(t.value)}
                      className={`px-3 py-1.5 text-sm font-medium transition ${
                        timeOfDay === t.value
                          ? 'bg-orange-600 text-white'
                          : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* kWh Tarife Cards */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-lg font-bold text-neutral-200">kWh-Tarife</h2>
            {standzeitWarning && (
              <span className="text-yellow-400 cursor-help" title={standzeitWarning}>
                <i className="material-icons text-base">warning</i>
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TARIF_NAMES.map(tarif => {
              const data = calculations.kwh[tarif];
              const cardKey = `kwh_${tarif}`;
              const isCheapest = calculations.cheapestKey === cardKey;
              return (
                <div
                  key={cardKey}
                  className={`bg-neutral-800 rounded-xl p-5 flex flex-col transition-all ${
                    isCheapest ? 'border-2 border-orange-500 ring-1 ring-orange-500/30' : 'border border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-orange-400">{tarif}</h3>
                    {isCheapest && (
                      <span className="text-xs font-semibold bg-orange-600 text-white px-2 py-0.5 rounded-full">
                        Günstigste Option
                      </span>
                    )}
                  </div>
                  <div className="text-3xl font-bold text-neutral-100 mb-1">
                    {fmtEuro(data.cost)}
                  </div>
                  <div className="text-sm text-neutral-400 mb-4">pro Ladevorgang</div>

                  <div className="text-xs text-neutral-500 space-y-1 mb-4">
                    <div>Energie: {fmtNum(energyKwh)} kWh × {fmtNum(data.unitPrice, 2)} €/kWh</div>
                    {data.standzeitCost > 0 && (
                      <div className="text-yellow-400">⚠️ Standzeit: +{fmtEuro(data.standzeitCost)}</div>
                    )}
                    {settings.kwh_tarife[tarif].grundgebuehr > 0 && (
                      <div>Grundgebühr: {fmtEuro(data.grundgebuehrAnteil)}/Vorgang</div>
                    )}
                  </div>

                  <button
                    onClick={() => toggleCardExpand(cardKey)}
                    className="mt-auto text-xs text-neutral-400 hover:text-orange-400 transition-colors flex items-center gap-1"
                  >
                    <i className="material-icons text-sm">{expandedCards[cardKey] ? 'expand_less' : 'expand_more'}</i>
                    Rechenweg {expandedCards[cardKey] ? 'ausblenden' : 'anzeigen'}
                  </button>
                  {expandedCards[cardKey] && (
                    <div className="mt-2 p-3 bg-neutral-900 rounded-lg text-xs text-neutral-400 leading-relaxed border border-neutral-700">
                      {data.rechenweg}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Zeit Tarife Cards */}
        <div>
          <h2 className="text-lg font-bold text-neutral-200 mb-3">Zeittarife</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TARIF_NAMES.map(tarif => {
              const data = calculations.zeit[tarif];
              const cardKey = `zeit_${tarif}`;
              const isCheapest = calculations.cheapestKey === cardKey;
              const zeitNetworkKey = networkType === 'wien' ? 'wien_netz' : 'roaming';
              const zeitGrundgebuehr = (settings.zeit_tarife as any)[zeitNetworkKey][tarif].grundgebuehr;
              return (
                <div
                  key={cardKey}
                  className={`bg-neutral-800 rounded-xl p-5 flex flex-col transition-all ${
                    isCheapest ? 'border-2 border-orange-500 ring-1 ring-orange-500/30' : 'border border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-orange-400">{tarif}</h3>
                    {isCheapest && (
                      <span className="text-xs font-semibold bg-orange-600 text-white px-2 py-0.5 rounded-full">
                        Günstigste Option
                      </span>
                    )}
                  </div>
                  <div className="text-3xl font-bold text-neutral-100 mb-1">
                    {fmtEuro(data.cost)}
                  </div>
                  <div className="text-sm text-neutral-400 mb-4">pro Ladevorgang</div>

                  <div className="text-xs text-neutral-500 space-y-1 mb-4">
                    <div>Dauer: {durationMin} min × {fmtNum(data.unitPrice, 3)} €/min</div>
                    {zeitGrundgebuehr > 0 && (
                      <div>Grundgebühr: {fmtEuro(data.grundgebuehrAnteil)}/Vorgang</div>
                    )}
                  </div>

                  <button
                    onClick={() => toggleCardExpand(cardKey)}
                    className="mt-auto text-xs text-neutral-400 hover:text-orange-400 transition-colors flex items-center gap-1"
                  >
                    <i className="material-icons text-sm">{expandedCards[cardKey] ? 'expand_less' : 'expand_more'}</i>
                    Rechenweg {expandedCards[cardKey] ? 'ausblenden' : 'anzeigen'}
                  </button>
                  {expandedCards[cardKey] && (
                    <div className="mt-2 p-3 bg-neutral-900 rounded-lg text-xs text-neutral-400 leading-relaxed border border-neutral-700">
                      {data.rechenweg}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4 text-sm text-yellow-300 flex items-start gap-2">
          <i className="material-icons text-base mt-0.5">warning</i>
          <span>Zeittarife können je nach Ladegeschwindigkeit des Fahrzeugs stark variieren. Die Berechnung basiert auf der eingegebenen Ladedauer.</span>
        </div>

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowSettings(false)}>
            <div className="bg-neutral-800 rounded-2xl w-full max-w-4xl flex flex-col border border-neutral-700 max-h-[85vh]" onClick={e => e.stopPropagation()}>
              <header className="flex items-center justify-between p-4 border-b border-neutral-700 flex-shrink-0">
                <div className="flex items-center">
                  <i className="material-icons text-2xl text-orange-400 mr-3">settings</i>
                  <h2 className="text-xl font-bold text-neutral-100">Tarifeinstellungen</h2>
                </div>
                <button onClick={() => setShowSettings(false)} className="p-1 rounded-full text-neutral-400 hover:bg-neutral-700 hover:text-white transition-colors" aria-label="Schließen">
                  <i className="material-icons">close</i>
                </button>
              </header>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                {/* kWh Tarife */}
                <div>
                  <h3 className="text-lg font-bold text-orange-400 mb-4">kWh-Tarife</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {TARIF_NAMES.map(tarif => (
                      <div key={tarif} className="space-y-2">
                        <h4 className="text-sm font-bold text-neutral-200 border-b border-neutral-700 pb-1">{tarif}</h4>
                        {Object.entries(KWH_FIELD_LABELS).map(([field, label]) => (
                          <div key={field} className="flex items-center gap-2">
                            <label className="text-xs text-neutral-400 flex-1 min-w-0 truncate" title={label}>{label}</label>
                            <input
                              type="number"
                              step="0.001"
                              value={(settingsDraft.kwh_tarife[tarif] as any)[field]}
                              onChange={e => updateDraft(['kwh_tarife', tarif, field], parseFloat(e.target.value) || 0)}
                              className="w-20 bg-neutral-900 border border-neutral-600 rounded px-2 py-1 text-xs text-neutral-200 focus:outline-none focus:ring-1 focus:ring-orange-500"
                            />
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Zeittarife Wien Netz */}
                <div>
                  <h3 className="text-lg font-bold text-orange-400 mb-4">Zeittarife — Wien Netz</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {TARIF_NAMES.map(tarif => (
                      <div key={tarif} className="space-y-2">
                        <h4 className="text-sm font-bold text-neutral-200 border-b border-neutral-700 pb-1">{tarif}</h4>
                        {Object.entries(ZEIT_WIEN_FIELD_LABELS).map(([field, label]) => (
                          <div key={field} className="flex items-center gap-2">
                            <label className="text-xs text-neutral-400 flex-1 min-w-0 truncate" title={label}>{label}</label>
                            <input
                              type="number"
                              step="0.001"
                              value={(settingsDraft.zeit_tarife.wien_netz[tarif] as any)[field]}
                              onChange={e => updateDraft(['zeit_tarife', 'wien_netz', tarif, field], parseFloat(e.target.value) || 0)}
                              className="w-20 bg-neutral-900 border border-neutral-600 rounded px-2 py-1 text-xs text-neutral-200 focus:outline-none focus:ring-1 focus:ring-orange-500"
                            />
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Zeittarife Roaming */}
                <div>
                  <h3 className="text-lg font-bold text-orange-400 mb-4">Zeittarife — Roaming</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {TARIF_NAMES.map(tarif => (
                      <div key={tarif} className="space-y-2">
                        <h4 className="text-sm font-bold text-neutral-200 border-b border-neutral-700 pb-1">{tarif}</h4>
                        {Object.entries(ZEIT_ROAMING_FIELD_LABELS).map(([field, label]) => (
                          <div key={field} className="flex items-center gap-2">
                            <label className="text-xs text-neutral-400 flex-1 min-w-0 truncate" title={label}>{label}</label>
                            <input
                              type="number"
                              step="0.001"
                              value={(settingsDraft.zeit_tarife.roaming[tarif] as any)[field]}
                              onChange={e => updateDraft(['zeit_tarife', 'roaming', tarif, field], parseFloat(e.target.value) || 0)}
                              className="w-20 bg-neutral-900 border border-neutral-600 rounded px-2 py-1 text-xs text-neutral-200 focus:outline-none focus:ring-1 focus:ring-orange-500"
                            />
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Standzeitzuschläge */}
                <div>
                  <h3 className="text-lg font-bold text-orange-400 mb-4">Standzeitzuschläge</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {Object.entries(STANDZEIT_FIELD_LABELS).map(([field, label]) => (
                      <div key={field} className="flex items-center gap-2">
                        <label className="text-xs text-neutral-400 flex-1 min-w-0 truncate" title={label}>{label}</label>
                        <input
                          type="number"
                          step={field.includes('threshold') ? '1' : '0.001'}
                          value={(settingsDraft.standzeit as any)[field]}
                          onChange={e => updateDraft(['standzeit', field], parseFloat(e.target.value) || 0)}
                          className="w-20 bg-neutral-900 border border-neutral-600 rounded px-2 py-1 text-xs text-neutral-200 focus:outline-none focus:ring-1 focus:ring-orange-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modal footer */}
              <div className="border-t border-neutral-700 p-4 flex justify-between flex-shrink-0">
                <button
                  onClick={resetSettings}
                  className="px-4 py-2 rounded-md bg-neutral-700 text-neutral-300 hover:bg-neutral-600 text-sm font-medium transition"
                >
                  Reset auf Defaults
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowSettings(false)}
                    className="px-4 py-2 rounded-md bg-neutral-700 text-neutral-300 hover:bg-neutral-600 text-sm font-medium transition"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={saveSettings}
                    className="px-4 py-2 rounded-md bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold transition shadow"
                  >
                    Speichern
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
