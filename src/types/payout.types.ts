export type PayoutRequestStatus = 'pending' | 'approved' | 'rejected' | 'processing' | 'completed';

export interface PayoutRequest {
  id: string;
  host_id: string;
  requested_amount: number;
  earned_amount: number;
  status: PayoutRequestStatus;
  request_note?: string;
  admin_note?: string;
  rejection_reason?: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;

  // Joined data
  host?: {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    avatar_url?: string;
  };

  // Bank details from host_requests table
  bank_details?: {
    account_holder_name: string;
    beneficiary_name: string;
    account_number: string;
    ifsc_code: string;
  };
}

export interface CreatePayoutRequestData {
  requested_amount: number;
  request_note?: string;
}

export interface ApprovePayoutRequestData {
  admin_note?: string;
}

export interface RejectPayoutRequestData {
  rejection_reason: string;
  admin_note?: string;
}

export interface HostEarnings {
  total_earnings: number;
  pending_payouts: number;
  completed_payouts: number;
  available_for_withdrawal: number;
  total_bookings: number;
  completed_events: number;
}
