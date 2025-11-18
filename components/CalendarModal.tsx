import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSchedule } from '../App';
import { CalendarHeader } from './calendar/components/CalendarHeader';
import { CalendarGrid } from './calendar/components/CalendarGrid';
import { WeekView } from './calendar/components/WeekView';
import { transformScheduleToEvents } from './calendar/services/calendarService';
import { CalendarEvent, ViewType } from './calendar/types';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MonthDaysHeader: React.FC = () => {
    const weekDays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
    return (
        <div className="grid grid-cols-[64px_repeat(7,minmax(0,1fr))]">
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
        <div className="grid grid-cols-[4rem_repeat(7,1fr)] flex-shrink-0">
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

export const CalendarModal: React.FC<CalendarModalProps> = ({ isOpen, onClose }) => {
  const { schedule, importSchedule } = useSchedule();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewType>('month');
  const importIcsRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
        const transformedEvents = transformScheduleToEvents(schedule);
        setEvents(transformedEvents);
        // Reset to current date and month view when opening
        setCurrentDate(new Date());
        setView('month');
    }
  }, [isOpen, schedule]);

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
    // Find the first day of that week (Monday)
    const simple = new Date(year, 0, 1 + (weekNumber - 1) * 7);
    const dow = simple.getDay();
    const ISOweekStart = simple;
    if (dow <= 4) { // for Thursday or earlier
        ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
    } else { // for Friday or later
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
      if(event.target) event.target.value = '';
  };

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-neutral-800 rounded-2xl shadow-2xl w-[95vw] h-[95vh] max-w-screen-2xl flex flex-col border border-neutral-700 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <input type="file" accept=".ics" ref={importIcsRef} onChange={handleFileChange} className="hidden" />
        <button
            onClick={onClose}
            className="absolute top-3 right-3 z-20 w-10 h-10 flex items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-700 hover:text-white transition-colors"
            aria-label="Kalender schließen"
        >
            <i className="material-icons">close</i>
        </button>

        <CalendarHeader
          currentDate={currentDate}
          view={view}
          onNavigate={handleNavigate}
          onViewChange={setView}
          onImportClick={handleImportClick}
        />

        <div className="px-4 pt-2 pb-2 border-b border-neutral-700 flex-shrink-0">
            {view === 'month' ? (
                <MonthDaysHeader />
            ) : (
                <WeekDaysHeader startDate={currentDate} />
            )}
        </div>

        <div className="flex-grow p-4 overflow-hidden">
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
    </div>
  );
};
