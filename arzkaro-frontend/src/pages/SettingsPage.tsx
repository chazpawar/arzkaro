import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Bell, Mail, FileText, Shield, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface SettingsPageProps {
  onBack: () => void;
}

export default function SettingsPage({ onBack }: SettingsPageProps) {
  const { user, signOut } = useAuth();
  const [isPublic, setIsPublic] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Load profile visibility setting
  useEffect(() => {
    const loadSettings = async () => {
      if (!user?.id) return;

      try {
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
      }
    };

    loadSettings();
  }, [user?.id]);

  const handleVisibilityToggle = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const newValue = !isPublic;
      setIsPublic(newValue);

      const { error } = await supabase
        .from('profiles')
        .update({ is_public: newValue })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating visibility:', error);
        setIsPublic(!newValue); // Revert on error
        alert('Failed to update account visibility. Please try again.');
      }
    } catch (error) {
      console.error('Error in handleVisibilityToggle:', error);
      setIsPublic(!isPublic); // Revert on error
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    if (window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone.\n\n' +
      'All your data including:\n' +
      '• Profile information\n' +
      '• Event bookings\n' +
      '• Messages\n' +
      '• Photos\n\n' +
      'will be permanently deleted.'
    )) {
      confirmDeleteAccount();
    }
  };

  const confirmDeleteAccount = async () => {
    if (!window.confirm(
      'This is your last chance. Are you absolutely sure you want to permanently delete your account?'
    )) {
      return;
    }

    try {
      setDeleting(true);

      if (!user?.id) {
        throw new Error('No user found');
      }

      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error('No active session found');
      }

      // Call edge function to delete account
      const { data, error } = await supabase.functions.invoke('delete-user-account', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error || !data?.success) {
        throw new Error(data?.error || 'Failed to delete account');
      }

      // Sign out
      await signOut();
      alert('Your account has been permanently deleted.');
      onBack();
    } catch (error: any) {
      console.error('Error deleting account:', error);
      alert(error.message || 'Failed to delete account. Please contact support.');
    } finally {
      setDeleting(false);
    }
  };

  const handleContactUs = () => {
    window.location.href = 'mailto:thearzkaro@gmail.com?subject=Support Request&body=Hi Arzkaro Team,\n\n';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
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

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Profile Section */}
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 ml-1">Profile</h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center p-4">
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
                  {isPublic ? 'Your profile is visible to everyone' : 'Your profile is only visible to you'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={handleVisibilityToggle}
                  disabled={loading}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF785A]"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Preferences Section */}
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 ml-1">Preferences</h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center p-4">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-4">
                <Bell className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Push Notifications</h3>
                <p className="text-sm text-gray-500">Stay updated</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications}
                  onChange={() => setNotifications(!notifications)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF785A]"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Support Section */}
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 ml-1">Support</h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <button
              onClick={handleContactUs}
              className="w-full flex items-center p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center mr-4">
                <Mail className="w-5 h-5 text-[#FF785A]" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-gray-900">Contact Us</h3>
                <p className="text-sm text-gray-500">Get in touch with our team</p>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Legal Section */}
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 ml-1">Legal</h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <button
              onClick={() => window.open('https://arzkaro.com/terms', '_blank')}
              className="w-full flex items-center p-4 hover:bg-gray-50 transition-colors border-b border-gray-100"
            >
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-4">
                <FileText className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-gray-900">Terms & Conditions</h3>
                <p className="text-sm text-gray-500">View our terms of service</p>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button
              onClick={() => window.open('https://arzkaro.com/privacy', '_blank')}
              className="w-full flex items-center p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-4">
                <Shield className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-gray-900">Privacy Policy</h3>
                <p className="text-sm text-gray-500">How we handle your data</p>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="mb-8">
          <h2 className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-3 ml-1">Danger Zone</h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <button
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="w-full flex items-center p-4 hover:bg-red-50 transition-colors disabled:opacity-50"
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
              <svg className="w-5 h-5 text-red-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
