// User and Profile Types

export type UserRole = 'user' | 'host' | 'admin';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  phone: string | null;
  role: UserRole;
  is_host_approved: boolean;
  host_requested_at: string | null;
  host_approved_at: string | null;
  is_public: boolean;
  location: string | null;
  website: string | null;
  created_at: string;
  updated_at: string;
}

export interface PublicProfile {
  id: string;
  full_name: string | null;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  role: UserRole;
  is_public: boolean;
  location: string | null;
  website: string | null;
}

export interface HostRequest {
  id: string;
  user_id: string;
  reason: string;
  business_name: string | null;
  business_type: string | null;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by: string | null;
  reviewed_at: string | null;
  admin_notes: string | null;
  created_at: string;
}

export interface CreateHostRequest {
  reason: string;
  business_name?: string;
  business_type?: string;
}
