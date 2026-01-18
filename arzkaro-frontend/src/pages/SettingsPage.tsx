import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Mail, FileText, Shield, Trash2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';

interface SettingsPageProps {
  onBack: () => void;
}

export default function SettingsPage({ onBack }: SettingsPageProps) {
  const { user, signOut } = useAuth();
  const { showToast } = useToast();
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Load profile visibility setting
  useEffect(() => {
    const loadSettings = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('is_public')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error loading settings:', error);
          return;
        }

        if (data) {
          setIsPublic(data.is_public ?? true);
        }
      } catch (error) {
        console.error('Error in loadSettings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [user?.id]);

  // Handle visibility toggle
  const handleVisibilityToggle = async (value: boolean) => {
    if (!user?.id) return;

    try {
      setUpdating(true);
      setIsPublic(value); // Optimistic update

      const { error } = await supabase
        .from('profiles')
        .update({ is_public: value })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating visibility:', error);
        setIsPublic(!value); // Revert on error
        showToast('Failed to update account visibility. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error in handleVisibilityToggle:', error);
      setIsPublic(!value); // Revert on error
      showToast('Failed to update account visibility. Please try again.', 'error');
    } finally {
      setUpdating(false);
    }
  };

  // Handle delete account
  const handleDeleteAccount = async () => {
    if (
      !window.confirm(
        'Are you sure you want to delete your account? This action cannot be undone.\n\n' +
          'All your data including:\n' +
          '• Profile information\n' +
          '• Event bookings\n' +
          '• Messages\n' +
          '• Photos\n\n' +
          'will be permanently deleted.'
      )
    ) {
      return;
    }

    if (
      !window.confirm(
        'This is your last chance. Are you absolutely sure you want to permanently delete your account?'
      )
    ) {
      return;
    }

    try {
      setDeleting(true);

      if (!user?.id) {
        throw new Error('No user found');
      }

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error('No active session found');
      }

      // Call Edge Function to delete user account
      const { data, error } = await supabase.functions.invoke('delete-user-account', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error || !data?.success) {
        throw new Error(data?.error || 'Failed to delete account. Please contact support.');
      }

      await signOut();
      showToast("Your account has been permanently deleted. We're sorry to see you go.", 'info');
      onBack();
    } catch (error) {
      console.error('Error deleting account:', error);
      const err = error as Error;
      showToast(err.message || 'Failed to delete account. Please try again or contact support.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleContactUs = () => {
    window.location.href =
      'mailto:thearzkaro@gmail.com?subject=Support%20Request&body=Hi%20Arz%20Team%2C%0A%0A';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <svg
              className="w-6 h-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="text-center">
            <h1 className="text-lg font-semibold text-gray-900">Settings</h1>
            <p className="text-xs text-gray-500">App configuration</p>
          </div>
          <div className="w-10" />
        </div>
      </div>

      {/* Settings Content */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Profile Section */}
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
            Profile
          </h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center px-4 py-4">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-4">
                {isPublic ? (
                  <Eye className="w-5 h-5 text-gray-600" />
                ) : (
                  <EyeOff className="w-5 h-5 text-gray-600" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">
                  {isPublic ? 'Public Account' : 'Private Account'}
                </h3>
                <p className="text-sm text-gray-500">
                  {isPublic
                    ? 'Your profile is visible to everyone'
                    : 'Your profile is only visible to you'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => handleVisibilityToggle(e.target.checked)}
                  disabled={loading || updating}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF785A]"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Support Section */}
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
            Support
          </h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <button
              onClick={handleContactUs}
              className="w-full flex items-center px-4 py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center mr-4">
                <Mail className="w-5 h-5 text-[#FF785A]" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-gray-900">Contact Us</h3>
                <p className="text-sm text-gray-500">Get in touch with our team</p>
              </div>
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Legal Section */}
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
            Legal
          </h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <button
              onClick={() => window.open('https://arzkaro.com/terms', '_blank')}
              className="w-full flex items-center px-4 py-4 hover:bg-gray-50 transition-colors border-b border-gray-100"
            >
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-4">
                <FileText className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-gray-900">Terms & Conditions</h3>
                <p className="text-sm text-gray-500">View our terms of service</p>
              </div>
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button
              onClick={() => window.open('https://arzkaro.com/privacy', '_blank')}
              className="w-full flex items-center px-4 py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-4">
                <Shield className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-gray-900">Privacy Policy</h3>
                <p className="text-sm text-gray-500">How we handle your data</p>
              </div>
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-3 px-2">
            Danger Zone
          </h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <button
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="w-full flex items-center px-4 py-4 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mr-4">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-red-600">
                  {deleting ? 'Deleting Account...' : 'Delete Account'}
                </h3>
                <p className="text-sm text-gray-500">Permanently delete your account and data</p>
              </div>
              <svg
                className="w-5 h-5 text-red-600"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
