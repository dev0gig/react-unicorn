import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSchedule } from '../../App';
import { CalendarHeader } from '../calendar/components/CalendarHeader';
import { CalendarGrid } from '../calendar/components/CalendarGrid';
import { WeekView } from '../calendar/components/WeekView';
import { transformScheduleToEvents } from '../calendar/services/calendarService';
import { CalendarEvent, ViewType } from '../calendar/types';

interface ProfileProps {
    // No props needed anymore
}

// --- WIDGET COMPONENTS ---

const MonthDaysHeader: React.FC = () => {
    const weekDays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
    return (
        <div className="grid grid-cols-[64px_repeat(7,minmax(0,1fr))] px-4 pt-2 pb-2 border-b border-neutral-700 flex-shrink-0">
            <div className="text-center py-2 text-sm font-bold text-neutral-500">KW</div>
            {weekDays.map(day => (
                <div key={day} className="text-center py-2 text-sm font-bold text-neutral-400">{day}</div>
            ))}
        </div>
    );
};

const WeekDaysHeader: React.FC<{ startDate: Date }> = ({ startDate }) => {
    const today = useMemo(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    }, []);

    const weekDays = useMemo(() => {
        const start = new Date(startDate);
        const dayOfWeek = start.getDay();
        const diff = start.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        start.setDate(diff);
        start.setHours(0, 0, 0, 0);

        const days: Date[] = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(start);
            date.setDate(date.getDate() + i);
            days.push(date);
        }
        return days;
    }, [startDate]);

    return (
        <div className="grid grid-cols-[4rem_repeat(7,1fr)] flex-shrink-0 px-4 pt-2 pb-2 border-b border-neutral-700">
            <div className="border-r border-neutral-700"></div> {/* Spacer for time column */}
            {weekDays.map(day => {
                const isToday = day.getTime() === today.getTime();
                return (
                    <div key={day.toISOString()} className="text-center p-3 border-r border-neutral-700 last:border-r-0">
                        <p className={`text-sm font-semibold ${isToday ? 'text-orange-400' : 'text-neutral-400'}`}>{day.toLocaleDateString('de-DE', { weekday: 'short' })}</p>
                        <p className={`text-2xl font-bold ${isToday ? 'text-orange-400' : 'text-neutral-100'}`}>{day.getDate()}</p>
                    </div>
                );
            })}
        </div>
    );
};

const CalendarWidget: React.FC = () => {
    const { schedule, importSchedule } = useSchedule();
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState<ViewType>('week');
    const importIcsRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const transformedEvents = transformScheduleToEvents(schedule);
        setEvents(transformedEvents);
    }, [schedule]);

    const handleNavigate = useCallback((direction: 'next' | 'prev' | 'today') => {
        setCurrentDate(current => {
            if (direction === 'today') {
                return new Date();
            }
            const newDate = new Date(current);
            const increment = direction === 'next' ? 1 : -1;

            if (view === 'month') {
                newDate.setMonth(newDate.getMonth() + increment);
            } else { // week view
                newDate.setDate(newDate.getDate() + (7 * increment));
            }
            return newDate;
        });
    }, [view]);

    const handleDayClick = useCallback((day: Date) => {
        setCurrentDate(day);
        setView('week');
    }, []);

    const handleWeekClick = useCallback((weekNumber: number, year: number) => {
        const simple = new Date(year, 0, 1 + (weekNumber - 1) * 7);
        const dow = simple.getDay();
        const ISOweekStart = simple;
        if (dow <= 4) {
            ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
        } else {
            ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
        }
        setCurrentDate(ISOweekStart);
        setView('week');
    }, []);

    const handleImportClick = () => {
        importIcsRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result;
            if (typeof content === 'string') {
                importSchedule(content);
            }
        };
        reader.readAsText(file);
        if (event.target) event.target.value = '';
    };

    return (
        <div className="bg-neutral-800 rounded-xl border border-neutral-700 shadow-2xl shadow-orange-900/10 flex flex-col">
            <input type="file" accept=".ics" ref={importIcsRef} onChange={handleFileChange} className="hidden" />
            <CalendarHeader
                currentDate={currentDate}
                view={view}
                onNavigate={handleNavigate}
                onViewChange={setView}
                onImportClick={handleImportClick}
            />
            {view === 'month' ? <MonthDaysHeader /> : <WeekDaysHeader startDate={currentDate} />}
            <div className="p-4">
                {view === 'month' ? (
                    <CalendarGrid
                        currentDate={currentDate}
                        events={events}
                        onDayClick={handleDayClick}
                        onWeekClick={handleWeekClick}
                    />
                ) : (
                    <WeekView
                        startDate={currentDate}
                        events={events}
                    />
                )}
            </div>
        </div>
    );
};

// --- MAIN PROFILE COMPONENT ---

export const Dienstplan: React.FC<ProfileProps> = () => {
    const [date, setDate] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setDate(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="h-full overflow-y-auto custom-scrollbar">
            <div className="view-p min-h-full">
                <header className="flex flex-col md:flex-row justify-between md:items-center gap-2 mb-6">
                    <h1 className="text-4xl font-bold text-neutral-100">Dienstplan</h1>
                    <p className="text-neutral-400 font-medium">
                        {date.toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </header>

                <main className="flex flex-col gap-6">
                    <div>
                        <CalendarWidget />
                    </div>
                </main>
            </div>
        </div>
    );
};