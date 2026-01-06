import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext.tsx';

// Import all components / pages
import Navbar from './components/Navbar.tsx';
import Auth from './components/Auth.tsx';
import HomePage from './pages/HomePage.tsx';
import ForYou from './pages/ForYou.tsx';
import ExperiencesPage from './pages/ExperiencesPage.tsx';
import ExperienceDetailPage, { Event } from './pages/ExperienceDetailPage.tsx';
import MyTicketsPage from './pages/MyTicketsPage.tsx';
import TripsPage from './pages/Trips.tsx';
import TripDetailsPage from './pages/TripDetails.tsx';
import Footer from './components/Footer.tsx';
import TermsPage from './pages/Terms.tsx';
import Thankyou from './pages/Thankyou.tsx';

// Mock Data Imports
import { ALL_MOCK_EVENTS } from './data/mockEvents.ts';
import { ALL_MOCK_TRIPS, DetailedTrip } from './data/mockTrips.ts';

// Convert the array of events into a map for fast lookup
const EVENT_DETAIL_MAP: { [key: string]: Event } = ALL_MOCK_EVENTS.reduce(
  (acc, event) => {
    acc[event.id] = event as Event;
    return acc;
  },
  {} as { [key: string]: Event }
);

function getEventDataById(id: string | null): Event | null {
  if (!id) return null;
  return EVENT_DETAIL_MAP[id] || null;
}

// Convert the array of DetailedTrips into a map for fast lookup
const TRIP_DETAIL_MAP: { [key: string]: DetailedTrip } = ALL_MOCK_TRIPS.reduce(
  (acc, trip) => {
    acc[trip.id] = trip as DetailedTrip;
    return acc;
  },
  {} as { [key: string]: DetailedTrip }
);

function getTripDataById(id: string | null): DetailedTrip | null {
  if (!id) return null;
  return TRIP_DETAIL_MAP[id] || null;
}

// Mocking the user object structure that would come from AuthContext
interface MockUser {
  uid: string;
  email: string;
}

type PageName =
  | 'home'
  | 'for-you'
  | 'experiences'
  | 'experience-detail'
  | 'trips'
  | 'trip-detail'
  | 'my-tickets'
  | 'terms'
  | 'thankyou';

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function parsePathname(pathname: string) {
  // Normalize pathname (no trailing slash except root)
  const clean = pathname.replace(/\/+$/, '') || '/';
  // Patterns:
  if (clean === '/' || clean === '') return { page: 'home' as PageName };
  if (clean === '/for-you') return { page: 'for-you' as PageName };
  if (clean === '/experiences') return { page: 'experiences' as PageName };
  if (clean === '/trips') return { page: 'trips' as PageName };
  if (clean === '/thankyou') return { page: 'thankyou' as PageName };
  if (clean === '/terms') return { page: 'terms' as PageName };
  if (clean === '/my-tickets') return { page: 'my-tickets' as PageName };

  // dynamic routes
  const experienceMatch = clean.match(/^\/experience\/([^/]+)$/);
  if (experienceMatch) return { page: 'experience-detail' as PageName, id: experienceMatch[1] };

  const tripMatch = clean.match(/^\/trip\/([^/]+)$/);
  if (tripMatch) return { page: 'trip-detail' as PageName, id: tripMatch[1] };

  // fallback
  return { page: 'home' as PageName };
}

function pathFor(page: PageName, id?: string | null) {
  switch (page) {
    case 'home':
      return '/';
    case 'for-you':
      return '/for-you';
    case 'experiences':
      return '/experiences';
    case 'trips':
      return '/trips';
    case 'thankyou':
      return '/thankyou';
    case 'terms':
      return '/terms';
    case 'my-tickets':
      return '/my-tickets';
    case 'experience-detail':
      return id ? `/experience/${id}` : '/experiences';
    case 'trip-detail':
      return id ? `/trip/${id}` : '/trips';
    default:
      return '/';
  }
}

function AppContent() {
  const authContext = useAuth();
  const mockUser: MockUser | null = authContext.user
    ? { uid: 'user-123', email: 'user@example.com' }
    : null;

  const user = mockUser;
  const loading = authContext.loading;

  // default page
  const [currentPage, setCurrentPage] = useState<PageName>('home');

  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<DetailedTrip | null>(null);
  const [showAuth, setShowAuth] = useState<boolean>(false);

  // Navigation helper that syncs history
  const handleNavigate = useCallback((page: PageName, id?: string | null, replace = false) => {
    // update app state
    setSelectedEvent(null);
    setSelectedTrip(null);

    // if navigating to a detail page, restore the selected item so back/forward states can check it
    if (page === 'experience-detail' && id) {
      const ev = getEventDataById(id);
      setSelectedEvent(ev);
      if (!ev) page = 'experiences'; // fallback
    } else if (page === 'trip-detail' && id) {
      const tr = getTripDataById(id);
      setSelectedTrip(tr);
      if (!tr) page = 'trips';
    }

    setCurrentPage(page);

    // update URL
    const newPath = pathFor(page, id);
    try {
      if (replace) window.history.replaceState({}, '', newPath);
      else window.history.pushState({}, '', newPath);
    } catch {
      // some environments (file://) can throw; ignore
    }
  }, []);

  // When the app mounts, read the URL and set the app state (supports deep linking)
  useEffect(() => {
    const { page, id } = parsePathname(window.location.pathname);
    // hydrate state based on parsed path
    if (page === 'experience-detail' && id) {
      const ev = getEventDataById(id);
      if (ev) {
        setSelectedEvent(ev);
        setCurrentPage('experience-detail');
      } else {
        setCurrentPage('experiences');
        // ensure URL matches
        window.history.replaceState({}, '', '/experiences');
      }
    } else if (page === 'trip-detail' && id) {
      const tr = getTripDataById(id);
      if (tr) {
        setSelectedTrip(tr);
        setCurrentPage('trip-detail');
      } else {
        setCurrentPage('trips');
        window.history.replaceState({}, '', '/trips');
      }
    } else {
      setCurrentPage(page);
      // normalize URL without creating history entry
      window.history.replaceState({}, '', pathFor(page, (id as string) || null));
    }
  }, []);

  // popstate handler: when user clicks back/forward in browser
  useEffect(() => {
    const onPopState = () => {
      const { page, id } = parsePathname(window.location.pathname);
      if (page === 'experience-detail' && id) {
        const ev = getEventDataById(id);
        if (ev) {
          setSelectedEvent(ev);
          setSelectedTrip(null);
          setCurrentPage('experience-detail');
          return;
        }
        setCurrentPage('experiences');
        return;
      }

      if (page === 'trip-detail' && id) {
        const tr = getTripDataById(id);
        if (tr) {
          setSelectedTrip(tr);
          setSelectedEvent(null);
          setCurrentPage('trip-detail');
          return;
        }
        setCurrentPage('trips');
        return;
      }

      // simple pages
      setSelectedEvent(null);
      setSelectedTrip(null);
      setCurrentPage(page);
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // ✅ Scroll to top whenever the user navigates (keeps UX consistent)
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, [currentPage]);

  const handleEventSelect = (eventId: string) => {
    const eventData = getEventDataById(eventId);
    if (eventData) {
      // push state with event id
      handleNavigate('experience-detail', eventId);
    } else {
      console.error(`Event with ID ${eventId} not found!`);
      handleNavigate('experiences');
    }
  };

  const handleTripSelect = (tripId: string) => {
    const tripData = getTripDataById(tripId);
    if (tripData) {
      handleNavigate('trip-detail', tripId);
    } else {
      console.error(`Trip with ID ${tripId} not found!`);
      handleNavigate('trips');
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
    <div className="flex flex-col min-h-screen">
      <Navbar
        onAuthClick={() => setShowAuth(true)}
        currentPage={currentPage}
        onNavigate={(p: string) => {
          // keep API compatible for components that pass a string route name
          // Map simple strings to PageName where possible
          const mapping: { [k: string]: PageName } = {
            home: 'home',
            'for-you': 'for-you',
            experiences: 'experiences',
            trips: 'trips',
            'my-tickets': 'my-tickets',
            terms: 'terms',
            thankyou: 'thankyou',
          };
          const page = mapping[p] || 'home';
          handleNavigate(page);
        }}
      />

      {/* Spacer for fixed navbar */}
      <div className="h-24" />

      <main className="flex-grow">
        {currentPage === 'home' && <HomePage onNavigate={() => handleNavigate('home')} />}

        {currentPage === 'for-you' && (
          <ForYou onEventSelect={handleEventSelect} onTripSelect={handleTripSelect} />
        )}

        {currentPage === 'experiences' && <ExperiencesPage onEventClick={handleEventSelect} />}

        {currentPage === 'trips' && (
          <TripsPage
            onTripSelect={handleTripSelect}
            onChatOpen={() => {}}
            currentUserId={user?.uid || null}
          />
        )}

        {currentPage === 'trip-detail' && selectedTrip && (
          <TripDetailsPage
            tripId={selectedTrip.id}
            onBack={() => handleNavigate('trips')}
            onChatOpen={() => {}}
            currentUserId={user?.uid || null}
          />
        )}

        {currentPage === 'experience-detail' && selectedEvent && (
          <ExperienceDetailPage
            event={selectedEvent}
            onBack={() => handleNavigate('experiences')}
            onChatOpen={() => {}}
          />
        )}

        {currentPage === 'my-tickets' && (
          <MyTicketsPage onEventSelect={handleEventSelect} onChatOpen={() => {}} />
        )}

        {currentPage === 'terms' && <TermsPage />}

        {currentPage === 'thankyou' && <Thankyou />}

        {showAuth && !user && <Auth onClose={() => setShowAuth(false)} />}
      </main>

      {/* Pass handleNavigate so Footer can trigger navigation (e.g., to 'terms' or 'thankyou') */}
      <Footer onNavigate={(p: string) => handleNavigate(p as PageName)} />
    </div>
  );
}
