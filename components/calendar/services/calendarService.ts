import { ScheduleEvent } from '../../../types';
import { CalendarEvent, EventStyle } from '../types';

export const transformScheduleToEvents = (schedule: Record<string, ScheduleEvent[]>): CalendarEvent[] => {
    return Object.values(schedule).flat();
};

export const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  // Set to nearest Thursday: current date + 4 - current day number
  // Make Sunday's day number 7
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  // Get first day of year
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  // Calculate full weeks to nearest Thursday
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  // Return week number
  return weekNo;
};

export const getEventType = (event: CalendarEvent): string => {
  const summary = event.summary.toLowerCase();
  if (summary.includes('abwesenheit')) return 'absence';
  if (summary.includes('flexi')) return 'flexi';
  if (summary.includes('meeting')) return 'meeting';
  if (event.dtstart.getHours() < 12) return 'early';
  return 'late';
};

export const EVENT_TYPE_STYLES: Record<string, EventStyle> = {
  absence: { className: 'bg-sky-800/80 text-sky-200 border-l-4 border-sky-500', icon: 'beach_access' },
  flexi: { className: 'bg-green-800/80 text-green-200 border-l-4 border-green-500', icon: 'laptop_chromebook' },
  meeting: { className: 'bg-red-800/80 text-red-200 border-l-4 border-red-500', icon: 'groups' },
  early: { className: 'bg-orange-800/80 text-orange-200 border-l-4 border-orange-500', icon: 'wb_sunny' },
  late: { className: 'bg-purple-800/80 text-purple-200 border-l-4 border-purple-500', icon: 'nightlight' },
  default: { className: 'bg-neutral-700/80 text-neutral-200 border-l-4 border-neutral-500', icon: 'event' },
};
