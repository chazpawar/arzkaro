import { supabase } from '../lib/supabase';
import type { HostRequest, HostRequestData, HostStats } from '../types/host';
import type { AppEvent } from '../hooks/useEvents';
import {
  validatePAN,
  validatePhone,
  validateEmail,
  validateIFSC,
  validatePIN,
  validateGSTIN,
  validateRequired,
  validateAccountNumber
} from '../utils/validation';

/**
 * Validation helpers
 */
interface HostRequestValidation {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Validate complete host request data
 */
export function validateHostRequest(data: HostRequestData): HostRequestValidation {
  const errors: Record<string, string> = {};

  // Personal Information
  const nameValidation = validateRequired(data.organizer_name, 'Organizer name');
  if (!nameValidation.isValid) errors.organizer_name = nameValidation.error!;

  const phoneValidation = validatePhone(data.contact_number);
  if (!phoneValidation.isValid) errors.contact_number = phoneValidation.error!;

  const emailValidation = validateEmail(data.email);
  if (!emailValidation.isValid) errors.email = emailValidation.error!;

  // Address
  const addressValidation = validateRequired(data.street_address, 'Street address', 5);
  if (!addressValidation.isValid) errors.street_address = addressValidation.error!;

  const cityValidation = validateRequired(data.city, 'City');
  if (!cityValidation.isValid) errors.city = cityValidation.error!;

  const stateValidation = validateRequired(data.state, 'State');
  if (!stateValidation.isValid) errors.state = stateValidation.error!;

  const pinValidation = validatePIN(data.pin_code);
  if (!pinValidation.isValid) errors.pin_code = pinValidation.error!;

  // KYC
  const panValidation = validatePAN(data.pan_number);
  if (!panValidation.isValid) errors.pan_number = panValidation.error!;

  if (!data.pan_card_photo_url || !data.pan_card_photo_url.trim()) {
    errors.pan_card_photo_url = 'PAN card photo is required';
  }

  // GSTIN (only for full hosts)
  if (data.requested_host_type === 'full' && data.gstin) {
    const gstinValidation = validateGSTIN(data.gstin);
    if (!gstinValidation.isValid) errors.gstin = gstinValidation.error!;
  }

  // Bank Details
  const holderValidation = validateRequired(data.account_holder_name, 'Account holder name');
  if (!holderValidation.isValid) errors.account_holder_name = holderValidation.error!;

  const accountValidation = validateAccountNumber(data.account_number);
  if (!accountValidation.isValid) errors.account_number = accountValidation.error!;

  const ifscValidation = validateIFSC(data.ifsc_code);
  if (!ifscValidation.isValid) errors.ifsc_code = ifscValidation.error!;

  const beneficiaryValidation = validateRequired(data.beneficiary_name, 'Beneficiary name');
  if (!beneficiaryValidation.isValid) errors.beneficiary_name = beneficiaryValidation.error!;

  return {
    isValid: Object.keys(errors).length === 0,
    errors
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
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    throw new Error(error.message);
  }

  return !!data;
}

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

  // 3. Insert data
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
