import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface TicketType {
  id: string;
  name: string;
  description: string | null;
}

export interface EventDetails {
  id: string;
  title: string;
  cover_image_url: string | null;
  start_date: string;
  end_date: string;
  location_name: string | null;
  location_address: string | null;
}

export interface BookingDetails {
  id: string;
  quantity: number;
  total_amount: number;
}

export interface TicketWithDetails {
  id: string;
  booking_id: string;
  user_id: string;
  event_id: string;
  ticket_type_id: string | null;
  status: 'valid' | 'used' | 'expired' | 'cancelled';
  verification_code: string;
  checked_in_at: string | null;
  checked_in_by: string | null;
  created_at: string;
  event: EventDetails;
  ticket_type: TicketType | null;
  booking: BookingDetails;
}

/**
 * Hook for managing user's tickets with filtering by status
 */
export function useTickets(userId: string | undefined) {
  const [tickets, setTickets] = useState<TicketWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      setTickets([]);
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('tickets')
        .select(
          `
          *,
          event:events(id, title, cover_image_url, start_date, end_date, location_name, location_address),
          ticket_type:ticket_types(id, name, description),
          booking:bookings!inner(id, quantity, total_amount)
        `
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .abortSignal(controller.signal);

      if (fetchError) throw fetchError;

      // Type assertion with proper handling
      const ticketsData = (data || []).map((item: Record<string, unknown>) => ({
        ...item,
        event: item.event || {},
        ticket_type: item.ticket_type || null,
        booking: Array.isArray(item.booking) ? item.booking[0] : item.booking,
      })) as TicketWithDetails[];

      setTickets(ticketsData);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.error('Request timed out while fetching tickets');
        setError('Request timed out. Please try again.');
      } else {
        console.error('Error fetching tickets:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch tickets');
      }
      setTickets([]);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Filter tickets by status and check event end date for expiration
  const now = new Date();

  const validTickets = tickets.filter((t) => {
    // Check if ticket status is valid
    if (t.status !== 'valid') return false;

    // Check if event has ended (expired)
    if (t.event?.end_date) {
      const eventEndDate = new Date(t.event.end_date);
      if (now > eventEndDate) {
        return false;
      }
    }

    return true;
  });

  const usedTickets = tickets.filter((t) => t.status === 'used');

  const expiredTickets = tickets.filter((t) => {
    // Explicitly marked as expired or cancelled
    if (t.status === 'expired' || t.status === 'cancelled') return true;

    // Check if event has ended (but ticket status is still 'valid')
    if (t.status === 'valid' && t.event?.end_date) {
      const eventEndDate = new Date(t.event.end_date);
      if (now > eventEndDate) {
        return true;
      }
    }

    return false;
  });

  return {
    tickets,
    validTickets,
    usedTickets,
    expiredTickets,
    loading,
    error,
    refresh: fetchTickets,
  };
}

/**
 * Hook for fetching a single ticket by ID
 */
export function useTicket(ticketId: string | undefined) {
  const [ticket, setTicket] = useState<TicketWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTicket = useCallback(async () => {
    if (!ticketId) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('tickets')
        .select(
          `
          *,
          event:events(id, title, cover_image_url, start_date, end_date, location_name, location_address),
          ticket_type:ticket_types(id, name, description),
          booking:bookings(id, quantity, total_amount)
        `
        )
        .eq('id', ticketId)
        .abortSignal(controller.signal)
        .single();

      if (fetchError) throw fetchError;

      // Type assertion with proper handling
      const ticketData = {
        ...data,
        event: data.event || {},
        ticket_type: data.ticket_type || null,
        booking: Array.isArray(data.booking) ? data.booking[0] : data.booking,
      } as TicketWithDetails;

      setTicket(ticketData);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.error('Request timed out while fetching ticket');
        setError('Request timed out. Please try again.');
      } else {
        console.error('Error fetching ticket:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch ticket');
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  return {
    ticket,
    loading,
    error,
    refresh: fetchTicket,
  };
}
