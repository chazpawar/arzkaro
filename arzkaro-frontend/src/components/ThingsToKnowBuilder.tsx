import React from 'react';
import { Plus, Trash2, Info } from 'lucide-react';

interface ThingsToKnowBuilderProps {
  value: string[];
  onChange: (items: string[]) => void;
  label?: string;
  description?: string;
  placeholder?: string;
}

export function ThingsToKnowBuilder({
  value = [],
  onChange,
  label = 'Things to Know',
  description = 'Add important information participants should know',
  placeholder = 'e.g., Bring comfortable shoes, Valid ID required',
}: ThingsToKnowBuilderProps) {
  const addItem = () => {
    onChange([...value, '']);
  };

  const updateItem = (index: number, text: string) => {
    const updated = value.map((item, i) => (i === index ? text : item));
    onChange(updated);
  };

  const removeItem = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
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
        {value.map((item, index) => (
          <div key={index} className="flex gap-2">
            <div className="flex-1 flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-3" />
              <textarea
                value={item}
                onChange={(e) => updateItem(index, e.target.value)}
                placeholder={placeholder}
                rows={2}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-none"
              />
            </div>
            <button
              onClick={() => removeItem(index)}
              type="button"
              className="p-2 h-10 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}

        <button
          onClick={addItem}
          type="button"
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-black hover:text-black transition-colors flex items-center justify-center gap-2 font-medium"
        >
          <Plus className="w-5 h-5" />
          Add Item
        </button>
      </div>

      {/* Preview */}
      {value.length > 0 && value.some((item) => item.trim()) && (
        <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Preview</h4>
          <ul className="space-y-2">
            {value
              .filter((item) => item.trim())
              .map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                  <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}
