// src/pages/AuthCallback.tsx
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function AuthCallback() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('🔄 AuthCallback: Starting OAuth callback handling...');
        console.log('🔄 Current URL:', window.location.href);
        console.log('🔄 Full search params:', window.location.search);
        console.log('🔄 Hash params:', window.location.hash);

        // Get the code from URL params OR hash (Supabase might use either)
        const searchParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));

        const code = searchParams.get('code') || hashParams.get('code');
        const error = searchParams.get('error') || hashParams.get('error');
        const errorDescription =
          searchParams.get('error_description') || hashParams.get('error_description');

        // Also check for access_token in hash (implicit flow)
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        console.log('🔍 URL params:', {
          code: code ? 'present' : 'missing',
          error,
          errorDescription,
          accessToken: accessToken ? 'present' : 'missing',
          refreshToken: refreshToken ? 'present' : 'missing',
        });

        if (error) {
          console.error('❌ OAuth error:', error, errorDescription);
          setErrorMessage(errorDescription || error);
          setStatus('error');
          setTimeout(() => {
            window.location.replace('/');
          }, 3000);
          return;
        }

        // If we have access token directly (implicit flow), set the session
        if (accessToken) {
          console.log('🔄 Found access token in hash, using implicit flow...');
          const { error: setSessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });

          if (setSessionError) {
            console.error('❌ Error setting session from tokens:', setSessionError);
            setErrorMessage(setSessionError.message);
            setStatus('error');
            setTimeout(() => {
              window.location.replace('/');
            }, 3000);
            return;
          }

          console.log('✅ Session set from access token!');
          setStatus('success');
          setTimeout(() => {
            window.location.replace('/');
          }, 1500);
          return;
        }

        if (!code) {
          console.error('❌ No authorization code or access token found in URL');
          console.log('📋 This might be a configuration issue. Check:');
          console.log('1. Supabase Dashboard > Auth > URL Configuration');
          console.log('2. Redirect URLs includes: http://localhost:3000/auth/callback');
          console.log(
            '3. Google Cloud Console redirect URI: https://atviwirutetvppkwespc.supabase.co/auth/v1/callback'
          );
          setErrorMessage('No authorization code found. Check redirect URL configuration.');
          setStatus('error');
          setTimeout(() => {
            window.location.replace('/');
          }, 5000);
          return;
        }

        console.log('🔄 Exchanging code for session...');

        // Exchange the code for a session
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          console.error('❌ Error exchanging code for session:', exchangeError);
          setErrorMessage(exchangeError.message);
          setStatus('error');
          setTimeout(() => {
            window.location.replace('/');
          }, 3000);
          return;
        }

        console.log('✅ Successfully exchanged code for session!');
        console.log('✅ Session data:', data.session);
        console.log('✅ User data:', data.user);

        // Manually set the session to ensure it's stored in localStorage
        const { error: setSessionError } = await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });

        if (setSessionError) {
          console.error('❌ Error setting session:', setSessionError);
        } else {
          console.log('✅ Session manually set in storage');
        }

        // Verify the session is stored
        const { data: sessionData } = await supabase.auth.getSession();
        console.log('✅ Verified session in storage:', sessionData.session ? 'YES' : 'NO');

        if (sessionData.session) {
          console.log('✅ Session details:', {
            userId: sessionData.session.user.id,
            email: sessionData.session.user.email,
            expiresAt: new Date(sessionData.session.expires_at! * 1000).toISOString(),
          });
        }

        setStatus('success');

        // Force a full page reload to ensure AuthContext picks up the new session
        console.log('🔄 Redirecting to home page with full reload...');
        setTimeout(() => {
          window.location.replace('/');
        }, 1500);
      } catch (err) {
        console.error('❌ Unexpected error during callback:', err);
        setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred');
        setStatus('error');
        setTimeout(() => {
          window.location.replace('/');
        }, 3000);
      }
    };

    handleCallback();
  }, []);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {status === 'loading' && (
          <div>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#FF785A] mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Completing sign in...</h2>
            <p className="text-gray-600">Please wait while we finish logging you in with Google.</p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <div className="rounded-full h-16 w-16 bg-green-100 flex items-center justify-center mx-auto mb-4">
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Successfully signed in!</h2>
            <p className="text-gray-600">Redirecting you to the app...</p>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div className="rounded-full h-16 w-16 bg-red-100 flex items-center justify-center mx-auto mb-4">
              <svg
                className="h-8 w-8 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign in failed</h2>
            <p className="text-gray-600 mb-4">{errorMessage}</p>
            <p className="text-sm text-gray-500">Redirecting you back...</p>
          </div>
        )}
      </div>
    </div>
  );
}
