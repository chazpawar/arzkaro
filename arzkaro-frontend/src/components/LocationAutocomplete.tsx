/// <reference types="google.maps" />

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, X } from 'lucide-react';

interface LocationAutocompleteProps {
  value: {
    address: string;
    latitude: number | null;
    longitude: number | null;
  } | null;
  onChange: (location: {
    address: string;
    latitude: number;
    longitude: number;
  } | null) => void;
  label?: string;
  placeholder?: string;
}

export function LocationAutocomplete({
  value,
  onChange,
  label = 'Location',
  placeholder = 'Search for a location...',
}: LocationAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value?.address || '');
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompleteSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const sessionToken = useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  // Initialize Session Token
  useEffect(() => {
    if (typeof window !== 'undefined' && window.google?.maps?.places) {
      sessionToken.current = new window.google.maps.places.AutocompleteSessionToken();
    }
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    if (!newValue.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Use the New Places API AutocompleteSuggestion
    if (window.google?.maps?.places?.AutocompleteSuggestion) {
      setIsLoading(true);
      try {
        const { suggestions: newSuggestions } = await window.google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: newValue,
          includedRegionCodes: ['in'], // Restrict to India
          sessionToken: sessionToken.current || undefined,
        });
        setSuggestions(newSuggestions || []);
        setShowSuggestions((newSuggestions?.length || 0) > 0);
      } catch (error) {
        console.error('Error fetching suggestions with New Places API:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSelectSuggestion = async (suggestion: google.maps.places.AutocompleteSuggestion) => {
    const prediction = suggestion.placePrediction;
    if (!prediction) return;

    const place = prediction.toPlace();
    
    setInputValue(prediction.text?.toString() || '');
    setShowSuggestions(false);
    setIsLoading(true);

    try {
      // Use the New Place fetchFields method
      await place.fetchFields({
        fields: ['location', 'formattedAddress'],
      });

      if (place.location) {
        onChange({
          address: place.formattedAddress || prediction.text?.toString() || '',
          latitude: place.location.lat(),
          longitude: place.location.lng(),
        });
        // Create a new session token after place selection
        sessionToken.current = new window.google.maps.places.AutocompleteSessionToken();
      }
    } catch (error) {
      console.error('Error fetching place details with New Place API:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setInputValue('');
    onChange(null);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <div className="w-full" ref={wrapperRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-900 mb-2">
          {label}
        </label>
      )}

      <div className="relative">
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => {
              if (suggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            placeholder={placeholder}
            className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
          />
          {inputValue && (
            <button
              onClick={handleClear}
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {suggestions.map((suggestion, index) => {
              const prediction = suggestion.placePrediction;
              if (!prediction) return null;

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSelectSuggestion(suggestion)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 flex items-start gap-3"
                >
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {prediction.mainText?.toString() || prediction.text?.toString()}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {prediction.secondaryText?.toString() || ''}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-gray-200 border-t-orange-500 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Selected location display */}
      {value && value.latitude !== null && value.longitude !== null && (
        <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
          <MapPin className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-green-900 font-medium">Location selected</p>
            <p className="text-xs text-green-700 mt-0.5">
              {value.latitude.toFixed(6)}, {value.longitude.toFixed(6)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
