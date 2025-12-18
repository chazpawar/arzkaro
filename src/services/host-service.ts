/**
 * Host Service
 * Handles host application submissions, KYC validation, and host request management
 */

import { supabase } from '../../backend/supabase';
import type { Event } from '../types';
import type {
  HostRequestData,
  HostRequest as NewHostRequest,
  HostRequestWithUser,
  HostRequestValidation,
  HostType,
} from '../types/host.types';

// Legacy types (keep for backward compatibility with existing host dashboard)
export interface HostStats {
  totalEvents: number;
  publishedEvents: number;
  totalBookings: number;
  totalRevenue: number;
  upcomingEvents: number;
}

/**
 * Host type labels for display
 */
export const HOST_TYPE_LABELS: Record<HostType, string> = {
  full: 'Full Host',
  activity: 'Activity Host',
};

/**
 * Validation helpers
 */

// Validate PAN number format: ABCDE1234F
export function isValidPAN(pan: string): boolean {
  return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan);
}

// Validate phone number: 10-15 digits with optional +
export function isValidPhone(phone: string): boolean {
  return /^\+?[0-9]{10,15}$/.test(phone);
}

// Validate IFSC code: ABCD0123456
export function isValidIFSC(ifsc: string): boolean {
  return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc);
}

// Validate pin code: 6 digits
export function isValidPinCode(pinCode: string): boolean {
  return /^[0-9]{6}$/.test(pinCode);
}

// Validate email
export function isValidEmail(email: string): boolean {
  return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email);
}

// Validate GSTIN format (optional field)
export function isValidGSTIN(gstin: string): boolean {
  if (!gstin) return true; // Optional field
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin);
}

// Validate URL
export function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate host request data
 */
export function validateHostRequest(data: HostRequestData): HostRequestValidation {
  const errors: HostRequestValidation['errors'] = {};

  // Organizer name
  if (!data.organizer_name || data.organizer_name.trim().length < 2) {
    errors.organizer_name = 'Organizer name must be at least 2 characters';
  }

  // Contact number
  if (!isValidPhone(data.contact_number)) {
    errors.contact_number = 'Invalid phone number format (10-15 digits)';
  }

  // Email
  if (!isValidEmail(data.email)) {
    errors.email = 'Invalid email address';
  }

  // Street address
  if (!data.street_address || data.street_address.trim().length < 5) {
    errors.street_address = 'Street address must be at least 5 characters';
  }

  // City
  if (!data.city || data.city.trim().length < 2) {
    errors.city = 'City name is required';
  }

  // State
  if (!data.state || data.state.trim().length < 2) {
    errors.state = 'State name is required';
  }

  // Pin code
  if (!isValidPinCode(data.pin_code)) {
    errors.pin_code = 'Pin code must be 6 digits';
  }

  // PAN number
  if (!isValidPAN(data.pan_number)) {
    errors.pan_number = 'Invalid PAN format (e.g., ABCDE1234F)';
  }

  // GSTIN (only for full hosts)
  if (data.requested_host_type === 'full' && data.gstin) {
    if (!isValidGSTIN(data.gstin)) {
      errors.gstin = 'Invalid GSTIN format';
    }
  }

  // Account holder name
  if (!data.account_holder_name || data.account_holder_name.trim().length < 2) {
    errors.account_holder_name = 'Account holder name is required';
  }

  // Beneficiary name
  if (!data.beneficiary_name || data.beneficiary_name.trim().length < 2) {
    errors.beneficiary_name = 'Beneficiary name is required';
  }

  // Account number
  if (!data.account_number || data.account_number.length < 9) {
    errors.account_number = 'Account number must be at least 9 digits';
  }

  // IFSC code
  if (!isValidIFSC(data.ifsc_code)) {
    errors.ifsc_code = 'Invalid IFSC code format (e.g., SBIN0001234)';
  }

  // PAN card photo URL
  if (!data.pan_card_photo_url || !isValidURL(data.pan_card_photo_url)) {
    errors.pan_card_photo_url = 'Valid PAN card photo URL is required';
  }

  // GST certificate URL (only for full hosts with GSTIN)
  if (
    data.requested_host_type === 'full' &&
    data.gstin &&
    'gst_certificate_url' in data &&
    data.gst_certificate_url
  ) {
    if (!isValidURL(data.gst_certificate_url)) {
      errors.gst_certificate_url = 'Valid GST certificate URL is required';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Check if user has a pending host request
 */
export async function hasPendingHostRequest(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('host_requests')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = not found, which is ok
    throw new Error(error.message);
  }

  return !!data;
}

/**
 * Get user's host requests
 */
export async function getUserHostRequests(userId: string): Promise<NewHostRequest[]> {
  const { data, error } = await supabase
    .from('host_requests')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  // NOTE: Database types are out of sync. Type assertion used until types are regenerated.
  return data as unknown as NewHostRequest[];
}

/**
 * Get user's latest host request
 */
export async function getLatestHostRequest(userId: string): Promise<NewHostRequest | null> {
  const { data, error } = await supabase
    .from('host_requests')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    throw new Error(error.message);
  }

  // NOTE: Database types are out of sync. Type assertion used until types are regenerated.
  return data as unknown as NewHostRequest;
}

/**
 * Submit host request (NEW KYC SYSTEM)
 */
export async function submitHostRequest(data: HostRequestData): Promise<NewHostRequest> {
  // 1. Validate data
  const validation = validateHostRequest(data);
  if (!validation.isValid) {
    const errorMessages = Object.values(validation.errors).join(', ');
    throw new Error(`Validation failed: ${errorMessages}`);
  }

  // 2. Check for existing pending request
  const hasPending = await hasPendingHostRequest(data.user_id);
  if (hasPending) {
    throw new Error('You already have a pending host request. Please wait for admin review.');
  }

  // 3. Prepare insert data
  const insertData = {
    user_id: data.user_id,
    requested_host_type: data.requested_host_type,
    organizer_name: data.organizer_name.trim(),
    contact_number: data.contact_number.trim(),
    email: data.email.trim().toLowerCase(),
    street_address: data.street_address.trim(),
    city: data.city.trim(),
    state: data.state.trim(),
    pin_code: data.pin_code.trim(),
    pan_number: data.pan_number.trim().toUpperCase(),
    gstin: ('gstin' in data ? data.gstin?.trim().toUpperCase() : null) || null,
    account_holder_name: data.account_holder_name.trim(),
    beneficiary_name: data.beneficiary_name.trim(),
    account_number: data.account_number.trim(),
    ifsc_code: data.ifsc_code.trim().toUpperCase(),
    pan_card_photo_url: data.pan_card_photo_url.trim(),
    gst_certificate_url:
      'gst_certificate_url' in data ? data.gst_certificate_url?.trim() || null : null,
  };

  // 4. Insert into database
  const { data: request, error } = await supabase
    .from('host_requests')
    .insert(insertData as any) // Type assertion needed due to database schema mismatch
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to submit host request: ${error.message}`);
  }

  // NOTE: Database types are out of sync. Type assertion used until types are regenerated.
  return request as unknown as NewHostRequest;
}

/**
 * Get host request by ID
 */
export async function getHostRequestById(requestId: string): Promise<NewHostRequest | null> {
  const { data, error } = await supabase
    .from('host_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(error.message);
  }

  // NOTE: Database types are out of sync. Type assertion used until types are regenerated.
  return data as unknown as NewHostRequest;
}

/**
 * Get host request by ID with user details (for admin view)
 */
export async function getHostRequestWithUser(
  requestId: string
): Promise<HostRequestWithUser | null> {
  const { data, error } = await supabase
    .from('host_requests')
    .select(
      `
      *,
      user:profiles!user_id(id, full_name, email, avatar_url),
      reviewer:profiles!reviewed_by(id, full_name, email)
    `
    )
    .eq('id', requestId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(error.message);
  }

  return data as unknown as HostRequestWithUser;
}

/**
 * Cancel pending host request
 */
export async function cancelHostRequest(requestId: string, userId: string): Promise<void> {
  // Verify request belongs to user and is pending
  const { data: request, error: fetchError } = await supabase
    .from('host_requests')
    .select('user_id, status')
    .eq('id', requestId)
    .single();

  if (fetchError) {
    throw new Error('Host request not found');
  }

  if (request.user_id !== userId) {
    throw new Error('Unauthorized: This request does not belong to you');
  }

  if (request.status !== 'pending') {
    throw new Error('Cannot cancel: Request has already been processed');
  }

  // Delete the request
  const { error: deleteError } = await supabase
    .from('host_requests')
    .delete()
    .eq('id', requestId)
    .eq('user_id', userId); // Double-check ownership

  if (deleteError) {
    throw new Error(`Failed to cancel request: ${deleteError.message}`);
  }
}

/**
 * Get host type label
 */
export function getHostTypeLabel(hostType: HostType | null): string {
  if (!hostType) return 'Not a host';
  return hostType === 'full' ? 'Full Host' : 'Activity Host';
}

/**
 * Get host type description
 */
export function getHostTypeDescription(hostType: HostType): string {
  return hostType === 'full'
    ? 'Can create Events, Trips, and Activities'
    : 'Can create Activities only';
}

/**
 * Format host request for display
 */
export function formatHostRequestForDisplay(request: NewHostRequest) {
  return {
    ...request,
    typeLabel: getHostTypeLabel(request.requested_host_type),
    typeDescription: getHostTypeDescription(request.requested_host_type),
    submittedAgo: formatTimeAgo(request.created_at),
    reviewedAgo: request.reviewed_at ? formatTimeAgo(request.reviewed_at) : null,
  };
}

/**
 * Helper: Format time ago
 */
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)} weeks ago`;
  if (seconds < 31536000) return `${Math.floor(seconds / 2592000)} months ago`;
  return `${Math.floor(seconds / 31536000)} years ago`;
}

// ========================================
// LEGACY FUNCTIONS - Host Dashboard
// Keep these for backward compatibility
// ========================================

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

  return data as unknown as Event[];
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
  let bookings: any[] = [];
  if (eventIds.length > 0) {
    const { data, error: bookingsError } = await supabase
      .from('bookings')
      .select('total_amount, status')
      .in('event_id', eventIds)
      .eq('status', 'confirmed');

    if (bookingsError) {
      throw new Error(bookingsError.message);
    }
    bookings = data || [];
  }

  interface BookingData {
    total_amount: number;
    status: string;
  }
  const bookingsList = bookings as BookingData[];

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
