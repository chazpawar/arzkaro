import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../contexts/ToastContext';
import { 
  getHostRequests, 
  approveHostRequest, 
  rejectHostRequest,
  getDocumentSignedUrl
} from '../../services/adminService';
import type { HostRequestWithUser } from '../../types/admin';
import type { PageName } from '../../types/navigation';
import { 
  ChevronLeft, 
  User as UserIcon,
  MapPin,
  FileText,
  Building2,
  CheckCircle,
  XCircle,
  Loader2,
  Image as ImageIcon,
  X,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminHostRequestsProps {
  onBack: () => void;
  onNavigate: (page: PageName) => void;
}

type StatusFilter = 'pending' | 'approved' | 'rejected' | 'all';

const HOST_TYPE_LABELS = {
  activity: 'Activity Host',
  full: 'Full Host'
};

export default function AdminHostRequests({ onBack, onNavigate }: AdminHostRequestsProps) {
  const { profile, user } = useAuth();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<HostRequestWithUser[]>([]);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [selectedRequest, setSelectedRequest] = useState<HostRequestWithUser | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [panImageUrl, setPanImageUrl] = useState<string | null>(null);
  const [gstImageUrl, setGstImageUrl] = useState<string | null>(null);
  const [loadingImages, setLoadingImages] = useState(false);
  const [viewingImage, setViewingImage] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    // Check if user is admin
    if (profile && profile.role !== 'admin') {
      showToast('Access denied. Admin privileges required.', 'error');
      onNavigate('home');
      return;
    }

    fetchRequests();
  }, [statusFilter, profile]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const result = await getHostRequests({
        status: statusFilter,
        page: 1,
        limit: 100
      });
      setRequests(result.requests);
      setTotal(result.total);
    } catch (err) {
      showToast('Failed to load host requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchDocumentUrls = async (request: HostRequestWithUser) => {
    setLoadingImages(true);
    setPanImageUrl(null);
    setGstImageUrl(null);

    try {
      if (request.pan_card_photo_url) {
        const url = await getDocumentSignedUrl('host-documents', request.pan_card_photo_url);
        setPanImageUrl(url);
      }

      if (request.gst_certificate_url) {
        const url = await getDocumentSignedUrl('host-documents', request.gst_certificate_url);
        setGstImageUrl(url);
      }
    } catch (error) {
      console.error('Error fetching document URLs:', error);
    } finally {
      setLoadingImages(false);
    }
  };

  useEffect(() => {
    if (selectedRequest) {
      fetchDocumentUrls(selectedRequest);
      setAdminNotes(selectedRequest.admin_notes || '');
    }
  }, [selectedRequest]);

  const handleApprove = async () => {
    if (!selectedRequest || !user?.id) return;

    setSubmitting(true);
    try {
      await approveHostRequest(selectedRequest.id, user.id, adminNotes || undefined);
      showToast('Host request approved successfully!', 'success');
      setShowApproveModal(false);
      setSelectedRequest(null);
      setAdminNotes('');
      fetchRequests();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to approve request', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !user?.id) return;

    if (!adminNotes.trim()) {
      showToast('Please provide a rejection reason', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await rejectHostRequest(selectedRequest.id, user.id, adminNotes, adminNotes);
      showToast('Host request rejected', 'success');
      setShowRejectModal(false);
      setSelectedRequest(null);
      setAdminNotes('');
      fetchRequests();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to reject request', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-yellow-100 text-yellow-700';
    }
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
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Host Requests</h1>
            <p className="text-gray-500 text-lg">Review and manage host applications</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Status Filters */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {(['pending', 'approved', 'rejected', 'all'] as StatusFilter[]).map((status) => (
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
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No requests found</h3>
            <p className="text-gray-500">
              {statusFilter === 'all' 
                ? 'No host requests available' 
                : `No ${statusFilter} requests at this time`}
            </p>
          </div>
        )}

        {/* Requests List */}
        {!loading && requests.length > 0 && (
          <div className="space-y-4">
            {requests.map((request) => (
              <motion.button
                key={request.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelectedRequest(request)}
                className="w-full bg-white rounded-3xl p-6 border border-gray-200 hover:border-gray-300 transition-all text-left"
              >
                <div className="flex items-start gap-4">
                  {request.user.avatar_url ? (
                    <img 
                      src={request.user.avatar_url} 
                      alt={request.user.full_name || 'User'} 
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
                        {request.user.full_name || 'Unknown User'}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                    </div>
                    
                    <p className="text-gray-500 mb-3">{request.user.email}</p>
                    
                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-gray-400" />
                        <span className="text-gray-600">{HOST_TYPE_LABELS[request.requested_host_type]}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-gray-400" />
                        <span className="text-gray-600">{request.city}</span>
                      </div>
                      <span className="text-gray-400">Applied {formatDate(request.created_at)}</span>
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedRequest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedRequest(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between rounded-t-3xl">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Host Application Details</h2>
                  <p className="text-gray-500">{HOST_TYPE_LABELS[selectedRequest.requested_host_type]}</p>
                </div>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-8">
                {/* Personal Information */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                      <UserIcon className="text-gray-900" size={20} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Personal Information</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 rounded-2xl p-4">
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Full Name</p>
                      <p className="text-gray-900 font-medium">{selectedRequest.organizer_name}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Email</p>
                      <p className="text-gray-900 font-medium">{selectedRequest.email}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Phone</p>
                      <p className="text-gray-900 font-medium">+91 {selectedRequest.contact_number}</p>
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                      <MapPin className="text-gray-900" size={20} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Address</h3>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                    <p className="text-gray-900">{selectedRequest.street_address}</p>
                    <p className="text-gray-900">{selectedRequest.city}, {selectedRequest.state} - {selectedRequest.pin_code}</p>
                  </div>
                </div>

                {/* KYC Documents */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                      <FileText className="text-gray-900" size={20} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">KYC Documents</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-2xl p-4">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">PAN Number</p>
                      <p className="text-gray-900 font-mono font-bold mb-3">{selectedRequest.pan_number}</p>
                      {loadingImages ? (
                        <div className="flex items-center gap-2 text-gray-500">
                          <Loader2 size={16} className="animate-spin" />
                          <span className="text-sm">Loading document...</span>
                        </div>
                      ) : panImageUrl ? (
                        <button
                          onClick={() => setViewingImage({ url: panImageUrl, title: 'PAN Card' })}
                          className="flex items-center gap-2 text-[#FF785A] hover:underline"
                        >
                          <ImageIcon size={16} />
                          <span className="text-sm font-medium">View PAN Card</span>
                        </button>
                      ) : (
                        <p className="text-sm text-gray-400">Document unavailable</p>
                      )}
                    </div>

                    {selectedRequest.requested_host_type === 'full' && selectedRequest.gstin && (
                      <div className="bg-gray-50 rounded-2xl p-4">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">GSTIN</p>
                        <p className="text-gray-900 font-mono font-bold mb-3">{selectedRequest.gstin}</p>
                        {loadingImages ? (
                          <div className="flex items-center gap-2 text-gray-500">
                            <Loader2 size={16} className="animate-spin" />
                            <span className="text-sm">Loading document...</span>
                          </div>
                        ) : gstImageUrl ? (
                          <button
                            onClick={() => setViewingImage({ url: gstImageUrl, title: 'GST Certificate' })}
                            className="flex items-center gap-2 text-[#FF785A] hover:underline"
                          >
                            <ImageIcon size={16} />
                            <span className="text-sm font-medium">View GST Certificate</span>
                          </button>
                        ) : (
                          <p className="text-sm text-gray-400">Document unavailable</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bank Details */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                      <Building2 className="text-gray-900" size={20} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Bank Details</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 rounded-2xl p-4">
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Account Holder</p>
                      <p className="text-gray-900 font-medium">{selectedRequest.account_holder_name}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Beneficiary</p>
                      <p className="text-gray-900 font-medium">{selectedRequest.beneficiary_name}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Account Number</p>
                      <p className="text-gray-900 font-mono font-medium">{selectedRequest.account_number}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">IFSC Code</p>
                      <p className="text-gray-900 font-mono font-medium">{selectedRequest.ifsc_code}</p>
                    </div>
                  </div>
                </div>

                {/* Admin Notes */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">
                    Admin Notes {selectedRequest.status === 'rejected' && <span className="text-red-500">*</span>}
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder={selectedRequest.status === 'pending' ? 'Add notes (optional for approval, required for rejection)' : 'Previous admin notes'}
                    disabled={selectedRequest.status !== 'pending'}
                    className={`w-full px-4 py-3 rounded-2xl border-2 text-base ${
                      selectedRequest.status !== 'pending'
                        ? 'bg-gray-100 border-gray-200'
                        : 'border-gray-200 focus:border-gray-900'
                    } focus:outline-none resize-none`}
                    rows={4}
                  />
                </div>

                {/* Actions */}
                {selectedRequest.status === 'pending' && (
                  <div className="flex gap-4">
                    <button
                      onClick={() => setShowRejectModal(true)}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-white border-2 border-red-200 text-red-700 font-bold rounded-2xl hover:bg-red-50 transition-colors"
                    >
                      <XCircle size={20} />
                      Reject
                    </button>
                    <button
                      onClick={() => setShowApproveModal(true)}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-green-600 text-white font-bold rounded-2xl hover:bg-green-700 transition-colors"
                    >
                      <CheckCircle size={20} />
                      Approve
                    </button>
                  </div>
                )}

                {selectedRequest.status !== 'pending' && (
                  <div className={`p-4 rounded-2xl ${
                    selectedRequest.status === 'approved' ? 'bg-green-50' : 'bg-red-50'
                  }`}>
                    <p className="text-sm font-bold text-gray-700 mb-1">
                      {selectedRequest.status === 'approved' ? 'Approved' : 'Rejected'} on {formatDate(selectedRequest.reviewed_at || selectedRequest.updated_at)}
                    </p>
                    {selectedRequest.rejection_reason && (
                      <p className="text-sm text-gray-600">
                        <strong>Reason:</strong> {selectedRequest.rejection_reason}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Viewer Modal */}
      <AnimatePresence>
        {viewingImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50"
            onClick={() => setViewingImage(null)}
          >
            <div className="relative max-w-5xl w-full">
              <button
                onClick={() => setViewingImage(null)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </button>
              <h3 className="text-white text-xl font-bold mb-4">{viewingImage.title}</h3>
              <img 
                src={viewingImage.url} 
                alt={viewingImage.title}
                className="w-full h-auto rounded-2xl"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Approve Confirmation Modal */}
      <AnimatePresence>
        {showApproveModal && (
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
              <h3 className="text-2xl font-bold text-gray-900 text-center mb-2">Approve Host Request?</h3>
              <p className="text-gray-500 text-center mb-6">
                This user will be granted host privileges and can start creating listings.
              </p>
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
        {showRejectModal && (
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
              <h3 className="text-2xl font-bold text-gray-900 text-center mb-2">Reject Host Request?</h3>
              <p className="text-gray-500 text-center mb-6">
                Please provide a reason for rejection. This will be shared with the applicant.
              </p>
              {!adminNotes.trim() && (
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
                  disabled={submitting || !adminNotes.trim()}
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
