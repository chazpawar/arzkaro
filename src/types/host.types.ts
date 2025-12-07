/**
 * Host System Type Definitions
 * Comprehensive types for the multi-tier host system with KYC
 */

export type HostType = 'full' | 'activity';
export type HostRequestStatus = 'pending' | 'approved' | 'rejected';

/**
 * Full Host Request Data
 * For hosts who want to create Events, Trips, AND Activities
 */
export interface FullHostRequestData {
  // User Reference
  user_id: string;
  requested_host_type: 'full';

  // Personal/Business Information
  organizer_name: string; // Company name or individual name
  contact_number: string; // +91 format
  email: string; // From signup

  // Address
  street_address: string;
  city: string;
  state: string;
  pin_code: string; // 6 digits

  // KYC Documents
  pan_number: string; // Format: ABCDE1234F
  gstin?: string; // Optional, for businesses with GST

  // Bank Details
  account_holder_name: string;
  beneficiary_name: string;
  account_number: string;
  ifsc_code: string; // Format: ABCD0123456

  // Document Links
  pan_card_photo_url: string; // Google Drive or cloud storage link
  gst_certificate_url?: string; // Optional, required if GSTIN provided
}

/**
 * Activity Host Request Data
 * For hosts who want to create Activities ONLY
 */
export interface ActivityHostRequestData {
  // User Reference
  user_id: string;
  requested_host_type: 'activity';

  // Personal Information
  organizer_name: string; // Host's name
  contact_number: string; // +91 format
  email: string; // From signup

  // Address
  street_address: string;
  city: string;
  state: string;
  pin_code: string; // 6 digits

  // KYC Documents
  pan_number: string; // Format: ABCDE1234F

  // Bank Details
  account_holder_name: string;
  beneficiary_name: string;
  account_number: string;
  ifsc_code: string; // Format: ABCD0123456

  // Document Links
  pan_card_photo_url: string; // Google Drive or cloud storage link
}

/**
 * Union type for both host request types
 */
export type HostRequestData = FullHostRequestData | ActivityHostRequestData;

/**
 * Host Request from Database (with all fields)
 */
export interface HostRequest {
  id: string;
  user_id: string;
  requested_host_type: HostType;

  // Personal/Business Info
  organizer_name: string;
  contact_number: string;
  email: string;

  // Address
  street_address: string;
  city: string;
  state: string;
  pin_code: string;

  // KYC Documents
  pan_number: string;
  gstin: string | null;

  // Bank Details
  account_holder_name: string;
  beneficiary_name: string;
  account_number: string;
  ifsc_code: string;

  // Document Links
  pan_card_photo_url: string;
  gst_certificate_url: string | null;

  // Status & Review
  status: HostRequestStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  admin_notes: string | null;
  rejection_reason: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}

/**
 * Host Request with User Profile (for admin display)
 */
export interface HostRequestWithUser extends HostRequest {
  user?: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
    username: string | null;
    created_at: string;
  };
  reviewer?: {
    id: string;
    full_name: string | null;
    email: string;
  };
}

/**
 * Host Request Form Data (frontend form state)
 */
export interface HostRequestFormData {
  host_type: HostType;

  // Personal/Business
  organizer_name: string;
  contact_number: string;
  email: string;

  // Address
  street_address: string;
  city: string;
  state: string;
  pin_code: string;

  // KYC
  pan_number: string;
  gstin: string;

  // Bank Details
  account_holder_name: string;
  beneficiary_name: string;
  account_number: string;
  ifsc_code: string;

  // Documents
  pan_card_photo_url: string;
  gst_certificate_url: string;
}

/**
 * Validation result for host request form
 */
export interface HostRequestValidation {
  isValid: boolean;
  errors: {
    organizer_name?: string;
    contact_number?: string;
    email?: string;
    street_address?: string;
    city?: string;
    state?: string;
    pin_code?: string;
    pan_number?: string;
    gstin?: string;
    account_holder_name?: string;
    beneficiary_name?: string;
    account_number?: string;
    ifsc_code?: string;
    pan_card_photo_url?: string;
    gst_certificate_url?: string;
  };
}

/**
 * Host approval/rejection response
 */
export interface HostRequestActionResult {
  success: boolean;
  message: string;
}

/**
 * Admin dashboard stats
 */
export interface AdminDashboardStats {
  pending_host_requests: number;
  total_users: number;
  total_hosts: number;
  total_full_hosts: number;
  total_activity_hosts: number;
  total_events: number;
  total_bookings: number;
}

/**
 * Host statistics for user profile
 */
export interface HostStatistics {
  total_events_created: number;
  total_trips_created: number;
  total_activities_created: number;
  total_bookings_received: number;
  total_revenue: number;
  host_since: string;
}

/**
 * Extended Profile with Host Type
 */
export interface ProfileWithHostType {
  id: string;
  email: string;
  full_name: string | null;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  phone: string | null;
  role: 'user' | 'host' | 'admin';
  host_type: HostType | null; // NULL for regular users
  is_host_approved: boolean;
  host_requested_at: string | null;
  host_approved_at: string | null;
  is_public: boolean;
  location: string | null;
  website: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Event creation permission check result
 */
export interface EventCreationPermission {
  canCreate: boolean;
  reason?: string;
  suggestedAction?: string;
}

/**
 * Helper type for event type labels
 */
export const EVENT_TYPE_LABELS: Record<'event' | 'trip' | 'experience', string> = {
  event: 'Event',
  trip: 'Trip',
  experience: 'Activity',
};

/**
 * Helper type for host type labels
 */
export const HOST_TYPE_LABELS: Record<HostType, string> = {
  full: 'Full Host (Events + Trips + Activities)',
  activity: 'Activity Host (Activities Only)',
};

/**
 * Host type descriptions
 */
export const HOST_TYPE_DESCRIPTIONS: Record<HostType, string> = {
  full: 'Create and host Events, Trips, and Activities. Requires complete business verification including GST details.',
  activity: 'Create and host Activities only. Simpler verification process with basic KYC.',
};

/**
 * Permissions matrix
 */
export const HOST_PERMISSIONS = {
  user: {
    canCreateEvents: false,
    canCreateTrips: false,
    canCreateActivities: false,
  },
  activity_host: {
    canCreateEvents: false,
    canCreateTrips: false,
    canCreateActivities: true,
  },
  full_host: {
    canCreateEvents: true,
    canCreateTrips: true,
    canCreateActivities: true,
  },
  admin: {
    canCreateEvents: true,
    canCreateTrips: true,
    canCreateActivities: true,
    canApproveHosts: true,
    canManageUsers: true,
  },
} as const;
