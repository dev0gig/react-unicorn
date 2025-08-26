import React, { useEffect, useRef } from 'react';

interface HolidayInfoModalProps {
  name: string;
  description: string;
  position: { top: number; left: number };
  onClose: () => void;
}

export const HolidayInfoModal: React.FC<HolidayInfoModalProps> = ({ name, description, position, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    // Use timeout to avoid closing on the same click that opened it
    setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
    }, 0);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div
      ref={modalRef}
      style={{ top: position.top, left: position.left }}
      className="fixed z-[60] w-64 bg-neutral-900 border border-orange-500/50 rounded-lg shadow-2xl p-4 text-white animate-fade-in-fast"
    >
      <h3 className="font-bold text-orange-400 mb-2">{name}</h3>
      <p className="text-sm text-neutral-300">{description}</p>
      <button onClick={onClose} className="absolute top-2 right-2 p-1 rounded-full hover:bg-neutral-700">
        <i className="material-icons text-base">close</i>
      </button>
    </div>
  );
};
