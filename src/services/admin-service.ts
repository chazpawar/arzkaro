import { supabase } from '../../backend/supabase';
import type { Profile, HostRequest } from '../types/user.types';

/**
 * Admin Service - Handles admin-specific operations
 */

// Admin Stats Types
export interface AdminStats {
  totalUsers: number;
  totalHosts: number;
  totalEvents: number;
  totalBookings: number;
  totalRevenue: number;
  pendingHostRequests: number;
  activeEvents: number;
  newUsersThisMonth: number;
}

export interface UserWithDetails extends Profile {
  _count?: {
    bookings: number;
    events: number;
  };
}

export interface HostRequestWithUser extends HostRequest {
  user?: Profile;
}

// Check if user is admin
export async function isAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase.from('profiles').select('role').eq('id', userId).single();

  if (error || !data) return false;
  return (data as Record<string, string>).role === 'admin';
}

// Get admin dashboard stats
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
  ]);

  const totalRevenue =
    bookingsResult.data?.reduce(
      (sum, b) => sum + ((b as Record<string, number>).total_amount || 0),
      0
    ) || 0;

  return {
    totalUsers: usersResult.count || 0,
    totalHosts: hostsResult.count || 0,
    totalEvents: eventsResult.count || 0,
    totalBookings: bookingsResult.data?.length || 0,
    totalRevenue,
    pendingHostRequests: pendingRequestsResult.count || 0,
    activeEvents: activeEventsResult.count || 0,
    newUsersThisMonth: newUsersResult.count || 0,
  };
}

// Get all users with pagination and search
export async function getUsers(options: {
  page?: number;
  limit?: number;
  search?: string;
  role?: 'user' | 'host' | 'admin' | 'all';
}): Promise<{ users: Profile[]; total: number }> {
  const { page = 1, limit = 20, search, role = 'all' } = options;
  const offset = (page - 1) * limit;

  let query = supabase.from('profiles').select('*', { count: 'exact' });

  // Apply role filter
  if (role !== 'all') {
    query = query.eq('role', role);
  }

  // Apply search filter
  if (search) {
    query = query.or(
      `full_name.ilike.%${search}%,email.ilike.%${search}%,username.ilike.%${search}%`
    );
  }

  // Apply pagination and ordering
  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return {
    users: (data || []) as Profile[],
    total: count || 0,
  };
}

// Get single user details
export async function getUserDetails(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(error.message);
  }

  return data as Profile;
}

// Update user role
export async function updateUserRole(
  userId: string,
  role: 'user' | 'host' | 'admin'
): Promise<Profile> {
  const updates: Record<string, unknown> = {
    role,
    updated_at: new Date().toISOString(),
  };

  // If promoting to host, also set is_host_approved
  if (role === 'host') {
    updates.is_host_approved = true;
    updates.host_approved_at = new Date().toISOString();
  }

  // If demoting from host, clear host approval
  if (role === 'user') {
    updates.is_host_approved = false;
    updates.host_approved_at = null;
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Profile;
}

// Get pending host requests
export async function getPendingHostRequests(): Promise<HostRequestWithUser[]> {
  const { data, error } = await supabase
    .from('host_requests')
    .select(
      `
      *,
      user:profiles!user_id(id, full_name, email, avatar_url, username, created_at)
    `
    )
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []) as HostRequestWithUser[];
}

// Get all host requests with filtering
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
    requests: (data || []) as HostRequestWithUser[],
    total: count || 0,
  };
}

// Approve host request
export async function approveHostRequest(
  requestId: string,
  adminId: string,
  adminNotes?: string
): Promise<HostRequest> {
  // Get the request first to find the user
  const { data: request, error: fetchError } = await supabase
    .from('host_requests')
    .select('user_id')
    .eq('id', requestId)
    .single();

  if (fetchError || !request) {
    throw new Error('Host request not found');
  }

  const now = new Date().toISOString();

  // Update the request
  const { data: updatedRequest, error: requestError } = await supabase
    .from('host_requests')
    .update({
      status: 'approved',
      reviewed_by: adminId,
      reviewed_at: now,
      admin_notes: adminNotes || null,
    } as Record<string, unknown>)
    .eq('id', requestId)
    .select()
    .single();

  if (requestError) {
    throw new Error(requestError.message);
  }

  // Update the user's profile to make them a host
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      role: 'host',
      is_host_approved: true,
      host_approved_at: now,
      updated_at: now,
    } as Record<string, unknown>)
    .eq('id', (request as Record<string, string>).user_id);

  if (profileError) {
    throw new Error(profileError.message);
  }

  return updatedRequest as HostRequest;
}

// Reject host request
export async function rejectHostRequest(
  requestId: string,
  adminId: string,
  adminNotes?: string
): Promise<HostRequest> {
  const { data, error } = await supabase
    .from('host_requests')
    .update({
      status: 'rejected',
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
      admin_notes: adminNotes || null,
    } as Record<string, unknown>)
    .eq('id', requestId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as HostRequest;
}

// Get recent activity (bookings, new users, etc.)
export async function getRecentActivity(limit = 10) {
  const [recentBookings, recentUsers, recentEvents] = await Promise.all([
    supabase
      .from('bookings')
      .select(
        `
        id, created_at, total_amount, status,
        user:profiles!user_id(full_name, email),
        event:events!event_id(title)
      `
      )
      .order('created_at', { ascending: false })
      .limit(limit),
    supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url, created_at')
      .order('created_at', { ascending: false })
      .limit(limit),
    supabase
      .from('events')
      .select('id, title, created_at, host_id, is_published')
      .order('created_at', { ascending: false })
      .limit(limit),
  ]);

  return {
    bookings: recentBookings.data || [],
    users: recentUsers.data || [],
    events: recentEvents.data || [],
  };
}

// Delete user (soft delete - just marks as inactive, or hard delete)
export async function deleteUser(userId: string): Promise<void> {
  // For now, we'll just delete the user. In production, you might want soft delete.
  // Note: This will cascade delete related data based on DB constraints
  const { error } = await supabase.from('profiles').delete().eq('id', userId);

  if (error) {
    throw new Error(error.message);
  }
}

// Get event management data
export async function getEventsForAdmin(options: {
  page?: number;
  limit?: number;
  status?: 'published' | 'draft' | 'cancelled' | 'all';
}): Promise<{ events: unknown[]; total: number }> {
  const { page = 1, limit = 20, status = 'all' } = options;
  const offset = (page - 1) * limit;

  let query = supabase.from('events').select(
    `
      *,
      host:profiles!host_id(id, full_name, email, avatar_url)
    `,
    { count: 'exact' }
  );

  if (status === 'published') {
    query = query.eq('is_published', true).eq('is_cancelled', false);
  } else if (status === 'draft') {
    query = query.eq('is_published', false);
  } else if (status === 'cancelled') {
    query = query.eq('is_cancelled', true);
  }

  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return {
    events: data || [],
    total: count || 0,
  };
}

// Cancel event (admin action)
export async function cancelEvent(eventId: string): Promise<void> {
  const { error } = await supabase
    .from('events')
    .update({
      is_cancelled: true,
      is_published: false,
      updated_at: new Date().toISOString(),
    } as Record<string, unknown>)
    .eq('id', eventId);

  if (error) {
    throw new Error(error.message);
  }
}
