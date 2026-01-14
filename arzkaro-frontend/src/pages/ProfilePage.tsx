// src/pages/ProfilePage.tsx
import React, { useState, useEffect } from 'react';
import { User, Briefcase, Users, MapPin, CheckCircle2, MessageSquare } from 'lucide-react';
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
  const [stats, setStats] = useState({
    tripsAttended: 0,
    reviews: 0,
    monthsOnPlatform: 0,
  });

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User';
  const avatarLetter = displayName.charAt(0).toUpperCase();
  const location = 'India';

  // Calculate months on platform
  useEffect(() => {
    if (user?.created_at) {
      const createdDate = new Date(user.created_at);
      const now = new Date();
      const monthsDiff = Math.max(1, Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));
      
      setStats(prev => ({
        ...prev,
        monthsOnPlatform: monthsDiff,
      }));
    }
  }, [user?.created_at]);

  // Load user stats
  useEffect(() => {
    const loadStats = async () => {
      if (!user?.id) return;

      try {
        // Get trips count
        const { count: tripsCount } = await supabase
          .from('tickets')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        setStats(prev => ({
          ...prev,
          tripsAttended: tripsCount || 0,
          reviews: 0, // Placeholder for reviews
        }));
      } catch (error) {
        console.error('Error loading stats:', error);
      }
    };

    loadStats();
  }, [user?.id]);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
          {/* Left Sidebar - Navigation */}
          <div className="lg:col-span-3">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile</h2>
              
              {/* About me */}
              <button
                onClick={() => setActiveSection('about')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left ${
                  activeSection === 'about'
                    ? 'bg-gray-100'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  activeSection === 'about' ? 'bg-gray-900' : 'bg-gray-200'
                }`}>
                  <span className={`text-lg font-bold ${
                    activeSection === 'about' ? 'text-white' : 'text-gray-600'
                  }`}>
                    {avatarLetter}
                  </span>
                </div>
                <span className="font-medium text-gray-900">About me</span>
              </button>

              {/* Past trips */}
              <button
                onClick={() => setActiveSection('past-trips')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left ${
                  activeSection === 'past-trips'
                    ? 'bg-gray-100'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="w-10 h-10">
                  <img 
                    src="/others/trips.png" 
                    alt="Past trips"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="font-medium text-gray-900">Past trips</span>
              </button>

              {/* Connections */}
              <button
                onClick={() => setActiveSection('connections')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left ${
                  activeSection === 'connections'
                    ? 'bg-gray-100'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="w-10 h-10">
                  <img 
                    src="/others/foryou.png" 
                    alt="Connections"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="font-medium text-gray-900">Connections</span>
              </button>
            </div>
          </div>

          {/* Vertical divider line (extends slightly beyond content top/bottom) */}
          <div className="hidden lg:block absolute left-[25%] -top-12 -bottom-12 w-px bg-gray-200"></div>

          {/* Main Content Area */}
          <div className="lg:col-span-9 lg:pl-10">
            {/* About Me Section */}
            {activeSection === 'about' && (
              <div className="space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between pb-6 border-b border-gray-200">
                  <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">
                    About me
                  </h1>
                </div>

                {/* Profile card and right-side details, spaced like Airbnb */}
                <div className="flex flex-col lg:flex-row items-start gap-12">
                  {/* Compact profile card */}
                  <div className="bg-white rounded-3xl border border-gray-200 shadow-md px-6 py-5 w-full max-w-sm">
                    <div className="flex items-center gap-6">
                      {/* Avatar + name block */}
                      <div className="flex flex-col items-center md:items-start">
                        {profile?.avatar_url ? (
                          <img
                            src={profile.avatar_url}
                            alt={displayName}
                            className="w-20 h-20 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-gray-900 flex items-center justify-center">
                            <span className="text-2xl font-bold text-white">
                              {avatarLetter}
                            </span>
                          </div>
                        )}

                        {/* Name and location under avatar */}
                        <div className="mt-3 text-center md:text-left">
                          <h2 className="text-2xl font-semibold text-gray-900 leading-tight">
                            {displayName}
                          </h2>
                          <p className="text-gray-500 flex items-center justify-center md:justify-start gap-1 mt-1 text-xs">
                            <MapPin size={12} />
                            {location}
                          </p>
                        </div>
                      </div>

                      {/* Stats column with dividers like Airbnb */}
                      <div className="flex-1 pl-6 border-l border-gray-200">
                        <div className="space-y-3 divide-y divide-gray-200">
                          {/* Trips */}
                          <div className="pb-2">
                            <div className="text-2xl font-semibold text-gray-900 leading-none">
                              {stats.tripsAttended}
                            </div>
                            <div className="text-[11px] uppercase tracking-wide text-gray-500 mt-1">
                              Trip
                            </div>
                          </div>

                          {/* Reviews */}
                          <div className="pt-2 pb-2">
                            <div className="text-2xl font-semibold text-gray-900 leading-none">
                              {stats.reviews}
                            </div>
                            <div className="text-[11px] uppercase tracking-wide text-gray-500 mt-1">
                              Reviews
                            </div>
                          </div>

                          {/* Months on platform */}
                          <div className="pt-2">
                            <div className="text-2xl font-semibold text-gray-900 leading-none">
                              {stats.monthsOnPlatform}
                            </div>
                            <div className="text-[11px] uppercase tracking-wide text-gray-500 mt-1">
                              Month on Arzkaro
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right side column - Edit button positioned next to card */}
                  <div className="flex lg:block mt-6 lg:mt-0">
                    <button
                      onClick={() => onNavigate('edit-profile')}
                      className="px-5 py-1.5 border border-gray-300 text-gray-800 text-sm font-medium rounded-full hover:bg-gray-50 transition-colors"
                    >
                      Edit
                    </button>
                  </div>
                </div>

                {/* About / Bio Section */}
                {profile?.bio && (
                  <div className="pt-6 space-y-3">
                    <h3 className="text-xl font-semibold text-gray-900">About</h3>
                    <p className="text-gray-700 leading-relaxed">{profile.bio}</p>
                  </div>
                )}
              </div>
            )}

            {/* Past Trips Section */}
            {activeSection === 'past-trips' && (
              <div>
                <div className="pb-6 border-b border-gray-200 mb-8">
                  <h1 className="text-3xl font-semibold text-gray-900">Past trips</h1>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 p-12">
                  <div className="text-center">
                    <Briefcase size={64} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No past trips yet</h3>
                    <p className="text-gray-600 mb-6">
                      Time to dust off your bags and start planning your next adventure
                    </p>
                    <button
                      onClick={() => onBack()}
                      className="px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      Start exploring
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Connections Section */}
            {activeSection === 'connections' && (
              <div>
                <div className="pb-6 border-b border-gray-200 mb-8">
                  <h1 className="text-3xl font-semibold text-gray-900">Connections</h1>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 p-12">
                  <div className="text-center">
                    <Users size={64} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No connections yet</h3>
                    <p className="text-gray-600 mb-6">
                      Connect with other travelers and make new friends
                    </p>
                    <button
                      onClick={() => onBack()}
                      className="px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      Explore events
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
