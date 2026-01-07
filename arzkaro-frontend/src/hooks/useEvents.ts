import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Event type matching the database schema
export interface Event {
  id: string;
  host_id: string;
  type: 'event' | 'experience' | 'trip';
  title: string;
  description: string | null;
  short_description: string | null;
  cover_image_url: string | null;
  images: string[];
  location_name: string | null;
  location_address: string | null;
  location_lat: number | null;
  location_lng: number | null;
  start_date: string;
  end_date: string;
  timezone: string;
  max_capacity: number | null;
  current_bookings: number;
  price: number;
  currency: string;
  is_published: boolean;
  is_cancelled: boolean;
  category: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
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
  }, [eventId]);

  const fetchEvent = async () => {
    if (!eventId) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch event details
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
