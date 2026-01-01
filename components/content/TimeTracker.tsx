import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Break, WorkPhase, PhaseType } from '../../types';
import { timeStringToMinutes, minutesToTimeString, formatDuration, getCurrentTime } from '../../utils/time';
import { loadFromStorage, saveToStorage } from '../../utils/storage';


interface TimeTrackerProps {
    onOpenResetModal: () => void;
    resetTrigger: number;
}

const Card: React.FC<{ title: string; icon: string; children: React.ReactNode; className?: string }> = ({ title, icon, children, className }) => (
    <div className={`bg-neutral-800 rounded-xl border border-neutral-700 p-6 shadow-2xl shadow-orange-900/10 flex flex-col ${className}`}>
        <h2 className="text-xl font-bold text-orange-400 border-b border-neutral-700 pb-3 mb-4 flex items-center flex-shrink-0">
            <i className="material-icons mr-3">{icon}</i>
            {title}
        </h2>
        <div className="flex-grow min-h-0">
            {children}
        </div>
    </div>
);


export const TimeTracker: React.FC<TimeTrackerProps> = ({ onOpenResetModal, resetTrigger }) => {
    const [totalWorkHours, setTotalWorkHours] = useState<number>(8);
    const [startTime, setStartTime] = useState<string>('');
    const [breaks, setBreaks] = useState<Break[]>([]);

    const [newBreakStart, setNewBreakStart] = useState('');
    const [newBreakEnd, setNewBreakEnd] = useState('');
    const [breakError, setBreakError] = useState('');

    const [currentTime, setCurrentTime] = useState(new Date());

    // Load state from localStorage on initial render
    // Load state from localStorage on initial render
    useEffect(() => {
        const savedState = loadFromStorage<{ totalWorkHours: number, startTime: string, breaks: Break[] } | null>('time-tracker-state', null);
        if (savedState) {
            const { totalWorkHours, startTime, breaks } = savedState;
            if (totalWorkHours) setTotalWorkHours(totalWorkHours);
            if (startTime) setStartTime(startTime);
            if (breaks) setBreaks(breaks);
        }
    }, []);

    // Save state to localStorage whenever it changes
    // Save state to localStorage whenever it changes
    useEffect(() => {
        const state = { totalWorkHours, startTime, breaks };
        saveToStorage('time-tracker-state', state);
    }, [totalWorkHours, startTime, breaks]);

    // Live update for current time
    useEffect(() => {
        const timerId = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);

    // Core Calculations
    const {
        totalWorkMinutes,
        totalBreakMinutes,
        endTime,
        remainingWorkMinutes,
        workPhases,
        activePhase,
    } = useMemo(() => {
        const totalWorkMins = totalWorkHours * 60;
        const sortedBreaks = [...breaks].sort((a, b) => timeStringToMinutes(a.start) - timeStringToMinutes(b.start));

        const totalBreakMins = sortedBreaks.reduce((acc, br) => {
            const startMins = timeStringToMinutes(br.start);
            const endMins = timeStringToMinutes(br.end);
            return acc + (endMins - startMins);
        }, 0);

        let endTimeString = '--:--';
        if (startTime) {
            const startMins = timeStringToMinutes(startTime);
            const endMins = startMins + totalWorkMins + totalBreakMins;
            endTimeString = minutesToTimeString(endMins);
        }

        // Live remaining time calculation
        let remainingMins = totalWorkMins;
        const nowMins = timeStringToMinutes(getCurrentTime());
        if (startTime && nowMins > timeStringToMinutes(startTime)) {
            const elapsedMins = nowMins - timeStringToMinutes(startTime);
            const elapsedBreakMins = sortedBreaks.reduce((acc, br) => {
                const breakStartMins = timeStringToMinutes(br.start);
                const breakEndMins = timeStringToMinutes(br.end);
                if (nowMins > breakEndMins) {
                    return acc + (breakEndMins - breakStartMins);
                } else if (nowMins > breakStartMins) {
                    return acc + (nowMins - breakStartMins);
                }
                return acc;
            }, 0);
            const elapsedWorkMins = elapsedMins - elapsedBreakMins;
            remainingMins = Math.max(0, totalWorkMins - elapsedWorkMins);
        }

        // Work phase calculation
        const phases: WorkPhase[] = [];
        let currentPhaseStart = startTime;
        if (startTime) {
            sortedBreaks.forEach((br, index) => {
                const breakStartMins = timeStringToMinutes(br.start);
                const currentPhaseStartMins = timeStringToMinutes(currentPhaseStart);

                // Add work block before this break
                if (breakStartMins > currentPhaseStartMins) {
                    phases.push({
                        type: 'work',
                        name: `Arbeitsblock ${phases.filter(p => p.type === 'work').length + 1}`,
                        start: currentPhaseStart,
                        end: br.start,
                        duration: breakStartMins - currentPhaseStartMins,
                    });
                }
                // Add the break itself
                phases.push({
                    type: 'break',
                    name: `Pause ${index + 1}`,
                    start: br.start,
                    end: br.end,
                    duration: timeStringToMinutes(br.end) - breakStartMins,
                });
                currentPhaseStart = br.end;
            });
            // Add final work block after the last break
            const lastPhaseEndMins = timeStringToMinutes(currentPhaseStart);
            const endTimeMins = timeStringToMinutes(endTimeString);
            if (endTimeMins > lastPhaseEndMins) {
                phases.push({
                    type: 'work',
                    name: `Arbeitsblock ${phases.filter(p => p.type === 'work').length + 1}`,
                    start: currentPhaseStart,
                    end: endTimeString,
                    duration: endTimeMins - lastPhaseEndMins,
                });
            }
        }

        const active = phases.find(p => nowMins >= timeStringToMinutes(p.start) && nowMins < timeStringToMinutes(p.end)) || null;

        return {
            totalWorkMinutes: totalWorkMins,
            totalBreakMinutes: totalBreakMins,
            endTime: endTimeString,
            remainingWorkMinutes: remainingMins,
            workPhases: phases,
            activePhase: active,
        };
    }, [totalWorkHours, startTime, breaks, currentTime]);

    // Effect to handle reset trigger from parent
    useEffect(() => {
        if (resetTrigger > 0) {
            setTotalWorkHours(8);
            setStartTime('');
            setBreaks([]);
            setNewBreakStart('');
            setNewBreakEnd('');
            setBreakError('');
        }
    }, [resetTrigger]);

    // Handlers
    const handleReset = () => {
        onOpenResetModal();
    };

    const handleAddBreak = () => {
        const startMins = timeStringToMinutes(newBreakStart);
        const endMins = timeStringToMinutes(newBreakEnd);
        if (startMins >= endMins) {
            setBreakError("Die Endzeit muss nach der Startzeit liegen.");
            return;
        }
        setBreakError('');
        setBreaks(prev => [...prev, { id: Date.now().toString(), start: newBreakStart, end: newBreakEnd }]);
        setNewBreakStart('');
        setNewBreakEnd('');
    };

    const handleDeleteBreak = (id: string) => {
        setBreaks(prev => prev.filter(b => b.id !== id));
    };

    return (
        <div className="flex flex-col h-full pt-8 pl-8">
            <header className="flex-shrink-0 flex justify-between items-start mb-8 pr-8">
                <div>
                    <h1 className="text-4xl font-bold text-neutral-100 mb-2">Homeoffice Zeiterfassung</h1>
                    <p className="text-neutral-400">Planen und verfolgen Sie Ihren Arbeitstag in Echtzeit.</p>
                </div>
            </header>

            <main className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0 pr-8 pb-8 overflow-y-auto custom-scrollbar">
                {/* Left Column */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    {/* Settings */}
                    <Card title="Einstellungen" icon="settings">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-neutral-300 mb-2">Gesamtarbeitszeit</label>
                                <div className="flex flex-wrap gap-2">
                                    {[4, 5, 6, 7, 8].map(h => (
                                        <button key={h} onClick={() => setTotalWorkHours(h)} className={`px-4 py-2 rounded-lg font-semibold transition-colors ${totalWorkHours === h ? 'bg-orange-500 text-white' : 'bg-neutral-700 hover:bg-neutral-600 text-neutral-200'}`}>{h} Std.</button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label htmlFor="start-time" className="block text-sm font-medium text-neutral-300 mb-2">Startzeit</label>
                                <div className="flex items-center gap-2">
                                    <input type="time" id="start-time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-neutral-200 focus:outline-none focus:ring-1 focus:ring-orange-500" />
                                    <button onClick={() => setStartTime(getCurrentTime())} className="bg-neutral-700 hover:bg-neutral-600 text-neutral-200 font-semibold py-2 px-3 rounded-lg transition-colors">Jetzt</button>
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 pt-4 border-t border-neutral-700">
                            <button onClick={handleReset} className="flex items-center gap-2 text-red-400 hover:bg-red-500/10 font-semibold py-2 px-3 rounded-lg transition-colors">
                                <i className="material-icons text-base">delete_sweep</i>
                                <span>Alle Felder leeren</span>
                            </button>
                        </div>
                    </Card>

                    {/* Results */}
                    <Card title="Ergebnis & Live-Tracking" icon="schedule">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                            <div>
                                <p className="text-sm text-neutral-400">Voraussichtliches Arbeitsende</p>
                                <p className="text-4xl font-bold text-orange-400">{startTime ? endTime : '--:--'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-neutral-400">Verbleibende Arbeitszeit</p>
                                <p className="text-4xl font-bold text-neutral-100">{startTime ? formatDuration(remainingWorkMinutes) : formatDuration(totalWorkMinutes)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-neutral-400">Aktuelle Uhrzeit</p>
                                <p className="text-4xl font-bold text-neutral-100">{currentTime.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                        </div>
                    </Card>

                    {/* Breaks */}
                    <Card title="Dienstunterbrechungen" icon="coffee">
                        <div className="flex flex-col h-full">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                                <div className="sm:col-span-2 grid grid-cols-2 gap-2">
                                    <div>
                                        <label htmlFor="break-start" className="block text-xs font-medium text-neutral-400 mb-1">Von</label>
                                        <div className="flex items-center gap-1">
                                            <input type="time" id="break-start" value={newBreakStart} onChange={e => setNewBreakStart(e.target.value)} className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-sm text-neutral-200 focus:outline-none focus:ring-1 focus:ring-orange-500" />
                                            <button onClick={() => setNewBreakStart(getCurrentTime())} className="bg-neutral-700 hover:bg-neutral-600 text-neutral-200 font-semibold py-2 px-2 text-sm rounded-lg transition-colors">Jetzt</button>
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="break-end" className="block text-xs font-medium text-neutral-400 mb-1">Bis</label>
                                        <div className="flex items-center gap-1">
                                            <input type="time" id="break-end" value={newBreakEnd} onChange={e => setNewBreakEnd(e.target.value)} className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-sm text-neutral-200 focus:outline-none focus:ring-1 focus:ring-orange-500" />
                                            <button onClick={() => setNewBreakEnd(getCurrentTime())} className="bg-neutral-700 hover:bg-neutral-600 text-neutral-200 font-semibold py-2 px-2 text-sm rounded-lg transition-colors">Jetzt</button>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={handleAddBreak} disabled={!newBreakStart || !newBreakEnd} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 rounded-lg transition-colors disabled:bg-neutral-600 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                    <i className="material-icons text-base">add</i>
                                    <span>Hinzufügen</span>
                                </button>
                            </div>
                            {breakError && <p className="text-red-400 text-sm mt-2">{breakError}</p>}

                            <div className="mt-4 pt-4 border-t border-neutral-700 flex-grow min-h-0">
                                <p className="text-sm font-semibold text-neutral-300 mb-2">Gesamt: {totalBreakMinutes} min</p>
                                {breaks.length > 0 ? (
                                    <ul className="space-y-2 overflow-y-auto custom-scrollbar max-h-40">
                                        {[...breaks].sort((a, b) => timeStringToMinutes(a.start) - timeStringToMinutes(b.start)).map(br => (
                                            <li key={br.id} className="flex items-center justify-between bg-neutral-900/50 p-2 rounded-lg">
                                                <span className="font-mono text-neutral-200">{br.start} - {br.end}</span>
                                                <span className="text-sm text-neutral-400">{formatDuration(timeStringToMinutes(br.end) - timeStringToMinutes(br.start))}</span>
                                                <button onClick={() => handleDeleteBreak(br.id)} className="p-1 rounded-full text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                                                    <i className="material-icons text-lg">delete</i>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-neutral-500">Keine Pausen hinzugefügt.</p>
                                )}
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Right Column */}
                <div className="lg:sticky lg:top-8">
                    <Card title="Arbeitsphasen" icon="splitscreen" className="h-full">
                        {startTime ? (
                            <ul className="space-y-2 h-full overflow-y-auto custom-scrollbar -mr-2 pr-2">
                                {workPhases.map((phase, index) => {
                                    const isBreak = phase.type === 'break';
                                    const isActive = phase.name === activePhase?.name;
                                    const remainingPhaseMinutes = isActive ? (timeStringToMinutes(phase.end) - timeStringToMinutes(getCurrentTime())) : 0;

                                    return (
                                        <li key={index} className={`p-3 rounded-lg transition-all duration-300 ${isActive ? 'bg-orange-500/20 border-l-4 border-orange-500' : 'bg-neutral-900/50'}`}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <i className={`material-icons text-lg ${isBreak ? 'text-sky-400' : 'text-green-400'}`}>{isBreak ? 'coffee' : 'laptop_mac'}</i>
                                                    <span className="font-semibold text-neutral-200">{phase.name}</span>
                                                </div>
                                                <span className="text-sm text-neutral-400 font-mono">{phase.start} - {phase.end}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm mt-1 pl-8">
                                                <span className="text-neutral-300">Dauer: {formatDuration(phase.duration)}</span>
                                                {isActive && (
                                                    <span className="font-bold text-orange-400">Noch {formatDuration(remainingPhaseMinutes, true)}</span>
                                                )}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center text-neutral-500">
                                <i className="material-icons text-5xl mb-2">hourglass_empty</i>
                                <p>Bitte eine Startzeit festlegen, um die Phasen anzuzeigen.</p>
                            </div>
                        )}
                    </Card>
                </div>
            </main>
        </div>
    );
};
