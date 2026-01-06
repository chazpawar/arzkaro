// src/pages/ForYou.tsx
import { useState, useEffect, useRef } from 'react';
import { MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { ALL_MOCK_EVENTS } from '../data/mockEvents';
import { ALL_MOCK_TRIPS } from '../data/mockTrips';

type ForYouProps = {
  onEventSelect: (eventId: string) => void;
  onTripSelect: (tripId: string) => void;
};

type CombinedItem = {
  id: string;
  title: string;
  type: 'experience' | 'trip';
  image_url: string;
  location?: string;
  city?: string;
  destination?: string;
  price?: number;
  ticket_price?: number;
  estimated_cost?: number;
};

export default function ForYou({ onEventSelect, onTripSelect }: ForYouProps) {
  const [topExperiences, setTopExperiences] = useState<CombinedItem[]>([]);
  const [popularTrips, setPopularTrips] = useState<CombinedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const experiencesRef = useRef<HTMLDivElement>(null);
  const tripsRef = useRef<HTMLDivElement>(null);
  const [showExperiencesArrows, setShowExperiencesArrows] = useState(false);
  const [showTripsArrows, setShowTripsArrows] = useState(false);

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    const checkScrollNeeded = () => {
      if (experiencesRef.current) {
        const isScrollable =
          experiencesRef.current.scrollWidth > experiencesRef.current.clientWidth;
        setShowExperiencesArrows(isScrollable);
      }
      if (tripsRef.current) {
        const isScrollable = tripsRef.current.scrollWidth > tripsRef.current.clientWidth;
        setShowTripsArrows(isScrollable);
      }
    };

    // Check after content loads and on window resize
    checkScrollNeeded();
    window.addEventListener('resize', checkScrollNeeded);

    return () => window.removeEventListener('resize', checkScrollNeeded);
  }, [topExperiences, popularTrips]);

  const loadItems = () => {
    // Top Experiences (from events)
    const experiences: CombinedItem[] = ALL_MOCK_EVENTS.slice(0, 10).map((event) => ({
      id: event.id,
      title: event.title,
      type: 'experience' as const,
      image_url: event.image_url || '',
      city: event.city,
      ticket_price: event.ticket_price,
    }));

    // Popular Trips
    const trips: CombinedItem[] = ALL_MOCK_TRIPS.slice(0, 10).map((trip) => ({
      id: trip.id,
      title: trip.title,
      type: 'trip' as const,
      image_url: trip.image_url,
      destination: trip.destination,
      estimated_cost: trip.estimated_cost,
    }));

    setTopExperiences(experiences);
    setPopularTrips(trips);
    setLoading(false);
  };

  const handleItemClick = (item: CombinedItem) => {
    if (item.type === 'experience') {
      onEventSelect(item.id);
    } else {
      onTripSelect(item.id);
    }
  };

  const formatPrice = (item: CombinedItem) => {
    const price = item.ticket_price || item.estimated_cost || 0;
    return `₹${price.toLocaleString()}`;
  };

  const formatLocation = (item: CombinedItem) => {
    return item.city || item.destination || 'Location TBA';
  };

  const scroll = (ref: React.RefObject<HTMLDivElement>, direction: 'left' | 'right') => {
    if (ref.current) {
      const scrollAmount = 300;
      const newScrollPosition =
        direction === 'left'
          ? ref.current.scrollLeft - scrollAmount
          : ref.current.scrollLeft + scrollAmount;

      ref.current.scrollTo({
        left: newScrollPosition,
        behavior: 'smooth',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Top Experiences Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Top Experiences</h2>
            <button
              onClick={() => onEventSelect('')}
              className="text-[#FF785A] font-semibold hover:underline transition-colors"
            >
              See All
            </button>
          </div>

          {topExperiences.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No experiences available</div>
          ) : (
            <div className="relative group">
              {/* Left Scroll Button - Only show if scrollable */}
              {showExperiencesArrows && (
                <button
                  onClick={() => scroll(experiencesRef, 'left')}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white disabled:opacity-0"
                  aria-label="Scroll left"
                >
                  <ChevronLeft size={24} className="text-gray-700" />
                </button>
              )}

              {/* Scrollable Container */}
              <div
                ref={experiencesRef}
                className="flex gap-4 overflow-x-auto overflow-y-visible scroll-smooth hide-scrollbar py-4 px-1"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                }}
              >
                {topExperiences.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    onClick={() => handleItemClick(item)}
                    className="flex-shrink-0 w-64 bg-white rounded-xl overflow-hidden cursor-pointer transition-all duration-300 ease-out hover:-translate-y-1"
                    style={{
                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                    }}
                    whileHover={{
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                    }}
                  >
                    {/* Image */}
                    <div className="relative h-40 overflow-hidden">
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                        onError={(e) => {
                          e.currentTarget.src = 'https://via.placeholder.com/256x160?text=No+Image';
                        }}
                      />
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="text-base font-bold text-gray-900 mb-2 line-clamp-1">
                        {item.title}
                      </h3>

                      {/* Location */}
                      <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                        <MapPin size={14} />
                        <span className="line-clamp-1">{formatLocation(item)}</span>
                      </div>

                      {/* Price */}
                      <div className="text-lg font-bold text-[#FF785A]">{formatPrice(item)}</div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Right Scroll Button - Only show if scrollable */}
              {showExperiencesArrows && (
                <button
                  onClick={() => scroll(experiencesRef, 'right')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white disabled:opacity-0"
                  aria-label="Scroll right"
                >
                  <ChevronRight size={24} className="text-gray-700" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 my-6"></div>

        {/* Popular Trips Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Popular Trips</h2>
            <button
              onClick={() => onTripSelect('')}
              className="text-[#ABDF8B] font-semibold hover:underline transition-colors"
            >
              See All
            </button>
          </div>

          {popularTrips.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No trips available</div>
          ) : (
            <div className="relative group">
              {/* Left Scroll Button - Only show if scrollable */}
              {showTripsArrows && (
                <button
                  onClick={() => scroll(tripsRef, 'left')}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white disabled:opacity-0"
                  aria-label="Scroll left"
                >
                  <ChevronLeft size={24} className="text-gray-700" />
                </button>
              )}

              {/* Scrollable Container */}
              <div
                ref={tripsRef}
                className="flex gap-4 overflow-x-auto overflow-y-visible scroll-smooth hide-scrollbar py-4 px-1"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                }}
              >
                {popularTrips.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    onClick={() => handleItemClick(item)}
                    className="flex-shrink-0 w-64 bg-white rounded-xl overflow-hidden cursor-pointer transition-all duration-300 ease-out hover:-translate-y-1"
                    style={{
                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                    }}
                    whileHover={{
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                    }}
                  >
                    {/* Image */}
                    <div className="relative h-40 overflow-hidden">
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                        onError={(e) => {
                          e.currentTarget.src = 'https://via.placeholder.com/256x160?text=No+Image';
                        }}
                      />
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="text-base font-bold text-gray-900 mb-2 line-clamp-1">
                        {item.title}
                      </h3>

                      {/* Location */}
                      <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                        <MapPin size={14} />
                        <span className="line-clamp-1">{formatLocation(item)}</span>
                      </div>

                      {/* Price */}
                      <div className="text-lg font-bold text-[#ABDF8B]">{formatPrice(item)}</div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Right Scroll Button - Only show if scrollable */}
              {showTripsArrows && (
                <button
                  onClick={() => scroll(tripsRef, 'right')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white disabled:opacity-0"
                  aria-label="Scroll right"
                >
                  <ChevronRight size={24} className="text-gray-700" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Global CSS for hiding scrollbar */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
