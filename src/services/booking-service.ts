import { supabase } from '../../backend/supabase';
import type { BookingWithDetails, TicketWithDetails } from '../types';

// Type for event with ticket types from query
interface EventWithTicketTypes {
  id: string;
  price: number;
  currency: string;
  current_bookings: number;
  ticket_types?: { id: string; price: number }[];
}

// Type for create booking input
interface CreateBookingInput {
  event_id: string;
  ticket_type_id?: string;
  quantity: number;
}

/**
 * Booking Service - Handles all booking-related database operations
 */

// Create a new booking (MVP - auto-confirm without payment)
export async function createBooking(bookingData: CreateBookingInput, userId: string) {
  // Get event and ticket type info
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('*, ticket_types(*)')
    .eq('id', bookingData.event_id)
    .single();

  if (eventError) {
    throw new Error(eventError.message);
  }

  const eventData = event as unknown as EventWithTicketTypes;

  // Calculate total amount
  let totalAmount = eventData.price * bookingData.quantity;
  const ticketTypeId = bookingData.ticket_type_id;

  if (ticketTypeId && eventData.ticket_types) {
    const ticketType = eventData.ticket_types.find((t) => t.id === ticketTypeId);
    if (ticketType) {
      totalAmount = ticketType.price * bookingData.quantity;
    }
  }

  // Create booking with confirmed status (MVP - no payment)
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      user_id: userId,
      event_id: bookingData.event_id,
      ticket_type_id: ticketTypeId,
      quantity: bookingData.quantity,
      total_amount: totalAmount,
      currency: eventData.currency || 'INR',
      status: 'confirmed', // Auto-confirm for MVP
      payment_status: 'completed', // Skip payment for MVP
    })
    .select()
    .single();

  if (bookingError) {
    throw new Error(bookingError.message);
  }

  // Note: Tickets are now auto-created by the database trigger when booking is confirmed
  // No need to manually create tickets or update event current_bookings

  // Add user to event group
  await addUserToEventGroup(userId, bookingData.event_id);

  return { booking };
}

// Get user's bookings
export async function getUserBookings(userId: string) {
  const { data, error } = await supabase
    .from('bookings')
    .select(
      `
      *,
      event:events(id, title, cover_image_url, start_date, end_date, location_name, location_address),
      ticket_type:ticket_types(id, name)
    `
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data as BookingWithDetails[];
}

// Get booking by ID
export async function getBookingById(id: string) {
  const { data, error } = await supabase
    .from('bookings')
    .select(
      `
      *,
      event:events(id, title, cover_image_url, start_date, end_date, location_name, location_address,
        host:profiles!host_id(id, full_name)
      ),
      ticket_type:ticket_types(id, name, description)
    `
    )
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as BookingWithDetails;
}

// Cancel a booking
export async function cancelBooking(id: string) {
  // Just verify booking exists
  const { error: fetchError } = await supabase.from('bookings').select('id').eq('id', id).single();

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  // Update booking status (trigger will handle ticket cancellation and event count update)
  const { error: updateError } = await supabase
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return { success: true };
}

// Get user's tickets
export async function getUserTickets(userId: string) {
  const { data, error } = await supabase
    .from('tickets')
    .select(
      `
      *,
      event:events(id, title, cover_image_url, start_date, end_date, location_name, location_address),
      ticket_type:ticket_types(id, name, description)
    `
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data as unknown as TicketWithDetails[];
}

// Get ticket by ID
export async function getTicketById(id: string) {
  const { data, error } = await supabase
    .from('tickets')
    .select(
      `
      *,
      event:events(id, title, cover_image_url, start_date, end_date, location_name, location_address,
        host:profiles!host_id(id, full_name)
      ),
      ticket_type:ticket_types(id, name, description),
      booking:bookings(id, quantity, total_amount),
      user:profiles!user_id(id, full_name, email)
    `
    )
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as unknown as TicketWithDetails;
}

// Validate and check-in a ticket (for hosts)
export async function validateTicket(ticketId: string, checkedInBy: string) {
  try {
    // Find ticket by ID with event details
    const { data: ticket, error: fetchError } = await supabase
      .from('tickets')
      .select(
        `
        *,
        event:events!inner(id, title, host_id, end_date, start_date),
        user:profiles!user_id(id, full_name, email),
        booking:bookings!inner(id, quantity, total_amount, status)
      `
      )
      .eq('id', ticketId)
      .single();

    if (fetchError) {
      console.error('Ticket fetch error:', fetchError);
      return { valid: false, message: 'Ticket not found', ticket: null };
    }

    if (!ticket) {
      return { valid: false, message: 'Ticket not found', ticket: null };
    }

    const eventData = ticket.event as unknown as {
      id: string;
      title: string;
      host_id: string;
      end_date: string;
      start_date: string;
    };
    const bookingData = ticket.booking as unknown as {
      id: string;
      quantity: number;
      total_amount: number;
      status: string;
    };

    // Validate ticket status
    if (ticket.status === 'used') {
      return {
        valid: false,
        message: `Ticket already used on ${new Date(ticket.checked_in_at as string).toLocaleString()}`,
        ticket,
      };
    }

    if (ticket.status === 'cancelled') {
      return { valid: false, message: 'Ticket has been cancelled', ticket };
    }

    if (ticket.status === 'expired') {
      return { valid: false, message: 'Ticket has expired', ticket };
    }

    // Check if booking is valid
    if (bookingData.status === 'cancelled') {
      return { valid: false, message: 'Booking has been cancelled', ticket };
    }

    // Check if event has started
    const now = new Date();
    const eventStart = new Date(eventData.start_date);
    const eventEnd = new Date(eventData.end_date);

    if (now < eventStart) {
      return {
        valid: false,
        message: `Event hasn't started yet. Starts on ${eventStart.toLocaleString()}`,
        ticket,
      };
    }

    if (now > eventEnd) {
      // Automatically mark as expired
      await supabase.from('tickets').update({ status: 'expired' }).eq('id', ticketId);
      return { valid: false, message: 'Event has already ended', ticket };
    }

    // All checks passed - mark as used
    const { error: updateError } = await supabase
      .from('tickets')
      .update({
        status: 'used',
        checked_in_at: new Date().toISOString(),
        checked_in_by: checkedInBy,
      })
      .eq('id', ticketId);

    if (updateError) {
      console.error('Error updating ticket:', updateError);
      return { valid: false, message: 'Failed to check in ticket', ticket };
    }

    return {
      valid: true,
      message: 'Ticket validated successfully! Welcome to the event.',
      ticket: {
        ...ticket,
        status: 'used',
        checked_in_at: new Date().toISOString(),
        checked_in_by: checkedInBy,
      },
    };
  } catch (error) {
    console.error('Ticket validation error:', error);
    return {
      valid: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      ticket: null,
    };
  }
}

// Helper: Add user to event group
async function addUserToEventGroup(userId: string, eventId: string) {
  // Find the event group
  const { data: group, error: groupError } = await supabase
    .from('event_groups')
    .select('id')
    .eq('event_id', eventId)
    .single();

  if (groupError || !group) {
    console.error('Event group not found:', groupError);
    return;
  }

  const groupData = group as Record<string, string>;

  // Add user to group (ignore if already exists)
  await supabase.from('group_members').upsert(
    {
      group_id: groupData.id,
      user_id: userId,
      role: 'member',
    },
    {
      onConflict: 'group_id,user_id',
    }
  );
}

// Get bookings for an event (for hosts)
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
