import { supabase } from '../lib/supabase';
import type { HostRequest, HostRequestData, HostStats } from '../types/host';
import type { AppEvent } from '../hooks/useEvents';

/**
 * Get user's latest host request
 */
export async function getLatestHostRequest(userId: string): Promise<HostRequest | null> {
  const { data, error } = await supabase
    .from('host_requests')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as HostRequest | null;
}

/**
 * Submit host request
 */
export async function submitHostRequest(data: HostRequestData): Promise<HostRequest> {
  const { data: request, error } = await supabase
    .from('host_requests')
    .insert(data)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to submit host request: ${error.message}`);
  }

  return request as HostRequest;
}

/**
 * Get host stats/analytics
 */
export async function getHostStats(hostId: string): Promise<HostStats> {
  // Get all host events
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('id, is_published, start_date, price')
    .eq('host_id', hostId);

  if (eventsError) {
    throw new Error(eventsError.message);
  }

  const eventsList = (events || []) as Partial<AppEvent>[];
  const eventIds = eventsList.map((e) => e.id as string);
  const now = new Date().toISOString();

  // Get bookings for host's events
  let bookings: { total_amount: number | null; status: string }[] = [];
  if (eventIds.length > 0) {
    const { data: bookingsData, error: bookingsError } = await supabase
      .from('bookings')
      .select('total_amount, status')
      .in('event_id', eventIds)
      .eq('status', 'confirmed');

    if (bookingsError) {
      throw new Error(bookingsError.message);
    }
    bookings = (bookingsData || []) as { total_amount: number | null; status: string }[];
  }

  // Calculate stats
  const stats: HostStats = {
    totalEvents: eventsList.length,
    publishedEvents: eventsList.filter((e) => e.is_published).length,
    totalBookings: bookings.length,
    totalRevenue: bookings.reduce((sum, b) => sum + (b.total_amount || 0), 0),
    upcomingEvents: eventsList.filter((e) => (e.start_date ?? '') > now && e.is_published).length,
  };

  return stats;
}

/**
 * Get host's events
 */
export async function getHostEvents(hostId: string): Promise<AppEvent[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('host_id', hostId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data as AppEvent[];
}
