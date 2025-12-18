import { supabase } from '../../backend/supabase';
import type {
  Event,
  CreateEvent,
  UpdateEvent,
  EventFilters,
  TicketType,
  CreateTicketType,
} from '../types';
import type { EventCreationPermission } from '../types/host.types';

/**
 * Event Service - Handles all event-related database operations
 */

// ========================================
// PERMISSION CHECKING FUNCTIONS
// ========================================

/**
 * Check if user can create a specific event type
 */
export async function canUserCreateEventType(
  userId: string,
  eventType: 'event' | 'trip' | 'experience'
): Promise<EventCreationPermission> {
  // Call database function for permission check
  const { data, error } = await supabase.rpc('can_user_create_event_type', {
    p_user_id: userId,
    p_event_type: eventType,
  });

  if (error) {
    return {
      canCreate: false,
      reason: 'Failed to check permissions',
      suggestedAction: 'Please try again or contact support',
    };
  }

  const canCreate = data as boolean;

  if (canCreate) {
    return { canCreate: true };
  }

  // Get user's profile to provide specific error message
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, host_type, is_host_approved')
    .eq('id', userId)
    .single();

  if (!profile) {
    return {
      canCreate: false,
      reason: 'User profile not found',
      suggestedAction: 'Please sign in again',
    };
  }

  // NOTE: host_type may not exist in current database schema but will be added in migrations
  const { role, host_type, is_host_approved } = profile as unknown as {
    role: string;
    host_type: string | null;
    is_host_approved: boolean;
  };

  // Provide specific feedback based on user's current status
  if (role === 'user') {
    return {
      canCreate: false,
      reason: 'You need host access to create events',
      suggestedAction: 'Apply for host access from your profile',
    };
  }

  if (role === 'host' && !is_host_approved) {
    return {
      canCreate: false,
      reason: 'Your host request is pending approval',
      suggestedAction: 'Please wait for admin approval',
    };
  }

  if (role === 'host' && host_type === 'activity' && eventType !== 'experience') {
    return {
      canCreate: false,
      reason: 'Activity hosts can only create activities',
      suggestedAction:
        eventType === 'event'
          ? 'Apply for Full Host access to create Events'
          : 'Apply for Full Host access to create Trips',
    };
  }

  return {
    canCreate: false,
    reason: 'Insufficient permissions',
    suggestedAction: 'Contact support for assistance',
  };
}

/**
 * Get user's host permissions summary
 */
export async function getUserHostPermissions(userId: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, host_type, is_host_approved')
    .eq('id', userId)
    .single();

  if (!profile) {
    return {
      canCreateEvents: false,
      canCreateTrips: false,
      canCreateExperiences: false,
      hostType: null,
      isApproved: false,
    };
  }

  // NOTE: host_type may not exist in current database schema but will be added in migrations
  const { role, host_type, is_host_approved } = profile as unknown as {
    role: string;
    host_type: string | null;
    is_host_approved: boolean;
  };

  const isAdmin = role === 'admin';
  const isFullHost = role === 'host' && host_type === 'full' && is_host_approved;
  const isActivityHost = role === 'host' && host_type === 'activity' && is_host_approved;

  return {
    canCreateEvents: isAdmin || isFullHost,
    canCreateTrips: isAdmin || isFullHost,
    canCreateExperiences: isAdmin || isFullHost || isActivityHost,
    hostType: host_type,
    isApproved: is_host_approved,
    role,
  };
}

// ========================================
// EVENT CRUD OPERATIONS
// ========================================

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
    .gte('end_date', new Date().toISOString()) // Hide expired events
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

  return data as unknown as Event;
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
    .gte('end_date', new Date().toISOString()) // Hide expired events
    .or(`title.ilike.%${query}%,description.ilike.%${query}%,location_name.ilike.%${query}%`)
    .order('start_date', { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return data as Event[];
}
