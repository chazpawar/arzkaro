import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
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
  sendSignupOTP: (email: string, fullName: string, password: string) => Promise<{ error: Error | null }>;
  verifyOTP: (email: string, otp: string) => Promise<{ error: Error | null }>;
  resendOTP: (email: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
  enableGuestMode: () => void;
  disableGuestMode: () => void;
}

const AuthContext = createContext<AuthContextType>({
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

  // Fetch user profile from database
  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

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

    // Set a safety timeout to prevent infinite loading
    const safetyTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn('Auth initialization timeout - forcing loading to false');
        setLoading(false);
      }
    }, 5000); // 5 second timeout

    // Get initial session
    supabase.auth.getSession()
      .then(async ({ data: { session }, error }) => {
        if (!mounted) return;

        if (error) {
          console.error('Error getting session:', error);
          setLoading(false);
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          try {
            const profileData = await fetchProfile(session.user.id);
            if (mounted) {
              setProfile(profileData);
            }
          } catch (err) {
            console.error('Error loading profile on init:', err);
            // Continue even if profile fetch fails
            if (mounted) {
              setProfile(null);
            }
          }
        }

        if (mounted) {
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Fatal error in getSession:', err);
        if (mounted) {
          setLoading(false);
        }
      });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      console.log('Auth state changed:', _event);
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        try {
          const profileData = await fetchProfile(session.user.id);
          if (mounted) {
            setProfile(profileData);
          }
        } catch (err) {
          console.error('Error loading profile on auth change:', err);
          if (mounted) {
            setProfile(null);
          }
        }
      } else {
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
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  // Sign in with email and password
  const signIn = async (email: string, password: string): Promise<{ error: Error | null }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) throw error;

      if (data.user) {
        const profileData = await fetchProfile(data.user.id);
        setProfile(profileData);
      }

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
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: fullName || '',
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Profile is auto-created by database trigger
        const profileData = await fetchProfile(data.user.id);
        setProfile(profileData);
      }

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

      // Fetch profile
      const profileData = await fetchProfile(data.user.id);
      setProfile(profileData);

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
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error('Google sign in error:', error);
      return { error: error as Error };
    }
  };

  // Sign out
  const [isSigningOut, setIsSigningOut] = useState(false);
  const signOut = async () => {
    // Prevent multiple simultaneous sign out calls
    if (isSigningOut) {
      console.log('Sign out already in progress, ignoring...');
      return;
    }

    try {
      setIsSigningOut(true);
      console.log('Signing out...');
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setSession(null);
      setIsGuestMode(false);
      console.log('Sign out successful');
    } catch (error) {
      console.error('Error signing out:', error);
      // Still clear local state even if Supabase call fails
      setUser(null);
      setProfile(null);
      setSession(null);
      setIsGuestMode(false);
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
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

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

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
