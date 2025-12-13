import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, hasValidCredentials } from '../../backend/supabase';
import type { Profile, UserRole } from '../types';

// Timeout for initial auth check (3 seconds for faster loading)
const AUTH_TIMEOUT_MS = 3000;

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  profileLoading: boolean;
  isAuthenticated: boolean;
  isAuthReady: boolean; // New: indicates auth is fully initialized with profile
  isHost: boolean;
  isAdmin: boolean;
  role: UserRole;
  signOut: () => Promise<void>;
  refreshProfile: (userId?: string) => Promise<Profile | null>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  profileLoading: false,
  isAuthenticated: false,
  isAuthReady: false,
  isHost: false,
  isAdmin: false,
  role: 'user',
  signOut: async () => {
    /* noop */
  },
  refreshProfile: async () => null,
  updateProfile: async () => ({ error: null }),
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

  // Fetch user profile from database with retry logic
  const fetchProfile = useCallback(async (userId: string, retryCount = 0) => {
    const MAX_RETRIES = 3;
    const RETRY_DELAY_MS = 1000;
    const FETCH_TIMEOUT_MS = 8000; // 8 second timeout for slow networks

    setProfileLoading(true);
    try {
      console.log(
        `🔍 [AUTH] Fetching profile for user: ${userId} (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`
      );

      // Check if session exists before making request
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      if (!currentSession) {
        console.error('❌ [AUTH] No session found when trying to fetch profile');
        return null;
      }

      console.log('✅ [AUTH] Session exists, proceeding with profile fetch');
      console.log('🔑 [AUTH] Session details:', {
        userId: currentSession.user?.id,
        accessToken: currentSession.access_token
          ? `${currentSession.access_token.substring(0, 20)}...`
          : 'none',
        expiresAt: currentSession.expires_at,
        refreshToken: currentSession.refresh_token ? 'present' : 'missing',
      });

      // Create a promise that rejects after timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Request timeout'));
        }, FETCH_TIMEOUT_MS);
      });

      // Test connectivity with a simple count query first (on first attempt only)
      if (retryCount === 0) {
        try {
          console.log('🧪 [AUTH] Testing database connectivity with count query...');
          const testStartTime = Date.now();
          const { error: countError } = await Promise.race([
            supabase.from('profiles').select('*', { count: 'exact', head: true }),
            new Promise<any>((_, reject) =>
              setTimeout(() => reject(new Error('Test timeout')), 3000)
            ),
          ]);
          const testDuration = Date.now() - testStartTime;
          console.log(
            `✅ [AUTH] Connectivity test completed in ${testDuration}ms, error:`,
            countError?.message || 'none'
          );
        } catch (testError: any) {
          console.error('⚠️ [AUTH] Connectivity test failed:', testError.message);
        }
      }

      // Race the fetch against the timeout
      console.log('🚀 [AUTH] Starting profile query for ID:', userId);
      const fetchStartTime = Date.now();
      const fetchPromise = supabase.from('profiles').select('*').eq('id', userId).single();

      let data: any = null;
      let error: any = null;

      try {
        const result = await Promise.race([fetchPromise, timeoutPromise]);
        const fetchDuration = Date.now() - fetchStartTime;
        console.log(`⏱️ [AUTH] Query completed in ${fetchDuration}ms`);
        data = (result as any).data;
        error = (result as any).error;
      } catch (timeoutError: any) {
        const fetchDuration = Date.now() - fetchStartTime;
        console.log(`⏱️ [AUTH] Query timed out after ${fetchDuration}ms`);
        // Timeout occurred
        if (timeoutError.message === 'Request timeout') {
          error = { message: 'Request timeout', code: 'TIMEOUT' };
        } else {
          throw timeoutError;
        }
      }

      console.log('📥 [AUTH] Profile fetch response:', {
        data: data ? { ...data, id: '***' } : null,
        error: error ? error.message : null,
        errorCode: error?.code,
        errorDetails: error?.details,
        errorHint: error?.hint,
      });

      if (error) {
        // Check for timeout
        if (error.code === 'TIMEOUT' || error.message?.includes('timeout')) {
          console.error('⏱️  [AUTH] Profile fetch TIMED OUT after', FETCH_TIMEOUT_MS, 'ms');

          if (retryCount < MAX_RETRIES) {
            const delay = RETRY_DELAY_MS * Math.pow(2, retryCount);
            console.log(`⏳ [AUTH] Retrying after timeout in ${delay}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            return fetchProfile(userId, retryCount + 1);
          }

          console.error('❌ [AUTH] Max retries reached after timeout. Profile fetch failed.');

          // Fallback: Create a temporary profile from session metadata
          console.log('🔄 [AUTH] Creating fallback profile from session user metadata...');
          const user = currentSession?.user;
          if (user && user.email) {
            const fallbackProfile: Profile = {
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
              username: user.user_metadata?.preferred_username || user.email?.split('@')[0] || null,
              avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
              role: 'user' as UserRole,
              host_type: null,
              is_host_approved: false,
              is_public: true,
              bio: null,
              phone: null,
              host_requested_at: null,
              host_approved_at: null,
              location: null,
              website: null,
              created_at: user.created_at || new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            console.log('✅ [AUTH] Using fallback profile from session metadata');
            return fallbackProfile;
          }

          return null;
        }

        // Check for missing table error
        if (error.code === 'PGRST205') {
          console.warn('Database setup incomplete: profiles table missing. Please run migrations.');
          return null;
        }

        // RETRY LOGIC: If query fails and we haven't exceeded retries, try again
        // This handles cases where session hasn't fully propagated yet
        if (
          retryCount < MAX_RETRIES &&
          (error.code === 'PGRST301' || error.message?.includes('JWT'))
        ) {
          const delay = RETRY_DELAY_MS * Math.pow(2, retryCount); // Exponential backoff
          console.log(`⏳ [AUTH] Profile fetch failed, retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          return fetchProfile(userId, retryCount + 1);
        }

        // Check for profile not found error (PGRST116 - result contains 0 rows)
        if (error.code === 'PGRST116') {
          console.log('Profile not found, waiting for database trigger to create it...');

          // The database has a trigger that automatically creates profiles
          // Wait a moment and retry the fetch
          await new Promise((resolve) => setTimeout(resolve, 1000));

          const { data: retryData, error: retryError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

          if (retryError) {
            console.error('Profile still not found after retry:', retryError);

            // As a fallback, manually create the profile (trigger might have failed)
            const {
              data: { user },
              error: userError,
            } = await supabase.auth.getUser();

            if (userError || !user || !user.email) {
              console.error('Cannot create profile - user data unavailable');
              return null;
            }

            const newProfile = {
              id: userId,
              email: user.email,
              full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
              username: user.user_metadata?.preferred_username || user.email?.split('@')[0] || null,
              avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
              role: 'user' as UserRole,
              host_type: null,
              is_host_approved: false,
              is_public: true,
            };

            // Use upsert to safely create or update
            const { data: upsertedProfile, error: upsertError } = await supabase
              .from('profiles')
              .upsert(newProfile, { onConflict: 'id' })
              .select()
              .single();

            if (upsertError) {
              console.error('Error upserting profile:', upsertError);
              return null;
            }

            console.log('Profile created via fallback:', upsertedProfile);
            return upsertedProfile as Profile;
          }

          console.log('✅ Profile found after retry:', retryData);
          return retryData as Profile;
        }

        console.error('❌ [AUTH] Error fetching profile:', error);
        return null;
      }

      console.log('✅ [AUTH] Profile fetched successfully. Role:', data?.role);
      return data as Profile;
    } catch (err) {
      console.error('❌ [AUTH] Error in fetchProfile:', err);
      return null;
    } finally {
      setProfileLoading(false);
    }
  }, []);

  // Refresh profile data - can optionally pass userId for cases where user state isn't set yet
  const refreshProfile = useCallback(
    async (userId?: string) => {
      const targetUserId = userId || user?.id;
      console.log('🔄 [AUTH] Refreshing profile for userId:', targetUserId);

      if (targetUserId) {
        const profileData = await fetchProfile(targetUserId);
        console.log('📋 [AUTH] Setting profile state with role:', profileData?.role);
        setProfile(profileData);
        return profileData;
      }
      return null;
    },
    [user?.id, fetchProfile]
  );

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
      console.log('🚪 [AUTH] Signing out...');
      await supabase.auth.signOut();

      // Force clear all state immediately
      setSession(null);
      setUser(null);
      setProfile(null);

      console.log('✅ [AUTH] Sign out successful');
    } catch (error) {
      console.error('❌ [AUTH] Error signing out:', error);
      // Force clear state even if sign out fails
      setSession(null);
      setUser(null);
      setProfile(null);
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    let isMounted = true;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let isInitialLoad = true;

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

          // Check if it's a refresh token error - clear session and force sign out
          if (
            error.message?.includes('Refresh Token') ||
            error.message?.includes('Invalid') ||
            error.message?.includes('refresh_token') ||
            error.name === 'AuthApiError'
          ) {
            console.log('🔄 [AUTH] Invalid/expired refresh token detected, clearing session...');
            try {
              await supabase.auth.signOut();
              if (isMounted) {
                setSession(null);
                setUser(null);
                setProfile(null);
              }
            } catch (signOutError) {
              console.error('Error signing out after refresh token error:', signOutError);
            }
          }

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
          isInitialLoad = false;
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
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      console.log('🔐 [AUTH] Auth state changed:', event);

      // Handle TOKEN_REFRESHED event errors (session will be null if refresh failed)
      if (event === 'TOKEN_REFRESHED' && !session) {
        console.error('🔄 [AUTH] Token refresh failed - session is null');
        if (isMounted) {
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
        return;
      }

      // Skip initial session event to avoid race condition with initAuth
      if (isInitialLoad && event === 'INITIAL_SESSION') {
        console.log('⏭️  [AUTH] Skipping INITIAL_SESSION event (already handled by initAuth)');
        return;
      }

      // Mark as no longer initial load after first event
      if (event === 'INITIAL_SESSION') {
        isInitialLoad = false;
      }

      // Mark as no longer initial load after first event
      if (event === 'INITIAL_SESSION') {
        isInitialLoad = false;
      }

      setSession(session);
      setUser(session?.user ?? null);

      try {
        if (session?.user) {
          // CRITICAL FIX: Skip profile fetch for SIGNED_IN events
          // The SIGNED_IN event fires DURING exchangeCodeForSession, not after
          // The session hasn't fully propagated yet, so RLS queries timeout
          // The callback screen will explicitly call refreshProfile() AFTER the exchange completes
          if (event === 'SIGNED_IN') {
            console.log(
              '⏭️  [AUTH] SIGNED_IN detected - skipping profile fetch (will be done by callback)'
            );
            // Just set the basic state, profile will be fetched by callback screen
            setLoading(false);
            return;
          }

          try {
            console.log(
              `📡 [AUTH] Fetching profile in ${event} handler for user:`,
              session.user.id
            );

            // CRITICAL FIX: For TOKEN_REFRESHED events, add a delay
            // to ensure the session has fully propagated to Supabase's RLS system
            if (event === 'TOKEN_REFRESHED') {
              console.log('⏳ [AUTH] TOKEN_REFRESHED - waiting 1500ms for session propagation...');
              await new Promise((resolve) => setTimeout(resolve, 1500));
            }

            const profileData = await fetchProfile(session.user.id);
            if (isMounted) {
              console.log(`✅ [AUTH] Profile loaded in ${event} handler, setting state`);
              setProfile(profileData);
            }
          } catch (error) {
            console.error(`❌ [AUTH] Error in ${event} profile fetch:`, error);
            if (isMounted) {
              setProfile(null);
            }
          }
        } else {
          setProfile(null);
        }

        setLoading(false);
      } catch (error: any) {
        console.error(`❌ [AUTH] Unexpected error in ${event} handler:`, error);

        // Check if it's a refresh token error
        if (
          error.message?.includes('Refresh Token') ||
          error.message?.includes('Invalid') ||
          error.message?.includes('refresh_token')
        ) {
          console.log('🔄 [AUTH] Refresh token error in auth state change, signing out...');
          try {
            await supabase.auth.signOut();
          } catch (signOutError) {
            console.error('Error signing out:', signOutError);
          }
        }

        if (isMounted) {
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      }
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
  const isAuthReady = isAuthenticated ? !!profile : !loading; // Auth is ready when: logged in with profile OR logged out
  const role: UserRole = profile?.role ?? 'user';
  const isHost = role === 'host' || role === 'admin';
  const isAdmin = role === 'admin';

  // Log role changes
  useEffect(() => {
    console.log('🎭 [AUTH] Role state updated:', {
      role,
      isAdmin,
      isHost,
      profileRole: profile?.role,
      userId: user?.id,
    });
  }, [role, isAdmin, isHost, profile?.role, user?.id]);

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        loading,
        profileLoading,
        isAuthenticated,
        isAuthReady,
        isHost,
        isAdmin,
        role,
        signOut,
        refreshProfile,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
