import { supabase } from '../lib/supabase';

export interface Attendee {
  id: string;
  user_id: string;
  booking_id: string;
  user: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
}

/**
 * Get all bookings for an event
 * Returns confirmed bookings with user details
 */
export async function getEventBookings(eventId: string) {
  const { data, error } = await supabase
    .from('bookings')
    .select(
      `
      *,
      user:profiles!user_id(id, full_name, email, avatar_url),
      ticket_type:ticket_types(id, name, description)
    `
    )
    .eq('event_id', eventId)
    .eq('status', 'confirmed')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Get attendees for an event (deduplicated by user)
 * Only returns confirmed bookings
 */
export async function getEventAttendees(eventId: string): Promise<Attendee[]> {
  const bookings = await getEventBookings(eventId);

  // Deduplicate users by ID
  const uniqueUsersMap = new Map<string, Attendee>();

  bookings
    .filter((b) => b.user)
    .forEach((b) => {
      // Type assertion since we know the structure from the query
      const booking = b as typeof b & {
        user: { id: string; full_name: string | null; email: string; avatar_url: string | null };
      };
      const userId = booking.user.id;
      if (!uniqueUsersMap.has(userId)) {
        uniqueUsersMap.set(userId, {
          id: booking.id,
          user_id: userId,
          booking_id: booking.id,
          user: booking.user,
        });
      }
    });

  return Array.from(uniqueUsersMap.values());
}
