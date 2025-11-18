import React from 'react';
import { ViewType } from '../types';
import { getWeekNumber } from '../services/calendarService';

interface CalendarHeaderProps {
  currentDate: Date;
  view: ViewType;
  onNavigate: (direction: 'prev' | 'next' | 'today') => void;
  onViewChange: (view: ViewType) => void;
  onImportClick: () => void;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({ currentDate, view, onNavigate, onViewChange, onImportClick }) => {

  const getHeaderText = () => {
    if (view === 'month') {
      return currentDate.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
    } else {
      const weekNumber = getWeekNumber(currentDate);
      const start = new Date(currentDate);
      const dayOfWeek = start.getDay();
      const diff = start.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      start.setDate(diff);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      
      let dateRangeText;
      if (start.getMonth() === end.getMonth()) {
        dateRangeText = `${start.getDate()}. - ${end.getDate()}. ${end.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}`;
      } else if (start.getFullYear() === end.getFullYear()) {
        dateRangeText = `${start.toLocaleDateString('de-DE', { day: 'numeric', month: 'long' })} - ${end.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })}`;
      } else {
        dateRangeText = `${start.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })} - ${end.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })}`;
      }
      return `KW ${weekNumber} | ${dateRangeText}`;
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border-b border-neutral-700 flex-shrink-0">
      <h2 className="text-xl font-bold text-neutral-100 truncate">{getHeaderText()}</h2>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
            <button onClick={() => onNavigate('prev')} className="p-2 rounded-full text-neutral-400 hover:bg-neutral-700 hover:text-white transition-colors" aria-label="Zurück">
                <i className="material-icons">chevron_left</i>
            </button>
            <button onClick={() => onNavigate('today')} className="px-4 py-2 text-sm font-semibold bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-colors">Heute</button>
            <button onClick={() => onNavigate('next')} className="p-2 rounded-full text-neutral-400 hover:bg-neutral-700 hover:text-white transition-colors" aria-label="Weiter">
                <i className="material-icons">chevron_right</i>
            </button>
        </div>

        <button onClick={onImportClick} className="flex items-center gap-2 bg-neutral-700 hover:bg-neutral-600 text-white font-semibold py-2 px-3 rounded-lg transition-all text-sm" title="Dienstplan importieren">
            <i className="material-icons text-base">file_upload</i>
            <span>Importieren</span>
        </button>

        <div className="flex items-center bg-neutral-800 p-1 rounded-lg">
            <button onClick={() => onViewChange('month')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${view === 'month' ? 'bg-orange-500 text-white' : 'text-neutral-300 hover:bg-neutral-700'}`}>Monat</button>
            <button onClick={() => onViewChange('week')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${view === 'week' ? 'bg-orange-500 text-white' : 'text-neutral-300 hover:bg-neutral-700'}`}>Woche</button>
        </div>
      </div>
    </div>
  );
};