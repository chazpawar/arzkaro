/**
 * Host System Type Definitions
 */

export type HostType = 'full' | 'activity';
export type HostRequestStatus = 'pending' | 'approved' | 'rejected';

export interface HostRequestData {
  user_id: string;
  requested_host_type: HostType;
  organizer_name: string;
  contact_number: string;
  email: string;
  street_address: string;
  city: string;
  state: string;
  pin_code: string;
  pan_number: string;
  gstin?: string;
  account_holder_name: string;
  beneficiary_name: string;
  account_number: string;
  ifsc_code: string;
  pan_card_photo_url: string;
  gst_certificate_url?: string;
}

export interface HostRequest {
  id: string;
  user_id: string;
  requested_host_type: HostType;
  organizer_name: string;
  contact_number: string;
  email: string;
  street_address: string;
  city: string;
  state: string;
  pin_code: string;
  pan_number: string;
  gstin: string | null;
  account_holder_name: string;
  beneficiary_name: string;
  account_number: string;
  ifsc_code: string;
  pan_card_photo_url: string;
  gst_certificate_url: string | null;
  status: HostRequestStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  admin_notes: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface HostStats {
  totalEvents: number;
  publishedEvents: number;
  totalBookings: number;
  totalRevenue: number;
  upcomingEvents: number;
}
