// src/pages/Trips.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, MapPin, Calendar, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { SkeletonCard, SkeletonStyles } from '../components/SkeletonCard';
import { PLACEHOLDER_IMAGES, getPlaceholderImage } from '../utils/placeholders';

interface Trip {
  id: string;
  title: string;
  cover_image_url: string | null;
  location_name: string | null;
  start_date: string;
  end_date: string;
  price: number;
  category: string | null;
  current_bookings: number;
  // Legacy field mappings for compatibility
  image_url?: string;
  destination?: string;
  estimated_cost?: number;
}

interface CategoryTag {
  id: string;
  label: string;
  icon: string;
}

const TRIP_CATEGORIES: CategoryTag[] = [
  { id: 'All', label: 'All', icon: '/trips/AllTrips.png' },
  { id: 'Adventure', label: 'Adventure', icon: '/trips/Adventure.png' },
  { id: 'Leisure', label: 'Leisure', icon: '/trips/Leisure.png' },
  { id: 'Offbeat', label: 'Offbeat', icon: '/trips/Offbeat.png' },
  { id: 'Spiritual', label: 'Spiritual', icon: '/trips/Spiritual.png' },
  { id: 'Nature', label: 'Nature', icon: '/trips/Nature.png' },
  { id: 'Festival', label: 'Festival', icon: '/trips/Festival.png' },
  { id: 'Food & Culture', label: 'Food & Culture', icon: '/trips/Food.png' },
  { id: 'Getaway', label: 'Getaway', icon: '/trips/Getaway.png' },
];

interface TripsPageProps {
  onTripSelect: (tripId: string) => void;
  onChatOpen?: (tripId: string) => void;
  currentUserId?: string | null;
  searchQuery?: string;
  location?: string;
  radius?: number;
  coordinates?: { latitude: number; longitude: number };
  onClearFilters?: () => void;
}

const TripsPage: React.FC<TripsPageProps> = ({ 
  onTripSelect, 
  searchQuery, 
  location,
  onClearFilters 
}) => {
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch trips from Supabase
  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('type', 'trip')
          .eq('is_published', true)
          .eq('is_cancelled', false)
          .gte('end_date', new Date().toISOString()) // Hide expired events (same as mobile app)
          .order('start_date', { ascending: true });

        if (error) {
          console.error('Error fetching trips:', error);
        } else {
          // Map database fields to expected format
          const mappedData = (data || []).map((trip) => ({
            ...trip,
            image_url: trip.cover_image_url,
            destination: trip.location_name,
            estimated_cost: trip.price,
          }));
          setTrips(mappedData);
        }
      } catch (error) {
        console.error('Error loading trips:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, []);

  // Filter trips based on selected category and search state
  const filteredTrips = useMemo(() => {
    let result = trips;

    // Filter by tag
    if (selectedTag !== 'All') {
      result = result.filter((trip) => trip.category === selectedTag);
    }

    // Filter by search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (trip) =>
          trip.title.toLowerCase().includes(q) ||
          trip.location_name?.toLowerCase().includes(q)
      );
    }

    // Filter by location name
    if (location && location !== 'All Locations' && location !== 'Current Location') {
      const loc = location.toLowerCase();
      result = result.filter((trip) => trip.location_name?.toLowerCase().includes(loc));
    }

    return result;
  }, [trips, selectedTag, searchQuery, location]);

  // Get visible categories based on selection
  const visibleCategories = useMemo(() => {
    if (selectedTag !== 'All') {
      // When a category is selected, show only that category (hide "All")
      return TRIP_CATEGORIES.filter((cat) => cat.id === selectedTag);
    }
    // Show all categories
    return TRIP_CATEGORIES;
  }, [selectedTag]);

  const handleCategoryClick = (category: CategoryTag) => {
    setSelectedTag(category.id);
  };

  const handleBackClick = () => {
    setSelectedTag('All');
  };

  const isSelected = (categoryId: string): boolean => {
    return selectedTag === categoryId;
  };

  // Calculate trip duration
  const calculateDuration = (startDate: string, endDate: string): string => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const nights = diffDays > 0 ? diffDays - 1 : 0;
    return `${diffDays}D, ${nights}N`;
  };

  // Show loading state
  if (loading) {
    return (
      <div className="w-full min-h-screen bg-white">
        <SkeletonStyles />

        {/* Category Selection Skeleton */}
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 pt-6 pb-4">
          <div className="flex justify-center items-center">
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex gap-4 py-3 px-4">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="flex-shrink-0 flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-2xl bg-gray-200 animate-pulse relative overflow-hidden">
                      <div className="absolute inset-0 shimmer" />
                    </div>
                    <div className="h-4 w-16 bg-gray-200 rounded animate-pulse relative overflow-hidden">
                      <div className="absolute inset-0 shimmer" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200"></div>

        {/* Grid Skeleton */}
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <SkeletonCard count={8} accentColor="#ABDF8B" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-white">
      {/* Category Selection Section - Full Width with proper padding */}
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 pt-6 pb-4">
        {/* Center container for categories and back button */}
        <div className="flex justify-center items-center">
          <div className="flex items-center gap-3">
            {/* Back Button */}
            {selectedTag !== 'All' && (
              <button
                onClick={handleBackClick}
                className="flex-shrink-0 w-9 h-9 rounded-full border border-gray-300 bg-white hover:bg-gray-50 transition-colors flex items-center justify-center"
                aria-label="Back to all categories"
              >
                <ChevronLeft size={18} className="text-gray-700" />
              </button>
            )}

            {/* Horizontal Scrollable Categories */}
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex gap-4 py-3 px-4">
                {visibleCategories.map((category) => {
                  const selected = isSelected(category.id);

                  return (
                    <button
                      key={category.id}
                      onClick={() => handleCategoryClick(category)}
                      className="flex-shrink-0 flex flex-col items-center gap-1.5 px-1"
                      style={{
                        transform: selected ? 'scale(1.15)' : 'scale(1)',
                        transformOrigin: 'center',
                        transition: 'transform 0.3s ease',
                      }}
                    >
                      {/* Category Icon Container - 72px with relative positioning for badge */}
                      <div className="relative w-[72px] h-[72px] flex items-center justify-center">
                        {/* Icon - 56px for most, 64px for Nature */}
                        <img
                          src={category.icon}
                          alt={category.label}
                          className={category.id === 'Nature' ? 'w-16 h-16 object-contain' : 'w-14 h-14 object-contain'}
                          onError={(e) => {
                            e.currentTarget.src = getPlaceholderImage(56, 56, category.label.substring(0, 2));
                          }}
                        />

                        {/* Checkmark Badge - Only show when selected */}
                        {selected && (
                          <div className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-[#ABDF8B] border-2 border-white flex items-center justify-center z-10">
                            <svg
                              width="10"
                              height="10"
                              viewBox="0 0 10 10"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M8.5 2.5L3.75 7.5L1.5 5.25"
                                stroke="white"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Label */}
                      <span
                        className={`
                          text-[13px] font-semibold transition-all duration-200 whitespace-nowrap text-center leading-tight
                          ${selected ? 'text-gray-900' : 'text-gray-600'}
                        `}
                      >
                        {category.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trips Grid Section */}
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-8">
        {filteredTrips.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg mb-6">
              {selectedTag === 'All'
                ? 'No trips available at the moment'
                : `No ${selectedTag.toLowerCase()} trips available`}
            </p>
            {(searchQuery || location || selectedTag !== 'All') && (
              <button
                onClick={() => {
                  setSelectedTag('All');
                  if (onClearFilters) onClearFilters();
                }}
                className="px-6 py-2 bg-[#FF785A] text-white rounded-full font-bold hover:shadow-lg transition-all"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTrips.map((trip) => (
              <div
                key={trip.id}
                onClick={() => onTripSelect(trip.id)}
                className="bg-white rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-2 shadow-sm hover:shadow-xl"
              >
                {/* Trip Image */}
                <div className="relative h-48 overflow-hidden bg-gray-100">
                  <img
                    src={trip.image_url || trip.cover_image_url || ''}
                    alt={trip.title}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                    onError={(e) => {
                      e.currentTarget.src = PLACEHOLDER_IMAGES.medium;
                    }}
                  />
                </div>

                {/* Trip Details */}
                <div className="p-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 leading-snug">
                    {trip.title}
                  </h3>

                  {/* Location */}
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <MapPin size={16} className="flex-shrink-0" />
                    <span className="line-clamp-1">
                      {trip.destination || trip.location_name || 'TBA'}
                    </span>
                  </div>

                  {/* Duration & Date */}
                  {trip.start_date && trip.end_date && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <Calendar size={16} className="flex-shrink-0" />
                      <span>{calculateDuration(trip.start_date, trip.end_date)}</span>
                    </div>
                  )}

                  {/* Member Count */}
                  {trip.current_bookings > 0 && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                      <Users size={16} className="flex-shrink-0" />
                      <span>{trip.current_bookings} members joined</span>
                    </div>
                  )}

                  {/* Price */}
                  <div className="text-xl font-bold text-gray-900">
                    ₹{(trip.estimated_cost || trip.price)?.toLocaleString('en-IN') || 'TBA'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Global CSS for hiding scrollbar */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default TripsPage;
