import React from 'react';
import { Plus, Trash2, Check, X } from 'lucide-react';

interface InclusionsBuilderProps {
  included: string[];
  notIncluded: string[];
  onIncludedChange: (items: string[]) => void;
  onNotIncludedChange: (items: string[]) => void;
  label?: string;
  description?: string;
}

export function InclusionsBuilder({
  included = [],
  notIncluded = [],
  onIncludedChange,
  onNotIncludedChange,
  label = 'Inclusions',
  description = 'Specify what is and isn\'t included in this trip',
}: InclusionsBuilderProps) {
  const addIncluded = () => {
    onIncludedChange([...included, '']);
  };

  const addNotIncluded = () => {
    onNotIncludedChange([...notIncluded, '']);
  };

  const updateIncluded = (index: number, value: string) => {
    const updated = included.map((item, i) => (i === index ? value : item));
    onIncludedChange(updated);
  };

  const updateNotIncluded = (index: number, value: string) => {
    const updated = notIncluded.map((item, i) => (i === index ? value : item));
    onNotIncludedChange(updated);
  };

  const removeIncluded = (index: number) => {
    onIncludedChange(included.filter((_, i) => i !== index));
  };

  const removeNotIncluded = (index: number) => {
    onNotIncludedChange(notIncluded.filter((_, i) => i !== index));
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

      <div className="grid md:grid-cols-2 gap-6">
        {/* What's Included */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-4 h-4 text-green-600" />
            </div>
            <h3 className="font-medium text-gray-900">What's Included</h3>
          </div>

          <div className="space-y-2">
            {included.map((item, index) => (
              <div key={index} className="flex gap-2">
                <div className="flex-1 flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => updateIncluded(index, e.target.value)}
                    placeholder="e.g., Accommodation, Meals, Transport"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={() => removeIncluded(index)}
                  type="button"
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={addIncluded}
            type="button"
            className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-green-500 hover:text-green-600 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Included Item
          </button>
        </div>

        {/* What's Not Included */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
              <X className="w-4 h-4 text-red-600" />
            </div>
            <h3 className="font-medium text-gray-900">What's Not Included</h3>
          </div>

          <div className="space-y-2">
            {notIncluded.map((item, index) => (
              <div key={index} className="flex gap-2">
                <div className="flex-1 flex items-center gap-2">
                  <X className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => updateNotIncluded(index, e.target.value)}
                    placeholder="e.g., Personal expenses, Tips"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={() => removeNotIncluded(index)}
                  type="button"
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={addNotIncluded}
            type="button"
            className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-red-500 hover:text-red-600 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Excluded Item
          </button>
        </div>
      </div>
    </div>
  );
}
