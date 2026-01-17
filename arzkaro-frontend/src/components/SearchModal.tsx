import React, { useState, useEffect, useRef } from 'react';
import { X, Search, MapPin, Navigation, ChevronRight, CheckCircle2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../contexts/ToastContext';
import { searchPlaces, getPlaceDetails, type PlaceAutocompleteResult } from '../services/googlePlacesService';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (
    location: string,
    query: string,
    radius: number,
    coordinates?: { latitude: number; longitude: number }
  ) => void;
  searchContext?: 'all' | 'experiences' | 'trips';
}

const SUGGESTED_KEYWORDS = {
  all: ['Cricket', 'Dance', 'Badminton', 'Yoga', 'Trekking', 'Photography', 'Comedy', 'Food', 'Music', 'Fitness'],
  experiences: ['Cricket', 'Dance', 'Badminton', 'Yoga', 'Photography', 'Comedy', 'Food', 'Music', 'Fitness', 'Workshop'],
  trips: ['Trekking', 'Beach', 'Mountains', 'Adventure', 'Road Trip', 'Camping', 'Backpacking', 'Hill Station', 'Wildlife', 'Heritage'],
};

const POPULAR_LOCATIONS = ['Bangalore', 'Mumbai', 'Delhi', 'Goa', 'Pune'];

export default function SearchModal({
  isOpen,
  onClose,
  onSearch,
  searchContext = 'all',
}: SearchModalProps) {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedRadius, setSelectedRadius] = useState(10);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<PlaceAutocompleteResult[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [userCoordinates, setUserCoordinates] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const keywords = SUGGESTED_KEYWORDS[searchContext];

  useEffect(() => {
    if (!isOpen) {
      setShowLocationPicker(false);
      setLocationSearchQuery('');
      setLocationSuggestions([]);
    }
  }, [isOpen]);

  // Handle debounced autocomplete
  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    if (!locationSearchQuery.trim()) {
      setLocationSuggestions([]);
      return;
    }

    setIsLoadingSuggestions(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const results = await searchPlaces(locationSearchQuery, '(cities)', 'country:in');
        setLocationSuggestions(results.slice(0, 5));
      } catch (error) {
        console.error('Autocomplete error:', error);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 500);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [locationSearchQuery]);

  const handleSearch = () => {
    const location = useCurrentLocation ? 'Current Location' : selectedLocation || 'All Locations';
    onSearch(location, searchQuery.trim(), selectedRadius, userCoordinates || undefined);
    onClose();
  };

  const handleCurrentLocation = async () => {
    setIsLoadingLocation(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserCoordinates({ latitude, longitude });
          setUseCurrentLocation(true);
          setSelectedLocation('Current Location');
          setShowLocationPicker(false);
          setIsLoadingLocation(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          showToast('Failed to get location. Please enable location permissions.', 'error');
          setIsLoadingLocation(false);
        }
      );
    } else {
      showToast('Geolocation is not supported by your browser.', 'error');
      setIsLoadingLocation(false);
    }
  };

  const handleSelectLocationItem = async (label: string, placeId?: string) => {
    setIsLoadingLocation(true);
    try {
      if (placeId) {
        const details = await getPlaceDetails(placeId);
        if (details) {
          setUserCoordinates({
            latitude: details.geometry.location.lat,
            longitude: details.geometry.location.lng,
          });
        }
      } else {
        // For popular locations without static coordinates in this mock, 
        // in a real app you'd fetch them or have a mapping.
        setUserCoordinates(null); 
      }
      setSelectedLocation(label);
      setUseCurrentLocation(false);
      setShowLocationPicker(false);
      setLocationSearchQuery('');
    } catch (error) {
      console.error('Error selecting location:', error);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleDeselectLocation = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedLocation('');
    setUseCurrentLocation(false);
    setUserCoordinates(null);
  };

  const handleClear = () => {
    setSearchQuery('');
    setSelectedLocation('');
    setSelectedRadius(10);
    setUseCurrentLocation(false);
    setUserCoordinates(null);
    // Apply clear to global state too
    onSearch('', '', 10, undefined);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {showLocationPicker && (
                <button 
                  onClick={() => setShowLocationPicker(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ChevronRight size={20} className="text-gray-500 rotate-180" />
                </button>
              )}
              <h2 className="text-2xl font-bold text-gray-900">
                {showLocationPicker ? 'Select Location' : 'Search'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={24} className="text-gray-500" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {!showLocationPicker ? (
              <>
                {/* Search Query Section */}
                <div className="space-y-4">
                  <label className="text-lg font-semibold text-gray-900">What are you looking for?</label>
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#FF785A] transition-colors" size={20} />
                    <input
                      autoFocus
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Type activity, event name..."
                      className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FF785A]/20 focus:bg-white transition-all text-gray-900 font-medium"
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2">
                        <X size={20} className="text-gray-400 hover:text-gray-600" />
                      </button>
                    )}
                  </div>

                  {/* Suggested Keywords */}
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Suggested</p>
                    <div className="flex flex-wrap gap-2">
                      {keywords.map((keyword) => (
                        <button
                          key={keyword}
                          onClick={() => setSearchQuery(keyword)}
                          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                            searchQuery === keyword
                              ? 'bg-[#FF785A] text-white shadow-lg shadow-[#FF785A]/20'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {keyword}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Location Section */}
                <div className="space-y-4">
                  <label className="text-lg font-semibold text-gray-900">Location</label>
                  <button
                    onClick={() => setShowLocationPicker(true)}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-2xl hover:bg-gray-100 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        {useCurrentLocation ? (
                          <Navigation size={20} className="text-[#FF785A]" />
                        ) : (
                          <MapPin size={20} className="text-[#FF785A]" />
                        )}
                      </div>
                      <span className="font-semibold text-gray-800">
                        {selectedLocation || 'Select Location'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedLocation && (
                        <>
                          <button
                            onClick={handleDeselectLocation}
                            className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                          >
                            <X size={18} className="text-gray-400" />
                          </button>
                          <CheckCircle2 size={20} className="text-[#FF785A]" />
                        </>
                      )}
                      {!selectedLocation && <ChevronRight size={20} className="text-gray-400 group-hover:translate-x-1 transition-transform" />}
                    </div>
                  </button>

                  {/* Show search mode indicator */}
                  {selectedLocation && (
                    <div className="flex items-center gap-2 px-1 text-xs">
                      {userCoordinates ? (
                        <CheckCircle2 size={16} className="text-[#FF785A]" />
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-400 ml-1" />
                      )}
                      <span className={userCoordinates ? 'text-[#FF785A] font-bold' : 'text-gray-500 font-medium'}>
                        {userCoordinates
                          ? `Radius search (${selectedRadius} km from ${selectedLocation})`
                          : 'Text search (name matching only)'}
                      </span>
                    </div>
                  )}

                  {/* Radius Slider (only if location coordinates are set or contextually appropriate) */}
                  {selectedLocation && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-3 pt-2"
                    >
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium text-gray-600">Search Radius</span>
                        <span className="font-bold text-[#FF785A]">{selectedRadius} km</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="50"
                        value={selectedRadius}
                        onChange={(e) => setSelectedRadius(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-[#FF785A]"
                      />
                      <div className="flex justify-between text-xs text-gray-400 font-medium">
                        <span>1 km</span>
                        <span>50 km</span>
                      </div>
                    </motion.div>
                  )}
                </div>
              </>
            ) : (
              /* Location Picker View */
              <div className="space-y-6">
                <button
                  onClick={handleCurrentLocation}
                  disabled={isLoadingLocation}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-colors group border border-gray-100"
                >
                  <div className="w-12 h-12 bg-[#FF785A]/10 rounded-2xl flex items-center justify-center">
                    {isLoadingLocation ? <Loader2 size={24} className="text-[#FF785A] animate-spin" /> : <Navigation size={24} className="text-[#FF785A]" />}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-bold text-gray-900">Current Location</p>
                    <p className="text-sm text-gray-500">Search nearby your actual position</p>
                  </div>
                </button>

                <div className="space-y-4">
                  <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Search City</p>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      value={locationSearchQuery}
                      onChange={(e) => setLocationSearchQuery(e.target.value)}
                      placeholder="Enter city or area..."
                      className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FF785A]/20"
                    />
                    {isLoadingSuggestions && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <Loader2 size={20} className="text-[#FF785A] animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* Autocomplete Suggestions */}
                  {locationSuggestions.length > 0 && (
                    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-xl shadow-gray-200/50">
                      {locationSuggestions.map((suggestion) => (
                        <button
                          key={suggestion.place_id}
                          onClick={() => handleSelectLocationItem(suggestion.structured_formatting.main_text, suggestion.place_id)}
                          className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0"
                        >
                          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <MapPin size={20} className="text-gray-400" />
                          </div>
                          <div className="overflow-hidden">
                            <p className="font-bold text-gray-900 truncate">
                              {suggestion.structured_formatting.main_text}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {suggestion.structured_formatting.secondary_text}
                            </p>
                          </div>
                          <ChevronRight size={18} className="ml-auto text-gray-300" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Popular Cities (only when not typing) */}
                  {!locationSearchQuery && (
                    <div className="space-y-2">
                       <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Popular Cities</p>
                       <div className="grid grid-cols-1 gap-2">
                        {POPULAR_LOCATIONS.map((loc) => (
                          <button
                            key={loc}
                            onClick={() => handleSelectLocationItem(loc)}
                            className="flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-colors group border border-gray-50"
                          >
                            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                              <MapPin size={20} className="text-gray-400" />
                            </div>
                            <span className="font-bold text-gray-900">{loc}</span>
                            <ChevronRight size={18} className="ml-auto text-gray-300 opacity-0 group-hover:opacity-100 transition-all" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {!showLocationPicker && (
            <div className="p-6 border-t border-gray-100 flex items-center gap-4 bg-gray-50/50">
              <button
                onClick={handleClear}
                className="px-6 py-4 text-gray-500 font-bold hover:text-gray-700 transition-colors"
              >
                Clear all
              </button>
              <button
                onClick={handleSearch}
                className="flex-1 bg-[#FF785A] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#ff6a47] transition-all hover:shadow-xl hover:shadow-[#FF785A]/20 active:scale-[0.98]"
              >
                <Search size={20} />
                Search experiences
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
