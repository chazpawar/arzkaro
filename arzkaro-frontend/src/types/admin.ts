// Admin Dashboard Types

export interface AdminStats {
  totalUsers: number;
  totalHosts: number;
  totalEvents: number;
  totalBookings: number;
  totalRevenue: number;
  pendingHostRequests: number;
  activeEvents: number;
  newUsersThisMonth: number;
  pendingPayouts: number;
  totalPayoutAmount: number;
}

export interface HostRequestWithUser {
  id: string;
  user_id: string;
  requested_host_type: 'activity' | 'full';
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
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
    username: string | null;
    created_at: string;
  };
}

export interface PayoutRequest {
  id: string;
  host_id: string;
  requested_amount: number;
  earned_amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'processing' | 'completed' | 'rejected';
  request_note: string | null;
  admin_note: string | null;
  rejection_reason: string | null;
  approved_by: string | null;
  approved_at: string | null;
  processing_started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  host: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
    phone: string | null;
  };
  // Bank details from host's approved host_request
  bank_details?: {
    account_holder_name: string;
    beneficiary_name: string;
    account_number: string;
    ifsc_code: string;
  };
}

export interface PayoutStatistics {
  pending: {
    count: number;
    total_amount: number;
  };
  approved: {
    count: number;
    total_amount: number;
  };
  processing: {
    count: number;
    total_amount: number;
  };
  completed: {
    count: number;
    total_amount: number;
  };
  rejected: {
    count: number;
    total_amount: number;
  };
}
