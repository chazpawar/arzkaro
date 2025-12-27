import { supabase } from '../../backend/supabase';
import {
  PayoutRequest,
  CreatePayoutRequestData,
  ApprovePayoutRequestData,
  RejectPayoutRequestData,
  HostEarnings,
} from '../types/payout.types';

/**
 * Calculate host earnings from their events
 */
export async function getHostEarnings(hostId: string): Promise<HostEarnings> {
  try {
    // Get all confirmed bookings for host's events
    const { data: events } = await supabase.from('events').select('id').eq('host_id', hostId);

    const eventIds = events?.map((e) => e.id) || [];

    // Calculate total earnings from bookings
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('total_amount')
      .eq('status', 'confirmed')
      .in('event_id', eventIds);

    if (bookingsError) throw bookingsError;

    const totalEarnings =
      bookings?.reduce((sum, booking) => sum + Number(booking.total_amount), 0) || 0;

    // Get pending payout requests total (not yet completed)
    const { data: pendingPayouts, error: pendingError } = await supabase
      .from('payout_requests')
      .select('requested_amount')
      .eq('host_id', hostId)
      .in('status', ['pending', 'approved', 'processing']);

    if (pendingError) throw pendingError;

    const pendingPayoutsAmount =
      pendingPayouts?.reduce((sum, payout) => sum + Number(payout.requested_amount), 0) || 0;

    // Get completed payout requests total (already paid out)
    const { data: completedPayouts, error: completedError } = await supabase
      .from('payout_requests')
      .select('requested_amount')
      .eq('host_id', hostId)
      .eq('status', 'completed');

    if (completedError) throw completedError;

    const completedPayoutsAmount =
      completedPayouts?.reduce((sum, payout) => sum + Number(payout.requested_amount), 0) || 0;

    // Get total bookings count
    const { count: totalBookings } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'confirmed')
      .in('event_id', eventIds);

    // Count completed events
    const { count: completedEvents } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('host_id', hostId)
      .lt('end_date', new Date().toISOString());

    return {
      total_earnings: totalEarnings,
      pending_payouts: pendingPayoutsAmount,
      completed_payouts: completedPayoutsAmount,
      available_for_withdrawal: totalEarnings - pendingPayoutsAmount - completedPayoutsAmount,
      total_bookings: totalBookings || 0,
      completed_events: completedEvents || 0,
    };
  } catch (error) {
    console.error('Error fetching host earnings:', error);
    throw error;
  }
}

/**
 * Create a new payout request
 */
export async function createPayoutRequest(
  hostId: string,
  data: CreatePayoutRequestData
): Promise<PayoutRequest> {
  try {
    // Get current earnings to validate
    const earnings = await getHostEarnings(hostId);

    if (data.requested_amount > earnings.available_for_withdrawal) {
      throw new Error('Requested amount exceeds available balance');
    }

    if (data.requested_amount <= 0) {
      throw new Error('Requested amount must be greater than 0');
    }

    // Create payout request
    // Note: earned_amount will be set automatically by the trigger
    const { data: payoutRequest, error } = await supabase
      .from('payout_requests')
      .insert({
        host_id: hostId,
        requested_amount: data.requested_amount,
        earned_amount: earnings.total_earnings, // Will be validated by trigger
        status: 'pending',
        request_note: data.request_note,
      })
      .select()
      .single();

    if (error) throw error;

    return payoutRequest;
  } catch (error) {
    console.error('Error creating payout request:', error);
    throw error;
  }
}

/**
 * Get all payout requests for a host
 */
export async function getHostPayoutRequests(hostId: string): Promise<PayoutRequest[]> {
  try {
    const { data, error } = await supabase
      .from('payout_requests')
      .select(
        `
        *,
        host:profiles!payout_requests_host_id_fkey(
          id,
          full_name,
          email,
          phone,
          avatar_url
        )
      `
      )
      .eq('host_id', hostId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching host payout requests:', error);
    throw error;
  }
}

/**
 * Get all pending payout requests (admin)
 */
export async function getAllPayoutRequests(status?: string): Promise<PayoutRequest[]> {
  try {
    let query = supabase.from('payout_requests').select(`
        *,
        host:profiles!payout_requests_host_id_fkey(
          id,
          full_name,
          email,
          phone,
          avatar_url
        )
      `);

    if (status && status !== 'all') {
      query = query.eq('status', status as any);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    // Fetch bank details for each host from their approved host_request
    const requestsWithBankDetails = await Promise.all(
      (data || []).map(async (request) => {
        const { data: hostRequest } = await supabase
          .from('host_requests')
          .select('account_holder_name, beneficiary_name, account_number, ifsc_code')
          .eq('user_id', request.host_id)
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        return {
          ...request,
          bank_details: hostRequest || undefined,
        };
      })
    );

    return requestsWithBankDetails;
  } catch (error) {
    console.error('Error fetching payout requests:', error);
    throw error;
  }
}

/**
 * Approve a payout request (admin)
 */
export async function approvePayoutRequest(
  requestId: string,
  adminId: string,
  data: ApprovePayoutRequestData
): Promise<PayoutRequest> {
  try {
    const { data: payoutRequest, error } = await supabase
      .from('payout_requests')
      .update({
        status: 'approved',
        approved_by: adminId,
        approved_at: new Date().toISOString(),
        admin_note: data.admin_note,
      })
      .eq('id', requestId)
      .select()
      .single();

    if (error) throw error;

    return payoutRequest;
  } catch (error) {
    console.error('Error approving payout request:', error);
    throw error;
  }
}

/**
 * Reject a payout request (admin)
 */
export async function rejectPayoutRequest(
  requestId: string,
  adminId: string,
  data: RejectPayoutRequestData
): Promise<PayoutRequest> {
  try {
    const { data: payoutRequest, error } = await supabase
      .from('payout_requests')
      .update({
        status: 'rejected',
        approved_by: adminId,
        approved_at: new Date().toISOString(),
        rejection_reason: data.rejection_reason,
        admin_note: data.admin_note,
      })
      .eq('id', requestId)
      .select()
      .single();

    if (error) throw error;

    return payoutRequest;
  } catch (error) {
    console.error('Error rejecting payout request:', error);
    throw error;
  }
}

/**
 * Mark payout as processing (admin)
 */
export async function markPayoutProcessing(requestId: string): Promise<PayoutRequest> {
  try {
    const { data: payoutRequest, error } = await supabase
      .from('payout_requests')
      .update({
        status: 'processing',
      })
      .eq('id', requestId)
      .select()
      .single();

    if (error) throw error;

    return payoutRequest;
  } catch (error) {
    console.error('Error marking payout as processing:', error);
    throw error;
  }
}

/**
 * Mark payout as completed (admin)
 */
export async function markPayoutCompleted(requestId: string): Promise<PayoutRequest> {
  try {
    const { data: payoutRequest, error } = await supabase
      .from('payout_requests')
      .update({
        status: 'completed',
      })
      .eq('id', requestId)
      .select()
      .single();

    if (error) throw error;

    return payoutRequest;
  } catch (error) {
    console.error('Error marking payout as completed:', error);
    throw error;
  }
}

/**
 * Get payout request statistics (admin)
 */
export async function getPayoutStatistics() {
  try {
    const { data, error } = await supabase
      .from('payout_requests')
      .select('status, requested_amount');

    if (error) throw error;

    const stats = {
      pending: { count: 0, amount: 0 },
      approved: { count: 0, amount: 0 },
      processing: { count: 0, amount: 0 },
      completed: { count: 0, amount: 0 },
      rejected: { count: 0, amount: 0 },
      total: { count: 0, amount: 0 },
    };

    data?.forEach((request) => {
      const status = request.status;
      if (stats[status]) {
        stats[status].count += 1;
        stats[status].amount += Number(request.requested_amount);
      }
      stats.total.count += 1;
      stats.total.amount += Number(request.requested_amount);
    });

    return stats;
  } catch (error) {
    console.error('Error fetching payout statistics:', error);
    throw error;
  }
}
