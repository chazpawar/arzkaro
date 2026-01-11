// src/components/Auth.tsx
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { X, Eye, EyeOff } from 'lucide-react';
import OTPVerificationModal from './OTPVerificationModal';

type AuthProps = {
  onClose: () => void;
};

const GOOGLE_SVG = `<svg width="24" height="24" viewBox="-0.5 0 48 48" xmlns="http://www.w3.org/2000/svg">
  <path d="M9.82727273,24 C9.82727273,22.4757333 10.0804318,21.0144 10.5322727,19.6437333 L2.62345455,13.6042667 C1.08206818,16.7338667 0.213636364,20.2602667 0.213636364,24 C0.213636364,27.7365333 1.081,31.2608 2.62025,34.3882667 L10.5247955,28.3370667 C10.0772273,26.9728 9.82727273,25.5168 9.82727273,24" fill="#FBBC05"/>
  <path d="M23.7136364,10.1333333 C27.025,10.1333333 30.0159091,11.3066667 32.3659091,13.2266667 L39.2022727,6.4 C35.0363636,2.77333333 29.6954545,0.533333333 23.7136364,0.533333333 C14.4268636,0.533333333 6.44540909,5.84426667 2.62345455,13.6042667 L10.5322727,19.6437333 C12.3545909,14.112 17.5491591,10.1333333 23.7136364,10.1333333" fill="#EB4335"/>
  <path d="M23.7136364,37.8666667 C17.5491591,37.8666667 12.3545909,33.888 10.5322727,28.3562667 L2.62345455,34.3946667 C6.44540909,42.1557333 14.4268636,47.4666667 23.7136364,47.4666667 C29.4455,47.4666667 34.9177955,45.4314667 39.0249545,41.6181333 L31.5177727,35.8144 C29.3995682,37.1488 26.7323182,37.8666667 23.7136364,37.8666667" fill="#34A853"/>
  <path d="M46.1454545,24 C46.1454545,22.6133333 45.9318182,21.12 45.6113636,19.7333333 L23.7136364,19.7333333 L23.7136364,28.8 L36.3181818,28.8 C35.6879545,31.8912 33.9724545,34.2677333 31.5177727,35.8144 L39.0249545,41.6181333 C43.3393409,37.6138667 46.1454545,31.6490667 46.1454545,24" fill="#4285F4"/>
</svg>`;

export default function Auth({ onClose }: AuthProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);

  const { signIn, sendSignupOTP, verifyOTP, resendOTP, signInWithGoogle } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        // Validation
        if (!fullName.trim()) {
          setError('Please enter your full name');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters long');
          setLoading(false);
          return;
        }

        // Send OTP for signup
        const { error: otpError } = await sendSignupOTP(email, fullName, password);
        if (otpError) {
          throw otpError;
        }

        // Show OTP modal
        setShowOTPModal(true);
        setLoading(false);
      } else {
        // Direct login (no OTP)
        const { error: signInError } = await signIn(email, password);
        if (signInError) {
          throw signInError;
        }

        // Success! Close modal
        onClose();
      }
    } catch (err: unknown) {
      console.error('Auth error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';

      // Handle specific Supabase errors
      if (errorMessage.includes('Invalid login credentials')) {
        setError('Invalid email or password');
      } else if (errorMessage.includes('Email not confirmed')) {
        setError('Please verify your email address before logging in');
      } else if (errorMessage.includes('User already registered')) {
        setError('This email is already registered. Please log in instead.');
      } else {
        setError(errorMessage);
      }
      setLoading(false);
    }
  };

  const handleOTPVerify = async (otp: string) => {
    return await verifyOTP(email, otp);
  };

  const handleOTPResend = async () => {
    return await resendOTP(email);
  };

  const handleOTPSuccess = () => {
    setShowOTPModal(false);
    onClose();
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      const { error: googleError } = await signInWithGoogle();
      if (googleError) {
        throw googleError;
      }
      // Note: User will be redirected to Google OAuth, then back to the app
    } catch (err: unknown) {
      console.error('Google sign in error:', err);
      setError(err instanceof Error ? err.message : 'Failed to sign in with Google');
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-8 relative shadow-2xl">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>

          {/* Logo Section */}
          <div className="text-center mb-8 mt-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {isSignUp ? 'Create Account' : 'Log in or Sign up'}
            </h2>
            <p className="text-gray-600 text-sm">Discover experiences happening in your city</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name - Only for Sign Up */}
            {isSignUp && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#FF785A] focus:border-transparent transition-all"
                  placeholder="Enter your full name"
                  required
                  disabled={loading}
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#FF785A] focus:border-transparent transition-all"
                placeholder="Enter your email"
                required
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#FF785A] focus:border-transparent transition-all"
                  placeholder={
                    isSignUp ? 'Create a password (min 6 characters)' : 'Enter your password'
                  }
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FF785A] text-white py-3 rounded-xl hover:bg-[#ff6a47] transition-colors font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {loading ? 'Loading...' : isSignUp ? 'Continue' : 'Log in'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gray-300"></div>
            <span className="text-sm text-gray-500 font-medium">Or</span>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>

          {/* Google Sign In Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-semibold text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div dangerouslySetInnerHTML={{ __html: GOOGLE_SVG }} />
            <span>Continue with Google</span>
          </button>

          {/* Switch between Sign In and Sign Up */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
                setFullName('');
              }}
              className="text-[#FF785A] hover:underline font-medium"
            >
              {isSignUp ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
            </button>
          </div>

          {/* Terms and Privacy */}
          <p className="mt-6 text-xs text-center text-gray-500">
            By continuing, you agree to our{' '}
            <a href="/terms" className="text-[#FF785A] hover:underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="text-[#FF785A] hover:underline">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>

      {/* OTP Verification Modal */}
      <OTPVerificationModal
        visible={showOTPModal}
        email={email}
        onClose={() => setShowOTPModal(false)}
        onVerifySuccess={handleOTPSuccess}
        onVerify={handleOTPVerify}
        onResend={handleOTPResend}
      />
    </>
  );
}
