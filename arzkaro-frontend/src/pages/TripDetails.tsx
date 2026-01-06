// src/pages/TripDetailsPage.tsx
import React, { useEffect, useState } from 'react';
import { ChevronLeft, MapPin, Share2, Users } from 'lucide-react';
import { DETAILED_MOCK_TRIPS, DetailedTrip } from '../data/mockTrips';

// --- Helper Functions ---

// Helper function to calculate duration from the DetailedTrip data (e.g., "3 Days")
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

// --- Component Props ---
type TripDetailsPageProps = {
  tripId: string;
  onBack: () => void;
  onChatOpen?: (tripId: string) => void;
  currentUserId?: string | null;
};

export default function TripDetailsPage({ tripId, onBack, currentUserId }: TripDetailsPageProps) {
  const [trip, setTrip] = useState<DetailedTrip | null>(null);
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showAllItinerary, setShowAllItinerary] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showCancellationModal, setShowCancellationModal] = useState(false);

  useEffect(() => {
    // Check if tripId exists in the mock data
    const foundTrip = DETAILED_MOCK_TRIPS.find((t) => t.id === tripId);

    // Simple mock check for joined status
    setJoined(currentUserId === 'user-123' && ['trip-udaipur', 'trip-kasol'].includes(tripId));

    if (foundTrip) {
      setTrip(foundTrip);
    }
    setLoading(false);
  }, [tripId, currentUserId]);

  const joinTrip = async () => {
    if (!currentUserId) {
      alert('Please sign in to join this trip.');
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

  if (loading || !trip) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading trip details...</div>
      </div>
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

  const isFull = trip.member_count >= Number(trip.group_size);

  // --- Render Component ---
  return (
    <div className="min-h-screen bg-white">
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
              {/* Departure Location */}
              {trip.departure_city && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Departure Location</h2>
                  <div className="mb-3">
                    <span className="text-gray-700">{trip.departure_city}</span>
                  </div>
                </div>
              )}

              {/* About this Trip */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">About this Trip</h2>
                <div className="text-gray-700 leading-relaxed">
                  {showFullDescription || !trip.notes || trip.notes.length <= 300 ? (
                    trip.notes || `Explore ${trip.destination} on this amazing group trip!`
                  ) : (
                    <>{trip.notes.substring(0, 300)}...</>
                  )}
                </div>
                {trip.notes && trip.notes.length > 300 && (
                  <button
                    onClick={() => setShowFullDescription(!showFullDescription)}
                    className="text-[#ABDF8B] font-semibold mt-3 hover:underline"
                  >
                    {showFullDescription ? 'Show less' : 'See more...'}
                  </button>
                )}
              </div>

              {/* What's Included & Not Included */}
              <div className="grid md:grid-cols-2 gap-8">
                {/* Inclusions */}
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

                {/* Exclusions */}
                {trip.exclusions && trip.exclusions.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">What's NOT Included</h2>
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
              </div>

              {/* Itinerary */}
              {trip.itinerary && trip.itinerary.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Itinerary</h2>
                  <div className="space-y-6">
                    {(showAllItinerary ? trip.itinerary : trip.itinerary.slice(0, 3)).map(
                      (day, index) => (
                        <div key={index} className="border-l-4 border-[#ABDF8B] pl-4">
                          <h3 className="text-lg font-bold text-gray-900 mb-1">
                            Day {day.day}: {day.title}
                          </h3>
                          <p className="text-gray-600">{day.details}</p>
                        </div>
                      )
                    )}
                  </div>
                  {trip.itinerary.length > 3 && (
                    <button
                      onClick={() => setShowAllItinerary(!showAllItinerary)}
                      className="text-[#ABDF8B] font-semibold mt-4 hover:underline"
                    >
                      {showAllItinerary ? 'Show less' : 'See more...'}
                    </button>
                  )}
                </div>
              )}

              {/* Hosted By Section */}
              <div className="bg-white rounded-2xl p-6 border-2 border-gray-900">
                <div className="flex gap-4">
                  {/* Host Avatar */}
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-full bg-[#ABDF8B] flex items-center justify-center text-white text-2xl font-bold">
                      A
                    </div>
                  </div>

                  {/* Host Info */}
                  <div className="flex-1">
                    <div className="text-sm text-gray-600 mb-1">Hosted by</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">ARZ</h3>
                    <p className="text-sm text-gray-700 mb-4">
                      Creating unforgettable travel experiences and bringing travelers together.
                    </p>

                    {/* Social Links */}
                    <div className="flex gap-3">
                      <a
                        href="https://instagram.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-7 h-7 rounded-full bg-white border border-gray-300 flex items-center justify-center hover:border-[#E4405F] transition-colors shadow-sm"
                      >
                        <svg className="w-4 h-4" fill="#E4405F" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                        </svg>
                      </a>
                      <a
                        href="https://youtube.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-7 h-7 rounded-full bg-white border border-gray-300 flex items-center justify-center hover:border-[#FF0000] transition-colors shadow-sm"
                      >
                        <svg className="w-4 h-4" fill="#FF0000" viewBox="0 0 24 24">
                          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                        </svg>
                      </a>
                      <a
                        href="https://linkedin.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-7 h-7 rounded-full bg-white border border-gray-300 flex items-center justify-center hover:border-[#0077B5] transition-colors shadow-sm"
                      >
                        <svg className="w-4 h-4" fill="#0077B5" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                      </a>
                      <a
                        href="https://twitter.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-7 h-7 rounded-full bg-white border border-gray-300 flex items-center justify-center hover:border-[#1DA1F2] transition-colors shadow-sm"
                      >
                        <svg className="w-4 h-4" fill="#1DA1F2" viewBox="0 0 24 24">
                          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
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

            {/* Right Column - Booking Card (1/3) */}
            <div className="lg:col-span-1">
              <div className="sticky top-28 bg-white p-6 border border-gray-200 rounded-2xl shadow-lg">
                <div className="mb-6">
                  <div className="flex items-baseline mb-2">
                    <span className="text-4xl font-bold text-gray-900">
                      {priceFormatter.format(price)}
                    </span>
                    <span className="text-sm text-gray-500 ml-2">/ person</span>
                  </div>
                </div>

                <button
                  onClick={() => joinTrip()}
                  disabled={joined || isFull || processing}
                  className={`w-full py-4 rounded-xl text-lg font-bold transition-all shadow-md ${
                    joined
                      ? 'bg-gray-600 text-white cursor-not-allowed'
                      : isFull
                        ? 'bg-red-500 text-white cursor-not-allowed'
                        : 'bg-[#ABDF8B] text-gray-900 hover:bg-[#9ACC7A]'
                  }`}
                >
                  {isFull ? 'Trip Full!' : bookingCtaText}
                </button>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm mb-3">
                    <span className="text-gray-600">Duration</span>
                    <span className="font-semibold text-gray-900">{tripDuration}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Group Size</span>
                    <span className="font-semibold text-gray-900">
                      {trip.member_count}/{trip.group_size}
                    </span>
                  </div>
                </div>
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
              <div className="text-gray-700 space-y-4 leading-relaxed">
                <p>• Participants must be within the specified age group ({trip.age_group}).</p>
                <p>• Full payment is required at the time of booking to confirm your spot.</p>
                <p>
                  • Valid government-issued ID is required for all participants during the trip.
                </p>
                <p>
                  • Participants are expected to follow all safety guidelines and instructions
                  provided by the trip organizer and guide.
                </p>
                <p>
                  • The organizer reserves the right to modify the itinerary due to unforeseen
                  circumstances such as weather conditions, road closures, or other factors beyond
                  control.
                </p>
                <p>
                  • Participants must ensure they are physically and mentally fit to undertake the
                  activities included in the trip.
                </p>
                <p>
                  • Any damage to property or accommodation caused by participants will be their
                  financial responsibility.
                </p>
                <p>
                  • The organizer and platform are not responsible for loss, theft, or damage to
                  personal belongings during the trip.
                </p>
                <p>
                  • Respectful behavior towards fellow travelers, guides, and local communities is
                  expected at all times.
                </p>
                <p>
                  • The organizer reserves the right to remove any participant for misconduct,
                  inappropriate behavior, or violation of rules without refund.
                </p>
                <p>• Consumption of alcohol or other substances must comply with local laws.</p>
                <p>
                  • Participants are advised to have adequate travel insurance covering medical
                  emergencies, accidents, and trip cancellations.
                </p>
                <p>
                  • By booking this trip, you acknowledge that adventure activities involve inherent
                  risks, and you participate at your own risk.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setShowTermsModal(false)}
                className="w-full py-3 bg-[#ABDF8B] hover:bg-[#9ACC7A] text-gray-900 font-semibold rounded-xl transition-colors"
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
              <div className="text-gray-700 space-y-4 leading-relaxed">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="font-semibold text-green-900 mb-2">
                    Cancellation 15+ days before trip start date:
                  </p>
                  <p className="text-green-800">
                    100% refund of the total amount paid (excluding payment gateway charges).
                  </p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="font-semibold text-yellow-900 mb-2">
                    Cancellation 7-14 days before trip start date:
                  </p>
                  <p className="text-yellow-800">50% refund of the total amount paid.</p>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="font-semibold text-red-900 mb-2">
                    Cancellation less than 7 days before trip start date:
                  </p>
                  <p className="text-red-800">No refund will be provided.</p>
                </div>

                <div className="border-t border-gray-200 pt-4 mt-4">
                  <p className="font-semibold text-gray-900 mb-2">Additional Information:</p>
                  <ul className="space-y-2 text-gray-700">
                    <li>
                      • All refunds will be processed within 7-10 business days from the date of
                      cancellation.
                    </li>
                    <li>
                      • In case of trip cancellation by the organizer due to insufficient bookings
                      or unforeseen circumstances, a full refund will be provided.
                    </li>
                    <li>
                      • Participants can transfer their booking to another person up to 7 days
                      before the trip starts (subject to approval).
                    </li>
                    <li>
                      • No-show on the trip date will be considered as a cancellation with no
                      refund.
                    </li>
                    <li>
                      • Force majeure events (natural disasters, pandemics, government restrictions)
                      may result in trip postponement rather than cancellation. Alternate dates will
                      be offered.
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setShowCancellationModal(false)}
                className="w-full py-3 bg-[#ABDF8B] hover:bg-[#9ACC7A] text-gray-900 font-semibold rounded-xl transition-colors"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
