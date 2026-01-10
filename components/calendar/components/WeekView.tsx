import React, { useMemo, useEffect, useRef } from 'react';
import { CalendarEvent } from '../types';
import { getEventType, EVENT_TYPE_STYLES } from '../services/calendarService';

interface WeekViewProps {
    startDate: Date;
    events: CalendarEvent[];
}

const HOUR_HEIGHT_PX = 40;
const DISPLAY_START_HOUR = 6;
const DISPLAY_END_HOUR = 22;

// Type for an event with added layout properties
type PositionedEvent = CalendarEvent & {
    layout: {
        top: number;
        height: number;
        left: number;
        width: number;
    }
};

export const WeekView: React.FC<WeekViewProps> = ({ startDate, events }) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // No longer need to scroll on load since we start at 6am (top)

    const { weekDays, positionedEventsByDay } = useMemo(() => {
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

        const positionedEvents: Record<string, PositionedEvent[]> = {};

        // This function calculates the layout properties for a group of overlapping events
        function packColumns(columns: PositionedEvent[][]) {
            const numCols = columns.length;
            for (let i = 0; i < numCols; i++) {
                for (const event of columns[i]) {
                    const hourPart = event.dtstart.getHours();
                    const minutePart = event.dtstart.getMinutes();
                    // Adjust top calculation relative to DISPLAY_START_HOUR
                    const top = ((hourPart - DISPLAY_START_HOUR) * 60 + minutePart) / 60 * HOUR_HEIGHT_PX;

                    const durationMinutes = (event.dtend.getTime() - event.dtstart.getTime()) / (1000 * 60);
                    const height = Math.max(20, (durationMinutes / 60) * HOUR_HEIGHT_PX - 2); // -2 for a small gap

                    event.layout = {
                        top,
                        height,
                        width: (100 / numCols),
                        left: (i * 100 / numCols),
                    };
                }
            }
        }

        days.forEach(date => {
            const dateKey = date.toISOString().split('T')[0];
            const dayEvents = events
                .filter(event => {
                    const eventDate = new Date(event.dtstart);
                    eventDate.setHours(0, 0, 0, 0);
                    return eventDate.getTime() === date.getTime();
                })
                // Filter out events that end before start hour or start after end hour to avoid clutter (optional but good)
                .filter(event => {
                    const h = event.dtstart.getHours();
                    return h >= DISPLAY_START_HOUR && h <= DISPLAY_END_HOUR;
                })
                .sort((a, b) => a.dtstart.getTime() - b.dtstart.getTime() || (b.dtend.getTime() - a.dtend.getTime()));

            const finalPositionedEventsForDay: PositionedEvent[] = [];
            let currentOverlapGroup: PositionedEvent[][] = [];
            let lastEventEndingOfGroup: number | null = null;

            for (const event of dayEvents) {
                const eventAsPositioned = event as PositionedEvent;

                // If the current event starts after the last group ended, pack the old group and start a new one.
                if (lastEventEndingOfGroup !== null && eventAsPositioned.dtstart.getTime() >= lastEventEndingOfGroup) {
                    packColumns(currentOverlapGroup);
                    finalPositionedEventsForDay.push(...currentOverlapGroup.flat());

                    currentOverlapGroup = [];
                    lastEventEndingOfGroup = null;
                }

                // Find a column in the current group for the event where it doesn't overlap.
                let placed = false;
                for (const col of currentOverlapGroup) {
                    if (col.length > 0 && col[col.length - 1].dtend.getTime() <= eventAsPositioned.dtstart.getTime()) {
                        col.push(eventAsPositioned);
                        placed = true;
                        break;
                    }
                }

                // If it couldn't be placed, it needs its own new column.
                if (!placed) {
                    currentOverlapGroup.push([eventAsPositioned]);
                }

                // Update the end time for the current group of overlapping events.
                if (lastEventEndingOfGroup === null || eventAsPositioned.dtend.getTime() > lastEventEndingOfGroup) {
                    lastEventEndingOfGroup = eventAsPositioned.dtend.getTime();
                }
            }

            // After the loop, pack the last remaining group.
            if (currentOverlapGroup.length > 0) {
                packColumns(currentOverlapGroup);
                finalPositionedEventsForDay.push(...currentOverlapGroup.flat());
            }

            positionedEvents[dateKey] = finalPositionedEventsForDay;
        });


        return { weekDays: days, positionedEventsByDay: positionedEvents };
    }, [startDate, events]);

    // Create hours array from start to end
    const hours = Array.from(
        { length: DISPLAY_END_HOUR - DISPLAY_START_HOUR + 1 },
        (_, i) => i + DISPLAY_START_HOUR
    );

    return (
        <div ref={scrollContainerRef} className="h-full overflow-y-auto hide-scrollbar bg-neutral-800 rounded-lg relative">
            <div className="relative grid grid-cols-[4rem_1fr]">
                {/* Time column (sticky) */}
                <div className="sticky top-0 z-20 bg-neutral-800">
                    {hours.map(hour => (
                        <div key={hour} className="relative pr-2 text-right border-r border-neutral-700" style={{ height: `${HOUR_HEIGHT_PX}px` }}>
                            <span className="text-xs text-neutral-500 relative -top-2">{`${String(hour).padStart(2, '0')}:00`}</span>
                        </div>
                    ))}
                </div>

                {/* Scrollable content area */}
                <div className="relative">
                    {/* Background Grid Lines Layer */}
                    <div className="absolute inset-0 grid grid-cols-7">
                        {weekDays.map((_, dayIndex) => (
                            <div key={dayIndex} className="border-r border-neutral-700 last:border-r-0">
                                {hours.map(hour => (
                                    <div key={hour} className="border-b border-neutral-700/50" style={{ height: `${HOUR_HEIGHT_PX}px` }}></div>
                                ))}
                            </div>
                        ))}
                    </div>

                    {/* Events Layer */}
                    <div className="relative grid grid-cols-7" style={{ height: `${hours.length * HOUR_HEIGHT_PX}px` }}>
                        {weekDays.map(day => (
                            <div key={day.toISOString()} className="relative">
                                {(positionedEventsByDay[day.toISOString().split('T')[0]] || []).map((event, index) => {
                                    const eventType = getEventType(event);
                                    const style = EVENT_TYPE_STYLES[eventType] || EVENT_TYPE_STYLES.default;
                                    const isShort = event.layout.height < 40;
                                    return (
                                        <div
                                            key={index}
                                            className={`absolute p-2 rounded-md transition-colors hover:brightness-125 cursor-pointer ${style.className} z-10`}
                                            style={{
                                                top: `${event.layout.top}px`,
                                                height: `${event.layout.height}px`,
                                                left: `calc(${event.layout.left}% + 2px)`,
                                                width: `calc(${event.layout.width}% - 4px)`,
                                            }}
                                            title={`${event.dtstart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${event.summary}`}
                                        >
                                            <p className="font-bold text-sm truncate">{event.summary}</p>
                                            {!isShort && <p className="text-xs">{event.dtstart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {event.dtend.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};