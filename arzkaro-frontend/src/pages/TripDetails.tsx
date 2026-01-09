// src/pages/TripDetailsPage.tsx
import React, { useState, useMemo } from 'react';
import { ChevronLeft, MapPin, Share2, Users } from 'lucide-react';
import { useEvent } from '../hooks/useEvents';
import { useAuth } from '../contexts/AuthContext';
import { SkeletonStyles } from '../components/SkeletonCard';

// --- Helper Functions ---

// Helper function to calculate duration from the trip data (e.g., "3 Days")
const calculateTripDuration = (start: string, end: string) => {
  const startDate = new Date(start).getTime();
  const endDate = new Date(end).getTime();
  const diffTime = Math.abs(endDate - startDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? `${diffDays} days` : '1 day';
};

// Helper to format dates for display
const formatTripDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

// Skeleton loader for trip detail page
const TripDetailSkeleton = () => (
  <div className="min-h-screen bg-white">
    <SkeletonStyles />
    {/* Hero Section Skeleton */}
    <div className="relative w-full h-[596px] -mt-24 bg-gray-200 animate-pulse">
      <div className="absolute inset-0 shimmer" />

      {/* Header buttons */}
      <div className="absolute top-28 left-0 right-0 z-20">
        <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
          <div className="w-10 h-10 bg-gray-300 rounded-full" />
          <div className="w-10 h-10 bg-gray-300 rounded-full" />
        </div>
      </div>

      {/* Title skeleton */}
      <div className="absolute bottom-0 left-0 right-0 z-10 px-4 sm:px-6 lg:px-8 pb-8">
        <div className="max-w-6xl mx-auto space-y-3">
          <div className="h-12 bg-gray-300 rounded w-3/4" />
          <div className="h-6 bg-gray-300 rounded w-1/2" />
          <div className="h-6 bg-gray-300 rounded w-1/3" />
        </div>
      </div>
    </div>

    {/* Content skeleton */}
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3" />
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
            </div>
          </div>
          <div className="lg:col-span-1">
            <div className="h-48 bg-gray-200 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Error display component
const ErrorDisplay = ({ message, onBack }: { message: string; onBack?: () => void }) => (
  <div className="min-h-screen bg-white flex items-center justify-center px-4">
    <div className="text-center max-w-md">
      <div className="text-6xl mb-4">⚠️</div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops! Something went wrong</h2>
      <p className="text-gray-600 mb-6">{message}</p>
      {onBack && (
        <button
          onClick={onBack}
          className="px-6 py-3 bg-[#ABDF8B] text-gray-900 font-semibold rounded-xl hover:bg-[#9dd077] transition-colors"
        >
          Go Back
        </button>
      )}
    </div>
  </div>
);

// --- Component Props ---
type TripDetailsPageProps = {
  tripId: string;
  onBack: () => void;
  onChatOpen?: (tripId: string) => void;
  currentUserId?: string | null;
  onAuthClick?: () => void;
};

export default function TripDetailsPage({
  tripId,
  onBack,
  currentUserId,
  onAuthClick,
}: TripDetailsPageProps) {
  const { isAuthenticated } = useAuth();
  const { event: dbTrip, loading, error } = useEvent(tripId);
  const [joined, setJoined] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showAllItinerary, setShowAllItinerary] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Map database trip to UI format
  const trip = useMemo(() => {
    if (!dbTrip) return null;

    // Parse itinerary from database (stored as JSON string)
    let itinerary: { day: number; title: string; details: string }[] = [];
    if (dbTrip.itinerary) {
      try {
        itinerary =
          typeof dbTrip.itinerary === 'string' ? JSON.parse(dbTrip.itinerary) : dbTrip.itinerary;
      } catch (e) {
        console.error('Failed to parse itinerary:', e);
      }
    }

    // Parse inclusions from database (stored as JSON string)
    let inclusions: string[] = [];
    if (dbTrip.whats_included) {
      try {
        inclusions =
          typeof dbTrip.whats_included === 'string'
            ? JSON.parse(dbTrip.whats_included)
            : Array.isArray(dbTrip.whats_included)
              ? dbTrip.whats_included
              : [dbTrip.whats_included];
      } catch (e) {
        console.error('Failed to parse whats_included:', e);
        inclusions = [dbTrip.whats_included];
      }
    }

    // Parse exclusions from database (stored as JSON string)
    let exclusions: string[] = [];
    if (dbTrip.whats_not_included) {
      try {
        exclusions =
          typeof dbTrip.whats_not_included === 'string'
            ? JSON.parse(dbTrip.whats_not_included)
            : Array.isArray(dbTrip.whats_not_included)
              ? dbTrip.whats_not_included
              : [dbTrip.whats_not_included];
      } catch (e) {
        console.error('Failed to parse whats_not_included:', e);
        exclusions = [dbTrip.whats_not_included];
      }
    }

    const highlights: string[] = [];

    return {
      id: dbTrip.id,
      title: dbTrip.title,
      destination: dbTrip.location_name || 'Destination TBA',
      start_date: dbTrip.start_date,
      end_date: dbTrip.end_date,
      image_url: dbTrip.cover_image_url || 'https://via.placeholder.com/1200x500?text=Trip+Image',
      images: dbTrip.images || [],
      tags: dbTrip.tags || [],
      pickups: dbTrip.pickups || [],
      estimated_cost: dbTrip.price,
      member_count: dbTrip.current_bookings,
      is_private: false,
      notes: dbTrip.short_description || dbTrip.description || 'No description available.',
      // Extended fields
      ideal_for: dbTrip.category || 'All travelers',
      travel_mode: 'TBA',
      stay: 'TBA',
      meals_included: 'TBA',
      departure_city: dbTrip.departure_location || 'TBA',
      agency: 'ARZ',
      agent: 'ARZ Team',
      age_group: '18+',
      group_size: dbTrip.max_capacity ? `Up to ${dbTrip.max_capacity}` : 'TBA',
      itinerary,
      inclusions,
      exclusions,
      highlights,
      terms_and_conditions: dbTrip.terms_and_conditions,
      cancellation_policy: dbTrip.cancellation_policy,
    };
  }, [dbTrip]);

  const joinTrip = async () => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }
    if (!currentUserId) {
      setShowLoginPrompt(true);
      return;
    }
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 700)); // Simulate API delay
    setJoined(true);
    setProcessing(false);
    alert('Trip joined successfully! Welcome to the group.');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: trip?.title || 'Trip',
          text: `Check out this trip: ${trip?.title}`,
          url: window.location.href,
        })
        .catch((err) => console.log('Error sharing:', err));
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  // Show skeleton while loading
  if (loading) {
    return <TripDetailSkeleton />;
  }

  // Show error if fetch failed
  if (error || !trip) {
    return (
      <ErrorDisplay
        message={error?.message || 'Trip not found. It may have been removed or cancelled.'}
        onBack={onBack}
      />
    );
  }

  // --- Dynamic Data Mapping ---
  const tripDuration = calculateTripDuration(trip.start_date, trip.end_date);
  const price = trip.estimated_cost;
  const priceFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });

  const bookingCtaText = joined ? 'You are Joined!' : processing ? 'Processing…' : 'Book Now';

  const isFull = trip.member_count >= Number(trip.group_size.replace(/[^0-9]/g, ''));

  // --- Render Component ---
  return (
    <div className="min-h-screen bg-white">
      <SkeletonStyles />
      {/* Hero Section with Banner Image and Overlay Text */}
      <div className="relative w-full h-[596px] -mt-24 bg-black">
        {/* Background Banner Image */}
        <img
          src={trip.image_url}
          alt={trip.title}
          className="absolute inset-0 w-full h-full object-cover opacity-90"
          onError={(e) => {
            e.currentTarget.src = 'https://via.placeholder.com/1200x500?text=Trip+Image';
          }}
        />

        {/* Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        {/* Header Buttons (Over the image) */}
        <div className="absolute top-28 left-0 right-0 z-20">
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
            <button
              onClick={onBack}
              className="p-2 bg-white/20 backdrop-blur-md hover:bg-white/30 rounded-full transition-colors"
              aria-label="Go back"
            >
              <ChevronLeft size={24} className="text-white" />
            </button>
            <button
              onClick={handleShare}
              className="p-2 bg-white/20 backdrop-blur-md hover:bg-white/30 rounded-full transition-colors"
              aria-label="Share"
            >
              <Share2 size={22} className="text-white" />
            </button>
          </div>
        </div>

        {/* Trip Info Overlay (Bottom of Banner) */}
        <div className="absolute bottom-0 left-0 right-0 z-10 px-4 sm:px-6 lg:px-8 pb-8">
          <div className="max-w-6xl mx-auto">
            {/* Member Count */}
            {trip.member_count && trip.member_count > 0 && (
              <div className="flex items-center gap-2 mb-2 text-white/90">
                <Users size={18} />
                <span className="text-sm">+{trip.member_count} have joined</span>
              </div>
            )}

            {/* Age Group Tag */}
            {trip.age_group && (
              <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-sm font-medium text-white mb-3">
                {trip.age_group}
              </div>
            )}

            {/* Tags */}
            {trip.tags && trip.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {trip.tags.slice(0, 3).map((tag, index) => (
                  <div
                    key={index}
                    className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-medium text-white"
                  >
                    {tag}
                  </div>
                ))}
              </div>
            )}

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 drop-shadow-lg">
              {trip.title}
            </h1>

            {/* Date Range & Duration */}
            <div className="text-lg text-white/95 mb-2 drop-shadow">
              {formatTripDate(trip.start_date)} - {formatTripDate(trip.end_date)} ({tripDuration})
            </div>

            {/* Destination */}
            {trip.destination && (
              <div className="flex items-center gap-2 text-lg text-white/95 drop-shadow">
                <MapPin size={20} />
                <span>{trip.destination}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Section - Grid Layout */}
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content - Left Side (2/3) */}
            <div className="lg:col-span-2 space-y-8">
              {/* Departure & Pickups */}
              {(trip.departure_city || (trip.pickups && trip.pickups.length > 0)) && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Departure & Pickups</h2>
                  <div className="space-y-3">
                    {trip.departure_city && trip.departure_city !== 'TBA' && (
                      <div>
                        <span className="font-semibold text-gray-900">Departure Location: </span>
                        <span className="text-gray-700">{trip.departure_city}</span>
                      </div>
                    )}
                    {trip.pickups && trip.pickups.length > 0 && (
                      <div>
                        <span className="font-semibold text-gray-900">Pickup Points:</span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {trip.pickups.map((pickup, index) => (
                            <div
                              key={index}
                              className="px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-700"
                            >
                              {pickup}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* About this Trip */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">About this Trip</h2>
                <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {showFullDescription || trip.notes.length <= 300 ? (
                    trip.notes
                  ) : (
                    <>{trip.notes.substring(0, 300)}...</>
                  )}
                </div>
                {trip.notes.length > 300 && (
                  <button
                    onClick={() => setShowFullDescription(!showFullDescription)}
                    className="text-[#ABDF8B] font-semibold mt-3 hover:underline"
                  >
                    {showFullDescription ? 'Show less' : 'See more...'}
                  </button>
                )}
              </div>

              {/* What's Included */}
              {trip.inclusions && trip.inclusions.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">What's Included</h2>
                  <ul className="space-y-3">
                    {trip.inclusions.map((item, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="text-[#ABDF8B] text-xl mt-0.5">✓</span>
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* What's Not Included */}
              {trip.exclusions && trip.exclusions.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">What's Not Included</h2>
                  <ul className="space-y-3">
                    {trip.exclusions.map((item, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="text-red-500 text-xl mt-0.5">✗</span>
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Trip Gallery */}
              {trip.images && trip.images.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Trip Gallery</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {trip.images.slice(0, 6).map((imageUrl, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className="relative aspect-video rounded-xl overflow-hidden group cursor-pointer"
                      >
                        <img
                          src={imageUrl}
                          alt={`Gallery image ${index + 1}`}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          onError={(e) => {
                            e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Image';
                          }}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                      </button>
                    ))}
                  </div>
                  {trip.images.length > 6 && (
                    <p className="text-sm text-gray-600 mt-2">
                      +{trip.images.length - 6} more images
                    </p>
                  )}
                </div>
              )}

              {/* Itinerary */}
              {trip.itinerary && trip.itinerary.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Itinerary</h2>
                  <div className="space-y-4">
                    {(showAllItinerary ? trip.itinerary : trip.itinerary.slice(0, 3)).map(
                      (day, index) => (
                        <div
                          key={index}
                          className="bg-gray-50 rounded-xl p-5 border border-gray-200"
                        >
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-[#ABDF8B] rounded-full flex items-center justify-center text-gray-900 font-bold text-lg">
                              {day.day}
                            </div>
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                {day.title}
                              </h3>
                              <p className="text-gray-700 leading-relaxed">{day.details}</p>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                  {trip.itinerary.length > 3 && (
                    <button
                      onClick={() => setShowAllItinerary(!showAllItinerary)}
                      className="text-[#ABDF8B] font-semibold mt-4 hover:underline"
                    >
                      {showAllItinerary
                        ? 'Show less'
                        : `See ${trip.itinerary.length - 3} more days...`}
                    </button>
                  )}
                </div>
              )}

              {/* Things to Know */}
              {dbTrip?.things_to_know && dbTrip.things_to_know.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Things to Know</h2>
                  <ul className="space-y-3">
                    {dbTrip.things_to_know.map((item: string, index: number) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="text-[#ABDF8B] text-xl mt-0.5">•</span>
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Hosted By Section */}
              <div className="bg-white rounded-2xl p-6 border-2 border-gray-900">
                {!isAuthenticated ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-[#ABDF8B] flex items-center justify-center text-gray-900 text-2xl font-bold mx-auto mb-4">
                      🔒
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Host Details</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Please log in to view host information and connect with them
                    </p>
                    <button
                      onClick={() => onAuthClick?.()}
                      className="px-6 py-2 bg-[#ABDF8B] text-gray-900 font-semibold rounded-xl hover:bg-[#9ed47a] transition-colors"
                    >
                      Log In
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-2xl font-bold mx-auto mb-4">
                      H
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Hosted by ARZ</h3>
                    <p className="text-sm text-gray-600">Your trusted trip organizer</p>
                  </div>
                )}
              </div>

              {/* Terms & Conditions - Button Style */}
              <button
                onClick={() => setShowTermsModal(true)}
                className="w-full px-6 py-4 bg-white hover:bg-gray-50 border border-gray-300 rounded-xl text-base font-semibold text-gray-900 transition-colors text-center"
              >
                Terms & Conditions
              </button>

              {/* Cancellation Policy - Button Style */}
              <button
                onClick={() => setShowCancellationModal(true)}
                className="w-full px-6 py-4 bg-white hover:bg-gray-50 border border-gray-300 rounded-xl text-base font-semibold text-gray-900 transition-colors text-center"
              >
                Cancellation policy
              </button>
            </div>

            {/* Sidebar - Right Side (1/3) */}
            <div className="lg:col-span-1">
              {/* Booking Card */}
              <div className="sticky top-4 bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-lg">
                {/* Trip Details */}
                <div className="space-y-4 mb-6 text-sm text-gray-700">
                  <div className="flex justify-between">
                    <span className="font-medium">Ideal For:</span>
                    <span>{trip.ideal_for}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Travel Mode:</span>
                    <span className="text-right">{trip.travel_mode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Stay:</span>
                    <span className="text-right">{trip.stay}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Meals:</span>
                    <span className="text-right">{trip.meals_included}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Group Size:</span>
                    <span>{trip.group_size}</span>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6 mb-6">
                  <div className="text-sm text-gray-600 mb-1">Estimated Cost</div>
                  <div className="text-3xl font-bold text-[#ABDF8B]">
                    {priceFormatter.format(price)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">per person</div>
                </div>

                <button
                  onClick={joinTrip}
                  disabled={joined || processing || isFull}
                  className={`w-full px-6 py-4 text-lg font-semibold rounded-xl transition-colors shadow-md ${
                    joined
                      ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                      : isFull
                        ? 'bg-red-100 text-red-600 cursor-not-allowed'
                        : 'bg-[#ABDF8B] text-gray-900 hover:bg-[#9dd077]'
                  }`}
                >
                  {isFull ? 'Trip Full' : bookingCtaText}
                </button>

                {isFull && (
                  <p className="mt-3 text-sm text-center text-red-600">
                    This trip has reached maximum capacity
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Terms & Conditions Modal */}
      {showTermsModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setShowTermsModal(false)}
        >
          <div
            className="bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Terms & Conditions</h2>
              <button
                onClick={() => setShowTermsModal(false)}
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                aria-label="Close"
              >
                <svg
                  className="w-5 h-5 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto">
              <div className="text-gray-700 space-y-4 leading-relaxed whitespace-pre-wrap">
                {trip.terms_and_conditions ||
                  `• Participation in this trip is voluntary and at your own risk. You confirm that you are physically and mentally fit to take part.

• Please follow all instructions given by the trip organizer and guide for your safety and enjoyment.

• The organizer and platform are not responsible for any injury, loss, damage, or accident that may occur during the trip.

• Personal belongings are the participant's responsibility at all times.

• Respectful behaviour towards the organizer, guide, and other participants is expected throughout the trip.

• The organizer reserves the right to remove any participant for misbehavior, unsafe conduct, or disruption, without refund.

• Please arrive on time at the departure location. The trip will not be delayed for late arrivals.

• No refund will be provided for late arrival or no-show.

• Cancellation and refund terms are defined for each trip and are mentioned separately. Unless stated otherwise, bookings are non-refundable.

• Photography or recording during the trip is subject to organizer permission. Any content shared on social media should respect the privacy of the organizer and other participants.

• The trip may be rescheduled or cancelled by the organizer due to unforeseen circumstances. In such cases, a full refund or rescheduling option will be provided.

• By booking this trip, you agree to comply with all applicable local laws and regulations.`}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setShowTermsModal(false)}
                className="w-full py-3 bg-[#ABDF8B] hover:bg-[#9dd077] text-gray-900 font-semibold rounded-xl transition-colors"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Policy Modal */}
      {showCancellationModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setShowCancellationModal(false)}
        >
          <div
            className="bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Cancellation Policy</h2>
              <button
                onClick={() => setShowCancellationModal(false)}
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                aria-label="Close"
              >
                <svg
                  className="w-5 h-5 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto">
              {trip.cancellation_policy ? (
                <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {trip.cancellation_policy}
                </div>
              ) : (
                <div className="text-gray-700 space-y-4 leading-relaxed">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="font-semibold text-green-900 mb-2">
                      Cancellation 7+ days before trip departure:
                    </p>
                    <p className="text-green-800">
                      70% refund of the total amount paid (excluding payment gateway charges).
                    </p>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="font-semibold text-yellow-900 mb-2">
                      Cancellation 3-7 days before trip departure:
                    </p>
                    <p className="text-yellow-800">50% refund of the total amount paid.</p>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="font-semibold text-red-900 mb-2">
                      Cancellation within 3 days of trip departure:
                    </p>
                    <p className="text-red-800">No refund will be provided.</p>
                  </div>

                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <p className="font-semibold text-gray-900 mb-2">Additional Information:</p>
                    <ul className="space-y-2 text-gray-700">
                      <li>
                        • All refunds will be processed within 7–10 business days to the original
                        payment method.
                      </li>
                      <li>
                        • Platform fees and convenience charges are non-refundable under any
                        circumstances.
                      </li>
                      <li>
                        • The organizer may cancel the trip due to unforeseen circumstances, in
                        which case a full refund will be provided.
                      </li>
                      <li>
                        • No-show on the trip departure date/time will be considered as a
                        cancellation with no refund.
                      </li>
                      <li>
                        • In case of force majeure events (natural disasters, pandemics, government
                        restrictions), trips may be rescheduled rather than cancelled. Alternate
                        dates will be offered.
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setShowCancellationModal(false)}
                className="w-full py-3 bg-[#ABDF8B] hover:bg-[#9dd077] text-gray-900 font-semibold rounded-xl transition-colors"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Gallery Modal */}
      {selectedImageIndex !== null && trip.images && trip.images.length > 0 && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImageIndex(null)}
        >
          <div className="relative max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
            {/* Close Button */}
            <button
              onClick={() => setSelectedImageIndex(null)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 flex items-center justify-center transition-colors z-10"
              aria-label="Close"
            >
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Navigation Buttons */}
            {selectedImageIndex > 0 && (
              <button
                onClick={() => setSelectedImageIndex(selectedImageIndex - 1)}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 flex items-center justify-center transition-colors"
                aria-label="Previous image"
              >
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
            )}
            {selectedImageIndex < trip.images.length - 1 && (
              <button
                onClick={() => setSelectedImageIndex(selectedImageIndex + 1)}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 flex items-center justify-center transition-colors"
                aria-label="Next image"
              >
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            )}

            {/* Image */}
            <img
              src={trip.images[selectedImageIndex]}
              alt={`Gallery image ${selectedImageIndex + 1}`}
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
              onError={(e) => {
                e.currentTarget.src = 'https://via.placeholder.com/800x600?text=Image';
              }}
            />

            {/* Image Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-white text-sm">
              {selectedImageIndex + 1} / {trip.images.length}
            </div>
          </div>
        </div>
      )}

      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowLoginPrompt(false)}
        >
          <div
            className="bg-white w-full max-w-md rounded-2xl p-8 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-20 h-20 rounded-full bg-[#ABDF8B] flex items-center justify-center text-gray-900 text-4xl mx-auto mb-4">
              🔒
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Login Required</h2>
            <p className="text-gray-600 mb-6">
              Please log in to book this trip and join the adventure!
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLoginPrompt(false)}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => onAuthClick?.()}
                className="flex-1 px-6 py-3 bg-[#ABDF8B] text-gray-900 font-semibold rounded-xl hover:bg-[#9ed47a] transition-colors"
              >
                Log In
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
