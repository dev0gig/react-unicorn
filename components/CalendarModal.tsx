import React, { useEffect, useMemo, useState } from 'react';

// --- UTILITY FUNCTIONS ---

// Calculates ISO 8601 week number
const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  // Set to nearest Thursday: current date + 4 - current day number
  // Make Sunday's day number 7
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  // Get first day of year
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  // Calculate full weeks to nearest Thursday
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return weekNo;
};

// Function to calculate Easter Sunday for a given year (using a common algorithm)
const getEaster = (year: number): Date => {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
};

// Function to get Austrian public holidays for a given year
const getAustrianHolidays = (year: number): Map<string, string> => {
  const holidays = new Map<string, string>();
  const easter = getEaster(year);

  const addHoliday = (date: Date, name: string) => {
    // Format date as YYYY-MM-DD
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    holidays.set(key, name);
  };
  
  const addDays = (date: Date, days: number): Date => {
      const result = new Date(date);
      result.setDate(result.getDate() + days);
      return result;
  };

  // Fixed holidays
  addHoliday(new Date(year, 0, 1), 'Neujahr');
  addHoliday(new Date(year, 0, 6), 'Heilige Drei Könige');
  addHoliday(new Date(year, 4, 1), 'Staatsfeiertag');
  addHoliday(new Date(year, 7, 15), 'Mariä Himmelfahrt');
  addHoliday(new Date(year, 9, 26), 'Nationalfeiertag');
  addHoliday(new Date(year, 10, 1), 'Allerheiligen');
  addHoliday(new Date(year, 11, 8), 'Mariä Empfängnis');
  addHoliday(new Date(year, 11, 25), 'Christtag');
  addHoliday(new Date(year, 11, 26), 'Stefanitag');

  // Movable holidays based on Easter
  addHoliday(addDays(easter, 1), 'Ostermontag');
  addHoliday(addDays(easter, 39), 'Christi Himmelfahrt');
  addHoliday(addDays(easter, 50), 'Pfingstmontag');
  addHoliday(addDays(easter, 60), 'Fronleichnam');
  
  return holidays;
};


interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CalendarModal: React.FC<CalendarModalProps> = ({ isOpen, onClose }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [now, setNow] = useState(new Date());

  const today = new Date();

  useEffect(() => {
    if (!isOpen) return;

    const timerId = setInterval(() => {
        setNow(new Date());
    }, 1000);

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    
    return () => {
      clearInterval(timerId);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  const changeMonth = (offset: number) => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setDate(1); // Avoid issues with different month lengths
      newDate.setMonth(newDate.getMonth() + offset);
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const calendarWeeks = useMemo(() => {
    const holidays = getAustrianHolidays(year);
    const days = [];
    const firstDayOfMonth = new Date(year, month, 1);
    const firstDayIndex = (firstDayOfMonth.getDay() + 6) % 7; // 0=Monday

    for (let i = 0; i < 42; i++) { // Always render 6 weeks
        const date = new Date(firstDayOfMonth);
        date.setDate(date.getDate() - firstDayIndex + i);
        
        const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

        days.push({
            day: date.getDate(),
            isCurrentMonth: date.getMonth() === month,
            date: date,
            holidayName: holidays.get(dayKey)
        });
    }
    
    // Chunk into weeks and add week number
    const weeksData = [];
    for (let i = 0; i < days.length; i += 7) {
      const weekSlice = days.slice(i, i + 7);
      weeksData.push({
        weekNumber: getWeekNumber(weekSlice[0].date), // Use first day of the week for KW
        days: weekSlice,
      });
    }
    return weeksData;
  }, [year, month]);


  const weekDays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  
  const formattedTimeWithSeconds = now.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
  });

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in-fast"
      onClick={onClose}
    >
      <div
        className="bg-neutral-800 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col border border-neutral-700"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 flex-shrink-0">
          <button
            onClick={() => changeMonth(-1)}
            className="p-2 rounded-full text-neutral-400 hover:bg-neutral-700 hover:text-white transition-colors"
            aria-label="Vorheriger Monat"
          >
            <i className="material-icons">chevron_left</i>
          </button>
          <h2 className="text-xl font-bold text-neutral-100 capitalize">
            {currentDate.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
          </h2>
          <button
            onClick={() => changeMonth(1)}
            className="p-2 rounded-full text-neutral-400 hover:bg-neutral-700 hover:text-white transition-colors"
            aria-label="Nächster Monat"
          >
            <i className="material-icons">chevron_right</i>
          </button>
        </header>

        <div className="p-4">
          <div className="grid grid-cols-[auto_repeat(7,1fr)] gap-y-1 justify-items-center">
            {/* Header row for KW and weekdays */}
            <div className="text-xs font-bold text-neutral-500 uppercase pb-2 w-10 text-center">KW</div>
            {weekDays.map(day => (
              <div key={day} className="text-xs font-bold text-neutral-400 uppercase pb-2 w-10 text-center">{day}</div>
            ))}
            
            {/* Calendar grid */}
            {calendarWeeks.map((week, weekIndex) => (
                <React.Fragment key={weekIndex}>
                    <div className="w-10 h-10 flex items-center justify-center text-xs text-neutral-500 font-medium">{week.weekNumber}</div>
                    {week.days.map((d, dayIndex) => {
                        const isToday = d.isCurrentMonth && d.day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                        const isWeekend = (d.date.getDay() === 6 || d.date.getDay() === 0);

                        const getDayClasses = () => {
                            const base = 'w-10 h-10 flex items-center justify-center rounded-full text-sm transition-colors';
                            if (!d.isCurrentMonth) return `${base} text-neutral-600`;
                            if (isToday) return `${base} bg-orange-500 font-bold text-white`;
                            if (d.holidayName) return `${base} bg-sky-800/50 border border-sky-600 text-sky-300 font-semibold`;
                            if (isWeekend) return `${base} text-neutral-400`;
                            return `${base} text-neutral-100`;
                        };

                        return (
                            <div
                            key={dayIndex}
                            title={d.holidayName || ''}
                            className={getDayClasses()}
                            >
                            {d.day}
                            </div>
                        );
                    })}
                </React.Fragment>
            ))}
          </div>
        </div>

        <footer className="flex justify-between items-center p-4 bg-neutral-900/50 rounded-b-2xl border-t border-neutral-700">
            <div className="flex items-center gap-4">
                <button
                    onClick={goToToday}
                    className="bg-neutral-700 hover:bg-neutral-600 text-white font-semibold py-2 px-4 rounded-lg transition-all"
                >
                    Heute
                </button>
                <div className="text-center">
                    <div className="text-2xl font-bold text-neutral-100 tracking-wider">
                        {formattedTimeWithSeconds}
                    </div>
                </div>
            </div>
            <button
            onClick={onClose}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-6 rounded-lg transition-all"
            >
            Schließen
            </button>
        </footer>
      </div>
    </div>
  );
};

export default CalendarModal;