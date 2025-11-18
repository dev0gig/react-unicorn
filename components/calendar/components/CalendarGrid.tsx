import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { useCalendar } from '../hooks/useCalendar';
import { CalendarEvent, CalendarDay } from '../types';
import { getEventType, EVENT_TYPE_STYLES } from '../services/calendarService';

interface CalendarGridProps {
  currentDate: Date;
  events: CalendarEvent[];
  onDayClick: (day: Date) => void;
  onWeekClick: (week: number, year: number) => void;
}

const DayTooltip: React.FC<{ dayInfo: { day: CalendarDay, element: HTMLElement }, onMouseEnter: () => void, onMouseLeave: () => void }> = ({ dayInfo, onMouseEnter, onMouseLeave }) => {
    const { day, element } = dayInfo;
    const tooltipRef = useRef<HTMLDivElement>(null);
    const [style, setStyle] = useState<React.CSSProperties>({
        opacity: 0,
        position: 'fixed',
        top: '-9999px',
        left: '-9999px',
    });

    useLayoutEffect(() => {
        if (element && tooltipRef.current) {
            const rect = element.getBoundingClientRect();
            const tooltipRect = tooltipRef.current.getBoundingClientRect();
            const buffer = 10;
            
            let top = rect.top;
            let left = rect.right + buffer;

            // Flip to left if not enough space on the right
            if (left + tooltipRect.width > window.innerWidth - buffer) {
                left = rect.left - tooltipRect.width - buffer;
            }

            // Adjust vertically if not enough space at the bottom
            if (top + tooltipRect.height > window.innerHeight - buffer) {
                top = rect.bottom - tooltipRect.height;
            }
            
            // Final boundary checks to keep it on screen
            if (left < buffer) left = buffer;
            if (top < buffer) top = buffer;

            setStyle({
                position: 'fixed',
                top: `${top}px`,
                left: `${left}px`,
                zIndex: 100,
                opacity: 1,
            });
        }
    }, [day, element]);
    
    if (day.events.length === 0) return null;

    return (
        <div 
            ref={tooltipRef} 
            style={style} 
            className="bg-neutral-900 p-3 rounded-lg shadow-2xl w-64 border border-neutral-700 transition-opacity duration-150"
            onMouseEnter={onMouseEnter} 
            onMouseLeave={onMouseLeave}
        >
            <h4 className="font-bold text-orange-400 mb-2">{day.date.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}</h4>
            <ul className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                {day.events.map((event, index) => {
                    const eventType = getEventType(event);
                    const eventStyle = EVENT_TYPE_STYLES[eventType] || EVENT_TYPE_STYLES.default;
                    return (
                         <li key={index} className="text-xs text-neutral-200 flex items-start gap-2">
                            <i className={`material-icons text-sm mt-0.5 ${eventStyle.className.split(' ')[1]}`}>{eventStyle.icon}</i>
                            <div className="flex-1">
                                <span className="font-semibold">{event.dtstart.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</span> - {event.summary}
                            </div>
                         </li>
                    )
                })}
            </ul>
        </div>
    );
};


const DayCell: React.FC<{ day: CalendarDay; onDayClick: (day: Date) => void; onMouseEnter: (day: CalendarDay, e: React.MouseEvent) => void; }> = ({ day, onDayClick, onMouseEnter }) => {
  const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6;

  const getDayClasses = () => {
    let classes = 'relative flex flex-col h-full p-2 overflow-hidden transition-colors duration-200 ';
    if (!day.isCurrentMonth) {
      classes += 'bg-neutral-900 text-neutral-600';
    } else if (isWeekend) {
      classes += 'bg-neutral-800/60';
    } else {
      classes += 'bg-neutral-800';
    }
    if (day.isCurrentMonth) {
      classes += ' hover:bg-neutral-700 cursor-pointer';
    }
    return classes;
  };

  const numberClasses = `w-7 h-7 flex items-center justify-center rounded-full text-sm font-semibold ${day.isToday ? 'bg-orange-500 text-white' : 'text-neutral-300'}`;
  
  const eventsToShow = day.events.slice(0, 3);
  const remainingEvents = day.events.length - eventsToShow.length;

  return (
    <div className={getDayClasses()} onClick={() => day.isCurrentMonth && onDayClick(day.date)} onMouseEnter={(e) => onMouseEnter(day, e)}>
      <div className="flex justify-between items-center">
        <span className={numberClasses}>{day.date.getDate()}</span>
      </div>
      <div className="mt-1 space-y-1 flex-grow overflow-hidden min-h-0">
          {eventsToShow.map((event, index) => {
             const eventType = getEventType(event);
             const style = EVENT_TYPE_STYLES[eventType] || EVENT_TYPE_STYLES.default;
             const opacityClass = day.isCurrentMonth ? '' : 'opacity-40';
             return (
                <div key={index} className={`text-xs px-2 py-0.5 rounded truncate ${style.className} ${opacityClass}`}>
                  {event.summary}
                </div>
             )
          })}
          {remainingEvents > 0 && (
            <div className={`text-neutral-400 text-xs mt-1 ${!day.isCurrentMonth ? 'opacity-40' : ''}`}>
              + {remainingEvents} weitere
            </div>
          )}
        </div>
    </div>
  );
};


export const CalendarGrid: React.FC<CalendarGridProps> = ({ currentDate, events, onDayClick, onWeekClick }) => {
  const { weeks } = useCalendar(currentDate, events);
  const [hoveredDayInfo, setHoveredDayInfo] = useState<{ day: CalendarDay, element: HTMLElement } | null>(null);
  const hideTooltipTimer = useRef<number | null>(null);

  const handleMouseEnterDay = (day: CalendarDay, e: React.MouseEvent) => {
    if (hideTooltipTimer.current) {
        clearTimeout(hideTooltipTimer.current);
        hideTooltipTimer.current = null;
    }
    if (day.isCurrentMonth && hoveredDayInfo?.day.date.getTime() !== day.date.getTime()) {
        setHoveredDayInfo({ day, element: e.currentTarget as HTMLElement });
    }
  };

  const handleMouseLeaveGrid = () => {
    hideTooltipTimer.current = window.setTimeout(() => {
        setHoveredDayInfo(null);
    }, 200);
  };

  const handleMouseEnterTooltip = () => {
      if (hideTooltipTimer.current) {
          clearTimeout(hideTooltipTimer.current);
          hideTooltipTimer.current = null;
      }
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (hideTooltipTimer.current) clearTimeout(hideTooltipTimer.current);
    }
  }, []);

  return (
    <div className="h-full flex flex-col relative" onMouseLeave={handleMouseLeaveGrid}>
      {hoveredDayInfo && <DayTooltip dayInfo={hoveredDayInfo} onMouseEnter={handleMouseEnterTooltip} onMouseLeave={handleMouseLeaveGrid} />}
      <div className="h-full grid grid-cols-[64px_repeat(7,minmax(0,1fr))] grid-rows-6 border-t border-l border-neutral-700">
        {weeks.map((week, weekIndex) => (
          <React.Fragment key={week.weekNumber + '-' + weekIndex}>
            <button
              onClick={() => onWeekClick(week.weekNumber, currentDate.getFullYear())}
              className="flex items-center justify-center text-sm font-semibold text-neutral-500 border-b border-r border-neutral-700 hover:bg-neutral-700/50 transition-colors"
            >
              {week.weekNumber}
            </button>
            {week.days.map(day => (
              <div key={day.date.toISOString()} className="border-b border-r border-neutral-700 min-h-0">
                <DayCell day={day} onDayClick={onDayClick} onMouseEnter={handleMouseEnterDay} />
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};