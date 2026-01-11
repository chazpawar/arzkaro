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
                <div className="flex items-start gap-4">
                  {/* Host Avatar */}
                  <div className="flex-shrink-0">
                    {dbEvent?.host?.avatar_url ? (
                      <img
                        src={dbEvent.host.avatar_url}
                        alt={dbEvent.host.full_name || 'Host'}
                        className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                        onError={(e) => {
                          // Fallback to initial if image fails to load
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      className="w-16 h-16 rounded-full bg-[#FF785A] flex items-center justify-center text-white text-2xl font-bold"
                      style={{ display: dbEvent?.host?.avatar_url ? 'none' : 'flex' }}
                    >
                      {dbEvent?.host?.full_name?.charAt(0).toUpperCase() || 'H'}
                    </div>
                  </div>

                  {/* Host Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-600 mb-1">Hosted by</p>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {dbEvent?.host?.full_name || 'Arzkaro'}
                    </h3>
                    
                    {/* Host Bio */}
                    {dbEvent?.host?.bio && (
                      <p className="text-sm text-gray-700 leading-relaxed mb-4">
                        {dbEvent.host.bio}
                      </p>
                    )}

                    {/* Social Links */}
                    {(dbEvent?.host?.instagram || dbEvent?.host?.youtube || dbEvent?.host?.linkedin || dbEvent?.host?.twitter) && (
                      <div className="flex flex-wrap gap-3 mt-4">
                        {dbEvent.host.instagram && (
                          <a
                            href={`https://instagram.com/${dbEvent.host.instagram.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-2 bg-pink-50 hover:bg-pink-100 text-pink-600 rounded-lg text-sm font-medium transition-colors"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                            </svg>
                            Instagram
                          </a>
                        )}
                        {dbEvent.host.youtube && (
                          <a
                            href={dbEvent.host.youtube}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                            </svg>
                            YouTube
                          </a>
                        )}
                        {dbEvent.host.linkedin && (
                          <a
                            href={dbEvent.host.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-sm font-medium transition-colors"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                            </svg>
                            LinkedIn
                          </a>
                        )}
                        {dbEvent.host.twitter && (
                          <a
                            href={`https://twitter.com/${dbEvent.host.twitter.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-2 bg-sky-50 hover:bg-sky-100 text-sky-600 rounded-lg text-sm font-medium transition-colors"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                            </svg>
                            Twitter
                          </a>
                        )}
                      </div>
                    )}
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
