import { useMemo } from 'react';
import { CalendarEvent, CalendarDay } from '../types';
import { getWeekNumber } from '../services/calendarService';

export const useCalendar = (currentDate: Date, events: CalendarEvent[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const weeks = useMemo(() => {
        const firstDayOfMonth = new Date(year, month, 1);

        const firstDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; // Monday is 0
        const startDate = new Date(firstDayOfMonth);
        startDate.setDate(startDate.getDate() - firstDayOfWeek);

        const calendarDays: CalendarDay[] = [];
        for (let i = 0; i < 42; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            date.setHours(0, 0, 0, 0);

            const dayEvents = events.filter(event => {
                const eventDate = new Date(event.dtstart);
                eventDate.setHours(0, 0, 0, 0);
                return eventDate.getTime() === date.getTime();
            }).sort((a, b) => a.dtstart.getTime() - b.dtstart.getTime());

            calendarDays.push({
                date,
                isCurrentMonth: date.getMonth() === month,
                isToday: date.getTime() === today.getTime(),
                events: dayEvents,
            });
        }

        const weeksData: { weekNumber: number; days: CalendarDay[] }[] = [];
        for (let i = 0; i < calendarDays.length; i += 7) {
            const weekSlice = calendarDays.slice(i, i + 7);
            const dayForWeekNumber = weekSlice.find(d => d.date.getDay() === 4) || weekSlice[3]; // Thursday is best for ISO week number
            weeksData.push({
                weekNumber: getWeekNumber(dayForWeekNumber.date),
                days: weekSlice
            });
        }

        return weeksData;
    }, [year, month, events, today]);

    const weekDays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

    return { weeks, weekDays };
};
