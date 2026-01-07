import React, { useState, useEffect } from 'react';
import { User, Settings, Calendar, Ticket } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface ProfilePageProps {
  onNavigate: (page: 'settings' | 'edit-profile' | 'my-tickets') => void;
  onBack: () => void;
}

interface ProfileStats {
  eventsAttended: number;
  ticketCount: number;
}

export default function ProfilePage({ onNavigate, onBack }: ProfilePageProps) {
  const { user, profile, signOut } = useAuth();
  const [stats, setStats] = useState<ProfileStats>({
    eventsAttended: 0,
    ticketCount: 0,
  });
  const [loading, setLoading] = useState(false);

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User';
  const avatarLetter = displayName.charAt(0).toUpperCase();

  // Load user stats (TODO: Implement actual API calls)
  useEffect(() => {
    // Placeholder for loading stats from backend
    setStats({
      eventsAttended: 0,
      ticketCount: 0,
    });
  }, [user?.id]);

  const handleSignOut = () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      signOut();
      onBack();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Profile Card */}
      <div className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="flex flex-col items-center">
            {/* Avatar */}
            <div className="relative mb-4 group cursor-pointer" onClick={() => onNavigate('edit-profile')}>
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={displayName}
                  className="w-24 h-24 rounded-full object-cover border-3 border-[#FF785A]"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-orange-100 border-3 border-[#FF785A] flex items-center justify-center">
                  <span className="text-3xl font-semibold text-[#FF785A]">{avatarLetter}</span>
                </div>
              )}
              
              {/* Edit Badge */}
              <div className="absolute bottom-1 right-1 w-7 h-7 bg-[#FF785A] rounded-full flex items-center justify-center border-3 border-white shadow-md group-hover:bg-orange-600 transition-colors">
                <User className="w-4 h-4 text-white" />
              </div>
            </div>

            {/* Name & Email */}
            <h2 className="text-2xl font-bold text-gray-900 mb-1">{displayName}</h2>
            <p className="text-sm text-gray-500 mb-6">{user?.email}</p>

            {/* Stats Row */}
            <div className="w-full bg-gray-100 rounded-xl px-4 py-6 flex justify-around">
              <div className="text-center flex-1">
                <p className="text-2xl font-bold text-gray-900">{stats.eventsAttended}</p>
                <p className="text-sm text-gray-500 mt-1">Events</p>
              </div>
              
              <div className="w-px bg-gray-300" />
              
              <button
                className="text-center flex-1 hover:bg-gray-200 rounded-lg transition-colors px-2 py-1"
                onClick={() => onNavigate('my-tickets')}
              >
                <p className="text-2xl font-bold text-gray-900">{stats.ticketCount}</p>
                <p className="text-sm text-gray-500 mt-1">Tickets</p>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Settings */}
          <button
            onClick={() => onNavigate('settings')}
            className="w-full flex items-center px-4 py-4 hover:bg-gray-50 transition-colors border-b border-gray-100"
          >
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-4">
              <Settings className="w-5 h-5 text-gray-600" />
            </div>
            <span className="flex-1 text-left font-medium text-gray-900">Settings</span>
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

        {/* Sign Out Button */}
        <div className="mt-8 mb-4">
          <button
            onClick={handleSignOut}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 border-2 border-red-500 text-red-500 font-semibold rounded-full hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
          
          <p className="text-center text-sm text-gray-400 mt-4">Version 1.0.0</p>
        </div>
      </div>
    </div>
  );
}
