import { supabase } from '../lib/supabase';
import type { 
  AdminStats, 
  HostRequestWithUser, 
  PayoutRequest,
  PayoutStatistics 
} from '../types/admin';

/**
 * Admin Service - Handles all admin-specific operations
 */

// Check if user is admin
export async function isAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (error || !data) return false;
  return data.role === 'admin';
}

// Get admin dashboard statistics
export async function getAdminStats(): Promise<AdminStats> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // Get all counts in parallel
  const [
    usersResult,
    hostsResult,
    eventsResult,
    bookingsResult,
    pendingRequestsResult,
    newUsersResult,
    activeEventsResult,
    payoutsResult,
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'host'),
    supabase.from('events').select('id', { count: 'exact', head: true }),
    supabase.from('bookings').select('id, total_amount').eq('status', 'confirmed'),
    supabase
      .from('host_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', startOfMonth),
    supabase
      .from('events')
      .select('id', { count: 'exact', head: true })
      .eq('is_published', true)
      .gte('end_date', now.toISOString()),
    supabase
      .from('payout_requests')
      .select('id, amount')
      .eq('status', 'pending'),
  ]);

  const totalRevenue =
    bookingsResult.data?.reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0) || 0;

  const totalPayoutAmount =
    payoutsResult.data?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;

  return {
    totalUsers: usersResult.count || 0,
    totalHosts: hostsResult.count || 0,
    totalEvents: eventsResult.count || 0,
    totalBookings: bookingsResult.data?.length || 0,
    totalRevenue,
    pendingHostRequests: pendingRequestsResult.count || 0,
    activeEvents: activeEventsResult.count || 0,
    newUsersThisMonth: newUsersResult.count || 0,
    pendingPayouts: payoutsResult.count || 0,
    totalPayoutAmount,
  };
}

// Get host requests with filtering
export async function getHostRequests(options: {
  status?: 'pending' | 'approved' | 'rejected' | 'all';
  page?: number;
  limit?: number;
}): Promise<{ requests: HostRequestWithUser[]; total: number }> {
  const { status = 'all', page = 1, limit = 20 } = options;
  const offset = (page - 1) * limit;

  let query = supabase.from('host_requests').select(
    `
      *,
      user:profiles!user_id(id, full_name, email, avatar_url, username, created_at)
    `,
    { count: 'exact' }
  );

  if (status !== 'all') {
    query = query.eq('status', status);
  }

  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return {
    requests: (data || []) as unknown as HostRequestWithUser[],
    total: count || 0,
  };
}

// Approve host request
export async function approveHostRequest(
  requestId: string,
  adminId: string,
  adminNotes?: string
): Promise<void> {
  // Use database function for atomic approval
  const { data, error } = await supabase.rpc('approve_host_request', {
    p_request_id: requestId,
    p_admin_id: adminId,
    p_admin_notes: adminNotes || null,
  });

  if (error) {
    throw new Error(error.message);
  }

  // Check if approval succeeded
  const result = data as unknown as { success: boolean; message: string }[];
  if (!result || result.length === 0 || !result[0].success) {
    throw new Error(result?.[0]?.message || 'Failed to approve host request');
  }
}

// Reject host request
export async function rejectHostRequest(
  requestId: string,
  adminId: string,
  rejectionReason: string,
  adminNotes?: string
): Promise<void> {
  // Use database function for rejection
  const { data, error } = await supabase.rpc('reject_host_request', {
    p_request_id: requestId,
    p_admin_id: adminId,
    p_rejection_reason: rejectionReason,
    p_admin_notes: adminNotes || null,
  });

  if (error) {
    throw new Error(error.message);
  }

  // Check if rejection succeeded
  const result = data as unknown as { success: boolean; message: string }[];
  if (!result || result.length === 0 || !result[0].success) {
    throw new Error(result?.[0]?.message || 'Failed to reject host request');
  }
}

// Get all payout requests
export async function getAllPayoutRequests(
  status?: string
): Promise<PayoutRequest[]> {
  let query = supabase
    .from('payout_requests')
    .select(`
      *,
      host:profiles!host_id(
        id,
        full_name,
        email,
        avatar_url,
        phone
      )
    `)
    .order('created_at', { ascending: false });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  // Fetch bank details for each host from their approved host_request
  const payoutsWithBankDetails = await Promise.all(
    (data || []).map(async (payout) => {
      const { data: hostRequest } = await supabase
        .from('host_requests')
        .select('account_holder_name, beneficiary_name, account_number, ifsc_code')
        .eq('user_id', payout.host_id)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      return {
        ...payout,
        bank_details: hostRequest || undefined,
      } as unknown as PayoutRequest;
    })
  );

  return payoutsWithBankDetails;
}

// Get payout statistics
export async function getPayoutStatistics(): Promise<PayoutStatistics> {
  const { data, error } = await supabase
    .from('payout_requests')
    .select('status, requested_amount');

  if (error) {
    throw new Error(error.message);
  }

  const stats: PayoutStatistics = {
    pending: { count: 0, total_amount: 0 },
    approved: { count: 0, total_amount: 0 },
    processing: { count: 0, total_amount: 0 },
    completed: { count: 0, total_amount: 0 },
    rejected: { count: 0, total_amount: 0 },
  };

  data?.forEach((payout) => {
    const status = payout.status as keyof PayoutStatistics;
    if (stats[status]) {
      stats[status].count += 1;
      stats[status].total_amount += Number(payout.requested_amount) || 0;
    }
  });

  return stats;
}

// Approve payout request
export async function approvePayoutRequest(
  payoutId: string,
  adminId: string,
  options?: { admin_note?: string }
): Promise<void> {
  const { error } = await supabase
    .from('payout_requests')
    .update({
      status: 'approved',
      approved_by: adminId,
      approved_at: new Date().toISOString(),
      admin_note: options?.admin_note || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', payoutId);

  if (error) {
    throw new Error(error.message);
  }
}

// Reject payout request
export async function rejectPayoutRequest(
  payoutId: string,
  adminId: string,
  options: { rejection_reason: string; admin_note?: string }
): Promise<void> {
  const { error } = await supabase
    .from('payout_requests')
    .update({
      status: 'rejected',
      approved_by: adminId,
      approved_at: new Date().toISOString(),
      rejection_reason: options.rejection_reason,
      admin_note: options.admin_note || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', payoutId);

  if (error) {
    throw new Error(error.message);
  }
}

// Mark payout as processing
export async function markPayoutProcessing(payoutId: string): Promise<void> {
  const { error } = await supabase
    .from('payout_requests')
    .update({
      status: 'processing',
      processed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', payoutId);

  if (error) {
    throw new Error(error.message);
  }
}

// Mark payout as completed
export async function markPayoutCompleted(payoutId: string): Promise<void> {
  const { error } = await supabase
    .from('payout_requests')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', payoutId);

  if (error) {
    throw new Error(error.message);
  }
}

// Create signed URL for document viewing
export async function getDocumentSignedUrl(
  bucket: string,
  path: string,
  expiresIn = 3600
): Promise<string | null> {
  try {
    // Extract path from public URL if needed
    const extractPath = (url: string) => {
      const bucketMatch = url.match(new RegExp(`${bucket}/(.+)$`));
      return bucketMatch ? bucketMatch[1] : url;
    };

    const cleanPath = extractPath(path);

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(cleanPath, expiresIn);

    if (error) {
      console.error('Error creating signed URL:', error);
      return null;
    }

    return data?.signedUrl || null;
  } catch (error) {
    console.error('Error in getDocumentSignedUrl:', error);
    return null;
  }
}
