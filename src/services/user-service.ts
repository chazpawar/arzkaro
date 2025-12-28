import { supabase } from '../../backend/supabase';
import type { Profile } from '../types/user.types';

export interface UpdateProfileData {
  full_name?: string;
  username?: string;
  bio?: string;
  avatar_url?: string;
  phone?: string;
  location?: string;
  website?: string;
  is_public?: boolean;
  date_of_birth?: string;
  gender?: string;
  instagram?: string;
  youtube?: string;
  linkedin?: string;
  twitter?: string;
  interests?: string[];
}

/**
 * Get user profile by ID
 */
export async function getProfile(userId: string): Promise<Profile | null> {
  try {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();

    if (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getProfile:', error);
    return null;
  }
}

/**
 * Update user profile
 */
export async function updateProfile(userId: string, updates: UpdateProfileData): Promise<Profile> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      throw error;
    }

    if (!data) {
      throw new Error('Profile update failed - no data returned');
    }

    return data;
  } catch (error) {
    console.error('Error in updateProfile:', error);
    throw error;
  }
}

/**
 * Check if username is available
 */
export async function isUsernameAvailable(
  username: string,
  currentUserId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .neq('id', currentUserId)
      .single();

    if (error && error.code === 'PGRST116') {
      // No rows found - username is available
      return true;
    }

    if (error) {
      console.error('Error checking username:', error);
      return false;
    }

    // Username exists for another user
    return !data;
  } catch (error) {
    console.error('Error in isUsernameAvailable:', error);
    return false;
  }
}

/**
 * Update profile avatar
 */
export async function updateProfileAvatar(userId: string, avatarUrl: string): Promise<Profile> {
  return updateProfile(userId, { avatar_url: avatarUrl });
}
