import { supabase } from '../../backend/supabase';
import type { Event } from '../types';

/**
 * Host Service - Handles host-specific operations
 */

// Host Request/Application Types
export interface HostRequest {
  id: string;
  user_id: string;
  reason: string;
  business_name: string | null;
  business_type: string | null;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by: string | null;
  reviewed_at: string | null;
  admin_notes: string | null;
  created_at: string;
}

export interface CreateHostRequest {
  reason: string;
  business_name?: string;
  business_type?: string;
}

export interface HostStats {
  totalEvents: number;
  publishedEvents: number;
  totalBookings: number;
  totalRevenue: number;
  upcomingEvents: number;
}

// Submit host application
export async function submitHostRequest(request: CreateHostRequest, userId: string) {
  // Check if user already has a pending request
  const { data: existingRequest } = await supabase
    .from('host_requests')
    .select('id, status')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .single();

  if (existingRequest) {
    throw new Error('You already have a pending host application');
  }

  const { data, error } = await supabase
    .from('host_requests')
    .insert({
      ...request,
      user_id: userId,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as HostRequest;
}

// Get user's host request status
export async function getHostRequestStatus(userId: string) {
  const { data, error } = await supabase
    .from('host_requests')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows found
    throw new Error(error.message);
  }

  return data as HostRequest | null;
}

// Get host's events
export async function getHostEvents(hostId: string) {
  const { data, error } = await supabase
    .from('events')
    .select(
      `
      *,
      ticket_types(count)
    `
    )
    .eq('host_id', hostId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data as Event[];
}

// Get host stats/analytics
export async function getHostStats(hostId: string): Promise<HostStats> {
  // Get all host events
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('id, is_published, start_date, price')
    .eq('host_id', hostId);

  if (eventsError) {
    throw new Error(eventsError.message);
  }

  interface EventData {
    id: string;
    is_published: boolean;
    start_date: string;
    price: number;
  }
  const eventsList = (events || []) as EventData[];
  const eventIds = eventsList.map((e) => e.id);
  const now = new Date().toISOString();

  // Get bookings for host's events
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('total_amount, status')
    .in('event_id', eventIds.length > 0 ? eventIds : [''])
    .eq('status', 'confirmed');

  if (bookingsError) {
    throw new Error(bookingsError.message);
  }

  interface BookingData {
    total_amount: number;
    status: string;
  }
  const bookingsList = (bookings || []) as BookingData[];

  // Calculate stats
  const stats: HostStats = {
    totalEvents: eventsList.length,
    publishedEvents: eventsList.filter((e) => e.is_published).length,
    totalBookings: bookingsList.length,
    totalRevenue: bookingsList.reduce((sum, b) => sum + (b.total_amount || 0), 0),
    upcomingEvents: eventsList.filter((e) => e.start_date > now && e.is_published).length,
  };

  return stats;
}

// Get event bookings for host
export async function getEventBookings(eventId: string) {
  const { data, error } = await supabase
    .from('bookings')
    .select(
      `
      *,
      user:profiles!user_id(id, full_name, email, avatar_url),
      ticket_type:ticket_types(id, name)
    `
    )
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

// Get event tickets for host (for check-in purposes)
export async function getEventTickets(eventId: string) {
  const { data, error } = await supabase
    .from('tickets')
    .select(
      `
      *,
      user:profiles!user_id(id, full_name, email, avatar_url),
      ticket_type:ticket_types(id, name)
    `
    )
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

// Get check-in stats for an event
export async function getEventCheckInStats(eventId: string) {
  const { data, error } = await supabase.from('tickets').select('status').eq('event_id', eventId);

  if (error) {
    throw new Error(error.message);
  }

  interface TicketData {
    status: string;
  }
  const tickets = (data || []) as TicketData[];
  const total = tickets.length;
  const checkedIn = tickets.filter((t) => t.status === 'used').length;
  const valid = tickets.filter((t) => t.status === 'valid').length;
  const cancelled = tickets.filter((t) => t.status === 'cancelled').length;

  return {
    total,
    checkedIn,
    valid,
    cancelled,
    checkInRate: total > 0 ? Math.round((checkedIn / total) * 100) : 0,
  };
}

// Create event with ticket types (convenience function)
export async function createEventWithTickets(
  eventData: Record<string, unknown>,
  ticketTypes: Record<string, unknown>[],
  hostId: string
) {
  // Create event
  const { data: event, error: eventError } = await supabase
    .from('events')
    .insert({
      ...(eventData as any),
      host_id: hostId,
    })
    .select()
    .single();

  if (eventError) {
    throw new Error(eventError.message);
  }

  const eventRecord = event;

  // Create ticket types if provided
  if (ticketTypes.length > 0) {
    const ticketTypesWithEventId = ticketTypes.map((tt) => ({
      ...tt,
      event_id: eventRecord.id,
    }));

    const { error: ticketsError } = await supabase
      .from('ticket_types')
      .insert(ticketTypesWithEventId as any);

    if (ticketsError) {
      // Rollback: delete the event
      await supabase
        .from('events')
        .delete()
        .eq('id', eventRecord.id as string);
      throw new Error(ticketsError.message);
    }
  }

  return event;
}
