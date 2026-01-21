import { createContext, ReactNode, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface Profile {
  id: string;
  username?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  email?: string | null;
  role?: 'user' | 'host' | 'admin';
  bio?: string | null;
  phone?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  instagram?: string | null;
  youtube?: string | null;
  linkedin?: string | null;
  twitter?: string | null;
  interests?: string[] | null;
  is_public?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isAuthenticated: boolean;
  isGuestMode: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null }>;
  sendSignupOTP: (
    email: string,
    fullName: string,
    password: string
  ) => Promise<{ error: Error | null }>;
  verifyOTP: (email: string, otp: string) => Promise<{ error: Error | null }>;
  resendOTP: (email: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
  enableGuestMode: () => void;
  disableGuestMode: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  isAuthenticated: false,
  isGuestMode: false,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  sendSignupOTP: async () => ({ error: null }),
  verifyOTP: async () => ({ error: null }),
  resendOTP: async () => ({ error: null }),
  signInWithGoogle: async () => ({ error: null }),
  signOut: async () => {},
  updateProfile: async () => ({ error: null }),
  refreshProfile: async () => {},
  enableGuestMode: () => {},
  disableGuestMode: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Fetch user profile from database with optimized query
  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      // Only fetch essential fields to reduce query time
      const { data, error } = await supabase
        .from('profiles')
        .select(
          'id, username, full_name, avatar_url, email, role, bio, phone, date_of_birth, gender, instagram, youtube, linkedin, twitter, interests, is_public, created_at, updated_at'
        )
        .eq('id', userId)
        .maybeSingle(); // Use maybeSingle instead of single to avoid errors if profile doesn't exist

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return data as Profile;
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      return null;
    }
  };

  // Refresh profile data
  const refreshProfile = async () => {
    if (user?.id) {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
    }
  };

  // Initialize auth state on mount
  useEffect(() => {
    let mounted = true;
    let isFetchingProfile = false; // Flag to prevent duplicate fetches
    let safetyTimeoutId: ReturnType<typeof setTimeout> | null = null;
    let isInitialLoad = true; // Track if this is the initial load

    const initAuth = async () => {
      try {
        // Set a safety timeout to prevent infinite loading (3 seconds like mobile)
        safetyTimeoutId = setTimeout(() => {
          if (mounted && loading) {
            console.warn('⚠️ Auth initialization timeout - forcing loading to false');
            setLoading(false);
          }
        }, 3000); // 3 second timeout (same as mobile)

        // CRITICAL: Check if we have tokens in URL hash from OAuth redirect
        // First check current hash, then fallback to sessionStorage (in case hash was cleared)
        let hash = window.location.hash;

        // If hash is empty, check sessionStorage
        if (!hash || !hash.includes('access_token')) {
          const storedHash = sessionStorage.getItem('oauth_hash');
          if (storedHash) {
            hash = storedHash;
            sessionStorage.removeItem('oauth_hash'); // Clean up
          }
        }

        const hashParams = new URLSearchParams(hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken && refreshToken) {
          // Set the session from the tokens
          const { data, error: setError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (setError) {
            console.error('❌ Error setting session from hash tokens:', setError);
          } else if (data.session) {
            // Clear the hash from URL
            window.history.replaceState(null, '', window.location.pathname);

            if (mounted) {
              setSession(data.session);
              setUser(data.session.user);

              // Fetch profile
              if (data.session.user) {
                const profileData = await fetchProfile(data.session.user.id);
                if (mounted) {
                  setProfile(profileData);
                }
              }

              setLoading(false);
              if (safetyTimeoutId) clearTimeout(safetyTimeoutId);
            }
            return; // Exit early, we're done
          }
        }

        // Get initial session (if no tokens in hash)
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          console.error('❌ Error getting session:', error);
          setLoading(false);
          if (safetyTimeoutId) clearTimeout(safetyTimeoutId);
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);

        // Fetch profile only if we have a user and haven't started fetching
        if (session?.user && !isFetchingProfile) {
          isFetchingProfile = true;
          try {
            const profileData = await fetchProfile(session.user.id);
            if (mounted) {
              setProfile(profileData);
            }
          } catch (err) {
            console.error('❌ Error loading profile on init:', err);
            if (mounted) {
              setProfile(null);
            }
          } finally {
            isFetchingProfile = false;
          }
        }

        if (mounted) {
          setLoading(false);
          isInitialLoad = false; // Mark initial load as complete
          if (safetyTimeoutId) clearTimeout(safetyTimeoutId);
        }
      } catch (err) {
        console.error('❌ Fatal error in auth initialization:', err);
        if (mounted) {
          setLoading(false);
          if (safetyTimeoutId) clearTimeout(safetyTimeoutId);
        }
      }
    };

    // Start initialization
    initAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      // Skip INITIAL_SESSION to avoid race with initAuth
      if (isInitialLoad && _event === 'INITIAL_SESSION') {
        return;
      }

      // Mark as no longer initial load after first event
      if (_event === 'INITIAL_SESSION') {
        isInitialLoad = false;
      }

      setSession(session);
      setUser(session?.user ?? null);

      // For SIGNED_IN event (happens after OAuth), fetch profile with delay
      if (_event === 'SIGNED_IN') {
        if (session?.user && !isFetchingProfile) {
          isFetchingProfile = true;

          setTimeout(async () => {
            try {
              const profileData = await fetchProfile(session.user.id);
              if (mounted) {
                setProfile(profileData);
              }
            } catch (err) {
              console.error('❌ Error fetching profile after SIGNED_IN:', err);
              if (mounted) {
                setProfile(null);
              }
            } finally {
              isFetchingProfile = false;
            }
          }, 1000);
        }

        if (mounted) {
          setLoading(false);
        }
        return;
      }

      // Only fetch profile if user exists and we're not already fetching
      if (session?.user && !isFetchingProfile) {
        isFetchingProfile = true;
        try {
          // For TOKEN_REFRESHED events, add a delay
          if (_event === 'TOKEN_REFRESHED') {
            await new Promise((resolve) => setTimeout(resolve, 1500));
          }

          const profileData = await fetchProfile(session.user.id);
          if (mounted) {
            setProfile(profileData);
          }
        } catch (err) {
          console.error('Error loading profile on auth change:', err);
          if (mounted) {
            setProfile(null);
          }
        } finally {
          isFetchingProfile = false;
        }
      } else if (!session?.user) {
        if (mounted) {
          setProfile(null);
        }
      }

      if (mounted) {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      if (safetyTimeoutId) clearTimeout(safetyTimeoutId);
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sign in with email and password
  const signIn = async (email: string, password: string): Promise<{ error: Error | null }> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) throw error;

      // Profile will be fetched by the SIGNED_IN event handler after a delay
      return { error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: error as Error };
    }
  };

  // Sign up with email and password (direct - no OTP)
  const signUp = async (
    email: string,
    password: string,
    fullName?: string
  ): Promise<{ error: Error | null }> => {
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: fullName || '',
          },
        },
      });

      if (error) throw error;

      // Profile is auto-created by database trigger and will be fetched by onAuthStateChange
      return { error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { error: error as Error };
    }
  };

  // Send OTP for email signup
  const sendSignupOTP = async (
    email: string,
    fullName: string,
    password: string
  ): Promise<{ error: Error | null }> => {
    try {
      const cleanEmail = email.trim().toLowerCase();

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        throw new Error('Invalid email format');
      }

      // Validate password
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          shouldCreateUser: true,
          data: {
            full_name: fullName,
            temp_password: password, // Store temporarily for after verification
          },
        },
      });

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error('Send OTP error:', error);
      return { error: error as Error };
    }
  };

  // Verify OTP and complete signup
  const verifyOTP = async (email: string, otp: string): Promise<{ error: Error | null }> => {
    try {
      const cleanEmail = email.trim().toLowerCase();

      const { data, error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: otp.trim(),
        type: 'email',
      });

      if (error) throw error;

      if (!data.session || !data.user) {
        throw new Error('No session created after OTP verification');
      }

      // Set the password from metadata if it exists
      const tempPassword = data.user.user_metadata?.temp_password;
      if (tempPassword) {
        await supabase.auth.updateUser({
          password: tempPassword,
          data: {
            temp_password: null, // Remove temp password
          },
        });
      }

      // Profile will be fetched automatically by onAuthStateChange listener
      return { error: null };
    } catch (error) {
      console.error('Verify OTP error:', error);
      return { error: error as Error };
    }
  };

  // Resend OTP
  const resendOTP = async (email: string): Promise<{ error: Error | null }> => {
    try {
      const cleanEmail = email.trim().toLowerCase();

      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          shouldCreateUser: false, // User should already exist
        },
      });

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error('Resend OTP error:', error);
      return { error: error as Error };
    }
  };

  // Sign in with Google OAuth
  const signInWithGoogle = async (): Promise<{ error: Error | null }> => {
    try {
      console.log('🔐 Starting Google OAuth...');

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // For implicit flow, Supabase handles redirect automatically
          // It will redirect back to current origin with tokens in URL hash
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;

      console.log('✅ OAuth initiated, redirecting to Google...', data);

      return { error: null };
    } catch (error) {
      console.error('❌ Google sign in error:', error);
      return { error: error as Error };
    }
  };

  // Sign out
  const signOut = async () => {
    // Prevent multiple simultaneous sign out calls
    if (isSigningOut) {
      console.log('Sign out already in progress, skipping...');
      return;
    }

    try {
      setIsSigningOut(true);
      console.log('Signing out...');

      // Add timeout to prevent hanging on invalid Supabase credentials
      const signOutPromise = supabase.auth.signOut();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Sign out timeout')), 3000)
      );

      await Promise.race([signOutPromise, timeoutPromise]).catch((error) => {
        console.warn('Supabase signOut failed or timed out:', error);
        // Continue to clear local state
      });

      // Always clear local state
      setUser(null);
      setProfile(null);
      setSession(null);
      setIsGuestMode(false);

      // Explicitly clear all Supabase auth data from localStorage
      // This ensures the session is removed even if signOut() failed/timed out
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('sb-') && key.includes('-auth-token')) {
          localStorage.removeItem(key);
        }
      });

      console.log('Sign out successful - local state and storage cleared');
    } catch (error) {
      console.error('Error signing out:', error);
      // Still clear local state even if Supabase call fails
      setUser(null);
      setProfile(null);
      setSession(null);
      setIsGuestMode(false);

      // Explicitly clear all Supabase auth data from localStorage
      try {
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith('sb-') && key.includes('-auth-token')) {
            localStorage.removeItem(key);
          }
        });
      } catch (storageError) {
        console.error('Error clearing localStorage:', storageError);
      }
    } finally {
      setIsSigningOut(false);
    }
  };

  // Update profile
  const updateProfile = async (updates: Partial<Profile>): Promise<{ error: Error | null }> => {
    if (!user?.id) {
      return { error: new Error('Not authenticated') };
    }

    try {
      const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);

      if (error) throw error;

      // Refresh profile
      await refreshProfile();

      return { error: null };
    } catch (error) {
      console.error('Update profile error:', error);
      return { error: error as Error };
    }
  };

  // Enable guest mode
  const enableGuestMode = () => {
    setIsGuestMode(true);
  };

  // Disable guest mode
  const disableGuestMode = () => {
    setIsGuestMode(false);
  };

  const value: AuthContextType = {
    user,
    session,
    profile,
    loading,
    isAuthenticated: !!user && !isGuestMode,
    isGuestMode,
    signIn,
    signUp,
    sendSignupOTP,
    verifyOTP,
    resendOTP,
    signInWithGoogle,
    signOut,
    updateProfile,
    refreshProfile,
    enableGuestMode,
    disableGuestMode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
