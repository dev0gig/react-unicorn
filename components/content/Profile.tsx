import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useContacts, useTemplates, useFavorites, useDashboard, useNotes, useEvidenz, useSchedule } from '../../App';
import type { ViewName, ToolLink, ToolGroup, ScheduleEvent, Note } from '../../types';
import { HolidayInfoModal } from '../HolidayInfoModal';

interface ProfileProps {
    setActiveView: (view: ViewName) => void;
    setHighlightedNoteId: (id: string | null) => void;
}

const toLocalDateKey = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getWeekSpanForDate = (date: Date) => {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const dayOfWeek = start.getDay();
    const diff = start.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    start.setDate(diff);

    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    
    return { weekStart: start, weekEnd: end };
};

// --- CARD COMPONENT ---
const Card: React.FC<{ title?: string; icon?: string; children: React.ReactNode; className?: string, headerContent?: React.ReactNode }> = ({ title, icon, children, className = '', headerContent }) => (
    <div className={`bg-neutral-800 rounded-2xl p-5 flex flex-col ${className}`}>
        {(title || headerContent) && (
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                    {icon && <i className="material-icons text-xl text-orange-400 mr-3">{icon}</i>}
                    {title && <h3 className="text-lg font-bold text-neutral-100 capitalize">{title}</h3>}
                </div>
                {headerContent}
            </div>
        )}
        <div className="flex-grow min-h-0">{children}</div>
    </div>
);

// --- CALENDAR HELPERS ---
const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return weekNo;
};

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

const getAustrianHolidays = (year: number): Map<string, string> => {
  const holidays = new Map<string, string>();
  const easter = getEaster(year);
  const addHoliday = (date: Date, name: string) => {
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    holidays.set(key, name);
  };
  const addDays = (date: Date, days: number): Date => {
      const result = new Date(date);
      result.setDate(result.getDate() + days);
      return result;
  };
  addHoliday(new Date(year, 0, 1), 'Neujahr');
  addHoliday(new Date(year, 0, 6), 'Heilige Drei Könige');
  addHoliday(new Date(year, 4, 1), 'Staatsfeiertag');
  addHoliday(new Date(year, 7, 15), 'Mariä Himmelfahrt');
  addHoliday(new Date(year, 9, 26), 'Nationalfeiertag');
  addHoliday(new Date(year, 10, 1), 'Allerheiligen');
  addHoliday(new Date(year, 11, 8), 'Mariä Empfängnis');
  addHoliday(new Date(year, 11, 25), 'Christtag');
  addHoliday(new Date(year, 11, 26), 'Stefanitag');
  addHoliday(addDays(easter, 1), 'Ostermontag');
  addHoliday(addDays(easter, 39), 'Christi Himmelfahrt');
  addHoliday(addDays(easter, 50), 'Pfingstmontag');
  addHoliday(addDays(easter, 60), 'Fronleichnam');
  return holidays;
};

const holidayDescriptions: Record<string, string> = {
    'Neujahr': 'Der erste Tag des neuen Jahres, an dem der Beginn des Kalenderjahres gefeiert wird.',
    'Heilige Drei Könige': 'Christliches Fest, das an die Weisen aus dem Morgenland erinnert, die das Jesuskind besuchten.',
    'Ostermontag': 'Der Tag nach Ostersonntag, der die Auferstehung Jesu Christi feiert.',
    'Staatsfeiertag': 'Der internationale Tag der Arbeit, in Österreich als Staatsfeiertag begangen.',
    'Christi Himmelfahrt': 'Fest 40 Tage nach Ostern, das die Aufnahme Christi in den Himmel feiert.',
    'Pfingstmontag': 'Der Tag nach Pfingstsonntag, an dem die Sendung des Heiligen Geistes gefeiert wird.',
    'Fronleichnam': 'Katholisches Fest zur Feier der Eucharistie, 60 Tage nach Ostern.',
    'Mariä Himmelfahrt': 'Katholisches Hochfest der leiblichen Aufnahme Mariens in den Himmel.',
    'Nationalfeiertag': 'Feiertag zur Erinnerung an die Verabschiedung des Neutralitätsgesetzes im Jahr 1955.',
    'Allerheiligen': 'Gedenktag für alle Heiligen der Kirche.',
    'Mariä Empfängnis': 'Katholisches Hochfest, das die unbefleckte Empfängnis der Gottesmutter Maria feiert.',
    'Christtag': 'Der erste Weihnachtsfeiertag zur Feier der Geburt Jesu Christi.',
    'Stefanitag': 'Der zweite Weihnachtsfeiertag, Gedenktag des Heiligen Stephanus.'
};

// --- WEATHER CONSTANTS ---
const WEATHER_CODES: { [key: number]: { text: string; icon: string; background: string } } = {
    0: { text: 'Klarer Himmel', icon: 'wb_sunny', background: 'bg-gradient-to-br from-sky-400 to-blue-600' },
    1: { text: 'Leicht bewölkt', icon: 'wb_cloudy', background: 'bg-gradient-to-br from-slate-400 to-gray-600' },
    2: { text: 'Teilweise bewölkt', icon: 'wb_cloudy', background: 'bg-gradient-to-br from-slate-500 to-gray-700' },
    3: { text: 'Bedeckt', icon: 'cloud', background: 'bg-gradient-to-br from-gray-600 to-slate-800' },
    45: { text: 'Nebel', icon: 'dehaze', background: 'bg-gradient-to-br from-slate-400 to-gray-500' },
    48: { text: 'Reifnebel', icon: 'ac_unit', background: 'bg-gradient-to-br from-slate-300 to-gray-400' },
    51: { text: 'Leichter Nieselregen', icon: 'grain', background: 'bg-gradient-to-br from-blue-300 to-gray-500' },
    53: { text: 'Mäßiger Nieselregen', icon: 'grain', background: 'bg-gradient-to-br from-blue-400 to-gray-600' },
    55: { text: 'Starker Nieselregen', icon: 'grain', background: 'bg-gradient-to-br from-blue-500 to-gray-700' },
    61: { text: 'Leichter Regen', icon: 'water_drop', background: 'bg-gradient-to-br from-sky-500 to-slate-700' },
    63: { text: 'Mäßiger Regen', icon: 'water_drop', background: 'bg-gradient-to-br from-sky-600 to-slate-800' },
    65: { text: 'Starker Regen', icon: 'water_drop', background: 'bg-gradient-to-br from-sky-700 to-slate-900' },
    80: { text: 'Leichte Schauer', icon: 'water_drop', background: 'bg-gradient-to-br from-sky-500 to-slate-700' },
    81: { text: 'Mäßige Schauer', icon: 'water_drop', background: 'bg-gradient-to-br from-sky-600 to-slate-800' },
    82: { text: 'Starke Schauer', icon: 'water_drop', background: 'bg-gradient-to-br from-sky-700 to-slate-900' },
    71: { text: 'Leichter Schneefall', icon: 'ac_unit', background: 'bg-gradient-to-br from-blue-200 to-slate-400' },
    73: { text: 'Mäßiger Schneefall', icon: 'ac_unit', background: 'bg-gradient-to-br from-blue-300 to-slate-500' },
    75: { text: 'Starker Schneefall', icon: 'ac_unit', background: 'bg-gradient-to-br from-blue-400 to-slate-600' },
    95: { text: 'Gewitter', icon: 'thunderstorm', background: 'bg-gradient-to-br from-slate-700 to-indigo-900' },
    96: { text: 'Gewitter mit Hagel', icon: 'thunderstorm', background: 'bg-gradient-to-br from-slate-800 to-indigo-950' },
    99: { text: 'Gewitter mit starkem Hagel', icon: 'thunderstorm', background: 'bg-gradient-to-br from-slate-900 to-indigo-950' },
};
const UNKNOWN_WEATHER = { text: 'Unbekannt', icon: 'help_outline', background: 'bg-gray-700' };

interface WeatherData {
    current: { temperature: number; weatherCode: number; windSpeed: number; };
    daily: { time: string[]; weatherCode: number[]; tempMax: number[]; tempMin: number[]; };
}


// --- WIDGET COMPONENTS ---

const WeatherWidget: React.FC = () => {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchWeather = async () => {
            setLoading(true);
            setError(null);
            try {
                const lat = 48.21, lon = 16.37; // Vienna
                const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Europe/Vienna&forecast_days=6`;
                const response = await fetch(url);
                if (!response.ok) throw new Error('Wetterdaten konnten nicht geladen werden.');
                const data = await response.json();
                setWeather({
                    current: { temperature: Math.round(data.current.temperature_2m), weatherCode: data.current.weather_code, windSpeed: Math.round(data.current.wind_speed_10m) },
                    daily: { time: data.daily.time, weatherCode: data.daily.weather_code, tempMax: data.daily.temperature_2m_max, tempMin: data.daily.temperature_2m_min },
                });
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Ein unbekannter Fehler ist aufgetreten.');
            } finally {
                setLoading(false);
            }
        };
        fetchWeather();
    }, []);

    const currentWeatherData = weather ? (WEATHER_CODES[weather.current.weatherCode] || UNKNOWN_WEATHER) : UNKNOWN_WEATHER;

    if (loading) return <div className="rounded-2xl bg-neutral-800 p-5 flex flex-col items-center justify-center h-full text-white/80"><i className="material-icons text-5xl animate-spin">sync</i><p className="mt-2">Lade Wetterdaten...</p></div>;
    if (error) return <div className="rounded-2xl bg-neutral-800 p-5 flex flex-col items-center justify-center h-full text-red-300 text-center"><i className="material-icons text-5xl">error_outline</i><p className="mt-2">{error}</p></div>;
    if (!weather) return <div className="rounded-2xl bg-neutral-800 p-5 flex items-center justify-center h-full text-white/80">Keine Wetterdaten verfügbar.</div>;

    const todayForecast = { max: Math.round(weather.daily.tempMax[0]), min: Math.round(weather.daily.tempMin[0]) };

    return (
        <div className={`rounded-2xl text-white p-5 flex flex-col justify-between ${currentWeatherData.background}`}>
            <div className="text-center">
                <p className="font-medium">Wien, Österreich</p>
                <div className="flex items-center justify-center gap-2 my-1">
                     <i className="material-icons text-6xl">{currentWeatherData.icon}</i>
                     <h2 className="text-6xl font-bold">{weather.current.temperature}°</h2>
                </div>
                <p className="text-lg capitalize">{currentWeatherData.text}</p>
                <div className="flex justify-center gap-4 mt-2 text-sm">
                    <span>Max: {todayForecast.max}°</span>
                    <span>Min: {todayForecast.min}°</span>
                    <span>Wind: {weather.current.windSpeed} km/h</span>
                </div>
            </div>
            <div className="pt-4">
                <div className="flex justify-between">
                    {weather.daily.time.slice(1).map((time, index) => {
                        const date = new Date(time);
                        const dayWeather = WEATHER_CODES[weather.daily.weatherCode[index + 1]] || UNKNOWN_WEATHER;
                        return (
                            <div key={time} className="flex flex-col items-center gap-1 text-center w-1/5">
                                <p className="text-xs font-semibold">{date.toLocaleDateString('de-DE', { weekday: 'short' })}</p>
                                <i className="material-icons text-2xl">{dayWeather.icon}</i>
                                <p className="text-xs">{Math.round(weather.daily.tempMax[index + 1])}°<span className="opacity-70">/{Math.round(weather.daily.tempMin[index + 1])}°</span></p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

const MonthView: React.FC<{
    dateForMonth: Date;
    today: Date;
    onHolidayClick: (e: React.MouseEvent<HTMLButtonElement>, holidayName: string) => void;
    schedule: Record<string, ScheduleEvent[]>;
    onDateSelect: (date: Date) => void;
}> = ({ dateForMonth, today, onHolidayClick, schedule, onDateSelect }) => {
    const year = dateForMonth.getFullYear();
    const month = dateForMonth.getMonth();
    
    const calendarWeeks = useMemo(() => {
        const holidays = getAustrianHolidays(year);
        const days = [];
        const firstDayOfMonth = new Date(year, month, 1);
        const firstDayIndex = (firstDayOfMonth.getDay() + 6) % 7;
        for (let i = 0; i < 42; i++) {
            const date = new Date(firstDayOfMonth);
            date.setDate(date.getDate() - firstDayIndex + i);
            const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            days.push({ day: date.getDate(), isCurrentMonth: date.getMonth() === month, date: date, holidayName: holidays.get(dayKey), scheduleEvents: schedule[dayKey] });
        }
        const weeksData = [];
        for (let i = 0; i < days.length; i += 7) {
          weeksData.push({ weekNumber: getWeekNumber(days[i].date), days: days.slice(i, i + 7) });
        }
        return weeksData;
    }, [year, month, schedule]);

    const weekDays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

    return (
        <div>
            <h4 className="text-lg font-bold text-neutral-100 capitalize text-center mb-4">
                {dateForMonth.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
            </h4>
            <div className="grid grid-cols-[auto_repeat(7,1fr)] gap-y-1 justify-items-center">
                <div className="text-xs font-bold text-neutral-500 uppercase pb-2 w-12 text-center">KW</div>
                {weekDays.map(day => <div key={day} className="text-xs font-bold text-neutral-400 uppercase pb-2 w-12 text-center">{day}</div>)}
                {calendarWeeks.map((week, weekIndex) => (
                    <React.Fragment key={`${year}-${month}-${weekIndex}`}>
                        <div className="w-12 h-12 flex items-center justify-center text-xs text-neutral-500 font-medium">{week.weekNumber}</div>
                        {week.days.map((d, dayIndex) => {
                            const isToday = d.isCurrentMonth && d.day === today.getDate() && d.date.getMonth() === today.getMonth() && d.date.getFullYear() === today.getFullYear();
                            const isWeekend = (d.date.getDay() === 6 || d.date.getDay() === 0);
                            const isHoliday = !!d.holidayName;
                            const scheduleEvent = d.scheduleEvents?.[0];

                            const isAbsence = scheduleEvent && scheduleEvent.summary.toLowerCase().includes('abwesenheit');
                            const isFlexi = scheduleEvent && !isAbsence && scheduleEvent.summary.toLowerCase().includes('flexi');
                            const isMeeting = scheduleEvent && !isAbsence && scheduleEvent.summary.toLowerCase().includes('meeting');
                            const isEarlyShift = scheduleEvent && !isAbsence && !isFlexi && !isMeeting && scheduleEvent.dtstart.getHours() < 12;

                            const getDayClasses = () => {
                                let base = 'w-12 h-12 flex flex-col items-center justify-center rounded-full text-sm transition-colors relative';
                                if (!d.isCurrentMonth) return `${base} text-neutral-600`;
                                if (isToday) return `${base} bg-orange-500 font-bold text-white`;
                                if (isHoliday) return `${base} bg-sky-800/50 border border-sky-600 text-sky-300 font-semibold hover:bg-sky-700/50 cursor-pointer`;
                                
                                let finalClasses = `${base} text-neutral-100`;
                                if (isWeekend) finalClasses = `${base} text-neutral-400`;
                                return `${finalClasses} hover:bg-neutral-700 cursor-pointer`;
                            };
                            
                            const dayTitle = isAbsence ? "Abwesenheit" : isFlexi ? "Home Office" : isMeeting ? "Meeting" : scheduleEvent ? scheduleEvent.summary : (d.holidayName || '');

                            const dayContent = (
                                <>
                                    <span>{d.day}</span>
                                    {scheduleEvent && (
                                        <div className="absolute top-1 right-1">
                                            {isAbsence ? (
                                                <i className="material-icons text-sky-400" style={{fontSize: '14px'}} title="Abwesenheit">beach_access</i>
                                            ) : isFlexi ? (
                                                <i className="material-icons text-green-400" style={{fontSize: '14px'}} title="Home Office">laptop_chromebook</i>
                                            ) : isMeeting ? (
                                                <i className="material-icons text-red-400" style={{fontSize: '14px'}} title="Meeting">groups</i>
                                            ) : isEarlyShift ? (
                                                <i className="material-icons text-orange-400" style={{fontSize: '14px'}}>wb_sunny</i>
                                            ) : (
                                                <i className="material-icons text-purple-400" style={{fontSize: '14px'}}>nightlight</i>
                                            )}
                                        </div>
                                    )}
                                </>
                            );

                            if (d.isCurrentMonth) {
                                return (
                                    <button
                                        key={dayIndex}
                                        title={dayTitle}
                                        className={getDayClasses()}
                                        onClick={(e) => {
                                            onDateSelect(d.date);
                                            if (isHoliday) {
                                                onHolidayClick(e, d.holidayName!);
                                            }
                                        }}
                                    >
                                        {dayContent}
                                    </button>
                                );
                            }

                            return (
                                <div
                                    key={dayIndex}
                                    className={getDayClasses()}
                                >
                                    {dayContent}
                                </div>
                            );
                        })}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};

const DualCalendarWidget: React.FC<{onDateSelect: (date: Date) => void}> = ({ onDateSelect }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [now, setNow] = useState(new Date());
    const [selectedHoliday, setSelectedHoliday] = useState<{ name: string; description: string; position: { top: number; left: number } } | null>(null);
    const { schedule, importSchedule } = useSchedule();
    const today = new Date();
    const importIcsRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const timerId = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);

    const changeMonth = (offset: number) => {
        setCurrentDate(prevDate => {
          const newDate = new Date(prevDate);
          newDate.setDate(1);
          newDate.setMonth(newDate.getMonth() + offset);
          return newDate;
        });
    };

    const goToToday = () => setCurrentDate(new Date());
  
    const handleHolidayClick = (e: React.MouseEvent<HTMLButtonElement>, holidayName: string) => {
        const description = holidayDescriptions[holidayName];
        if (!description) return;
        const rect = e.currentTarget.getBoundingClientRect();
        setSelectedHoliday({ name: holidayName, description: description, position: { top: rect.bottom + 5, left: rect.left } });
    };

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
        if(event.target) event.target.value = ''; // Reset input
    };

    const nextMonthDate = useMemo(() => {
        const next = new Date(currentDate);
        next.setDate(1);
        next.setMonth(next.getMonth() + 1);
        return next;
    }, [currentDate]);

    const formattedTimeWithSeconds = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    return (
        <>
            {selectedHoliday && <HolidayInfoModal {...selectedHoliday} onClose={() => setSelectedHoliday(null)} />}
            <Card>
                <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                            <i className="material-icons text-xl text-orange-400 mr-3">calendar_month</i>
                            <h3 className="text-lg font-bold text-neutral-100 capitalize">Kalender</h3>
                        </div>
                        <div className="flex items-center">
                            <button onClick={handleImportClick} className="flex items-center gap-2 mr-2 bg-neutral-700 hover:bg-neutral-600 text-white font-semibold py-2 px-3 rounded-lg transition-all text-sm" title="Dienstplan importieren">
                                <i className="material-icons text-base">file_upload</i>
                                <span>Dienstplan importieren</span>
                            </button>
                            <input type="file" accept=".ics" ref={importIcsRef} onChange={handleFileChange} className="hidden" />
                            <button onClick={() => changeMonth(-1)} className="p-2 rounded-full text-neutral-400 hover:bg-neutral-700 hover:text-white transition-colors" aria-label="Vorheriger Monat"><i className="material-icons">chevron_left</i></button>
                            <button onClick={() => changeMonth(1)} className="p-2 rounded-full text-neutral-400 hover:bg-neutral-700 hover:text-white transition-colors" aria-label="Nächster Monat"><i className="material-icons">chevron_right</i></button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x md:divide-neutral-700">
                        <div className="md:pr-8">
                           <MonthView dateForMonth={currentDate} today={today} onHolidayClick={handleHolidayClick} schedule={schedule} onDateSelect={onDateSelect} />
                        </div>
                        <div className="mt-6 md:mt-0 md:pl-8">
                           <MonthView dateForMonth={nextMonthDate} today={today} onHolidayClick={handleHolidayClick} schedule={schedule} onDateSelect={onDateSelect} />
                        </div>
                    </div>

                    <div className="mt-auto flex justify-between items-center pt-4 border-t border-neutral-700/50">
                        <button onClick={goToToday} className="bg-neutral-700 hover:bg-neutral-600 text-white font-semibold py-2 px-4 rounded-lg transition-all">Heute</button>
                        <div className="text-2xl font-bold text-neutral-100 tracking-wider">{formattedTimeWithSeconds}</div>
                    </div>
                </div>
            </Card>
        </>
    );
};

const MetricsCard: React.FC<{ setActiveView: (view: ViewName) => void }> = ({ setActiveView }) => {
    const { contacts } = useContacts();
    const { notes } = useNotes();
    const { faelle } = useEvidenz();
    const { templateGroups } = useTemplates();

    const activeFaelleCount = faelle.filter(f => f.column !== 'fertig').length;
    const totalTemplates = templateGroups.reduce((acc, group) => acc + group.templates.length, 0);

    const metrics = [
        { icon: 'people', value: contacts.length, label: 'Kontakte', view: 'Kontakte' as ViewName },
        { icon: 'note_alt', value: notes.length, label: 'Notizen', view: 'Notizen' as ViewName },
        { icon: 'gavel', value: activeFaelleCount, label: 'Evidenzfälle', view: 'Evidenzfälle' as ViewName },
        { icon: 'drafts', value: totalTemplates, label: 'Vorlagen', view: 'Mail Vorlagen' as ViewName },
    ];
    return (
        <Card title="Auf einen Blick" icon="query_stats">
            <div className="grid grid-cols-2 gap-4 h-full">
                {metrics.map(metric => (
                     <button 
                        key={metric.label}
                        onClick={() => setActiveView(metric.view)}
                        className="bg-neutral-900/70 p-3 rounded-lg flex flex-col items-center justify-center text-center transition-colors hover:bg-neutral-700/80 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                        <i className="material-icons text-3xl text-neutral-400">{metric.icon}</i>
                        <span className="text-2xl font-bold mt-1 text-neutral-100">{metric.value}</span>
                        <span className="text-xs text-neutral-500">{metric.label}</span>
                    </button>
                ))}
            </div>
        </Card>
    );
};

const FavoritesCard: React.FC = () => {
    const { favorites } = useFavorites();
    const { toolGroups } = useDashboard();
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;
    
    const allLinksMap = useMemo(() => {
        const map = new Map<string, { link: ToolLink; group: ToolGroup }>();
        toolGroups.forEach(group => group.links.forEach(link => map.set(link.url, { link, group })));
        return map;
    }, [toolGroups]);

    const favoriteItems = favorites.map(fav => allLinksMap.get(fav.url)).filter(Boolean as any as (x: any) => x is { link: ToolLink; group: ToolGroup });

    const totalPages = Math.ceil(favoriteItems.length / itemsPerPage);
    const paginatedItems = favoriteItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    
    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);


    return (
        <Card title="Favoriten" icon="star">
            <div className="flex flex-col h-full">
                <div className="flex-grow min-h-[200px]">
                    {favoriteItems.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {paginatedItems.map(item => (
                                <a key={item.link.url} href={item.link.url} target="_blank" rel="noopener noreferrer" 
                                   className="flex items-center gap-2 p-2 rounded-md transition-colors hover:bg-neutral-700/50"
                                   style={{ color: 'white' }}
                                >
                                    <div className="w-7 h-7 rounded flex-shrink-0 flex items-center justify-center" style={{backgroundColor: item.group.color}}>
                                        <i className="material-icons text-base">{item.group.icon}</i>
                                    </div>
                                    <span className="text-sm font-medium truncate">{item.link.name}</span>
                                </a>
                            ))}
                        </div>
                    ) : (
                        <div className="flex h-full items-center justify-center">
                            <p className="text-sm text-neutral-500">Keine Favoriten festgelegt.</p>
                        </div>
                    )}
                </div>

                {totalPages > 1 && (
                    <div className="flex justify-center items-center pt-4 flex-shrink-0">
                        <button 
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                            disabled={currentPage === 1} 
                            className="p-1 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-700 transition-colors"
                        >
                            <i className="material-icons">chevron_left</i>
                        </button>
                        <span className="text-neutral-400 text-sm mx-2">
                            Seite {currentPage} von {totalPages}
                        </span>
                        <button 
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                            disabled={currentPage === totalPages} 
                            className="p-1 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-700 transition-colors"
                        >
                            <i className="material-icons">chevron_right</i>
                        </button>
                    </div>
                )}
            </div>
        </Card>
    );
};


const AgendaWidget: React.FC<{
    selectedDate: Date | null;
    onScrollComplete: () => void;
}> = ({ selectedDate, onScrollComplete }) => {
    const { schedule } = useSchedule();
    const [currentDate, setCurrentDate] = useState(() => getWeekSpanForDate(new Date()).weekStart);
    const agendaDayRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());

    useEffect(() => {
        let interactionTimerId: number;
        let highlightTimerId: number;

        if (selectedDate) {
            const mondayOfWeek = getWeekSpanForDate(new Date(selectedDate)).weekStart;
            setCurrentDate(mondayOfWeek);
            
            interactionTimerId = window.setTimeout(() => {
                const dateKey = toLocalDateKey(selectedDate);
                const element = agendaDayRefs.current.get(dateKey);

                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    const header = element.querySelector('h4');

                    if (header) {
                        header.classList.add('highlight-agenda-day');
                        
                        highlightTimerId = window.setTimeout(() => {
                            header.classList.remove('highlight-agenda-day');
                            onScrollComplete();
                        }, 5000); // Highlight for 5 seconds
                    } else {
                        onScrollComplete(); // No header found, complete
                    }
                } else {
                    onScrollComplete(); // Element not found for date, complete
                }
            }, 150); // Small delay for re-render
        }

        return () => {
            clearTimeout(interactionTimerId);
            clearTimeout(highlightTimerId);
        };
    }, [selectedDate, onScrollComplete]);

    const { weekStart, weekEnd } = useMemo(() => getWeekSpanForDate(currentDate), [currentDate]);

    const eventsByDay = useMemo(() => {
        const allEvents: ScheduleEvent[] = Object.values(schedule).flat();
        const eventsInWeek = allEvents.filter(event => event.dtstart >= weekStart && event.dtstart <= weekEnd);
        
        return eventsInWeek.reduce((acc, event) => {
            const dateKey = toLocalDateKey(event.dtstart);
            if (!acc[dateKey]) {
                acc[dateKey] = [];
            }
            acc[dateKey].push(event);
            acc[dateKey].sort((a,b) => a.dtstart.getTime() - b.dtstart.getTime());
            return acc;
        }, {} as Record<string, ScheduleEvent[]>);
    }, [schedule, weekStart, weekEnd]);

    const weekDaysToRender = useMemo(() => {
        const days = [];
        for (let i = 0; i < 7; i++) {
            const day = new Date(weekStart);
            day.setDate(day.getDate() + i);
            days.push(day);
        }
        return days;
    }, [weekStart]);
    
    const handlePrevWeek = () => {
        setCurrentDate(d => {
            const newDate = new Date(d);
            newDate.setDate(newDate.getDate() - 7);
            return newDate;
        });
    };

    const handleNextWeek = () => {
        setCurrentDate(d => {
            const newDate = new Date(d);
            newDate.setDate(newDate.getDate() + 7);
            return newDate;
        });
    };
    
    const goToCurrentWeek = () => {
        setCurrentDate(getWeekSpanForDate(new Date()).weekStart);
    };

    const formatDateForAgendaHeading = (date: Date) => {
        return date.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    };

    const isCurrentWeek = useMemo(() => {
        const { weekStart: currentWeekStart } = getWeekSpanForDate(new Date());
        return weekStart.getTime() === currentWeekStart.getTime();
    }, [weekStart]);

    const headerContent = (
        <div className="flex items-center gap-1">
            <button 
                onClick={goToCurrentWeek}
                disabled={isCurrentWeek}
                className="text-sm font-semibold bg-neutral-700 hover:bg-neutral-600 text-white py-1 px-3 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Heute
            </button>
            <button onClick={handlePrevWeek} className="p-2 rounded-full text-neutral-400 hover:bg-neutral-700 hover:text-white transition-colors" aria-label="Vorherige Woche">
                <i className="material-icons text-lg">chevron_left</i>
            </button>
            <span className="font-semibold text-sm text-neutral-300 w-16 text-center">KW {getWeekNumber(currentDate)}</span>
            <button onClick={handleNextWeek} className="p-2 rounded-full text-neutral-400 hover:bg-neutral-700 hover:text-white transition-colors" aria-label="Nächste Woche">
                <i className="material-icons text-lg">chevron_right</i>
            </button>
        </div>
    );

    return (
        <Card title="Agenda" icon="list_alt" className="h-full" headerContent={headerContent}>
            <div className="flex flex-col h-full">
                <div className="flex-grow min-h-0 overflow-y-auto custom-scrollbar -mr-3 pr-3 space-y-4">
                    {weekDaysToRender.map((day) => {
                        const dateKey = toLocalDateKey(day);
                        const events = eventsByDay[dateKey] || [];
                        return (
                            <div 
                                key={dateKey} 
                                ref={(el) => { agendaDayRefs.current.set(dateKey, el); }}
                            >
                                <h4 className="font-semibold text-neutral-300 mb-2 sticky top-0 bg-neutral-800 py-1 z-10">
                                    {formatDateForAgendaHeading(day)}
                                </h4>
                                {events.length > 0 ? (
                                    <div className="space-y-3">
                                        {events.map(event => {
                                            const isAbsence = event.summary.toLowerCase().includes('abwesenheit');
                                            const isFlexi = !isAbsence && event.summary.toLowerCase().includes('flexi');
                                            const isMeeting = !isAbsence && event.summary.toLowerCase().includes('meeting');
                                            const isEarlyShift = !isAbsence && !isFlexi && !isMeeting && event.dtstart.getHours() < 12;

                                            const shiftInfo = isAbsence
                                                ? { border: 'border-sky-400', icon: 'beach_access', iconColor: 'text-sky-400' }
                                                : isFlexi
                                                ? { border: 'border-green-400', icon: 'laptop_chromebook', iconColor: 'text-green-400' }
                                                : isMeeting
                                                ? { border: 'border-red-400', icon: 'groups', iconColor: 'text-red-400' }
                                                : isEarlyShift
                                                ? { border: 'border-orange-400', icon: 'wb_sunny', iconColor: 'text-orange-400' }
                                                : { border: 'border-purple-400', icon: 'nightlight', iconColor: 'text-purple-400' };

                                            return (
                                                <div key={event.dtstart.toISOString()} className={`flex items-center gap-4 p-3 bg-neutral-900/70 rounded-lg border-l-4 ${shiftInfo.border}`}>
                                                    <i className={`material-icons text-2xl ${shiftInfo.iconColor}`}>{shiftInfo.icon}</i>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-neutral-100 truncate">{event.summary}</p>
                                                        <p className="text-sm text-neutral-400">{formatTime(event.dtstart)} - {formatTime(event.dtend)} Uhr</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-4 p-3 bg-neutral-900/40 rounded-lg border-l-4 border-neutral-700">
                                        <i className="material-icons text-2xl text-neutral-500">event_busy</i>
                                        <p className="text-sm text-neutral-500">Keine Einträge für diesen Tag.</p>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        </Card>
    );
};

const RecentNotesWidget: React.FC<{ onNoteClick: (noteId: string) => void }> = ({ onNoteClick }) => {
    const { notes } = useNotes();

    const recentNotes = useMemo(() => {
        return [...notes]
            .sort((a, b) => b.lastModified - a.lastModified)
            .slice(0, 8);
    }, [notes]);

    return (
        <Card title="Letzte Notizen" icon="history_edu" className="h-full">
            <div className="flex flex-col h-full">
                {recentNotes.length > 0 ? (
                    <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 -mr-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {recentNotes.map(note => (
                                <button
                                    key={note.id}
                                    onClick={() => onNoteClick(note.id)}
                                    className="p-3 bg-neutral-900/70 rounded-lg transition-colors hover:bg-neutral-700/50 text-left flex flex-col h-28 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                >
                                    <div className="flex-grow overflow-hidden">
                                        <p className="text-sm font-normal text-neutral-200" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }} title={note.content}>
                                            {note.content.replace(/^#+\s*/, '').trim() || '...'}
                                        </p>
                                    </div>
                                    <p className="text-xs text-neutral-500 mt-1 flex-shrink-0">
                                        {new Date(note.lastModified).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex-grow flex items-center justify-center">
                        <p className="text-sm text-neutral-500">Keine Notizen vorhanden.</p>
                    </div>
                )}
            </div>
        </Card>
    );
};

// --- MAIN PROFILE COMPONENT ---

export const Profile: React.FC<ProfileProps> = ({ setActiveView, setHighlightedNoteId }) => {
    const [date, setDate] = useState(new Date());
    const [selectedAgendaDate, setSelectedAgendaDate] = useState<Date | null>(null);

    useEffect(() => {
        const timer = setInterval(() => setDate(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const handleNoteClick = useCallback((noteId: string) => {
        setHighlightedNoteId(noteId);
        setActiveView('Notizen');
    }, [setActiveView, setHighlightedNoteId]);

    const handleScrollComplete = useCallback(() => {
        setSelectedAgendaDate(null);
    }, []);

    return (
        <div className="h-full overflow-y-auto custom-scrollbar p-6">
            <header className="flex flex-col md:flex-row justify-between md:items-center gap-2 mb-6">
                <h1 className="text-4xl font-bold text-neutral-100">Profilübersicht</h1>
                <p className="text-neutral-400 font-medium">
                    {date.toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
            </header>

            <main className="flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    <WeatherWidget />
                    <MetricsCard setActiveView={setActiveView} />
                    <FavoritesCard />
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="xl:col-span-2 flex flex-col gap-6">
                        <div className="flex-shrink-0">
                            <DualCalendarWidget onDateSelect={setSelectedAgendaDate} />
                        </div>
                        <div className="flex-grow min-h-0">
                           <RecentNotesWidget onNoteClick={handleNoteClick} />
                        </div>
                    </div>
                    <div className="h-full">
                        <AgendaWidget 
                            selectedDate={selectedAgendaDate}
                            onScrollComplete={handleScrollComplete}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
};