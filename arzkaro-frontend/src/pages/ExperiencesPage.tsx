// src/pages/ExperiencesPage.tsx
import React, { useEffect, useState } from 'react';
import { Search, MapPin, Calendar, X } from 'lucide-react';
import { MOCK_ARTISTS, ALL_MOCK_EVENTS, MockEventItem } from '../data/mockEvents';

const ACCENT_VARIABLE = '--accent';

// --- Type Definitions ---
type ExperiencesPageProps = {
  onEventSelect: (eventId: string) => void;
  onChatOpen?: (eventId: string) => void;
};

type SortByType = 'popularity' | 'price_low' | 'price_high' | 'date' | 'distance';
type VenueType = 'all' | 'club' | 'open' | 'theatre';
type DistanceType = 'near' | 'far' | 'any';
// ------------------------

const MOCK_EVENTS_LIST = ALL_MOCK_EVENTS;
const MOCK_ARTISTS_LIST = MOCK_ARTISTS;

// Helper to handle single string or array of strings for artist_name
const artistNameToArray = (name: string | string[]): string[] => {
  return Array.isArray(name) ? name : [name];
};

export default function ExperiencesPage({ onEventSelect, onChatOpen }: ExperiencesPageProps) {
  const [events, setEvents] = useState<MockEventItem[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<MockEventItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedArtist, setSelectedArtist] = useState('all');
  const [loading, setLoading] = useState(true);

  // filter modal states
  const [showFilters, setShowFilters] = useState(false);

  // detailed filter options
  const [sortBy, setSortBy] = useState<SortByType>('popularity');
  const [genre, setGenre] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 2000]);
  const [distance, setDistance] = useState<DistanceType>('any');
  const [venueType, setVenueType] = useState<VenueType>('all');
  const [onlyOnline, setOnlyOnline] = useState(false);

  useEffect(() => {
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    filterEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    searchQuery,
    selectedCity,
    selectedArtist,
    events,
    sortBy,
    genre,
    priceRange,
    distance,
    venueType,
    onlyOnline,
  ]);

  const loadEvents = async () => {
    const eventsWithDefaults = MOCK_EVENTS_LIST.map((e) => ({
      ...e,
      genre: (e as any).genre || 'pop',
    })) as MockEventItem[];

    setEvents(eventsWithDefaults);
    await loadCurrentUserAndTickets();
    setLoading(false);
  };

  const loadCurrentUserAndTickets = async () => {
    try {
      // keep empty so UI never shows "Purchased"
    } catch (err) {
      console.error('Error fetching user/tickets:', err);
    }
  };

  const filterEvents = () => {
    let filtered = [...events];

    // 1. Search Query
    if (searchQuery && searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((e) => {
        const artistNames = artistNameToArray(e.artist_name || '');
        const eventMatches =
          (e.title || '').toLowerCase().includes(q) ||
          (e.city || '').toLowerCase().includes(q) ||
          (e.description || '').toLowerCase().includes(q);

        const artistMatches = artistNames.some((name) => name.toLowerCase().includes(q));

        return eventMatches || artistMatches;
      });
    }

    // 2. Quick Filters
    if (selectedCity !== 'all') filtered = filtered.filter((e) => e.city === selectedCity);

    if (selectedArtist !== 'all') {
      filtered = filtered.filter((e) => {
        const artistNames = artistNameToArray(e.artist_name || '');
        return artistNames.includes(selectedArtist);
      });
    }

    // 3. Detailed Filters

    if (genre !== 'all') {
      filtered = filtered.filter((e) => {
        const eventGenre = ((e as any).genre || '').toLowerCase();
        return eventGenre.includes(genre.toLowerCase());
      });
    }

    if (venueType !== 'all')
      filtered = filtered.filter((e) => (e.venue || '').toLowerCase().includes(venueType));
    if (onlyOnline) filtered = filtered.filter((e) => !!(e as any).is_online);

    // 4. Price Range
    filtered = filtered.filter(
      (e) => (e.ticket_price || 0) >= priceRange[0] && (e.ticket_price || 0) <= priceRange[1]
    );

    // 5. Sorting
    if (sortBy === 'popularity') {
      filtered.sort((a, b) => (b.member_count || 0) - (a.member_count || 0));
    } else if (sortBy === 'price_low') {
      filtered.sort((a, b) => (a.ticket_price || 0) - (b.ticket_price || 0));
    } else if (sortBy === 'price_high') {
      filtered.sort((a, b) => (b.ticket_price || 0) - (a.ticket_price || 0));
    } else if (sortBy === 'date') {
      filtered.sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
    }

    // 6. Distance (Mocked)
    if (distance === 'near') {
      filtered = filtered.slice(0, 4);
    }

    setFilteredEvents(filtered);
  };

  const cities = Array.from(new Set(events.map((e) => e.city))).filter(Boolean);

  // **UPDATE 2: Use flatMap and Set to get all unique artists from all events**
  const allArtistNames = events.flatMap((e) => artistNameToArray(e.artist_name || ''));
  const uniqueArtistNames = Array.from(new Set(allArtistNames)).filter(Boolean);

  const artistList =
    uniqueArtistNames.length > 0
      ? uniqueArtistNames.map((name) => {
          const found = MOCK_ARTISTS_LIST.find((a) => a.name === name);
          return {
            name,
            image_url: found
              ? found.image_url
              : `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=111827&color=fff&size=256`,
          };
        })
      : MOCK_ARTISTS_LIST;

  const uniqueGenres = Array.from(new Set(events.map((e) => (e as any).genre))).filter(Boolean);

  if (loading) {
    return (
      <div className="min-h-screen bg-white pt-24 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading events...</div>
      </div>
    );
  }

  const visibleEvents = filteredEvents;

  const clearAllFilters = () => {
    setSelectedArtist('all');
    setSelectedCity('all');

    setSearchQuery('');
    setSortBy('popularity');
    setGenre('all');
    setPriceRange([0, 2000]);
    setDistance('any');
    setVenueType('all');
    setOnlyOnline(false);
    setShowFilters(false);
  };

  const applyFilters = () => {
    filterEvents();
    setShowFilters(false);
  };

  const openChat = (eventItem: MockEventItem) => {
    const eventId = eventItem.id;
    if (!eventId) return;

    if (onChatOpen) {
      onChatOpen(eventId);
      return;
    }

    try {
      window.history.replaceState({}, '', `#chat-${eventId}`);
      window.dispatchEvent(new CustomEvent('openChat', { detail: { eventId } }));
    } catch (err) {
      console.warn('Could not open chat via fallback:', err);
    }
  };

  // --- Filter Modal Sub-Components (Simplified for Pop-up) ---
  const SortBySection = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-bold mb-4 text-gray-900">Sort By</h3>
      {[
        { key: 'popularity', label: 'Popularity' },
        { key: 'price_low', label: 'Price : Low to High' },
        { key: 'price_high', label: 'Price : High to Low' },
        { key: 'date', label: 'Date' },
        { key: 'distance', label: 'Distance : Near to Far' },
      ].map(({ key, label }) => (
        <label key={key} className="flex items-center justify-between cursor-pointer group">
          <span className="text-gray-700 group-hover:text-gray-900">{label}</span>
          <input
            type="radio"
            name="sortBy"
            value={key}
            checked={sortBy === key}
            onChange={() => setSortBy(key as SortByType)}
            className="form-radio h-4 w-4 border-gray-300 transition-colors duration-200 focus:ring-[var(--accent)] text-[var(--accent)]"
          />
        </label>
      ))}
    </div>
  );

  const GenreSection = () => (
    <div className="space-y-4 mt-8 pt-4 border-t border-gray-100">
      <h3 className="text-xl font-bold mb-4 text-gray-900">Genre</h3>
      <label className="flex items-center justify-between cursor-pointer group">
        <span className="text-gray-700 group-hover:text-gray-900">All Genres</span>
        <input
          type="radio"
          name="genre"
          value="all"
          checked={genre === 'all'}
          onChange={() => setGenre('all')}
          className="form-radio h-4 w-4 border-gray-300 transition-colors duration-200 focus:ring-[var(--accent)] text-[var(--accent)]"
        />
      </label>
      {uniqueGenres.slice(0, 5).map((g) => (
        <label key={g} className="flex items-center justify-between cursor-pointer group">
          <span className="text-gray-700 group-hover:text-gray-900 capitalize">{g}</span>
          <input
            type="radio"
            name="genre"
            value={g}
            checked={genre === g}
            onChange={() => setGenre(g)}
            className="form-radio h-4 w-4 border-gray-300 transition-colors duration-200 focus:ring-[var(--accent)] text-[var(--accent)]"
          />
        </label>
      ))}
    </div>
  );
  // -------------------------------------------------------------

  return (
    <>
      <style>{`
        :root {
          ${ACCENT_VARIABLE}: #FF785A;
        }
        .bg-black-85 { background-color: rgba(0,0,0,0.85); }
        .scroll-offset { scroll-margin-top: 6rem; }
        .event-card-content {
          height: 250px;
        }
        .description-line-clamp {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        input[type="radio"] {
          color: var(--accent);
        }

        /*
         MOBILE-ONLY ADJUSTMENTS (<= 640px)
         - compact header
         - search and selects stacked with consistent spacing
         - buttons full width and well-sized
         - artists row hidden to reduce clutter
         Desktop is untouched.
        */
        @media (max-width: 640px) {
          /* Layout container tweaks so content feels edge-to-edge like takemytickets */
          .max-w-7xl { padding-left: 12px !important; padding-right: 12px !important; }

          /* Header */
          h1 { font-size: 32px; line-height: 1.05; }
          .text-sm { font-size: 13px; }

          /* Search */
          .max-w-3xl { max-width: 100% !important; }
          .relative input[type="text"] {
            padding-top: 12px;
            padding-bottom: 12px;
            font-size: 15px;
            border-radius: 12px;
          }
          .relative svg { left: 12px; }

          /* Quick filters stacked */
          .mb-6.flex { align-items: stretch; }
          .mb-6 .flex-wrap > * {
            flex-basis: 100% !important;
            width: 100% !important;
          }
          select {
            width: 100% !important;
            border-radius: 12px;
            padding: 12px;
            font-size: 14px;
          }

          /* Filter + Clear row */
          .flex.items-center.gap-3.w-full.md\\:w-auto {
            display: flex;
            gap: 10px;
            align-items: center;
            width: 100%;
            justify-content: space-between;
          }
          .flex.items-center.gap-3.w-full.md\\:w-auto button:first-child {
            flex: 1;
            margin-right: 8px;
          }
          .flex.items-center.gap-3.w-full.md\\:w-auto button:last-child {
            flex: 0 0 auto;
            width: 70px;
          }

          /* Sort buttons row smaller and full width */
          .ml-0.mt-3.md\\:ml-auto.md\\:mt-0 {
            display: flex;
            gap: 8px;
            width: 100%;
            justify-content: flex-start;
          }
          .ml-0.mt-3.md\\:ml-auto.md\\:mt-0 button {
            flex: 1;
            padding: 10px 12px;
            border-radius: 10px;
            font-size: 14px;
          }

          /* HIDE the Popular/Upcoming row on mobile */
          .sort-buttons-row { display: none !important; }

          /* Hide heavy artists row on narrow mobile to declutter */
          .artists-row-mobile-hide { display: none !important; }

          /* Event image taller and consistent */
          .event-image-mobile { height: 240px !important; }

          /* Card spacing: make cards taller, ensure CTA is visible */
          .event-card-content { min-height: 220px; height: auto; }

          /* Buttons: full width stacking inside card */
          .hidden.sm\\:flex.items-center.gap-3 { display: none !important; } /* hide desktop action layout on mobile */
          .card-actions-mobile {
            display: flex;
            flex-direction: column;
            gap: 10px;
            width: 100%;
          }
          .card-actions-mobile .primary-cta,
          .card-actions-mobile .secondary-cta,
          .primary-cta, .secondary-cta {
            width: 100%;
            display: block;
            text-align: center;
            padding: 12px 14px;
            border-radius: 10px;
            font-size: 15px;
            font-weight: 600;
          }
          .primary-cta { color: #fff; background: var(--accent); border: none; }
          .secondary-cta { background: #fff; border: 1px solid #e5e7eb; color: #111827; }

          /* Reduce margins below header */
          .pt-6 { padding-top: 12px !important; }
          .pb-12 { padding-bottom: 16px !important; }

          /* Make event cards have slight inner padding & full bleed look */
          .grid { grid-template-columns: 1fr !important; gap: 14px !important; }
          .rounded-2xl { border-radius: 12px !important; }
        }
      `}</style>

      <div className="min-h-screen bg-white pb-12 lg:pb-16">
        <div className="max-w-7xl mx-auto px-6 pt-6 pb-12">
          <div className="flex flex-col gap-4 mb-6">
            <div className="w-full flex items-end justify-between">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
                  Discover Experiences
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Find concerts, shows and more near you.
                </p>
              </div>
            </div>

            {/* Search bar */}
            <div className="w-full">
              <div className="max-w-3xl w-full">
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="text"
                    placeholder="Search events, artists, or cities..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent shadow-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quick selects (including Filter Button) */}
          <div className="mb-6 flex flex-wrap md:flex-row gap-3 items-start">
            <select
              value={selectedArtist}
              onChange={(e) => setSelectedArtist(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent flex-grow md:flex-grow-0"
            >
              <option value="all">All Artists</option>
              {artistList.map((artist) => (
                <option key={artist.name} value={artist.name}>
                  {artist.name}
                </option>
              ))}
            </select>

            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent flex-grow md:flex-grow-0"
            >
              <option value="all">All Cities</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <button
                onClick={() => setShowFilters(true)}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-colors bg-white flex-grow"
                aria-label="Filters"
              >
                <svg
                  style={{ width: 18, height: 18 }}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 3H2l7 9v7l6-3v-4l7-9z" />
                </svg>
                <span className="font-medium">Filters</span>
              </button>

              <button
                onClick={() => clearAllFilters()}
                className="px-3 py-2 text-sm border border-dashed border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 flex-shrink-0"
                aria-label="Clear filters"
              >
                Clear
              </button>
            </div>

            {/* sort-buttons-row: hidden on mobile via CSS */}
            <div className="sort-buttons-row ml-0 mt-3 md:ml-auto md:mt-0 flex items-center gap-3 w-full justify-between md:w-auto md:justify-start">
              <button
                onClick={() => {
                  setSortBy('popularity');
                }}
                className={`px-3 py-2 rounded-lg text-sm flex-grow ${sortBy === 'popularity' ? 'bg-[var(--accent)] text-white' : 'border'}`}
              >
                Popular
              </button>
              <button
                onClick={() => {
                  setSortBy('date');
                }}
                className={`px-3 py-2 rounded-lg text-sm flex-grow ${sortBy === 'date' ? 'bg-[var(--accent)] text-white' : 'border'}`}
              >
                Upcoming
              </button>
            </div>
          </div>

          {/* Artists row - hidden on small mobile */}
          <div className="mb-8 artists-row-mobile-hide">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Artists</h2>
            <div className="flex gap-6 overflow-x-auto pb-2 items-center">
              <button
                onClick={() => setSelectedArtist('all')}
                className={`flex flex-col items-center gap-2 flex-shrink-0 ${selectedArtist === 'all' ? 'opacity-100' : 'opacity-80'}`}
              >
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 font-medium border border-gray-100">
                  All
                </div>
              </button>

              {artistList.map((artist) => (
                <button
                  key={artist.name}
                  onClick={() => setSelectedArtist(artist.name)}
                  className={`flex flex-col items-center gap-2 flex-shrink-0 transition-transform ${selectedArtist === artist.name ? 'scale-105' : 'hover:scale-105'}`}
                >
                  <img
                    src={artist.image_url}
                    alt={artist.name}
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover shadow"
                  />
                  <span className="text-sm text-gray-700 font-medium text-center">
                    {artist.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          {visibleEvents.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-xl text-gray-600">No events found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {visibleEvents.map((event) => (
                <article
                  key={event.id}
                  onClick={() => onEventSelect(event.id)}
                  className="cursor-pointer bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition flex flex-col scroll-offset"
                  aria-labelledby={`event-${event.id}-title`}
                >
                  {/* Image Section */}
                  <div className="relative">
                    <img
                      src={event.image_url}
                      alt={event.title}
                      className={`w-full object-cover ${window.innerWidth <= 640 ? 'event-image-mobile' : 'h-48 sm:h-64'}`}
                    />

                    <div className="absolute left-3 bottom-3 bg-black-85 text-white px-3 py-1 rounded-md text-sm flex items-center gap-2">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden
                      >
                        <path d="M16 11c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm-8 0c1.657 0 3-1.343 3-3S9.657 5 8 5 5 6.343 5 8s1.343 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V20h14v-3.5C13 14.17 8.33 13 8 13zm8 0c-.29 0-1.78.14-2.72.52.86.9 2.1 1.48 3.72 1.48 2.33 0 7 1.17 7 3.5V20h-8.72C16.22 18.14 16 15 16 15z" />
                      </svg>
                      <span className="font-medium">
                        {(event.member_count ?? 0).toLocaleString()} members
                      </span>
                    </div>

                    <div className="absolute right-3 top-3 flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openChat(event);
                        }}
                        className="px-3 py-1 rounded-full text-sm font-medium shadow bg-white text-gray-800 border"
                        aria-label="Open group chat"
                      >
                        View Group
                      </button>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-4 flex flex-col justify-between event-card-content">
                    <div className="flex flex-col">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h3
                            id={`event-${event.id}-title`}
                            className="text-lg font-semibold text-gray-900 truncate"
                          >
                            {event.title}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {artistNameToArray(event.artist_name).join(', ')}
                          </p>
                        </div>

                        <div className="flex-shrink-0 ml-2">
                          <div className="inline-flex items-center px-3 py-1 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] font-semibold">
                            <span className="text-sm">₹{event.ticket_price}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-sm text-gray-500 mt-3">
                        <div className="flex items-center gap-2">
                          <MapPin size={14} />
                          <span>{event.city}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar size={14} />
                          <span>{new Date(event.event_date).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <p className="text-sm text-gray-500 mt-3 description-line-clamp">
                        {(event as any).description ||
                          'Don’t miss this event — book your seat now.'}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 flex items-center justify-between w-full">
                      <div className="w-full">
                        {/* Desktop two-button layout (hidden on mobile) */}
                        <div className="hidden sm:flex items-center gap-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEventSelect(event.id); // always open event page
                            }}
                            className="px-5 py-2 rounded-lg transition text-white text-sm"
                            style={{ backgroundColor: 'var(--accent)' }}
                          >
                            Book Now
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openChat(event);
                            }}
                            className="px-4 py-2 rounded-lg border text-sm"
                          >
                            Open Chat
                          </button>
                        </div>

                        {/* Mobile stacked CTAs */}
                        <div className="sm:hidden card-actions-mobile">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEventSelect(event.id);
                            }}
                            className="primary-cta"
                          >
                            View / Book
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openChat(event);
                            }}
                            className="secondary-cta"
                          >
                            Open Chat
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filters modal */}
      {showFilters && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => setShowFilters(false)}
          ></div>

          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm mx-auto overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Filter by</h2>
              <button
                type="button"
                className="rounded-md text-gray-400 hover:text-gray-900 transition-colors"
                onClick={() => setShowFilters(false)}
              >
                <span className="sr-only">Close filters</span>
                <X size={24} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto max-h-[80vh]">
              <SortBySection />
              <GenreSection />
            </div>

            <div className="flex justify-between items-center p-5 border-t border-gray-100">
              <button
                type="button"
                className="text-sm font-semibold text-gray-600 hover:text-gray-900 px-4 py-2"
                onClick={clearAllFilters}
              >
                Clear filters
              </button>
              <button
                type="button"
                className="px-6 py-3 rounded-lg text-white font-semibold transition-colors shadow-md"
                style={{ backgroundColor: 'var(--accent)' }}
                onClick={applyFilters}
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
