import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, hasValidCredentials } from '../../backend/supabase';
import type { Profile, UserRole } from '../types';

// Timeout for initial auth check (5 seconds)
const AUTH_TIMEOUT_MS = 5000;

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  profileLoading: boolean;
  isAuthenticated: boolean;
  isHost: boolean;
  isAdmin: boolean;
  role: UserRole;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
  signInAsAdmin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  profileLoading: false,
  isAuthenticated: false,
  isHost: false,
  isAdmin: false,
  role: 'user',
  signOut: async () => {
    /* noop */
  },
  refreshProfile: async () => {
    /* noop */
  },
  updateProfile: async () => ({ error: null }),
  signInAsAdmin: async () => {
    /* noop */
  },
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const loadingRef = useRef(true); // Use ref to track loading state for timeout

  // Update ref when loading changes
  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  // Fetch user profile from database
  const fetchProfile = useCallback(async (userId: string) => {
    setProfileLoading(true);
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();

      if (error) {
        // Check for missing table error
        if (error.code === 'PGRST205') {
          console.warn('Database setup incomplete: profiles table missing. Please run migrations.');
          return null;
        }

        // Check for profile not found error (PGRST116 - result contains 0 rows)
        if (error.code === 'PGRST116') {
          console.log('Profile not found for user, creating new profile...');

          // Get user metadata from auth
          const {
            data: { user },
            error: userError,
          } = await supabase.auth.getUser();

          if (userError || !user) {
            console.error('Error getting user metadata:', userError);
            return null;
          }

          // Create new profile from user metadata
          const newProfile = {
            id: userId,
            email: user.email || null,
            full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
            username: user.user_metadata?.preferred_username || user.email?.split('@')[0] || null,
            avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
            role: 'user' as UserRole,
            is_host_approved: false,
            is_public: true,
          };

          const { data: createdProfile, error: createError } = await supabase
            .from('profiles')
            .upsert(newProfile, { onConflict: 'id' })
            .select()
            .single();

          if (createError) {
            console.error('Error creating profile:', createError);
            return null;
          }

          console.log('Profile created successfully:', createdProfile);
          return createdProfile as Profile;
        }

        console.error('Error fetching profile:', error);
        return null;
      }

      return data as Profile;
    } catch (err) {
      console.error('Error fetching profile:', err);
      return null;
    } finally {
      setProfileLoading(false);
    }
  }, []);

  // Refresh profile data
  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
    }
  }, [user?.id, fetchProfile]);

  // Update profile
  const updateProfile = useCallback(
    async (updates: Partial<Profile>) => {
      if (!user?.id) {
        return { error: new Error('No user logged in') };
      }

      try {
        const { error } = await supabase
          .from('profiles')
          .update(updates as Record<string, unknown>)
          .eq('id', user.id);

        if (error) {
          return { error: new Error(error.message) };
        }

        // Refresh profile after update
        await refreshProfile();
        return { error: null };
      } catch (err) {
        return { error: err instanceof Error ? err : new Error('Unknown error') };
      }
    },
    [user?.id, refreshProfile]
  );

  // Sign out
  const signOut = useCallback(async () => {
    try {
      // Sign out from Supabase
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      // Always clear local state regardless of API response
      setSession(null);
      setUser(null);
      setProfile(null);
    }
  }, []);

  // Sign in as admin (for development/testing only)
  const signInAsAdmin = useCallback(async () => {
    // Create a mock admin session and user
    const mockUser = {
      id: 'dev-admin-001',
      aud: 'authenticated',
      role: 'authenticated',
      email: 'admin@arzkaro.dev',
      app_metadata: {},
      user_metadata: {},
      created_at: new Date().toISOString(),
    } as User;

    const mockSession = {
      access_token: 'dev-mock-token',
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: Date.now() + 3600000,
      refresh_token: 'dev-mock-refresh',
      user: mockUser,
    } as Session;

    const mockAdminProfile: Profile = {
      id: 'dev-admin-001',
      email: 'admin@arzkaro.dev',
      full_name: 'Dev Admin',
      username: 'devadmin',
      bio: 'Development admin account',
      avatar_url: null,
      phone: null,
      role: 'admin',
      is_host_approved: true,
      host_requested_at: null,
      host_approved_at: new Date().toISOString(),
      is_public: true,
      location: null,
      website: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Set the mock session, user, and profile
    setSession(mockSession);
    setUser(mockUser);
    setProfile(mockAdminProfile);
    setLoading(false);
  }, []);

  // Initialize auth state
  useEffect(() => {
    let isMounted = true;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    // Set a timeout to prevent infinite loading - this runs regardless of credential check
    timeoutId = setTimeout(() => {
      if (isMounted && loadingRef.current) {
        console.warn('Auth initialization timed out after', AUTH_TIMEOUT_MS, 'ms');
        setLoading(false);
      }
    }, AUTH_TIMEOUT_MS);

    const initAuth = async () => {
      // If no valid credentials, skip auth check and show auth screen
      if (!hasValidCredentials) {
        console.warn('No valid Supabase credentials, skipping auth initialization');
        if (isMounted) {
          setLoading(false);
        }
        return;
      }

      try {
        // Get initial session
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error('Error getting session:', error);
          if (isMounted) {
            setLoading(false);
          }
          return;
        }

        if (isMounted) {
          setSession(session);
          setUser(session?.user ?? null);

          if (session?.user) {
            const profileData = await fetchProfile(session.user.id);
            if (isMounted) {
              setProfile(profileData);
            }
          }

          setLoading(false);
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const profileData = await fetchProfile(session.user.id);
        if (isMounted) {
          setProfile(profileData);
        }
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // Computed values
  const isAuthenticated = !!user && !!session;
  const role: UserRole = profile?.role ?? 'user';
  const isHost = role === 'host' || role === 'admin';
  const isAdmin = role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        loading,
        profileLoading,
        isAuthenticated,
        isHost,
        isAdmin,
        role,
        signOut,
        refreshProfile,
        updateProfile,
        signInAsAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
