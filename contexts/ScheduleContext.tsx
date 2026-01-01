import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { loadFromStorage, saveToStorage } from '../utils/storage';
import { ScheduleEvent, ScheduleContextType } from '../types';

const ScheduleContext = createContext<ScheduleContextType | null>(null);

export const useSchedule = () => {
    const context = useContext(ScheduleContext);
    if (!context) throw new Error('useSchedule must be used within a ScheduleProvider');
    return context;
};

export const ScheduleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [schedule, setSchedule] = useState<Record<string, ScheduleEvent[]>>(() => {
        const savedSchedule = loadFromStorage<Record<string, ScheduleEvent[]> | null>('schedule', null);
        if (!savedSchedule) return {};
        // loadFromStorage already parses JSON, but we need to revive Date objects
        const parsed = savedSchedule;
        Object.keys(parsed).forEach(dateKey => {
            parsed[dateKey] = parsed[dateKey].map((event: any) => ({
                ...event,
                dtstart: new Date(event.dtstart),
                dtend: new Date(event.dtend),
            }));
        });
        return parsed;
    });

    useEffect(() => { saveToStorage('schedule', schedule); }, [schedule]);

    const importSchedule = useCallback((icsContent: string) => {
        try {
            const events: ScheduleEvent[] = [];
            const lines = icsContent.replace(/\r\n /g, '').split(/\r\n/);
            let currentEvent: Partial<ScheduleEvent> | null = null;

            const parseIcsDate = (dateStr: string): Date | null => {
                // This parser handles floating local times and UTC times ending in 'Z'.
                // It does not parse TZID timezone identifiers.
                const isUtc = dateStr.endsWith('Z');
                const cleanDateStr = isUtc ? dateStr.slice(0, -1) : dateStr;

                const match = cleanDateStr.match(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/);
                if (!match) return null;

                const [, year, month, day, hour, minute, second] = match.map(Number);

                if (isUtc) {
                    // Create a Date object from UTC components.
                    return new Date(Date.UTC(year, month - 1, day, hour, minute, second));
                } else {
                    // Create a Date object from local time components for floating times.
                    return new Date(year, month - 1, day, hour, minute, second);
                }
            };

            lines.forEach(line => {
                if (line.startsWith('BEGIN:VEVENT')) {
                    currentEvent = {};
                } else if (line.startsWith('END:VEVENT')) {
                    if (currentEvent && currentEvent.summary && currentEvent.dtstart && currentEvent.dtend) {
                        events.push(currentEvent as ScheduleEvent);
                    }
                    currentEvent = null;
                } else if (currentEvent) {
                    if (line.startsWith('SUMMARY:')) {
                        currentEvent.summary = line.substring(8);
                    } else if (line.startsWith('DTSTART;')) { // Handles DTSTART;TZID=...
                        const dateStr = line.split(':')[1];
                        currentEvent.dtstart = parseIcsDate(dateStr) || undefined;
                    } else if (line.startsWith('DTSTART:')) {
                        currentEvent.dtstart = parseIcsDate(line.substring(8)) || undefined;
                    } else if (line.startsWith('DTEND;')) { // Handles DTEND;TZID=...
                        const dateStr = line.split(':')[1];
                        currentEvent.dtend = parseIcsDate(dateStr) || undefined;
                    } else if (line.startsWith('DTEND:')) {
                        currentEvent.dtend = parseIcsDate(line.substring(6)) || undefined;
                    }
                }
            });

            if (events.length === 0) {
                // Note: We throw an error here to be caught by the caller (likely App.tsx or a component)
                // App.tsx was handling this with setInfoModal. We'll throw so it propagates.
                // However, the original code in App.tsx had setInfoModal INSIDE importSchedule.
                // To keep this pure logic in Context, we should probably throw and let UI handle modal,
                // OR we accept that Context shouldn't drive UI modals directly.
                // Given the refactor, I will THROW error and let the component handle the UI feedback.
                throw new Error("Keine Termine in der Datei gefunden. Bitte prüfen Sie das Format der Datei.");
            }

            const newSchedule: Record<string, ScheduleEvent[]> = {};
            events.forEach(event => {
                const d = event.dtstart;
                const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                if (!newSchedule[dateKey]) {
                    newSchedule[dateKey] = [];
                }
                newSchedule[dateKey].push(event);
                newSchedule[dateKey].sort((a, b) => a.dtstart.getTime() - b.dtstart.getTime());
            });

            setSchedule(newSchedule);
            // Ideally we'd return success message or structure to caller
        } catch (e) {
            console.error("ICS Import failed:", e);
            throw e; // Re-throw to let caller handle
        }
    }, [setSchedule]);

    const clearSchedule = useCallback(() => {
        setSchedule({});
    }, [setSchedule]);

    const value = useMemo(() => ({
        schedule,
        importSchedule,
        clearSchedule,
        setSchedule
    }), [schedule, importSchedule, clearSchedule, setSchedule]);

    return (
        <ScheduleContext.Provider value={value}>
            {children}
        </ScheduleContext.Provider>
    );
};
