// src/pages/ExperienceDetailPage.tsx
import React, { useState, useMemo } from 'react';
import { ChevronLeft, MapPin, Share2, Users } from 'lucide-react';
import { useEvent } from '../hooks/useEvents';
import { useAuth } from '../hooks/useAuth';
import { SkeletonStyles } from '../components/SkeletonCard';
import AttendeesModal from '../components/AttendeesModal';

// Skeleton loader for detail page
const DetailPageSkeleton = () => (
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
          className="px-6 py-3 bg-[#FF785A] text-white font-semibold rounded-xl hover:bg-[#ff6a47] transition-colors"
        >
          Go Back
        </button>
      )}
    </div>
  </div>
);

export default function ExperienceDetailPage({
  eventId,
  onBack,
  onBookNow,
  onAuthClick,
}: {
  eventId: string;
  onBack?: () => void;
  onBookNow?: (eventId: string) => void;
  onChatOpen?: (eventId: string) => void;
  onAuthClick?: () => void;
}) {
  const { isAuthenticated } = useAuth();
  const { event: dbEvent, loading, error } = useEvent(eventId);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showAttendeesModal, setShowAttendeesModal] = useState(false);

  // Handle Book Now click
  const handleBookNow = () => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }
    onBookNow?.(eventId);
  };

  // Map database event to UI format
  const event = useMemo(() => {
    if (!dbEvent) return null;

    // Parse whats_included from database
    let includes: string[] = [];
    if (dbEvent.whats_included) {
      try {
        includes =
          typeof dbEvent.whats_included === 'string'
            ? JSON.parse(dbEvent.whats_included)
            : Array.isArray(dbEvent.whats_included)
              ? dbEvent.whats_included
              : [dbEvent.whats_included];
      } catch {
        includes = [dbEvent.whats_included];
      }
    }

    // Parse things_to_know from database
    let notes: string[] = [];
    if (dbEvent.things_to_know) {
      notes = Array.isArray(dbEvent.things_to_know) ? dbEvent.things_to_know : [];
    }

    return {
      id: dbEvent.id,
      title: dbEvent.title,
      city: dbEvent.location_name || 'Location TBA',
      venue: dbEvent.location_address || dbEvent.location_name || 'Venue TBA',
      event_date: dbEvent.start_date,
      end_date: dbEvent.end_date,
      ticket_price: dbEvent.price,
      description: dbEvent.description || dbEvent.short_description || 'No description available.',
      image_url: dbEvent.cover_image_url || 'https://via.placeholder.com/1200x500?text=Event+Image',
      banner_image_url:
        dbEvent.cover_image_url || 'https://via.placeholder.com/1200x500?text=Event+Image',
      images: dbEvent.images || [],
      tags: dbEvent.tags || [],
      includes,
      notes,
      contact: 'Contact via platform',
      member_count: dbEvent.current_bookings,
      genre: dbEvent.category,
      terms_and_conditions: dbEvent.terms_and_conditions,
      cancellation_policy: dbEvent.cancellation_policy,
    };
  }, [dbEvent]);

  // Show skeleton while loading
  if (loading) {
    return <DetailPageSkeleton />;
  }

  // Show error if fetch failed
  if (error || !event) {
    return (
      <ErrorDisplay
        message={error?.message || 'Event not found. It may have been removed or cancelled.'}
        onBack={onBack}
      />
    );
  }

  const formattedDate = new Date(event.event_date).toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const formattedStartTime = new Date(event.event_date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const formattedEndTime = new Date(event.end_date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const price = event.ticket_price ?? 0;
  const priceFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: event.title,
          text: `Check out this event: ${event.title}`,
          url: window.location.href,
        })
        .catch((err) => console.log('Error sharing:', err));
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <SkeletonStyles />
      {/* Hero Section with Banner Image and Overlay Text */}
      <div className="relative w-full h-[596px] -mt-24 bg-black">
        {/* Background Banner Image */}
        <img
          src={event.banner_image_url || event.image_url}
          alt={event.title}
          className="absolute inset-0 w-full h-full object-cover opacity-90"
          onError={(e) => {
            e.currentTarget.src = 'https://via.placeholder.com/1200x500?text=Event+Image';
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

        {/* Event Info Overlay (Bottom of Banner) */}
        <div className="absolute bottom-0 left-0 right-0 z-10 px-4 sm:px-6 lg:px-8 pb-8">
          <div className="max-w-6xl mx-auto">
            {/* Member Count */}
            {event.member_count && event.member_count > 0 && (
              <button
                onClick={() => setShowAttendeesModal(true)}
                className="flex items-center gap-2 mb-2 text-white/90 hover:text-white transition-colors"
              >
                <Users size={18} />
                <span className="text-sm">+{event.member_count} have joined</span>
              </button>
            )}

            {/* Genre Tag */}
            {event.genre && (
              <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-sm font-medium text-white mb-3">
                {event.genre}
              </div>
            )}

            {/* Tags */}
            {event.tags && event.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {event.tags.slice(0, 3).map((tag, index) => (
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
              {event.title}
            </h1>

            {/* Date & Time */}
            <div className="text-lg text-white/95 mb-2 drop-shadow">
              {formattedDate} | {formattedStartTime} - {formattedEndTime}
            </div>

            {/* Location */}
            {event.city && (
              <div className="flex items-center gap-2 text-lg text-white/95 drop-shadow">
                <MapPin size={20} />
                <span>{event.city}</span>
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
              {/* About this Event */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">About this Event</h2>
                <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {showFullDescription || event.description.length <= 300 ? (
                    event.description
                  ) : (
                    <>{event.description.substring(0, 300)}...</>
                  )}
                </div>
                {event.description.length > 300 && (
                  <button
                    onClick={() => setShowFullDescription(!showFullDescription)}
                    className="text-[#FF785A] font-semibold mt-3 hover:underline"
                  >
                    {showFullDescription ? 'Show less' : 'See more...'}
                  </button>
                )}
              </div>

              {/* Things to Know */}
              {event.notes && event.notes.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Things to Know</h2>
                  <ul className="space-y-3">
                    {event.notes.map((note, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="text-[#FF785A] text-xl mt-0.5">•</span>
                        <span className="text-gray-700">{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Hosted By Section */}
              <div className="bg-white rounded-2xl p-6 border-2 border-gray-900">
                {!isAuthenticated ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-[#FF785A] flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                      🔒
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Host Details</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Please log in to view host information and connect with them
                    </p>
                    <button
                      onClick={() => onAuthClick?.()}
                      className="px-6 py-2 bg-[#FF785A] text-white font-semibold rounded-xl hover:bg-[#ff6a47] transition-colors"
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
                    <p className="text-sm text-gray-600">Your trusted event host</p>
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
                <div className="mb-6">
                  <div className="text-sm text-gray-600 mb-1">Price</div>
                  <div className="text-3xl font-bold text-[#FF785A]">
                    {priceFormatter.format(price)}
                  </div>
                </div>

                <button
                  onClick={handleBookNow}
                  className="w-full px-6 py-4 bg-[#FF785A] text-white text-lg font-semibold rounded-xl hover:bg-[#ff6a47] transition-colors shadow-md"
                >
                  Book Now
                </button>

                {/* Contact */}
                {event.contact && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Contact</h3>
                    <p className="text-sm text-gray-600">{event.contact}</p>
                  </div>
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
                {event.terms_and_conditions ||
                  `• Participation in this experience is voluntary and at your own risk. You confirm that you are physically and mentally fit to take part.

• Please follow all instructions given by the host during the experience for your safety and enjoyment.

• The host and platform are not responsible for any injury, loss, damage, or accident that may occur during the experience.

• Personal belongings are the participant's responsibility at all times.

• Respectful behaviour towards the host and other participants is expected throughout the experience.

• The host reserves the right to remove any participant for misbehavior, unsafe conduct, or disruption, without refund.

• Please arrive on time. Late entry may not be allowed once the experience has started.

• No refund will be provided for late arrival or no-show.

• Cancellation and refund terms are defined by the host for each experience and are mentioned separately. Unless stated otherwise, bookings are non-refundable.

• Photography or recording during the experience is subject to host permission. Any content shared on social media should respect the privacy of the host and other participants.

• The experience may be rescheduled or cancelled by the host due to unforeseen circumstances. In such cases, a full refund or rescheduling option will be provided.

• By booking this experience, you agree to comply with all applicable local laws and regulations.`}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setShowTermsModal(false)}
                className="w-full py-3 bg-[#FF785A] hover:bg-[#ff6a47] text-white font-semibold rounded-xl transition-colors"
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
              {event.cancellation_policy ? (
                <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {event.cancellation_policy}
                </div>
              ) : (
                <div className="text-gray-700 space-y-4 leading-relaxed">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="font-semibold text-green-900 mb-2">
                      Cancellation 48+ hours before experience:
                    </p>
                    <p className="text-green-800">
                      100% refund of the total amount paid (excluding payment gateway charges).
                    </p>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="font-semibold text-red-900 mb-2">
                      Cancellation within 48 hours of experience:
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
                        • The host may cancel the experience due to unforeseen circumstances, in
                        which case a full refund will be provided.
                      </li>
                      <li>
                        • No-show on the experience date/time will be considered as a cancellation
                        with no refund.
                      </li>
                      <li>
                        • Late arrival may result in shortened experience duration with no refund
                        for missed time.
                      </li>
                      <li>
                        • In case of force majeure events (natural disasters, pandemics, government
                        restrictions), experiences may be rescheduled rather than cancelled.
                        Alternate dates will be offered.
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
                className="w-full py-3 bg-[#FF785A] hover:bg-[#ff6a47] text-white font-semibold rounded-xl transition-colors"
              >
                I Understand
              </button>
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
            <div className="w-20 h-20 rounded-full bg-[#FF785A] flex items-center justify-center text-white text-4xl mx-auto mb-4">
              🔒
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Login Required</h2>
            <p className="text-gray-600 mb-6">
              Please log in to book this experience and join the adventure!
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
                className="flex-1 px-6 py-3 bg-[#FF785A] text-white font-semibold rounded-xl hover:bg-[#ff6a47] transition-colors"
              >
                Log In
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attendees Modal */}
      {showAttendeesModal && (
        <AttendeesModal
          eventId={eventId}
          onClose={() => setShowAttendeesModal(false)}
          accentColor="#FF785A"
          onAuthClick={onAuthClick}
        />
      )}
    </div>
  );
}
