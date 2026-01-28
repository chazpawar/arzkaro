import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getHostStats, getHostEvents } from '../services/hostService';
import type { HostStats } from '../types/host';
import type { PageName } from '../types/navigation';
import type { AppEvent } from '../hooks/useEvents';
import { 
  Wallet, 
  Ticket, 
  Calendar, 
  PlusCircle, 
  QrCode, 
  List, 
  Banknote,
  ChevronRight,
  AlertCircle,
  Loader2,
  X,
  Smartphone
} from 'lucide-react';

interface HostDashboardProps {
  onNavigate: (page: PageName) => void;
}

export default function HostDashboard({ onNavigate }: HostDashboardProps) {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<HostStats | null>(null);
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInstallPopup, setShowInstallPopup] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);
      const [statsData, eventsData] = await Promise.all([
        getHostStats(user.id),
        getHostEvents(user.id)
      ]);
      setStats(statsData);
      setEvents(eventsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF785A]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-gray-900 font-bold text-xl mb-2">Something went wrong</p>
        <p className="text-gray-600 mb-6">{error}</p>
        <button 
          onClick={fetchData}
          className="px-6 py-2 bg-gray-900 text-white rounded-full font-bold transition-all hover:bg-black"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-12 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Hello, {profile?.full_name?.split(' ')[0] || 'Host'}
          </h1>
          <p className="text-gray-600 text-lg">Here's your hosting overview.</p>
        </div>

        {/* Primary Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm flex flex-col items-start">
            <div className="w-12 h-12 rounded-2xl bg-[#FF785A]/10 flex items-center justify-center mb-6">
              <Wallet className="text-[#FF785A]" size={24} />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {stats ? formatCurrency(stats.totalRevenue) : '₹0'}
            </div>
            <p className="text-gray-500 font-medium">Total Revenue</p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm flex flex-col items-start">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-6">
              <Ticket className="text-blue-500" size={24} />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {stats?.totalBookings || 0}
            </div>
            <p className="text-gray-500 font-medium">Total Bookings</p>
          </div>
        </div>

        {/* Detailed Stats Grid */}
        <div className="mb-12">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Your Stats</h2>
            <p className="text-gray-500">Key performance indicators</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-gray-200">
              <div className="text-2xl font-bold text-gray-900 mb-1">{stats?.totalEvents || 0}</div>
              <p className="text-xs uppercase tracking-wider text-gray-400 font-bold mb-2">Listings</p>
              <p className="text-[11px] text-gray-500">Created all time</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-200">
              <div className="text-2xl font-bold text-gray-900 mb-1">{stats?.upcomingEvents || 0}</div>
              <p className="text-xs uppercase tracking-wider text-gray-400 font-bold mb-2">Upcoming</p>
              <div className="inline-flex items-center px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-bold rounded-full">
                ACTIVE
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-200">
              <div className="text-2xl font-bold text-gray-900 mb-1">{stats?.totalBookings || 0}</div>
              <p className="text-xs uppercase tracking-wider text-gray-400 font-bold mb-2">Bookings</p>
              <p className="text-[11px] text-gray-500">Confirmed seats</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-200">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {stats ? stats.totalEvents - stats.upcomingEvents : 0}
              </div>
              <p className="text-xs uppercase tracking-wider text-gray-400 font-bold mb-2">Completed</p>
              <p className="text-[11px] text-gray-500">Past listings</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Quick Actions</h2>
              <p className="text-gray-500">Manage your hosting business</p>
            </div>
            <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
              <button 
                onClick={() => onNavigate('create-listing')}
                className="w-full flex items-center p-6 hover:bg-gray-50 transition-colors border-b border-gray-100"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#FF785A]/10 flex items-center justify-center mr-4">
                  <PlusCircle className="text-[#FF785A]" size={24} />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-bold text-gray-900 text-lg">Create Listing</h3>
                  <p className="text-sm text-gray-500">Launch a new trip or experience</p>
                </div>
                <ChevronRight className="text-gray-300" />
              </button>

              <button 
                onClick={() => setShowInstallPopup(true)}
                className="w-full flex items-center p-6 hover:bg-gray-50 transition-colors border-b border-gray-100"
              >
                <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mr-4">
                  <QrCode className="text-gray-600" size={24} />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-bold text-gray-900 text-lg">Scan Tickets</h3>
                  <p className="text-sm text-gray-500">Validate attendee tickets</p>
                </div>
                <ChevronRight className="text-gray-300" />
              </button>

              <button 
                onClick={() => onNavigate('my-listings')}
                className="w-full flex items-center p-6 hover:bg-gray-50 transition-colors border-b border-gray-100"
              >
                <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mr-4 relative">
                  <List className="text-gray-600" size={24} />
                  {stats && stats.upcomingEvents > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#FF785A] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                      {stats.upcomingEvents}
                    </div>
                  )}
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-bold text-gray-900 text-lg">My Listings</h3>
                  <p className="text-sm text-gray-500">View and manage your active entries</p>
                </div>
                <ChevronRight className="text-gray-300" />
              </button>

              <button 
                onClick={() => setShowInstallPopup(true)}
                className="w-full flex items-center p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center mr-4">
                  <Banknote className="text-green-600" size={24} />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-bold text-gray-900 text-lg">Payout Requests</h3>
                  <p className="text-sm text-gray-500">Withdraw your earnings</p>
                </div>
                <ChevronRight className="text-gray-300" />
              </button>
            </div>
          </div>

          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Current Listings</h2>
              <p className="text-gray-500">Recent active items</p>
            </div>
            <div className="space-y-4">
              {events.length > 0 ? (
                events.slice(0, 3).map((event) => (
                  <div key={event.id} className="bg-white p-4 rounded-2xl border border-gray-200 flex gap-4">
                    <img 
                      src={event.cover_image_url || 'https://via.placeholder.com/100'} 
                      alt={event.title}
                      className="w-16 h-16 rounded-xl object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 truncate mb-1">{event.title}</h4>
                      <p className="text-xs text-gray-500 mb-2">{event.category}</p>
                      <div className="flex items-center text-[10px] font-bold uppercase">
                        <span className={event.is_published ? 'text-green-600' : (event.is_cancelled ? 'text-red-600' : 'text-gray-400')}>
                          {event.is_published ? 'PUBLISHED' : (event.is_cancelled ? 'CANCELLED' : 'DRAFT')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white p-8 rounded-2xl border border-dashed border-gray-300 text-center">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">No listings yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Install App Popup */}
      {showInstallPopup && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border-2 border-black shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#FF785A]/10 flex items-center justify-center">
                  <Smartphone className="text-[#FF785A]" size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Install App</h3>
              </div>
              <button
                onClick={() => setShowInstallPopup(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <p className="text-gray-600 mb-6">
              This feature is only available in the mobile app. Please install the app to use this feature.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowInstallPopup(false)}
                className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  // You can add app store links here
                  setShowInstallPopup(false);
                }}
                className="flex-1 py-3 px-4 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
              >
                Download App
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
