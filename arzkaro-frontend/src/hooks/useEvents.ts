import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Event type matching the database schema
export interface Event {
  id: string;
  title: string;
  description: string | null;
  short_description: string | null;
  type: 'experience' | 'trip' | 'nightlife';
  category: string;
  tags: string[];
  location_name: string | null;
  location_address: string | null;
  location_coordinates: { lat: number; lng: number } | null;
  start_date: string;
  end_date: string;
  price: number;
  max_capacity: number;
  current_bookings: number;
  cover_image_url: string | null;
  images: string[];
  host_id: string;
  host?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    bio?: string | null;
    instagram?: string | null;
    youtube?: string | null;
    linkedin?: string | null;
    twitter?: string | null;
  };
  status: 'draft' | 'published' | 'cancelled';
  created_at: string;
  updated_at: string;
  // Additional fields for trips
  departure_location: string | null;
  pickups: string[];
  itinerary: string | null;
  whats_included: string | null;
  whats_not_included: string | null;
  things_to_know: string[] | null;
  terms_and_conditions: string | null;
  cancellation_policy: string | null;
}

export interface TicketType {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  price: number;
  quantity_available: number;
  quantity_sold: number;
  max_per_order: number;
  sale_start_date: string | null;
  sale_end_date: string | null;
  created_at: string;
}

/**
 * Hook to fetch all published events/experiences (not trips)
 */
export function useEvents(category?: string) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('events')
        .select('*')
        .eq('is_published', true)
        .eq('is_cancelled', false)
        .in('type', ['event', 'experience'])
        .order('start_date', { ascending: true });

      if (category && category !== 'All') {
        query = query.eq('category', category.toLowerCase());
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setEvents(data || []);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  return { events, loading, error, refetch: fetchEvents };
}

/**
 * Hook to fetch a single event by ID with its ticket types
 */
export function useEvent(eventId: string | null) {
  const [event, setEvent] = useState<Event | null>(null);
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (eventId) {
      fetchEvent();
    } else {
      setEvent(null);
      setTicketTypes([]);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const fetchEvent = async () => {
    if (!eventId) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch event details WITHOUT host profile join (to avoid 401 for unauthenticated users)
      // Host details will be shown only to authenticated users via separate query or UI message
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (eventError) throw eventError;

      // Fetch ticket types for this event
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('ticket_types')
        .select('*')
        .eq('event_id', eventId)
        .order('price', { ascending: true });

      if (ticketsError) throw ticketsError;

      setEvent(eventData);
      setTicketTypes(ticketsData || []);
    } catch (err) {
      console.error('Error fetching event:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  return { event, ticketTypes, loading, error, refetch: fetchEvent };
}

/**
 * Hook to fetch featured/recommended events for "For You" page
 */
export function useFeaturedEvents(limit: number = 10) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchFeaturedEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit]);

  const fetchFeaturedEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch upcoming published events (not trips)
      const { data, error: fetchError } = await supabase
        .from('events')
        .select('*')
        .eq('is_published', true)
        .eq('is_cancelled', false)
        .in('type', ['event', 'experience'])
        .gte('start_date', new Date().toISOString())
        .order('start_date', { ascending: true })
        .limit(limit);

      if (fetchError) throw fetchError;

      setEvents(data || []);
    } catch (err) {
      console.error('Error fetching featured events:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  return { events, loading, error, refetch: fetchFeaturedEvents };
}
