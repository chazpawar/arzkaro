import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../contexts/ToastContext';
import { getAdminStats } from '../../services/adminService';
import type { AdminStats } from '../../types/admin';
import type { PageName } from '../../types/navigation';
import { 
  ChevronLeft, 
  Users, 
  Wallet, 
  Calendar,
  FileText,
  CreditCard,
  AlertCircle,
  Loader2,
  ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';

interface AdminDashboardProps {
  onNavigate: (page: PageName) => void;
}

export default function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const { profile, user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is admin
    if (profile && profile.role !== 'admin') {
      showToast('Access denied. Admin privileges required.', 'error');
      onNavigate('home');
      return;
    }

    fetchStats();
  }, [profile]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAdminStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load statistics');
      showToast('Failed to load dashboard statistics', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-900" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Failed to Load Dashboard</h2>
        <p className="text-gray-500 mb-6">{error}</p>
        <button 
          onClick={fetchStats}
          className="px-6 py-3 bg-gray-900 text-white font-bold rounded-2xl hover:bg-black transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => onNavigate('home')}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ChevronLeft size={20} className="mr-1" />
            <span className="font-medium">Back</span>
          </button>
          
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
            <p className="text-gray-500 text-lg">
              Welcome back, {profile?.full_name?.split(' ')[0] || 'Admin'}. Here's what's happening today.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Alert Section - Pending Host Requests */}
        {stats.pendingHostRequests > 0 && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => onNavigate('admin-host-requests')}
            className="w-full flex items-center gap-4 p-6 bg-yellow-50 border-2 border-yellow-200 rounded-3xl mb-8 hover:border-yellow-300 transition-all"
          >
            <div className="w-12 h-12 rounded-2xl bg-yellow-100 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="text-yellow-600" size={24} />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-lg font-bold text-yellow-900">Pending Host Requests</h3>
              <p className="text-yellow-700">
                {stats.pendingHostRequests} new request{stats.pendingHostRequests > 1 ? 's' : ''} require your attention
              </p>
            </div>
            <ChevronRight className="text-yellow-600" size={24} />
          </motion.button>
        )}

        {/* Alert Section - Pending Payouts */}
        {stats.pendingPayouts > 0 && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => onNavigate('admin-payouts')}
            className="w-full flex items-center gap-4 p-6 bg-green-50 border-2 border-green-200 rounded-3xl mb-8 hover:border-green-300 transition-all"
          >
            <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center flex-shrink-0">
              <CreditCard className="text-green-600" size={24} />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-lg font-bold text-green-900">Pending Payout Requests</h3>
              <p className="text-green-700">
                {stats.pendingPayouts} payout{stats.pendingPayouts > 1 ? 's' : ''} totaling {formatCurrency(stats.totalPayoutAmount)} awaiting approval
              </p>
            </div>
            <ChevronRight className="text-green-600" size={24} />
          </motion.button>
        )}

        {/* Primary Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#FF785A]/10 flex items-center justify-center mb-6">
              <Wallet className="text-[#FF785A]" size={24} />
            </div>
            <h3 className="text-4xl font-bold text-gray-900 mb-2">
              {formatCurrency(stats.totalRevenue)}
            </h3>
            <p className="text-gray-500 font-medium">Total Revenue</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-6">
              <Calendar className="text-blue-600" size={24} />
            </div>
            <h3 className="text-4xl font-bold text-gray-900 mb-2">
              {stats.totalBookings}
            </h3>
            <p className="text-gray-500 font-medium">Total Bookings</p>
          </motion.div>
        </div>

        {/* Platform Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-10"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Platform Metrics</h2>
          <p className="text-gray-500 mb-6">Key performance indicators</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <h4 className="text-3xl font-bold text-gray-900 mb-1">{stats.totalUsers}</h4>
              <p className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">Users</p>
              {stats.newUsersThisMonth > 0 && (
                <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 rounded-full">
                  <span className="text-xs font-bold text-green-600">
                    +{stats.newUsersThisMonth} this month
                  </span>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <h4 className="text-3xl font-bold text-gray-900 mb-1">{stats.totalHosts}</h4>
              <p className="text-sm font-bold text-gray-700 uppercase tracking-wider">Hosts</p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <h4 className="text-3xl font-bold text-gray-900 mb-1">{stats.totalEvents}</h4>
              <p className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">Listings</p>
              <p className="text-xs text-gray-500">{stats.activeEvents} active</p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <h4 className="text-3xl font-bold text-gray-900 mb-1">{stats.pendingHostRequests}</h4>
              <p className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">Requests</p>
              <p className={`text-xs ${stats.pendingHostRequests > 0 ? 'text-yellow-600' : 'text-gray-500'}`}>
                {stats.pendingHostRequests > 0 ? 'Pending' : 'All clear'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Quick Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Quick Management</h2>
          <p className="text-gray-500 mb-6">Access core admin functions</p>

          <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden">
            <button
              onClick={() => onNavigate('admin-host-requests')}
              className="w-full flex items-center gap-4 p-6 hover:bg-gray-50 transition-colors border-b border-gray-200"
            >
              <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
                <FileText size={24} className="text-gray-900" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-lg font-bold text-gray-900">Host Requests</h3>
                <p className="text-sm text-gray-500">Approve or reject host applications</p>
              </div>
              {stats.pendingHostRequests > 0 && (
                <div className="px-3 py-1 bg-[#FF785A] rounded-full">
                  <span className="text-white text-sm font-bold">{stats.pendingHostRequests}</span>
                </div>
              )}
              <ChevronRight className="text-gray-400" size={24} />
            </button>

            <button
              onClick={() => onNavigate('admin-payouts')}
              className="w-full flex items-center gap-4 p-6 hover:bg-gray-50 transition-colors"
            >
              <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center">
                <CreditCard size={24} className="text-green-600" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-lg font-bold text-gray-900">Payout Requests</h3>
                <p className="text-sm text-gray-500">Review and approve host payouts</p>
              </div>
              {stats.pendingPayouts > 0 && (
                <div className="px-3 py-1 bg-green-500 rounded-full">
                  <span className="text-white text-sm font-bold">{stats.pendingPayouts}</span>
                </div>
              )}
              <ChevronRight className="text-gray-400" size={24} />
            </button>
          </div>
        </motion.div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-400">ArzKaro Admin Panel v1.0</p>
        </div>
      </div>
    </div>
  );
}
