import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getLatestHostRequest, submitHostRequest } from '../services/hostService';
import type { HostRequest, HostType, HostRequestData } from '../types/host';
import type { PageName } from '../types/navigation';
import { 
  ChevronLeft, 
  MapPin, 
  CheckCircle2, 
  FileText, 
  CreditCard,
  Building2,
  Loader2
} from 'lucide-react';

interface HostRequestPageProps {
  onBack: () => void;
  onNavigate: (page: PageName) => void;
}

export default function HostRequestPage({ onBack, onNavigate }: HostRequestPageProps) {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingRequest, setExistingRequest] = useState<HostRequest | null>(null);
  const [selectedType, setSelectedType] = useState<HostType | null>(null);
  const [step, setStep] = useState<'selection' | 'form'>('selection');
  
  // Form State
  const [formData, setFormData] = useState({
    organizer_name: '',
    contact_number: '',
    street_address: '',
    city: '',
    state: '',
    pin_code: '',
    pan_number: '',
    gstin: '',
    account_holder_name: '',
    beneficiary_name: '',
    account_number: '',
    ifsc_code: '',
    pan_card_photo_url: 'https://placeholder.com/pan.jpg', // placeholders for now
    gst_certificate_url: 'https://placeholder.com/gst.jpg'
  });

  useEffect(() => {
    async function checkStatus() {
      if (!user?.id) return;
      try {
        const request = await getLatestHostRequest(user.id);
        setExistingRequest(request);
      } catch (err) {
        console.error('Error fetching host request:', err);
      } finally {
        setLoading(false);
      }
    }
    checkStatus();
  }, [user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !selectedType) return;

    setSubmitting(true);
    try {
      const data: HostRequestData = {
        user_id: user.id,
        requested_host_type: selectedType,
        ...formData,
        email: user.email || ''
      };
      
      await submitHostRequest(data);
      const updatedRequest = await getLatestHostRequest(user.id);
      setExistingRequest(updatedRequest);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF785A]" />
      </div>
    );
  }

  // If already a host
  if (profile?.role === 'host' || profile?.role === 'admin') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="text-green-500 w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">You're a Host!</h1>
        <p className="text-gray-600 mb-8 max-w-md">
          You have full access to hosting features. Start creating amazing events and trips for your community.
        </p>
        <button 
          onClick={() => onNavigate('host-dashboard')}
          className="px-8 py-3 bg-[#FF785A] text-white font-bold rounded-full transition-all hover:shadow-lg"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  // If application is pending
  if (existingRequest?.status === 'pending') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
          <Loader2 className="text-blue-500 w-10 h-10 animate-spin" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Under Review</h1>
        <p className="text-gray-600 mb-8 max-w-md">
          Your host application is being reviewed by our team. We'll notify you once a decision is made. This typically takes 2-3 business days.
        </p>
        <button 
          onClick={onBack}
          className="px-8 py-3 bg-gray-900 text-white font-bold rounded-full transition-all hover:bg-black"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Selection Screen
  if (step === 'selection') {
    return (
      <div className="min-h-screen bg-white pb-24">
        {/* Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full mr-4 transition-colors">
            <ChevronLeft size={24} />
          </button>
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">What would you like to host?</h1>
          <p className="text-gray-500 text-lg mb-12">Choose the path that best fits your hosting goals.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <button 
              onClick={() => setSelectedType('activity')}
              className={`p-8 rounded-3xl border-2 text-left transition-all ${
                selectedType === 'activity' 
                  ? 'border-[#FF785A] bg-[#FF785A]/5' 
                  : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-6 text-3xl">
                ✨
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Experiences</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Host workshops, masterclasses, or single-day activities in your city.
              </p>
            </button>

            <button 
              onClick={() => setSelectedType('full')}
              className={`p-8 rounded-3xl border-2 text-left transition-all ${
                selectedType === 'full' 
                  ? 'border-[#FF785A] bg-[#FF785A]/5' 
                  : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-6 text-3xl">
                🏔️
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Trips & Events</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Host multi-day journeys, curated group trips, and large scale events.
              </p>
            </button>
          </div>

          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-6 md:relative md:bg-transparent md:border-0 md:p-0">
            <button 
              disabled={!selectedType}
              onClick={() => setStep('form')}
              className="w-full md:w-auto px-12 py-4 bg-[#FF785A] text-white font-bold rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg"
            >
              Next Step
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Form Screen
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center">
          <button onClick={() => setStep('selection')} className="p-2 hover:bg-gray-100 rounded-full mr-4 transition-colors">
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Become a Host</h1>
            <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">
              {selectedType === 'full' ? 'Full Host Application' : 'Activity Host Application'}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section: Basic Info */}
          <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <FileText className="text-[#FF785A]" size={24} />
              <h2 className="text-xl font-bold text-gray-900">Basic Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Organizer Name</label>
                <input 
                  required
                  type="text"
                  placeholder="Your name or company name"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FF785A]/20 transition-all text-sm"
                  value={formData.organizer_name}
                  onChange={(e) => setFormData({...formData, organizer_name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Contact Number</label>
                <input 
                  required
                  type="tel"
                  placeholder="+91 12345 67890"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FF785A]/20 transition-all text-sm"
                  value={formData.contact_number}
                  onChange={(e) => setFormData({...formData, contact_number: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Section: Address */}
          <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <MapPin className="text-[#FF785A]" size={24} />
              <h2 className="text-xl font-bold text-gray-900">Address</h2>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Street Address</label>
                <input 
                  required
                  type="text"
                  placeholder="Address Line 1"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FF785A]/20 transition-all text-sm"
                  value={formData.street_address}
                  onChange={(e) => setFormData({...formData, street_address: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">City</label>
                  <input 
                    required
                    type="text"
                    placeholder="City"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FF785A]/20 transition-all text-sm"
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">State</label>
                  <input 
                    required
                    type="text"
                    placeholder="State"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FF785A]/20 transition-all text-sm"
                    value={formData.state}
                    onChange={(e) => setFormData({...formData, state: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">PIN Code</label>
                  <input 
                    required
                    type="text"
                    placeholder="110001"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FF785A]/20 transition-all text-sm"
                    value={formData.pin_code}
                    onChange={(e) => setFormData({...formData, pin_code: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section: KYC */}
          <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <CreditCard className="text-[#FF785A]" size={24} />
              <h2 className="text-xl font-bold text-gray-900">KYC Verification</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">PAN Number</label>
                <input 
                  required
                  type="text"
                  placeholder="ABCDE1234F"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FF785A]/20 transition-all text-sm uppercase"
                  value={formData.pan_number}
                  onChange={(e) => setFormData({...formData, pan_number: e.target.value})}
                />
              </div>
              {selectedType === 'full' && (
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">GSTIN (Optional)</label>
                  <input 
                    type="text"
                    placeholder="07AAAAA0000A1Z5"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FF785A]/20 transition-all text-sm uppercase"
                    value={formData.gstin}
                    onChange={(e) => setFormData({...formData, gstin: e.target.value})}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Section: Bank */}
          <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <Building2 className="text-[#FF785A]" size={24} />
              <h2 className="text-xl font-bold text-gray-900">Bank Details</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Account Holder Name</label>
                <input 
                  required
                  type="text"
                  placeholder="Name as per bank records"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FF785A]/20 transition-all text-sm"
                  value={formData.account_holder_name}
                  onChange={(e) => setFormData({...formData, account_holder_name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Beneficiary Name</label>
                <input 
                  required
                  type="text"
                  placeholder="Name of person/entity"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FF785A]/20 transition-all text-sm"
                  value={formData.beneficiary_name}
                  onChange={(e) => setFormData({...formData, beneficiary_name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Account Number</label>
                <input 
                  required
                  type="text"
                  placeholder="1234567890"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FF785A]/20 transition-all text-sm"
                  value={formData.account_number}
                  onChange={(e) => setFormData({...formData, account_number: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">IFSC Code</label>
                <input 
                  required
                  type="text"
                  placeholder="SBIN0001234"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FF785A]/20 transition-all text-sm uppercase"
                  value={formData.ifsc_code}
                  onChange={(e) => setFormData({...formData, ifsc_code: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4">
            <button 
              type="submit"
              disabled={submitting}
              className="w-full md:w-auto px-16 py-4 bg-[#FF785A] text-white font-bold rounded-full disabled:opacity-50 transition-all hover:shadow-xl flex items-center justify-center"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Application'}
            </button>
            <p className="text-xs text-gray-400 max-w-md text-center">
              By submitting this application, you agree to our Terms of Service and Privacy Policy. KYC documents will be handled securely.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
