import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { useAuth } from './hooks/useAuth';

// Import all components / pages
import Navbar from './components/Navbar.tsx';
import Auth from './components/Auth.tsx';
import HomePage from './pages/HomePage.tsx';
import ForYou from './pages/ForYou.tsx';
import ExperiencesPage from './pages/ExperiencesPage.tsx';
import ExperienceDetailPage from './pages/ExperienceDetailPage.tsx';
import BookingPage from './pages/BookingPage.tsx';
import ProfilePage from './pages/ProfilePage.tsx';
import EditProfilePage from './pages/EditProfilePage.tsx';
import SettingsPage from './pages/SettingsPage.tsx';
import MyTicketsPage from './pages/MyTicketsPage.tsx';
import TicketDetailPage from './pages/TicketDetailPage.tsx';
import TripsPage from './pages/Trips.tsx';
import TripDetailsPage from './pages/TripDetails.tsx';
import Footer from './components/Footer.tsx';
import TermsPage from './pages/Terms.tsx';
import Thankyou from './pages/Thankyou.tsx';
import ChatModal from './components/ChatModal.tsx';

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
  | 'booking'
  | 'profile'
  | 'edit-profile'
  | 'settings'
  | 'trips'
  | 'trip-detail'
  | 'my-tickets'
  | 'ticket-detail'
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
  if (clean === '/profile') return { page: 'profile' as PageName };
  if (clean === '/edit-profile') return { page: 'edit-profile' as PageName };
  if (clean === '/settings') return { page: 'settings' as PageName };

  // dynamic routes
  const experienceMatch = clean.match(/^\/experience\/([^/]+)$/);
  if (experienceMatch) return { page: 'experience-detail' as PageName, id: experienceMatch[1] };

  const bookingMatch = clean.match(/^\/booking\/([^/]+)$/);
  if (bookingMatch) return { page: 'booking' as PageName, id: bookingMatch[1] };

  const tripMatch = clean.match(/^\/trip\/([^/]+)$/);
  if (tripMatch) return { page: 'trip-detail' as PageName, id: tripMatch[1] };

  const ticketMatch = clean.match(/^\/ticket\/([^/]+)$/);
  if (ticketMatch) return { page: 'ticket-detail' as PageName, id: ticketMatch[1] };

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
    case 'profile':
      return '/profile';
    case 'edit-profile':
      return '/edit-profile';
    case 'settings':
      return '/settings';
    case 'experience-detail':
      return id ? `/experience/${id}` : '/experiences';
    case 'booking':
      return id ? `/booking/${id}` : '/experiences';
    case 'trip-detail':
      return id ? `/trip/${id}` : '/trips';
    case 'ticket-detail':
      return id ? `/ticket/${id}` : '/my-tickets';
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

  // Store IDs instead of full objects - detail pages will fetch from Supabase
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState<boolean>(false);
  const [showChatModal, setShowChatModal] = useState<boolean>(false);

  // Navigation helper that syncs history
  const handleNavigate = useCallback((page: PageName, id?: string | null, replace = false) => {
    // Clear selected IDs
    setSelectedEventId(null);
    setSelectedTripId(null);

    // Store ID for detail pages (detail pages will fetch from Supabase)
    if (page === 'experience-detail' && id) {
      setSelectedEventId(id);
    } else if (page === 'booking' && id) {
      setSelectedEventId(id);
    } else if (page === 'ticket-detail' && id) {
      setSelectedEventId(id);
    } else if (page === 'trip-detail' && id) {
      setSelectedTripId(id);
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
      setSelectedEventId(id);
      setCurrentPage('experience-detail');
    } else if (page === 'booking' && id) {
      setSelectedEventId(id);
      setCurrentPage('booking');
    } else if (page === 'trip-detail' && id) {
      setSelectedTripId(id);
      setCurrentPage('trip-detail');
    } else if (page === 'ticket-detail' && id) {
      setSelectedEventId(id);
      setCurrentPage('ticket-detail');
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
        setSelectedEventId(id);
        setSelectedTripId(null);
        setCurrentPage('experience-detail');
        return;
      }

      if (page === 'booking' && id) {
        setSelectedEventId(id);
        setSelectedTripId(null);
        setCurrentPage('booking');
        return;
      }

      if (page === 'trip-detail' && id) {
        setSelectedTripId(id);
        setSelectedEventId(null);
        setCurrentPage('trip-detail');
        return;
      }

      if (page === 'ticket-detail' && id) {
        setSelectedEventId(id);
        setSelectedTripId(null);
        setCurrentPage('ticket-detail');
        return;
      }

      // simple pages
      setSelectedEventId(null);
      setSelectedTripId(null);
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
    // Just navigate with ID - detail page will fetch from Supabase
    handleNavigate('experience-detail', eventId);
  };

  const handleTripSelect = (tripId: string) => {
    // Just navigate with ID - detail page will fetch from Supabase
    handleNavigate('trip-detail', tripId);
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
            profile: 'profile',
            'edit-profile': 'edit-profile',
            settings: 'settings',
            terms: 'terms',
            thankyou: 'thankyou',
          };
          const page = mapping[p] || 'home';
          handleNavigate(page);
        }}
        onChatClick={() => setShowChatModal(true)}
      />

      {/* Spacer for fixed navbar */}
      <div className="h-24" />

      <main className="flex-grow">
        {currentPage === 'home' && <HomePage />}

        {currentPage === 'for-you' && (
          <ForYou 
            onEventSelect={handleEventSelect} 
            onTripSelect={handleTripSelect}
            onNavigate={(p: string) => {
              const mapping: { [k: string]: PageName } = {
                experiences: 'experiences',
                trips: 'trips',
              };
              const page = mapping[p] || 'home';
              handleNavigate(page);
            }}
          />
        )}

        {currentPage === 'experiences' && <ExperiencesPage onEventClick={handleEventSelect} />}

        {currentPage === 'trips' && (
          <TripsPage
            onTripSelect={handleTripSelect}
            onChatOpen={() => {}}
            currentUserId={user?.uid || null}
          />
        )}

        {currentPage === 'trip-detail' && selectedTripId && (
          <TripDetailsPage
            tripId={selectedTripId}
            onBack={() => handleNavigate('trips')}
            onChatOpen={() => {}}
            currentUserId={user?.uid || null}
            onAuthClick={() => setShowAuth(true)}
            onBookNow={(tripId) => handleNavigate('booking', tripId)}
          />
        )}

        {currentPage === 'experience-detail' && selectedEventId && (
          <ExperienceDetailPage
            eventId={selectedEventId}
            onBack={() => handleNavigate('experiences')}
            onBookNow={(eventId) => handleNavigate('booking', eventId)}
            onChatOpen={() => {}}
            onAuthClick={() => setShowAuth(true)}
          />
        )}

        {currentPage === 'booking' && selectedEventId && (
          <BookingPage
            eventId={selectedEventId}
            onBack={() => handleNavigate('experience-detail', selectedEventId)}
            onSuccess={() => handleNavigate('my-tickets')}
            onAuthClick={() => setShowAuth(true)}
          />
        )}

        {currentPage === 'my-tickets' && (
          <MyTicketsPage 
            onEventSelect={handleEventSelect} 
            onChatOpen={() => {}} 
            onTicketSelect={(ticketId) => handleNavigate('ticket-detail', ticketId)}
            onAuthClick={() => setShowAuth(true)}
          />
        )}

        {currentPage === 'ticket-detail' && selectedEventId && (
          <TicketDetailPage
            ticketId={selectedEventId}
            onBack={() => handleNavigate('my-tickets')}
          />
        )}

        {currentPage === 'profile' && (
          <ProfilePage
            onNavigate={(page) => handleNavigate(page as PageName)}
            onBack={() => handleNavigate('home')}
          />
        )}

        {currentPage === 'edit-profile' && (
          <EditProfilePage
            onBack={() => handleNavigate('profile')}
            onSuccess={() => handleNavigate('profile')}
          />
        )}

        {currentPage === 'settings' && <SettingsPage onBack={() => handleNavigate('profile')} />}

        {currentPage === 'terms' && <TermsPage />}

        {currentPage === 'thankyou' && <Thankyou />}

        {showAuth && !user && <Auth onClose={() => setShowAuth(false)} />}
        {showChatModal && <ChatModal onClose={() => setShowChatModal(false)} />}
      </main>

      {/* Pass handleNavigate so Footer can trigger navigation (e.g., to 'terms' or 'thankyou') */}
      <Footer onNavigate={(p: string) => handleNavigate(p as PageName)} />
    </div>
  );
}
