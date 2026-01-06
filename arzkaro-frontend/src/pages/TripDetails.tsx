// src/pages/TripDetailsPage.tsx
import React, { useEffect, useState } from 'react';
import {
  MapPin,
  Users,
  Calendar,
  Clock,
  DollarSign,
  MessageSquare,
  Star,
  X,
  ShieldCheck,
} from 'lucide-react';
import { DETAILED_MOCK_TRIPS, DetailedTrip } from '../data/mockTrips';

const ACCENT = '#FF785A';
const ACCENT_VARIABLE = '--accent';

// --- Helper Functions ---

// Helper function to calculate duration from the DetailedTrip data (e.g., "3 Days / 2 Nights")
const calculateTripDuration = (start: string, end: string) => {
  const startDate = new Date(start).getTime();
  const endDate = new Date(end).getTime();
  const diffTime = Math.abs(endDate - startDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? `${diffDays} Days / ${diffDays - 1} Nights` : '1 Day';
};

// Helper to format dates for display (Shortened to match event style: Fri, 21 Mar 2026)
const formatTripDatesShort = (start: string) => {
  const startDate = new Date(start);
  return startDate.toLocaleDateString('en-US', {
    weekday: 'short',
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

export default function TripDetailsPage({
  tripId,
  onBack,
  onChatOpen,
  currentUserId,
}: TripDetailsPageProps) {
  const [trip, setTrip] = useState<DetailedTrip | null>(null);
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(false);
  const [processing, setProcessing] = useState(false);

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

  const joinTrip = async (id: string) => {
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

  const openChat = (tripItem: DetailedTrip) => {
    if (onChatOpen) {
      onChatOpen(tripItem.id);
      return;
    }
    console.log(`Opening chat for trip ${tripItem.id}`);
  };

  if (loading || !trip) {
    return (
      <div className="min-h-screen bg-white pt-24 flex items-center justify-center">
        Loading trip details...
      </div>
    );
  }

  // --- Dynamic Data Mapping ---
  const tripDuration = calculateTripDuration(trip.start_date, trip.end_date);
  const durationShort = tripDuration.split('/')[0].trim();
  const mockRating = (Math.random() * (4.9 - 4.0) + 4.0).toFixed(1);
  const price = trip.estimated_cost;
  const priceFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });

  const bookingCtaText = joined
    ? 'You are Joined!'
    : processing
      ? 'Processing…'
      : `Book Experience ${priceFormatter.format(price)}`;

  const isFull = trip.member_count >= Number(trip.group_size);

  // --- Render Component ---
  return (
    <>
      <style>{`
        :root {
          ${ACCENT_VARIABLE}: ${ACCENT};
        }
        .header-bg {
            background-color: #1a1a1a;
            background-image: url(${trip.image_url}); 
            background-size: cover;
            background-position: center;
            position: relative;
        }
        .header-bg::before {
            content: '';
            position: absolute;
            top: 0;
            right: 0;
            bottom: 0;
            left: 0;
            background-color: rgba(0, 0, 0, 0.65); /* Dark overlay */
        }
      `}</style>

      <div className="min-h-screen bg-white">
        {/* TOP NAVIGATION BAR (Placeholder) */}
        <div className="hidden lg:block bg-black text-white h-16 w-full fixed top-0 z-10">
          {/* Nav content here */}
        </div>

        {/* 1. HEADER SECTION (Trip Info, Matching Event Style) */}
        <div className="header-bg pt-24 pb-8 md:pt-32 md:pb-12 text-white overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            {/* Changed text-5xl to text-6xl */}
            <h1 className="text-6xl font-extrabold mb-1">{trip.title}</h1>
            {/* Changed text-xl to text-2xl */}
            <p className="text-2xl font-medium mb-4">A Group Trip by **{trip.agency}**</p>

            {/* Key Trip Details Line */}
            <div className="flex items-center gap-4 text-gray-300">
              <span className="flex items-center gap-1">
                <Calendar size={18} />
                {formatTripDatesShort(trip.start_date)}
              </span>
              <span className="text-xl">·</span>
              <span className="flex items-center gap-1">
                <MapPin size={18} />
                {trip.destination}
              </span>
              <span className="text-xl">·</span>
              <span className="text-base border border-gray-500 rounded px-2 py-0.5">
                {trip.age_group}
              </span>
            </div>
          </div>
        </div>

        {/* 2. MAIN CONTENT AREA (Two Columns) */}
        <main className="max-w-7xl mx-auto px-6 py-10 grid lg:grid-cols-3 gap-10">
          {/* LEFT COLUMN: About & Itinerary (lg:col-span-2) */}
          <div className="lg:col-span-2 space-y-8">
            {/* ABOUT THE TRIP (Matching "About the Event") */}
            <div className="border-b pb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About the Trip</h2>
              <p className="text-lg text-gray-700 mb-4">
                {trip.notes ||
                  `This group trip from ${trip.departure_city} to ${trip.destination} is perfect for ${trip.age_group} travelers. Enjoy hassle-free travel and bonding with a new group of friends.`}
              </p>

              {/* Rating Badge (Matching Screenshot) */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-sm font-semibold">
                <Star size={16} className="text-yellow-500 fill-yellow-500" />
                Rating: **{mockRating}/5** ({trip.member_count} reviews)
              </div>
            </div>

            {/* DETAILED ITINERARY (Mapping to "Event Guide") */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Detailed Itinerary</h2>

              <div className="space-y-8">
                {trip.itinerary.map((day, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-[var(--accent)] text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-md">
                        {day.day}
                      </div>
                      {index < trip.itinerary.length - 1 && (
                        <div className="w-0.5 h-full bg-gray-200"></div>
                      )}
                    </div>
                    <div className="pt-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">{day.title}</h3>
                      <p className="text-gray-600 text-sm">{day.details}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Inclusions & Exclusions */}
              <div className="grid md:grid-cols-2 gap-8 pt-8 border-t">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <ShieldCheck size={20} className="text-green-500" /> What's Included
                  </h3>
                  <ul className="space-y-2 text-gray-700">
                    {trip.inclusions.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <svg
                          className="w-4 h-4 mt-1 text-green-500 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 13l4 4L19 7"
                          ></path>
                        </svg>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <X size={20} className="text-red-500" /> What's Excluded
                  </h3>
                  <ul className="space-y-2 text-gray-700">
                    {trip.exclusions.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <svg
                          className="w-4 h-4 mt-1 text-red-500 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M6 18L18 6M6 6l12 12"
                          ></path>
                        </svg>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Price & Action Block (lg:col-span-1) */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 bg-white p-6 border border-gray-200 rounded-xl shadow-md space-y-4">
              {/* Price Block (Matching Screenshot) */}
              <div className="flex items-baseline justify-start border-b pb-4">
                <span className="text-4xl font-extrabold text-gray-900">
                  {priceFormatter.format(price)}
                </span>
                <span className="text-sm font-medium text-gray-500 ml-2 pt-1">per person</span>
              </div>

              {/* Quick Details (Duration & Travelers Joined) */}
              <div className="grid grid-cols-2 gap-4 text-center pb-4 border-b">
                <div>
                  <p className="text-lg font-bold text-gray-900">{durationShort}</p>
                  <p className="text-sm text-gray-500">Duration</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">{trip.member_count}</p>
                  <p className="text-sm text-gray-500">Travelers Joined</p>
                </div>
              </div>

              {/* Action Buttons (Matching Screenshot) */}
              <div className="space-y-3">
                <button
                  onClick={() => joinTrip(trip.id)}
                  disabled={joined || isFull || processing}
                  className={`w-full py-3 rounded-xl text-lg font-bold transition shadow-lg ${joined ? 'bg-gray-700 text-white cursor-default' : isFull ? 'bg-red-500 text-white cursor-default' : 'bg-[var(--accent)] text-white hover:bg-[#E5664A]'}`}
                  aria-pressed={joined}
                >
                  {isFull ? 'Trip Full!' : bookingCtaText}
                </button>
                <button
                  onClick={() => openChat(trip)}
                  className="w-full py-3 rounded-xl border border-gray-300 text-lg font-semibold text-gray-800 flex items-center justify-center gap-2 hover:bg-gray-50 transition"
                >
                  <MessageSquare size={20} />
                  View Group Chat (Read-only)
                </button>
              </div>

              {/* Audience Info (Mocked from screenshot) */}
              <div className="pt-2 text-sm text-center text-gray-500">
                Ideal for **{trip.age_group}** Solo Travelers
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
