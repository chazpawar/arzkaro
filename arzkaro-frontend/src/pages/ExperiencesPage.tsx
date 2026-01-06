import React, { useState, useMemo } from 'react';
import { ChevronLeft, MapPin, Calendar } from 'lucide-react';
import { ALL_MOCK_EVENTS } from '../data/mockEvents';

interface CategoryTag {
  id: string;
  label: string;
  icon: string;
  subcategories?: CategoryTag[];
}

const CATEGORY_TAGS: CategoryTag[] = [
  { id: 'All', label: 'All', icon: '/categoriesicons/AllExperience.png' },
  {
    id: 'Cultural',
    label: 'Cultural',
    icon: '/categoriesicons/cultural/Cultural.png',
    subcategories: [
      { id: 'Music', label: 'Music', icon: '/categoriesicons/cultural/Music.png' },
      { id: 'Art', label: 'Art', icon: '/categoriesicons/cultural/Art.png' },
      { id: 'Dance', label: 'Dance', icon: '/categoriesicons/cultural/Dance.png' },
    ],
  },
  {
    id: 'Sports',
    label: 'Sports',
    icon: '/categoriesicons/sports/Sports.png',
    subcategories: [
      { id: 'Cricket', label: 'Cricket', icon: '/categoriesicons/sports/Cricket.png' },
      { id: 'Football', label: 'Football', icon: '/categoriesicons/sports/Football.png' },
      { id: 'Basketball', label: 'Basketball', icon: '/categoriesicons/sports/Basketball.png' },
      { id: 'Badminton', label: 'Badminton', icon: '/categoriesicons/sports/Badminton.png' },
      { id: 'Volleyball', label: 'Volleyball', icon: '/categoriesicons/sports/Volleyball.png' },
      { id: 'Pickleball', label: 'Pickleball', icon: '/categoriesicons/sports/Pickleball.png' },
    ],
  },
  {
    id: 'Play',
    label: 'Play',
    icon: '/categoriesicons/play/Play.png',
    subcategories: [
      { id: 'Gaming', label: 'Gaming', icon: '/categoriesicons/play/Gaming.png' },
      { id: 'Board Game', label: 'Board Game', icon: '/categoriesicons/play/BoardGame.png' },
    ],
  },
  {
    id: 'Outdoors',
    label: 'Outdoors',
    icon: '/categoriesicons/outdoors/Outdoors.png',
    subcategories: [
      { id: 'Camping', label: 'Camping', icon: '/categoriesicons/outdoors/Camping.png' },
      { id: 'Hiking', label: 'Hiking', icon: '/categoriesicons/outdoors/Hiking.png' },
      { id: 'Cycling', label: 'Cycling', icon: '/categoriesicons/outdoors/Cycling.png' },
      { id: 'Walking', label: 'Walking', icon: '/categoriesicons/outdoors/Walking.png' },
    ],
  },
  {
    id: 'Nightlife',
    label: 'Nightlife',
    icon: '/categoriesicons/nightlife/Nightlife.png',
    subcategories: [
      { id: 'DJ Night', label: 'DJ Night', icon: '/categoriesicons/nightlife/DJNight.png' },
      {
        id: 'House Party',
        label: 'House Party',
        icon: '/categoriesicons/nightlife/HouseParty.png',
      },
      { id: 'Nightout', label: 'Nightout', icon: '/categoriesicons/nightlife/Nightout.png' },
    ],
  },
  {
    id: 'Wellness',
    label: 'Wellness',
    icon: '/categoriesicons/wellness/Wellness.png',
    subcategories: [
      { id: 'Yoga', label: 'Yoga', icon: '/categoriesicons/wellness/Yoga.png' },
      { id: 'Meditation', label: 'Meditation', icon: '/categoriesicons/wellness/Meditation.png' },
    ],
  },
];

interface ExperiencesPageProps {
  onEventClick: (eventId: string) => void;
}

const ExperiencesPage: React.FC<ExperiencesPageProps> = ({ onEventClick }) => {
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [selectedParentCategory, setSelectedParentCategory] = useState<CategoryTag | null>(null);

  // Filter events based on selected category
  // TODO: Add category field to events for proper filtering
  const filteredEvents = useMemo(() => {
    // For now, show all events regardless of category
    // Once events have category fields, implement proper filtering
    return ALL_MOCK_EVENTS;
  }, [selectedTag]);

  // Get visible categories based on selection
  const visibleCategories = useMemo(() => {
    if (selectedParentCategory) {
      // Show parent category + its subcategories
      return [selectedParentCategory, ...(selectedParentCategory.subcategories || [])];
    }
    // Show only main categories (no subcategories)
    return CATEGORY_TAGS;
  }, [selectedParentCategory]);

  const handleCategoryClick = (category: CategoryTag) => {
    if (category.id === 'All') {
      setSelectedTag('All');
      setSelectedParentCategory(null);
      return;
    }

    // Check if it's a parent category with subcategories
    if (category.subcategories && category.subcategories.length > 0) {
      setSelectedParentCategory(category);
      setSelectedTag(category.id);
    } else {
      // It's a subcategory, just update the filter
      setSelectedTag(category.id);
    }
  };

  const handleBackClick = () => {
    setSelectedTag('All');
    setSelectedParentCategory(null);
  };

  const isSelected = (categoryId: string): boolean => {
    return selectedTag === categoryId;
  };

  const isParentSelected = (categoryId: string): boolean => {
    return selectedParentCategory?.id === categoryId;
  };

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
                  const parentSelected = isParentSelected(category.id);
                  const shouldScale = selected || parentSelected;

                  return (
                    <button
                      key={category.id}
                      onClick={() => handleCategoryClick(category)}
                      className="flex-shrink-0 flex flex-col items-center gap-1.5 px-1"
                      style={{
                        transform: shouldScale ? 'scale(1.15)' : 'scale(1)',
                        transformOrigin: 'center',
                        transition: 'transform 0.3s ease',
                      }}
                    >
                      {/* Category Icon Container - 68px with relative positioning for badge */}
                      <div className="relative w-[68px] h-[68px] flex items-center justify-center">
                        {/* Icon - 56px */}
                        <img
                          src={category.icon}
                          alt={category.label}
                          className="w-14 h-14 object-contain"
                          onError={(e) => {
                            e.currentTarget.src =
                              'https://via.placeholder.com/56?text=' + category.label;
                          }}
                        />

                        {/* Checkmark Badge - Only show when selected */}
                        {selected && (
                          <div className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-[#FF785A] border-2 border-white flex items-center justify-center z-10">
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

                      {/* Category Label */}
                      <span
                        className={`text-xs transition-colors whitespace-nowrap ${
                          selected ? 'text-gray-900 font-bold' : 'text-gray-600 font-medium'
                        }`}
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

      {/* Events Grid Section - Full Width */}
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 pb-12">
        {filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                onClick={() => onEventClick(event.id)}
                className="bg-white rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-2 shadow-sm hover:shadow-xl"
              >
                {/* Event Image */}
                <div className="relative h-48 overflow-hidden bg-gray-100">
                  <img
                    src={event.image_url}
                    alt={event.title}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/400x300?text=No+Image';
                    }}
                  />
                </div>

                {/* Event Details */}
                <div className="p-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 leading-snug">
                    {event.title}
                  </h3>

                  {/* Location */}
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <MapPin size={16} className="flex-shrink-0" />
                    <span className="line-clamp-1">{event.city || 'TBA'}</span>
                  </div>

                  {/* Date */}
                  {event.event_date && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                      <Calendar size={16} className="flex-shrink-0" />
                      <span>
                        {new Date(event.event_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  )}

                  {/* Price */}
                  <div className="text-xl font-bold text-[#FF785A]">
                    ₹{event.ticket_price?.toLocaleString('en-IN') || 'TBA'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-2xl font-semibold text-gray-600 mb-2">No experiences found</p>
            <p className="text-base text-gray-500">
              Try selecting a different category or check back later
            </p>
          </div>
        )}
      </div>

      {/* Custom CSS for hiding scrollbar */}
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

export default ExperiencesPage;
