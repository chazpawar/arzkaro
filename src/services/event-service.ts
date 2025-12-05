import { supabase } from '../../backend/supabase';
import type {
  Event,
  CreateEvent,
  UpdateEvent,
  EventFilters,
  TicketType,
  CreateTicketType,
} from '../types';

/**
 * Event Service - Handles all event-related database operations
 */

// Fetch published events with optional filters
export async function getEvents(filters?: EventFilters, page = 1, pageSize = 20) {
  let query = supabase
    .from('events')
    .select(
      `
      *,
      host:profiles!host_id(id, full_name, avatar_url)
    `
    )
    .eq('is_published', true)
    .eq('is_cancelled', false)
    .order('start_date', { ascending: true });

  // Apply filters
  if (filters?.type) {
    query = query.eq('type', filters.type);
  }
  if (filters?.category) {
    query = query.eq('category', filters.category);
  }
  if (filters?.minPrice !== undefined) {
    query = query.gte('price', filters.minPrice);
  }
  if (filters?.maxPrice !== undefined) {
    query = query.lte('price', filters.maxPrice);
  }
  if (filters?.startDate) {
    query = query.gte('start_date', filters.startDate);
  }
  if (filters?.endDate) {
    query = query.lte('end_date', filters.endDate);
  }
  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,location_name.ilike.%${filters.search}%`);
  }

  // Pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return {
    data: data as Event[],
    count: count ?? 0,
    page,
    pageSize,
    hasMore: (data?.length ?? 0) === pageSize,
  };
}

// Fetch a single event by ID
export async function getEventById(id: string) {
  const { data, error } = await supabase
    .from('events')
    .select(
      `
      *,
      host:profiles!host_id(id, full_name, avatar_url, bio)
    `
    )
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Event;
}

// Fetch events by host
export async function getEventsByHost(hostId: string) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('host_id', hostId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data as Event[];
}

// Create a new event (host only)
export async function createEvent(eventData: CreateEvent, hostId: string) {
  const { data, error } = await supabase
    .from('events')
    .insert({
      ...eventData,
      host_id: hostId,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Event;
}

// Update an event (host only)
export async function updateEvent(id: string, updates: UpdateEvent) {
  const { data, error } = await supabase
    .from('events')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Event;
}

// Publish an event
export async function publishEvent(id: string) {
  return updateEvent(id, { is_published: true });
}

// Unpublish an event
export async function unpublishEvent(id: string) {
  return updateEvent(id, { is_published: false });
}

// Cancel an event
export async function cancelEvent(id: string) {
  return updateEvent(id, { is_cancelled: true });
}

// Delete an event (soft delete by cancelling)
export async function deleteEvent(id: string) {
  const { error } = await supabase.from('events').delete().eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
}

// Ticket Types
export async function getTicketTypes(eventId: string) {
  const { data, error } = await supabase
    .from('ticket_types')
    .select('*')
    .eq('event_id', eventId)
    .order('price', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data as TicketType[];
}

export async function createTicketType(eventId: string, ticketData: CreateTicketType) {
  const { data, error } = await supabase
    .from('ticket_types')
    .insert({
      ...ticketData,
      event_id: eventId,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as TicketType;
}

export async function updateTicketType(id: string, updates: Partial<CreateTicketType>) {
  const { data, error } = await supabase
    .from('ticket_types')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as TicketType;
}

export async function deleteTicketType(id: string) {
  const { error } = await supabase.from('ticket_types').delete().eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
}

// Get featured/upcoming events for home screen
export async function getFeaturedEvents(limit = 5) {
  const { data, error } = await supabase
    .from('events')
    .select(
      `
      *,
      host:profiles!host_id(id, full_name, avatar_url)
    `
    )
    .eq('is_published', true)
    .eq('is_cancelled', false)
    .gte('start_date', new Date().toISOString())
    .order('start_date', { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return data as Event[];
}

// Search events
export async function searchEvents(query: string, limit = 20) {
  const { data, error } = await supabase
    .from('events')
    .select(
      `
      *,
      host:profiles!host_id(id, full_name, avatar_url)
    `
    )
    .eq('is_published', true)
    .eq('is_cancelled', false)
    .or(`title.ilike.%${query}%,description.ilike.%${query}%,location_name.ilike.%${query}%`)
    .order('start_date', { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return data as Event[];
}
