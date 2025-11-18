import { ScheduleEvent } from '../../types';

export type ViewType = 'month' | 'week';

export interface CalendarEvent extends ScheduleEvent {
  // Can extend with color, etc. in the future
}

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
  weekNumber?: number;
}

export interface EventStyle {
  className: string;
  icon: string;
}
