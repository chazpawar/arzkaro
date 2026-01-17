import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface StyledDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
  minDate?: string; // Minimum selectable date in YYYY-MM-DD format
}

export function StyledDatePicker({ value, onChange, label, className = '', minDate }: StyledDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(value ? new Date(value) : null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const calendarRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [positionAbove, setPositionAbove] = useState(false);

  useEffect(() => {
    if (value) {
      setSelectedDate(new Date(value));
      setCurrentMonth(new Date(value));
    }
  }, [value]);

  const updatePosition = useCallback(() => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      const calendarHeight = 320; // Approximate height of the calendar
      const calendarWidth = 280; // Width of the calendar
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      // If there's not enough space below but enough space above, position above
      const shouldPositionAbove = spaceBelow < calendarHeight && spaceAbove > calendarHeight;
      
      setPositionAbove(shouldPositionAbove);
      
      // Calculate top position
      let top: number;
      if (shouldPositionAbove) {
        top = rect.top - calendarHeight - 8;
        // Ensure it doesn't go above viewport
        if (top < 8) {
          top = 8;
        }
      } else {
        top = rect.bottom + 8;
        // Ensure it doesn't go below viewport
        if (top + calendarHeight > window.innerHeight - 8) {
          top = window.innerHeight - calendarHeight - 8;
        }
      }
      
      // Calculate left position - ensure it doesn't go off right edge
      let left = rect.left;
      if (left + calendarWidth > window.innerWidth - 8) {
        left = window.innerWidth - calendarWidth - 8;
      }
      // Ensure it doesn't go off left edge
      if (left < 8) {
        left = 8;
      }
      
      setPosition({
        top,
        left,
      });
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      }
    };

    if (isOpen && inputRef.current) {
      updatePosition();
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, updatePosition]);

  const formatDate = (date: Date | null): string => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    onChange(formatDate(date));
    setIsOpen(false);
  };

  const handleClear = () => {
    setSelectedDate(null);
    onChange('');
    setIsOpen(false);
  };

  const handleToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if today is allowed
    if (!isDisabled(today)) {
      setSelectedDate(today);
      setCurrentMonth(today);
      onChange(formatDate(today));
      setIsOpen(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const days = getDaysInMonth(currentMonth);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isToday = (date: Date | null) => {
    if (!date) return false;
    return date.getTime() === today.getTime();
  };

  const isSelected = (date: Date | null) => {
    if (!date || !selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const isDisabled = (date: Date | null) => {
    if (!date) return false;
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);
    
    // Disable past dates
    if (dateOnly.getTime() < today.getTime()) {
      return true;
    }
    
    // Disable dates before minDate if provided
    if (minDate) {
      const minDateObj = new Date(minDate);
      minDateObj.setHours(0, 0, 0, 0);
      if (dateOnly.getTime() < minDateObj.getTime()) {
        return true;
      }
    }
    
    return false;
  };

  return (
    <>
      <div className={`relative ${className}`}>
        {label && (
          <label className="block text-xs font-medium text-gray-600 mb-2">{label}</label>
        )}
        <div className="relative" ref={inputRef}>
          <input
            type="text"
            readOnly
            value={value || ''}
            onClick={() => setIsOpen(!isOpen)}
            placeholder="Select date"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white text-base cursor-pointer"
          />
          <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {isOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={calendarRef}
            className="fixed z-[99999] border-2 border-black rounded-xl shadow-2xl p-3 w-[280px]"
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
              backgroundColor: '#ffffff',
            }}
          >
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={() => navigateMonth('prev')}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1.5">
                <select
                  value={currentMonth.getMonth()}
                  onChange={(e) => {
                    const newDate = new Date(currentMonth);
                    newDate.setMonth(parseInt(e.target.value));
                    setCurrentMonth(newDate);
                  }}
                  className="text-sm font-semibold text-gray-900 border-none bg-transparent cursor-pointer focus:outline-none"
                >
                  {monthNames.map((month, index) => (
                    <option key={month} value={index}>
                      {month}
                    </option>
                  ))}
                </select>
                <select
                  value={currentMonth.getFullYear()}
                  onChange={(e) => {
                    const newDate = new Date(currentMonth);
                    newDate.setFullYear(parseInt(e.target.value));
                    setCurrentMonth(newDate);
                  }}
                  className="text-sm font-semibold text-gray-900 border-none bg-transparent cursor-pointer focus:outline-none"
                >
                  {Array.from({ length: 10 }, (_, i) => today.getFullYear() - 2 + i).map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => navigateMonth('next')}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Week Days Header */}
            <div className="grid grid-cols-7 gap-0.5 mb-1.5">
              {weekDays.map((day) => (
                <div key={day} className="text-center text-[10px] font-medium text-gray-600 py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-0.5">
              {days.map((date, index) => {
                if (!date) {
                  return <div key={`empty-${index}`} className="aspect-square" />;
                }

                const dateToday = isToday(date);
                const dateSelected = isSelected(date);
                const isOtherMonth = date.getMonth() !== currentMonth.getMonth();
                const dateDisabled = isDisabled(date);

                return (
                  <button
                    key={date.toISOString()}
                    type="button"
                    onClick={() => !dateDisabled && handleDateSelect(date)}
                    disabled={dateDisabled}
                    className={`
                      aspect-square flex items-center justify-center text-xs font-medium rounded-md transition-all
                      ${dateDisabled 
                        ? 'text-gray-300 bg-gray-50 cursor-not-allowed opacity-50' 
                        : isOtherMonth 
                        ? 'text-gray-300' 
                        : 'text-gray-900'
                      }
                      ${!dateDisabled && dateSelected 
                        ? 'bg-blue-600 text-white border-2 border-black font-bold' 
                        : !dateDisabled && dateToday
                        ? 'bg-blue-50 text-blue-600 border border-blue-200'
                        : !dateDisabled
                        ? 'hover:bg-gray-100'
                        : ''
                      }
                    `}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleToday}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Today
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
