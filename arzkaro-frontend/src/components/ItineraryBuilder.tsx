import React, { useState } from 'react';
import { Plus, Trash2, Calendar } from 'lucide-react';

export interface ItineraryDay {
  day: number;
  title: string;
  activities: string[];
}

interface ItineraryBuilderProps {
  value: ItineraryDay[];
  onChange: (itinerary: ItineraryDay[]) => void;
  label?: string;
  description?: string;
}

export function ItineraryBuilder({
  value = [],
  onChange,
  label = 'Trip Itinerary',
  description = 'Build your day-by-day trip schedule',
}: ItineraryBuilderProps) {
  const [expandedDay, setExpandedDay] = useState<number | null>(value.length > 0 ? 1 : null);

  const addDay = () => {
    const newDay: ItineraryDay = {
      day: value.length + 1,
      title: '',
      activities: [''],
    };
    onChange([...value, newDay]);
    setExpandedDay(newDay.day);
  };

  const removeDay = (dayNumber: number) => {
    const updatedItinerary = value
      .filter((d) => d.day !== dayNumber)
      .map((d, index) => ({ ...d, day: index + 1 }));
    onChange(updatedItinerary);
    if (expandedDay === dayNumber) {
      setExpandedDay(null);
    }
  };

  const updateDayTitle = (dayNumber: number, title: string) => {
    const updated = value.map((d) =>
      d.day === dayNumber ? { ...d, title } : d
    );
    onChange(updated);
  };

  const addActivity = (dayNumber: number) => {
    const updated = value.map((d) =>
      d.day === dayNumber ? { ...d, activities: [...d.activities, ''] } : d
    );
    onChange(updated);
  };

  const updateActivity = (dayNumber: number, activityIndex: number, text: string) => {
    const updated = value.map((d) =>
      d.day === dayNumber
        ? {
            ...d,
            activities: d.activities.map((a, i) => (i === activityIndex ? text : a)),
          }
        : d
    );
    onChange(updated);
  };

  const removeActivity = (dayNumber: number, activityIndex: number) => {
    const updated = value.map((d) =>
      d.day === dayNumber
        ? {
            ...d,
            activities: d.activities.filter((_, i) => i !== activityIndex),
          }
        : d
    );
    onChange(updated);
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-900 mb-2">
          {label}
        </label>
      )}
      {description && (
        <p className="text-sm text-gray-500 mb-4">{description}</p>
      )}

      <div className="space-y-3">
        {value.map((day) => (
          <div
            key={day.day}
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            {/* Day header */}
            <div
              className={`flex items-center justify-between p-4 cursor-pointer transition-colors ${
                expandedDay === day.day ? 'bg-gray-100' : 'bg-gray-50 hover:bg-gray-100'
              }`}
              onClick={() => setExpandedDay(expandedDay === day.day ? null : day.day)}
            >
              <div className="flex items-center gap-3 flex-1">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Day {day.day}</p>
                  {day.title && (
                    <p className="text-sm text-gray-600 mt-0.5">{day.title}</p>
                  )}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeDay(day.day);
                }}
                type="button"
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Day content */}
            {expandedDay === day.day && (
              <div className="p-4 bg-white border-t border-gray-200 space-y-4">
                {/* Day title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Day Title
                  </label>
                  <input
                    type="text"
                    value={day.title}
                    onChange={(e) => updateDayTitle(day.day, e.target.value)}
                    placeholder="e.g., Arrival & City Tour"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>

                {/* Activities */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Activities
                  </label>
                  <div className="space-y-2">
                    {day.activities.map((activity, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={activity}
                          onChange={(e) =>
                            updateActivity(day.day, index, e.target.value)
                          }
                          placeholder={`Activity ${index + 1}`}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                        />
                        {day.activities.length > 1 && (
                          <button
                            onClick={() => removeActivity(day.day, index)}
                            type="button"
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => addActivity(day.day)}
                    type="button"
                    className="mt-2 text-sm text-black hover:text-gray-700 font-medium flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Add Activity
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Add day button */}
        <button
          onClick={addDay}
          type="button"
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-black hover:text-black transition-colors flex items-center justify-center gap-2 font-medium"
        >
          <Plus className="w-5 h-5" />
          Add Day {value.length + 1}
        </button>
      </div>
    </div>
  );
}
