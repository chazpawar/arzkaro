import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Clock } from 'lucide-react';

interface StyledTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
  minTime?: string; // Minimum selectable time in HH:MM format (24-hour)
  selectedDate?: string; // Selected date in YYYY-MM-DD format to check if it's today
}

export function StyledTimePicker({ value, onChange, label, className = '', minTime, selectedDate }: StyledTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState<number>(value ? parseInt(value.split(':')[0]) || 12 : 12);
  const [selectedMinute, setSelectedMinute] = useState<number>(value ? parseInt(value.split(':')[1]) || 0 : 0);
  const [isAM, setIsAM] = useState<boolean>(value ? parseInt(value.split(':')[0]) < 12 : true);
  const timePickerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [positionAbove, setPositionAbove] = useState(false);

  useEffect(() => {
    if (value) {
      const [hour24, minute] = value.split(':').map(Number);
      const hour = hour24 || 12;
      const minuteValue = minute || 0;
      
      // Convert 24-hour to 12-hour format
      let displayHour = hour;
      let am = true;
      
      if (hour === 0) {
        displayHour = 12;
        am = true;
      } else if (hour === 12) {
        displayHour = 12;
        am = false;
      } else if (hour > 12) {
        displayHour = hour - 12;
        am = false;
      } else {
        displayHour = hour;
        am = true;
      }
      
      setSelectedHour(displayHour);
      setSelectedMinute(minuteValue);
      setIsAM(am);
    } else {
      setSelectedHour(12);
      setSelectedMinute(0);
      setIsAM(true);
    }
  }, [value]);

  const formatTime = (hour: number, minute: number, am: boolean): string => {
    let displayHour = hour;
    if (hour === 0) displayHour = 12;
    else if (hour > 12) displayHour = hour - 12;
    else if (hour === 12) displayHour = 12;
    
    const formattedHour = String(displayHour).padStart(2, '0');
    const formattedMinute = String(minute).padStart(2, '0');
    const period = am ? 'AM' : 'PM';
    
    return `${formattedHour}:${formattedMinute} ${period}`;
  };

  const formatTimeForInput = (hour: number, minute: number, am: boolean): string => {
    let actualHour = hour;
    if (!am && hour !== 12) actualHour = hour + 12;
    if (am && hour === 12) actualHour = 0;
    
    return `${String(actualHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  };

  const handleTimeSelect = (hour: number, minute: number, am: boolean) => {
    setSelectedHour(hour);
    setSelectedMinute(minute);
    setIsAM(am);
    // Don't close the picker - let user select hour, minute, and AM/PM before applying
  };

  const handleApply = () => {
    onChange(formatTimeForInput(selectedHour, selectedMinute, isAM));
    setIsOpen(false);
  };

  const handleClear = () => {
    setSelectedHour(12);
    setSelectedMinute(0);
    setIsAM(true);
    onChange('');
    setIsOpen(false);
  };

  const updatePosition = useCallback(() => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      const timePickerHeight = 320; // Approximate height of the time picker
      const timePickerWidth = 280; // Width of the time picker
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      // If there's not enough space below but enough space above, position above
      const shouldPositionAbove = spaceBelow < timePickerHeight && spaceAbove > timePickerHeight;
      
      setPositionAbove(shouldPositionAbove);
      
      // Calculate top position
      let top: number;
      if (shouldPositionAbove) {
        top = rect.top - timePickerHeight - 8;
        // Ensure it doesn't go above viewport
        if (top < 8) {
          top = 8;
        }
      } else {
        top = rect.bottom + 8;
        // Ensure it doesn't go below viewport
        if (top + timePickerHeight > window.innerHeight - 8) {
          top = window.innerHeight - timePickerHeight - 8;
        }
      }
      
      // Calculate left position - ensure it doesn't go off right edge
      let left = rect.left;
      if (left + timePickerWidth > window.innerWidth - 8) {
        left = window.innerWidth - timePickerWidth - 8;
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
      if (timePickerRef.current && !timePickerRef.current.contains(event.target as Node)) {
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

  const isTimeDisabled = (hour: number, minute: number, am: boolean): boolean => {
    // Check if selected date is today
    let isToday = false;
    if (selectedDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDateObj = new Date(selectedDate);
      selectedDateObj.setHours(0, 0, 0, 0);
      isToday = selectedDateObj.getTime() === today.getTime();
    }
    
    const time24Hour = formatTimeForInput(hour, minute, am);
    const [timeHour, timeMinute] = time24Hour.split(':').map(Number);
    
    // If today, check against current time
    if (isToday) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      // Disable if time is in the past
      if (timeHour < currentHour || (timeHour === currentHour && timeMinute < currentMinute)) {
        return true;
      }
    }
    
    // Check minTime if provided (for end time picker when same date as start)
    if (minTime) {
      const [minHour, minMinute] = minTime.split(':').map(Number);
      if (timeHour < minHour || (timeHour === minHour && timeMinute < minMinute)) {
        return true;
      }
    }
    
    return false;
  };

  const isHourDisabled = (hour: number): boolean => {
    // Check with current minute and AM/PM
    return isTimeDisabled(hour, selectedMinute, isAM);
  };

  const isMinuteDisabled = (minute: number): boolean => {
    // Check with current hour and AM/PM
    return isTimeDisabled(selectedHour, minute, isAM);
  };

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

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
            value={isOpen || value ? formatTime(selectedHour, selectedMinute, isAM) : ''}
            onClick={() => setIsOpen(!isOpen)}
            placeholder="--:--"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white text-base cursor-pointer"
          />
          <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {isOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={timePickerRef}
            className="fixed z-[99999] border-2 border-black rounded-2xl shadow-2xl p-3 w-[280px]"
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
              backgroundColor: '#ffffff',
            }}
          >
            {/* Time Picker Header */}
            <div className="flex items-center justify-center mb-4">
              <h3 className="text-base font-semibold text-gray-900">Select Time</h3>
            </div>

            {/* Time Selection Grid */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {/* Hours */}
              <div>
                <div className="text-xs font-medium text-gray-600 mb-2 text-center">Hour</div>
                <div className="max-h-[200px] overflow-y-auto space-y-1">
                  {hours.map((hour) => {
                    const hourDisabled = isHourDisabled(hour);
                    return (
                      <button
                        key={hour}
                        type="button"
                        onClick={() => !hourDisabled && handleTimeSelect(hour, selectedMinute, isAM)}
                        disabled={hourDisabled}
                        className={`w-full py-2 text-sm font-medium rounded-lg transition-all ${
                          hourDisabled
                            ? 'bg-gray-50 text-gray-300 cursor-not-allowed opacity-50'
                            : selectedHour === hour
                            ? 'bg-blue-600 text-white border-2 border-black font-bold'
                            : 'bg-gray-50 text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        {String(hour).padStart(2, '0')}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Minutes */}
              <div>
                <div className="text-xs font-medium text-gray-600 mb-2 text-center">Minute</div>
                <div className="max-h-[200px] overflow-y-auto space-y-1">
                  {minutes.filter((_, i) => i % 5 === 0).map((minute) => {
                    const minuteDisabled = isMinuteDisabled(minute);
                    return (
                      <button
                        key={minute}
                        type="button"
                        onClick={() => !minuteDisabled && handleTimeSelect(selectedHour, minute, isAM)}
                        disabled={minuteDisabled}
                        className={`w-full py-2 text-sm font-medium rounded-lg transition-all ${
                          minuteDisabled
                            ? 'bg-gray-50 text-gray-300 cursor-not-allowed opacity-50'
                            : selectedMinute === minute
                            ? 'bg-blue-600 text-white border-2 border-black font-bold'
                            : 'bg-gray-50 text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        {String(minute).padStart(2, '0')}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* AM/PM */}
              <div>
                <div className="text-xs font-medium text-gray-600 mb-2 text-center">Period</div>
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => handleTimeSelect(selectedHour, selectedMinute, true)}
                    className={`w-full py-2 text-sm font-medium rounded-lg transition-all ${
                      isAM
                        ? 'bg-blue-600 text-white border-2 border-black font-bold'
                        : 'bg-gray-50 text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTimeSelect(selectedHour, selectedMinute, false)}
                    className={`w-full py-2 text-sm font-medium rounded-lg transition-all ${
                      !isAM
                        ? 'bg-blue-600 text-white border-2 border-black font-bold'
                        : 'bg-gray-50 text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    PM
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="px-3 py-1.5 text-xs font-medium text-white bg-black hover:bg-gray-800 rounded-lg transition-colors"
              >
                Apply
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
