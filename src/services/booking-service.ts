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
    } as Record<string, unknown>)
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
    .update({ status: 'cancelled' } as Record<string, unknown>)
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

  return data as TicketWithDetails[];
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
      booking:bookings(id, quantity, total_amount)
    `
    )
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as TicketWithDetails;
}

// Validate and check-in a ticket (for hosts)
export async function validateTicket(ticketNumber: string, checkedInBy: string) {
  // Find ticket by ticket number
  const { data: ticket, error: fetchError } = await supabase
    .from('tickets')
    .select(
      `
      *,
      event:events(id, title, host_id, end_date)
    `
    )
    .eq('ticket_number', ticketNumber)
    .single();

  if (fetchError) {
    return { valid: false, message: 'Ticket not found' };
  }

  const ticketData = ticket as Record<string, unknown>;
  const eventData = ticketData.event as Record<string, string>;

  // Check if already used
  if (ticketData.status === 'used') {
    return {
      valid: false,
      message: `Ticket already used at ${new Date(ticketData.checked_in_at as string).toLocaleString()}`,
      ticket: ticketData,
    };
  }

  // Check if cancelled
  if (ticketData.status === 'cancelled') {
    return { valid: false, message: 'Ticket has been cancelled', ticket: ticketData };
  }

  // Check if expired (event has ended)
  if (new Date(eventData.end_date) < new Date()) {
    return { valid: false, message: 'Event has already ended', ticket: ticketData };
  }

  // Mark as used
  const { error: updateError } = await supabase
    .from('tickets')
    .update({
      status: 'used',
      checked_in_at: new Date().toISOString(),
      checked_in_by: checkedInBy,
    } as Record<string, unknown>)
    .eq('id', ticketData.id as string);

  if (updateError) {
    return { valid: false, message: 'Failed to check in ticket' };
  }

  return { valid: true, message: 'Ticket validated successfully', ticket: ticketData };
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
    } as Record<string, unknown>,
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
