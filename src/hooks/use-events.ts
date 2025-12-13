import { useState, useEffect, useCallback } from 'react';
import * as EventService from '../services/event-service';
import type { Event, EventFilters, TicketType } from '../types';
import { hasValidCredentials } from '../../backend/supabase';
import { useAuth } from '../contexts/auth-context';
import { mockEvents } from '../data/mock-events';

// TEMPORARY: Set to true to use mock data for UI development
const USE_MOCK_DATA = true;

/**
 * Hook for fetching and managing events
 */
export function useEvents(initialFilters?: EventFilters) {
  const { user, isAuthReady } = useAuth(); // Check if auth is fully ready
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters] = useState<EventFilters>(initialFilters || {});
  const [hasMore, setHasMore] = useState(false);

  // Fetch events - now runs when user changes AND auth is ready
  useEffect(() => {
    let mounted = true;
    let timeoutId: ReturnType<typeof setTimeout>;

    const doFetch = async () => {
      // TEMPORARY: Use mock data for UI development
      if (USE_MOCK_DATA) {
        // Simulate loading delay
        await new Promise((resolve) => setTimeout(resolve, 500));
        
        if (mounted) {
          // Filter mock events based on filters
          let filtered = [...mockEvents];
          
          // Apply type filter
          if (filters.type) {
            filtered = filtered.filter((e) => e.type === filters.type);
          }
          
          // Apply search filter
          if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filtered = filtered.filter(
              (e) =>
                e.title.toLowerCase().includes(searchLower) ||
                e.description?.toLowerCase().includes(searchLower) ||
                e.category?.toLowerCase().includes(searchLower)
            );
          }
          
          setEvents(filtered);
          setLoading(false);
          setError(null);
          setHasMore(false);
        }
        return;
      }

      // Wait for auth to be fully ready before fetching
      if (!isAuthReady) {
        console.log('⏳ [EVENTS] Waiting for auth to be ready...');
        return;
      }

      // If no valid credentials, don't even try to fetch
      if (!hasValidCredentials) {
        if (mounted) {
          setEvents([]);
          setLoading(false);
          setError(null);
        }
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log('🔄 [EVENTS] Fetching events...');

        // Set a timeout to prevent infinite loading (8 seconds for faster UX)
        const fetchPromise = EventService.getEvents(filters, 1);
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('Request timeout')), 8000);
        });

        const result = await Promise.race([fetchPromise, timeoutPromise]);

        if (mounted) {
          console.log(`✅ [EVENTS] Fetched ${result.data?.length || 0} events`);
          setEvents(result.data || []);
          setHasMore(result.hasMore || false);
        }
      } catch (err) {
        if (mounted) {
          let errorMessage = err instanceof Error ? err.message : 'Failed to fetch events';

          // Show helpful message if tables don't exist
          if (errorMessage.includes('Could not find the table')) {
            errorMessage = 'Database not set up. Please run migrations - see SETUP_DATABASE.md';
          }

          // Don't show timeout as an error - just show empty state
          if (errorMessage.includes('Request timeout')) {
            console.warn('⚠️ [EVENTS] Events fetch timed out - showing empty state');
            setError(null);
            setEvents([]);
          } else {
            console.error('❌ [EVENTS] Error fetching events:', errorMessage);
            setError(errorMessage);
            setEvents([]);
          }
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      }
    };

    doFetch();

    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [filters, user?.id, isAuthReady]); // Re-fetch when user changes OR auth becomes ready

  const refresh = useCallback(async () => {
    // TEMPORARY: Use mock data for UI development
    if (USE_MOCK_DATA) {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      // Filter mock events based on filters
      let filtered = [...mockEvents];
      
      if (filters.type) {
        filtered = filtered.filter((e) => e.type === filters.type);
      }
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filtered = filtered.filter(
          (e) =>
            e.title.toLowerCase().includes(searchLower) ||
            e.description?.toLowerCase().includes(searchLower) ||
            e.category?.toLowerCase().includes(searchLower)
        );
      }
      
      setEvents(filtered);
      setLoading(false);
      setError(null);
      setHasMore(false);
      return;
    }

    if (!hasValidCredentials) {
      setEvents([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await EventService.getEvents(filters, 1);
      setEvents(result.data || []);
      setHasMore(result.hasMore || false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch events';
      setError(errorMessage);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const loadMore = useCallback(() => {
    // Not implemented for now
  }, []);

  const updateFilters = useCallback(() => {
    // Not implemented for now
  }, []);

  return {
    events,
    loading,
    error,
    filters,
    hasMore,
    loadMore,
    refresh,
    updateFilters,
  };
}

/**
 * Hook for fetching a single event
 */
export function useEvent(eventId: string | undefined) {
  const [event, setEvent] = useState<Event | null>(null);
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvent = useCallback(async () => {
    if (!eventId) return;

    // TEMPORARY: Use mock data for UI development
    if (USE_MOCK_DATA) {
      // Simulate loading delay
      await new Promise((resolve) => setTimeout(resolve, 300));
      
      // Find event in mock data
      const foundEvent = mockEvents.find((e) => e.id === eventId);
      
      if (foundEvent) {
        setEvent(foundEvent);
        // Mock ticket types
        setTicketTypes([
          {
            id: 'ticket-1',
            event_id: foundEvent.id,
            name: 'General Admission',
            description: 'Standard entry ticket',
            price: foundEvent.price,
            quantity_available: foundEvent.max_capacity ? foundEvent.max_capacity - foundEvent.current_bookings : 100,
            quantity_sold: foundEvent.current_bookings,
            max_per_order: 10,
            sale_start_date: null,
            sale_end_date: null,
            created_at: foundEvent.created_at,
          },
        ]);
        setError(null);
      } else {
        setError('Event not found');
        setEvent(null);
      }
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [eventData, ticketData] = await Promise.all([
        EventService.getEventById(eventId),
        EventService.getTicketTypes(eventId),
      ]);

      setEvent(eventData);
      setTicketTypes(ticketData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch event');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  return {
    event,
    ticketTypes,
    loading,
    error,
    refresh: fetchEvent,
  };
}

/**
 * Hook for fetching featured events
 */
export function useFeaturedEvents(limit = 5) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeaturedEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await EventService.getFeaturedEvents(limit);
      setEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch featured events');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchFeaturedEvents();
  }, [fetchFeaturedEvents]);

  return {
    events,
    loading,
    error,
    refresh: fetchFeaturedEvents,
  };
}

/**
 * Hook for searching events
 */
export function useEventSearch() {
  const [results, setResults] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await EventService.searchEvents(query);
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return {
    results,
    loading,
    error,
    search,
    clearResults,
  };
}

/**
 * Hook for host's events management
 */
export function useHostEvents(hostId: string | undefined) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    if (!hostId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await EventService.getEventsByHost(hostId);
      setEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  }, [hostId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return {
    events,
    loading,
    error,
    refresh: fetchEvents,
  };
}
