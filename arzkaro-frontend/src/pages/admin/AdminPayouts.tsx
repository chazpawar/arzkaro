import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../contexts/ToastContext';
import { 
  getAllPayoutRequests, 
  getPayoutStatistics,
  approvePayoutRequest,
  rejectPayoutRequest,
  markPayoutProcessing,
  markPayoutCompleted
} from '../../services/adminService';
import type { PayoutRequest, PayoutStatistics } from '../../types/admin';
import type { PageName } from '../../types/navigation';
import { 
  ChevronLeft, 
  CreditCard,
  UserIcon,
  CheckCircle,
  XCircle,
  Clock,
  Check,
  Loader2,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminPayoutsProps {
  onBack: () => void;
  onNavigate: (page: PageName) => void;
}

type StatusFilter = 'pending' | 'approved' | 'processing' | 'completed' | 'rejected' | 'all';

export default function AdminPayouts({ onBack, onNavigate }: AdminPayoutsProps) {
  const { profile, user } = useAuth();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<PayoutRequest[]>([]);
  const [stats, setStats] = useState<PayoutStatistics | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [selectedRequest, setSelectedRequest] = useState<PayoutRequest | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    // Check if user is admin
    if (profile && profile.role !== 'admin') {
      showToast('Access denied. Admin privileges required.', 'error');
      onNavigate('home');
      return;
    }

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, profile]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [payoutsData, statsData] = await Promise.all([
        getAllPayoutRequests(statusFilter === 'all' ? undefined : statusFilter),
        getPayoutStatistics()
      ]);
      setRequests(payoutsData);
      setStats(statsData);
    } catch {
      showToast('Failed to load payout requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest || !user?.id) return;

    setSubmitting(true);
    try {
      await approvePayoutRequest(selectedRequest.id, user.id, {
        admin_note: adminNote || undefined
      });
      showToast('Payout request approved successfully!', 'success');
      setShowApproveModal(false);
      setSelectedRequest(null);
      setAdminNote('');
      fetchData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to approve payout', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !user?.id) return;

    if (!rejectionReason.trim()) {
      showToast('Please provide a rejection reason', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await rejectPayoutRequest(selectedRequest.id, user.id, {
        rejection_reason: rejectionReason,
        admin_note: adminNote || undefined
      });
      showToast('Payout request rejected', 'success');
      setShowRejectModal(false);
      setSelectedRequest(null);
      setRejectionReason('');
      setAdminNote('');
      fetchData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to reject payout', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkProcessing = async (request: PayoutRequest) => {
    setSubmitting(true);
    try {
      await markPayoutProcessing(request.id);
      showToast('Marked as processing', 'success');
      fetchData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update status', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkCompleted = async (request: PayoutRequest) => {
    setSubmitting(true);
    try {
      await markPayoutCompleted(request.id);
      showToast('Marked as completed', 'success');
      fetchData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update status', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock };
      case 'approved':
        return { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle };
      case 'processing':
        return { bg: 'bg-blue-100', text: 'text-blue-700', icon: TrendingUp };
      case 'completed':
        return { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: Check };
      case 'rejected':
        return { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', icon: Clock };
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={onBack}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ChevronLeft size={20} className="mr-1" />
            <span className="font-medium">Back to Dashboard</span>
          </button>
          
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Payout Requests</h1>
            <p className="text-gray-500 text-lg">Review and manage host payout requests</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-4 border border-gray-200"
            >
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.pending.total_amount)}</p>
              <p className="text-xs text-gray-500 mt-1">{stats.pending.count} requests</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-4 border border-gray-200"
            >
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Approved</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.approved.total_amount)}</p>
              <p className="text-xs text-gray-500 mt-1">{stats.approved.count} requests</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-4 border border-gray-200"
            >
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Processing</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.processing.total_amount)}</p>
              <p className="text-xs text-gray-500 mt-1">{stats.processing.count} requests</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl p-4 border border-gray-200"
            >
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.completed.total_amount)}</p>
              <p className="text-xs text-gray-500 mt-1">{stats.completed.count} requests</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-2xl p-4 border border-gray-200"
            >
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Rejected</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.rejected.total_amount)}</p>
              <p className="text-xs text-gray-500 mt-1">{stats.rejected.count} requests</p>
            </motion.div>
          </div>
        )}

        {/* Status Filters */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {(['pending', 'approved', 'processing', 'completed', 'rejected', 'all'] as StatusFilter[]).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-6 py-3 rounded-2xl font-bold text-sm uppercase tracking-wider transition-all flex-shrink-0 ${
                statusFilter === status
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gray-900" />
          </div>
        )}

        {/* Empty State */}
        {!loading && requests.length === 0 && (
          <div className="text-center py-20">
            <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No payout requests found</h3>
            <p className="text-gray-500">
              {statusFilter === 'all' 
                ? 'No payout requests available' 
                : `No ${statusFilter} payout requests at this time`}
            </p>
          </div>
        )}

        {/* Requests List */}
        {!loading && requests.length > 0 && (
          <div className="space-y-4">
            {requests.map((request) => {
              const statusStyle = getStatusColor(request.status);
              const StatusIcon = statusStyle.icon;

              return (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-3xl p-6 border border-gray-200"
                >
                  <div className="flex items-start gap-4 mb-6">
                    {request.host.avatar_url ? (
                      <img 
                        src={request.host.avatar_url} 
                        alt={request.host.full_name || 'Host'} 
                        className="w-16 h-16 rounded-2xl object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                        <UserIcon className="text-gray-400" size={32} />
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">
                          {request.host.full_name || 'Unknown Host'}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1 ${statusStyle.bg} ${statusStyle.text}`}>
                          <StatusIcon size={14} />
                          {request.status}
                        </span>
                      </div>
                      
                      <p className="text-gray-500 mb-3">{request.host.email}</p>
                      
                      <div className="flex items-center gap-6 text-sm mb-4">
                        <div className="flex items-center gap-2">
                          <CreditCard size={16} className="text-gray-400" />
                          <span className="text-2xl font-bold text-gray-900">{formatCurrency(request.requested_amount)}</span>
                        </div>
                        <span className="text-gray-400">Requested {formatDate(request.created_at)}</span>
                      </div>

                      {/* Bank Details */}
                      {request.bank_details && (
                        <div className="bg-gray-50 rounded-2xl p-4 mb-4">
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Bank Details</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500 text-xs mb-1">Account Holder</p>
                              <p className="text-gray-900 font-medium">{request.bank_details.account_holder_name}</p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs mb-1">Account Number</p>
                              <p className="text-gray-900 font-mono font-medium">{request.bank_details.account_number}</p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs mb-1">IFSC Code</p>
                              <p className="text-gray-900 font-mono font-medium">{request.bank_details.ifsc_code}</p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs mb-1">Beneficiary</p>
                              <p className="text-gray-900 font-medium">{request.bank_details.beneficiary_name}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Request Note */}
                      {request.request_note && (
                        <div className="bg-blue-50 rounded-2xl p-4 mb-4">
                          <p className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2">Request Note</p>
                          <p className="text-blue-900">{request.request_note}</p>
                        </div>
                      )}

                      {/* Admin Note */}
                      {request.admin_note && (
                        <div className="bg-purple-50 rounded-2xl p-4 mb-4">
                          <p className="text-xs font-bold text-purple-900 uppercase tracking-wider mb-2">Admin Note</p>
                          <p className="text-purple-900">{request.admin_note}</p>
                        </div>
                      )}

                      {/* Rejection Reason */}
                      {request.rejection_reason && (
                        <div className="bg-red-50 rounded-2xl p-4 mb-4">
                          <p className="text-xs font-bold text-red-900 uppercase tracking-wider mb-2">Rejection Reason</p>
                          <p className="text-red-900">{request.rejection_reason}</p>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        {request.status === 'pending' && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedRequest(request);
                                setShowRejectModal(true);
                              }}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-red-200 text-red-700 font-bold rounded-2xl hover:bg-red-50 transition-colors"
                            >
                              <XCircle size={18} />
                              Reject
                            </button>
                            <button
                              onClick={() => {
                                setSelectedRequest(request);
                                setShowApproveModal(true);
                              }}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white font-bold rounded-2xl hover:bg-green-700 transition-colors"
                            >
                              <CheckCircle size={18} />
                              Approve
                            </button>
                          </>
                        )}

                        {request.status === 'approved' && (
                          <button
                            onClick={() => handleMarkProcessing(request)}
                            disabled={submitting}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                          >
                            {submitting ? <Loader2 size={18} className="animate-spin" /> : <TrendingUp size={18} />}
                            Mark as Processing
                          </button>
                        )}

                        {request.status === 'processing' && (
                          <button
                            onClick={() => handleMarkCompleted(request)}
                            disabled={submitting}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-colors disabled:opacity-50"
                          >
                            {submitting ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                            Mark as Completed
                          </button>
                        )}

                        {(request.status === 'completed' || request.status === 'rejected') && (
                          <div className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl ${statusStyle.bg}`}>
                            <StatusIcon size={18} className={statusStyle.text} />
                            <span className={`font-bold ${statusStyle.text}`}>
                              {request.status === 'completed' 
                                ? `Completed on ${formatDate(request.completed_at || request.updated_at)}`
                                : `Rejected on ${formatDate(request.approved_at || request.updated_at)}`
                              }
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Approve Confirmation Modal */}
      <AnimatePresence>
        {showApproveModal && selectedRequest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => !submitting && setShowApproveModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-8 max-w-md w-full"
            >
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="text-green-600" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 text-center mb-2">Approve Payout?</h3>
              <p className="text-gray-500 text-center mb-4">
                {formatCurrency(selectedRequest.requested_amount)} will be marked as approved for {selectedRequest.host.full_name}.
              </p>

              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Admin Note (Optional)
                </label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Add any notes..."
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-gray-900 focus:outline-none resize-none"
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowApproveModal(false)}
                  disabled={submitting}
                  className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprove}
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-green-600 text-white font-bold rounded-2xl hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Approving...
                    </>
                  ) : (
                    'Confirm Approval'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reject Confirmation Modal */}
      <AnimatePresence>
        {showRejectModal && selectedRequest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => !submitting && setShowRejectModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-8 max-w-md w-full"
            >
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <XCircle className="text-red-600" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 text-center mb-2">Reject Payout?</h3>
              <p className="text-gray-500 text-center mb-4">
                Please provide a reason for rejecting {formatCurrency(selectedRequest.requested_amount)} for {selectedRequest.host.full_name}.
              </p>

              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why this payout is being rejected..."
                  className={`w-full px-4 py-3 rounded-2xl border-2 ${
                    !rejectionReason.trim() ? 'border-red-300' : 'border-gray-200'
                  } focus:border-gray-900 focus:outline-none resize-none`}
                  rows={3}
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Admin Note (Optional)
                </label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Add any additional notes..."
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-gray-900 focus:outline-none resize-none"
                  rows={2}
                />
              </div>

              {!rejectionReason.trim() && (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-2xl mb-4">
                  <AlertCircle className="text-yellow-600" size={20} />
                  <p className="text-sm text-yellow-700 font-medium">Rejection reason is required</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowRejectModal(false)}
                  disabled={submitting}
                  className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={submitting || !rejectionReason.trim()}
                  className="flex-1 px-6 py-3 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Rejecting...
                    </>
                  ) : (
                    'Confirm Rejection'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
