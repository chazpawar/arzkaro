// src/pages/ProfilePage.tsx
import React, { useState, useEffect } from 'react';
import { User, Briefcase, Users, LogOut, Edit3 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

interface ProfilePageProps {
  onNavigate: (page: 'settings' | 'edit-profile' | 'my-tickets') => void;
  onBack: () => void;
}

type ActiveSection = 'about' | 'past-trips' | 'connections';

export default function ProfilePage({ onNavigate, onBack }: ProfilePageProps) {
  const { user, profile, signOut } = useAuth();
  const [activeSection, setActiveSection] = useState<ActiveSection>('about');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    eventsAttended: 0,
    pastTrips: 0,
    connections: 0,
  });

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User';
  const avatarLetter = displayName.charAt(0).toUpperCase();
  const memberSince = user?.created_at 
    ? new Date(user.created_at).getFullYear()
    : new Date().getFullYear();

  // Calculate profile completeness
  const calculateCompleteness = () => {
    let completed = 0;
    const total = 4;

    if (profile?.avatar_url) completed++;
    if (profile?.bio) completed++;
    if (profile?.phone) completed++;
    if (profile?.date_of_birth) completed++;

    return Math.round((completed / total) * 100);
  };

  const completeness = calculateCompleteness();

  // Load user stats
  useEffect(() => {
    const loadStats = async () => {
      if (!user?.id) return;

      try {
        // Get unique events attended
        const { count: eventsCount } = await supabase
          .from('tickets')
          .select('event_id', { count: 'exact', head: true })
          .eq('user_id', user.id);

        // Get past trips count
        const { count: tripsCount } = await supabase
          .from('trip_participants')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        // Get connections/friends count (if you have a friends table)
        // For now, using a placeholder
        const connectionsCount = 0;

        setStats({
          eventsAttended: eventsCount || 0,
          pastTrips: tripsCount || 0,
          connections: connectionsCount,
        });
      } catch (error) {
        console.error('Error loading stats:', error);
      }
    };

    loadStats();
  }, [user?.id]);

  const handleSignOut = async () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      setLoading(true);
      await signOut();
      onBack();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar - Navigation */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-28">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Profile Settings</h2>
              
              <div className="space-y-2">
                {/* About me */}
                <button
                  onClick={() => setActiveSection('about')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    activeSection === 'about'
                      ? 'bg-[#FFF5F3] text-[#FF785A]'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <User size={20} />
                  <span className="font-medium">About me</span>
                </button>

                {/* Past trips */}
                <button
                  onClick={() => setActiveSection('past-trips')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    activeSection === 'past-trips'
                      ? 'bg-[#FFF5F3] text-[#FF785A]'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Briefcase size={20} />
                  <span className="font-medium">Past trips</span>
                </button>

                {/* Connections */}
                <button
                  onClick={() => setActiveSection('connections')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    activeSection === 'connections'
                      ? 'bg-[#FFF5F3] text-[#FF785A]'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Users size={20} />
                  <span className="font-medium">Connections</span>
                </button>

                {/* Divider */}
                <div className="py-2">
                  <div className="border-t border-gray-200"></div>
                </div>

                {/* Sign Out */}
                <button
                  onClick={handleSignOut}
                  disabled={loading}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  <LogOut size={20} />
                  <span className="font-medium">Sign Out</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-gray-900">
                {activeSection === 'about' && 'About me'}
                {activeSection === 'past-trips' && 'Past trips'}
                {activeSection === 'connections' && 'Connections'}
              </h1>
              <button
                onClick={() => onNavigate('edit-profile')}
                className="flex items-center gap-2 px-6 py-3 bg-[#FF785A] text-white font-semibold rounded-xl hover:bg-[#ff6a47] transition-colors"
              >
                <Edit3 size={18} />
                Edit Profile
              </button>
            </div>

            {/* About Me Section */}
            {activeSection === 'about' && (
              <div className="space-y-6">
                {/* Profile Card */}
                <div className="bg-white rounded-2xl shadow-sm p-8">
                  <div className="flex items-start gap-6">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {profile?.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt={displayName}
                          className="w-24 h-24 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-[#FF785A] flex items-center justify-center">
                          <span className="text-4xl font-bold text-white">
                            {avatarLetter}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Name & Info */}
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-gray-900 mb-1">
                        {displayName}
                      </h2>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <span className="inline-block w-2 h-2 bg-yellow-400 rounded-full"></span>
                        Guest since {memberSince}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bio Section */}
                <div className="bg-white rounded-2xl shadow-sm p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">My Bio</h3>
                  
                  {profile?.bio ? (
                    <p className="text-gray-700 leading-relaxed">{profile.bio}</p>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500 italic mb-3">
                        Welcome! Add a short bio to help hosts and other guests get to know you.
                      </p>
                      <button
                        onClick={() => onNavigate('edit-profile')}
                        className="text-[#FF785A] font-semibold hover:underline"
                      >
                        Click here to add your bio
                      </button>
                    </div>
                  )}
                </div>

                {/* Additional Info */}
                {(profile?.phone || profile?.date_of_birth || profile?.gender) && (
                  <div className="bg-white rounded-2xl shadow-sm p-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Additional Information</h3>
                    <div className="space-y-3">
                      {profile?.phone && (
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-600">Phone</span>
                          <span className="font-medium text-gray-900">{profile.phone}</span>
                        </div>
                      )}
                      {profile?.date_of_birth && (
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-600">Date of Birth</span>
                          <span className="font-medium text-gray-900">
                            {new Date(profile.date_of_birth).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                      )}
                      {profile?.gender && (
                        <div className="flex items-center justify-between py-2">
                          <span className="text-gray-600">Gender</span>
                          <span className="font-medium text-gray-900">{profile.gender}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Past Trips Section */}
            {activeSection === 'past-trips' && (
              <div className="bg-white rounded-2xl shadow-sm p-8">
                <div className="text-center py-16">
                  <Briefcase size={64} className="mx-auto text-gray-300 mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No past trips yet</h3>
                  <p className="text-gray-600 mb-6">
                    Join a trip to start your adventure!
                  </p>
                  <button
                    onClick={() => onNavigate('my-tickets')}
                    className="px-6 py-3 bg-[#FF785A] text-white font-semibold rounded-xl hover:bg-[#ff6a47] transition-colors"
                  >
                    Browse Trips
                  </button>
                </div>
              </div>
            )}

            {/* Connections Section */}
            {activeSection === 'connections' && (
              <div className="bg-white rounded-2xl shadow-sm p-8">
                <div className="text-center py-16">
                  <Users size={64} className="mx-auto text-gray-300 mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No connections yet</h3>
                  <p className="text-gray-600 mb-6">
                    Connect with other travelers and make new friends!
                  </p>
                  <button
                    onClick={() => onNavigate('my-tickets')}
                    className="px-6 py-3 bg-[#FF785A] text-white font-semibold rounded-xl hover:bg-[#ff6a47] transition-colors"
                  >
                    Explore Events
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar - Profile Completeness */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-28">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Profile Completeness</h3>
              
              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Progress</span>
                  <span className="text-sm font-semibold text-[#FF785A]">{completeness}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#FF785A] transition-all duration-500"
                    style={{ width: `${completeness}%` }}
                  ></div>
                </div>
              </div>

              {/* Tips */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                <h4 className="font-semibold text-blue-900 text-sm mb-2">
                  Make a great first impression!
                </h4>
                <p className="text-sm text-blue-800 leading-relaxed">
                  Update your profile picture and write a detailed bio.
                </p>
              </div>

              {/* Checklist */}
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    profile?.avatar_url ? 'bg-green-500' : 'bg-gray-300'
                  }`}>
                    {profile?.avatar_url && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-gray-700">Add profile photo</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    profile?.bio ? 'bg-green-500' : 'bg-gray-300'
                  }`}>
                    {profile?.bio && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-gray-700">Write your bio</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    profile?.phone ? 'bg-green-500' : 'bg-gray-300'
                  }`}>
                    {profile?.phone && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-gray-700">Add phone number</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    profile?.date_of_birth ? 'bg-green-500' : 'bg-gray-300'
                  }`}>
                    {profile?.date_of_birth && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-gray-700">Add date of birth</span>
                </div>
              </div>

              {/* Edit Button */}
              <button
                onClick={() => onNavigate('edit-profile')}
                className="w-full px-6 py-3 bg-[#FF785A] text-white font-semibold rounded-xl hover:bg-[#ff6a47] transition-colors"
              >
                Edit Details
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
