// src/components/OTPVerificationModal.tsx
import { useState } from 'react';
import { X } from 'lucide-react';

interface OTPVerificationModalProps {
  visible: boolean;
  email: string;
  fullName: string;
  onClose: () => void;
  onVerifySuccess: () => void;
  onVerify: (otp: string) => Promise<{ error: Error | null }>;
  onResend: () => Promise<{ error: Error | null }>;
}

export default function OTPVerificationModal({
  visible,
  email,
  fullName,
  onClose,
  onVerifySuccess,
  onVerify,
  onResend,
}: OTPVerificationModalProps) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!visible) return null;

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { error: verifyError } = await onVerify(otp);

      if (verifyError) {
        throw verifyError;
      }

      // Success!
      onVerifySuccess();
    } catch (err: any) {
      console.error('OTP verification error:', err);

      if (err.message?.includes('invalid') || err.message?.includes('expired')) {
        setError('Invalid or expired OTP. Please try again.');
      } else if (err.message?.includes('rate limit')) {
        setError('Too many attempts. Please wait a moment.');
      } else {
        setError(err.message || 'Failed to verify OTP. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      setError(null);
      setSuccess(null);
      setLoading(true);

      const { error: resendError } = await onResend();

      if (resendError) {
        throw resendError;
      }

      setSuccess('✓ Verification code sent successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('OTP resend error:', err);

      if (err.message?.includes('rate limit')) {
        setError('Please wait a moment before requesting another code.');
      } else {
        setError(err.message || 'Failed to resend OTP');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOTPChange = (value: string) => {
    // Only allow numbers, max 6 digits
    const cleaned = value.replace(/[^0-9]/g, '').slice(0, 6);
    setOtp(cleaned);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-8 relative shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={24} />
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center">
            <span className="text-3xl">✉️</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Verify your email</h2>
          <p className="text-gray-600 text-sm">
            Enter the 6-digit code sent to<br />
            <span className="font-semibold text-gray-900">{email}</span>
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm text-center">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-600 text-sm text-center">{success}</p>
          </div>
        )}

        {/* OTP Input */}
        <div className="mb-6">
          <input
            type="text"
            value={otp}
            onChange={(e) => handleOTPChange(e.target.value)}
            placeholder="000000"
            className="w-full px-4 py-4 text-center text-3xl font-semibold border-2 border-gray-900 rounded-xl focus:ring-2 focus:ring-[#FF785A] focus:border-transparent tracking-[12px] transition-all"
            maxLength={6}
            disabled={loading}
            inputMode="numeric"
            autoFocus
          />
        </div>

        {/* Verify Button */}
        <button
          onClick={handleVerify}
          disabled={loading || otp.length !== 6}
          className="w-full bg-[#FF785A] text-white py-3 rounded-xl hover:bg-[#ff6a47] transition-colors font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-md mb-4"
        >
          {loading ? 'Verifying...' : 'Verify code'}
        </button>

        {/* Resend OTP */}
        <div className="text-center">
          <span className="text-gray-600 text-sm">Didn't receive the code? </span>
          <button
            onClick={handleResendOTP}
            disabled={loading}
            className="text-[#FF785A] font-semibold text-sm hover:underline disabled:opacity-50"
          >
            Resend
          </button>
        </div>
      </div>
    </div>
  );
}
