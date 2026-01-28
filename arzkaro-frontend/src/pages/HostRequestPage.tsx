import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../contexts/ToastContext';
import { getLatestHostRequest, submitHostRequest } from '../services/hostService';
import ImageUpload from '../components/ImageUpload';
import type { HostRequest, HostType, HostRequestData } from '../types/host';
import type { PageName } from '../types/navigation';
import { 
  MapPin, 
  CheckCircle2, 
  FileText, 
  Building2,
  Loader2,
  User
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  validatePAN,
  validatePhone,
  validateIFSC,
  validatePIN,
  validateEmail,
  validateGSTIN,
  validateRequired,
  validateAccountNumber,
  formatPhone,
  formatPAN,
  formatIFSC,
  formatGSTIN,
  formatPIN
} from '../utils/validation';

interface HostRequestPageProps {
  onBack: () => void;
  onNavigate: (page: PageName) => void;
}

interface FormErrors {
  [key: string]: string;
}

export default function HostRequestPage({ onBack, onNavigate }: HostRequestPageProps) {
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingRequest, setExistingRequest] = useState<HostRequest | null>(null);
  const [selectedType, setSelectedType] = useState<HostType | null>(null);
  const [step, setStep] = useState<'selection' | 1 | 2 | 3 | 4>('selection');
  const [errors, setErrors] = useState<FormErrors>({});
  
  // Form State
  const [formData, setFormData] = useState({
    organizer_name: '',
    contact_number: '',
    email: user?.email || '',
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
    pan_card_photo_url: '',
    gst_certificate_url: ''
  });

  useEffect(() => {
    async function checkStatus() {
      if (!user?.id) {
        setLoading(false);
        return;
      }
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

  useEffect(() => {
    // Pre-fill email when user is available
    if (user?.email && !formData.email) {
      setFormData(prev => ({ ...prev, email: user.email || '' }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateCurrentStep = (): boolean => {
    const newErrors: FormErrors = {};

    if (step === 1) {
      // Personal Information validation
      const nameValidation = validateRequired(formData.organizer_name, 'Full name');
      if (!nameValidation.isValid) newErrors.organizer_name = nameValidation.error!;

      const phoneValidation = validatePhone(formData.contact_number);
      if (!phoneValidation.isValid) newErrors.contact_number = phoneValidation.error!;

      const emailValidation = validateEmail(formData.email);
      if (!emailValidation.isValid) newErrors.email = emailValidation.error!;
    } else if (step === 2) {
      // Address validation
      const addressValidation = validateRequired(formData.street_address, 'Street address', 5);
      if (!addressValidation.isValid) newErrors.street_address = addressValidation.error!;

      const cityValidation = validateRequired(formData.city, 'City');
      if (!cityValidation.isValid) newErrors.city = cityValidation.error!;

      const stateValidation = validateRequired(formData.state, 'State');
      if (!stateValidation.isValid) newErrors.state = stateValidation.error!;

      const pinValidation = validatePIN(formData.pin_code);
      if (!pinValidation.isValid) newErrors.pin_code = pinValidation.error!;
    } else if (step === 3) {
      // KYC validation
      const panValidation = validatePAN(formData.pan_number);
      if (!panValidation.isValid) newErrors.pan_number = panValidation.error!;

      if (!formData.pan_card_photo_url) {
        newErrors.pan_card_photo_url = 'Please upload PAN card photo';
      }

      if (selectedType === 'full') {
        const gstinValidation = validateGSTIN(formData.gstin);
        if (!gstinValidation.isValid) newErrors.gstin = gstinValidation.error!;
      }
    } else if (step === 4) {
      // Bank Details validation
      const holderValidation = validateRequired(formData.account_holder_name, 'Account holder name');
      if (!holderValidation.isValid) newErrors.account_holder_name = holderValidation.error!;

      const accountValidation = validateAccountNumber(formData.account_number);
      if (!accountValidation.isValid) newErrors.account_number = accountValidation.error!;

      const ifscValidation = validateIFSC(formData.ifsc_code);
      if (!ifscValidation.isValid) newErrors.ifsc_code = ifscValidation.error!;

      const beneficiaryValidation = validateRequired(formData.beneficiary_name, 'Beneficiary name');
      if (!beneficiaryValidation.isValid) newErrors.beneficiary_name = beneficiaryValidation.error!;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      if (step === 1) setStep(2);
      else if (step === 2) setStep(3);
      else if (step === 3) setStep(4);
    } else {
      showToast('Please fill in all required fields correctly', 'error');
    }
  };

  const handleBack = () => {
    if (step === 1) setStep('selection');
    else if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
    else if (step === 4) setStep(3);
  };

  const handleSubmit = async () => {
    if (!user?.id || !selectedType) return;

    if (!validateCurrentStep()) {
      showToast('Please fill in all required fields correctly', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const data: HostRequestData = {
        user_id: user.id,
        requested_host_type: selectedType,
        organizer_name: formData.organizer_name.trim(),
        contact_number: formData.contact_number.trim(),
        email: formData.email.trim().toLowerCase(),
        street_address: formData.street_address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        pin_code: formData.pin_code.trim(),
        pan_number: formData.pan_number.trim().toUpperCase(),
        account_holder_name: formData.account_holder_name.trim(),
        beneficiary_name: formData.beneficiary_name.trim(),
        account_number: formData.account_number.trim(),
        ifsc_code: formData.ifsc_code.trim().toUpperCase(),
        pan_card_photo_url: formData.pan_card_photo_url.trim(),
        ...(selectedType === 'full' && {
          gstin: formData.gstin ? formData.gstin.trim().toUpperCase() : undefined,
          gst_certificate_url: formData.gst_certificate_url ? formData.gst_certificate_url.trim() : undefined
        })
      };
      
      await submitHostRequest(data);
      showToast('Application submitted successfully! We\'ll review it within 2-3 business days.', 'success');
      
      const updatedRequest = await getLatestHostRequest(user.id);
      setExistingRequest(updatedRequest);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Submission failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 -mt-16 md:-mt-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF785A]" />
      </div>
    );
  }

  // If already a host
  if (profile?.role === 'host' || profile?.role === 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 -mt-16 md:-mt-24 flex flex-col items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full bg-white rounded-3xl p-12 border border-gray-200 shadow-sm text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-20 h-20 bg-green-50 rounded-2xl flex items-center justify-center mb-6 mx-auto"
          >
            <CheckCircle2 className="text-green-500 w-10 h-10" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="text-3xl font-bold text-gray-900 mb-3"
          >
            You're a Host!
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="text-gray-500 mb-8 leading-relaxed"
          >
            You have full access to hosting features. Start creating amazing events and trips for your community.
          </motion.p>
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            onClick={() => onNavigate('host-dashboard')}
            className="w-full px-8 py-4 bg-gray-900 text-white font-bold rounded-2xl transition-all hover:bg-black"
          >
            Go to Dashboard
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // If application is pending
  if (existingRequest?.status === 'pending') {
    return (
      <div className="min-h-screen bg-gray-50 -mt-16 md:-mt-24 flex flex-col items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full bg-white rounded-3xl p-12 border border-gray-200 shadow-sm text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 mx-auto"
          >
            <Loader2 className="text-blue-500 w-10 h-10 animate-spin" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="text-3xl font-bold text-gray-900 mb-3"
          >
            Under Review
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="text-gray-500 mb-8 leading-relaxed"
          >
            Your host application is being reviewed by our team. We'll notify you once a decision is made. This typically takes 2-3 business days.
          </motion.p>
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            onClick={onBack}
            className="w-full px-8 py-4 bg-gray-900 text-white font-bold rounded-2xl transition-all hover:bg-black"
          >
            Go Back
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // Selection Screen
  if (step === 'selection') {
    return (
      <div className="min-h-screen bg-gray-50 -mt-16 md:-mt-24 pt-28 md:pt-36 pb-24">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10"
        >
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Become a Host</h1>
            <p className="text-gray-500 text-lg">Choose the path that best fits your hosting goals</p>
          </div>
        </motion.div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              onClick={() => setSelectedType('activity')}
              className={`group p-8 rounded-3xl border-2 text-center transition-all ${
                selectedType === 'activity' 
                  ? 'border-black bg-gray-100 shadow-lg' 
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="mb-6 flex justify-center">
                <img 
                  src="/others/experiences.png" 
                  alt="Activity Host" 
                  className="w-32 h-32 object-contain"
                />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Activity Host</h3>
              <p className="text-gray-500 leading-relaxed mb-6">
                Host workshops, masterclasses, or single-day activities in your city.
              </p>
              <div className="flex items-center justify-center text-sm font-bold text-gray-400 uppercase tracking-wider">
                <span className={selectedType === 'activity' ? 'text-black' : ''}>
                  {selectedType === 'activity' ? 'Selected' : 'Select this option'}
                </span>
              </div>
            </motion.button>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              onClick={() => setSelectedType('full')}
              className={`group p-8 rounded-3xl border-2 text-center transition-all ${
                selectedType === 'full' 
                  ? 'border-black bg-gray-100 shadow-lg' 
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="mb-6 flex justify-center">
                <img 
                  src="/others/trips.png" 
                  alt="Full Host" 
                  className="w-32 h-32 object-contain"
                />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Full Host</h3>
              <p className="text-gray-500 leading-relaxed mb-6">
                Host multi-day journeys, curated group trips, and large scale events.
              </p>
              <div className="flex items-center justify-center text-sm font-bold text-gray-400 uppercase tracking-wider">
                <span className={selectedType === 'full' ? 'text-black' : ''}>
                  {selectedType === 'full' ? 'Selected' : 'Select this option'}
                </span>
              </div>
            </motion.button>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex justify-center"
          >
            <button 
              disabled={!selectedType}
              onClick={() => setStep(1)}
              className="px-16 py-4 bg-gray-900 text-white font-bold rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-black hover:shadow-lg"
            >
              Continue
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Form Steps
  return (
    <div className="min-h-screen bg-gray-50 -mt-16 md:-mt-24 pt-28 md:pt-36 pb-32">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10"
      >
        <div className="flex items-center justify-end mb-8">
          <button 
            onClick={() => setStep('selection')}
            className="text-sm text-black font-bold hover:underline"
          >
            Change Host Type
          </button>
        </div>
        
        <div className="mb-4">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {selectedType === 'full' ? 'Full Host' : 'Activity Host'} Application
          </h1>
          <p className="text-gray-500 text-lg">Complete the steps below to become a host</p>
        </div>
      </motion.div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Step 1: Personal Information */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm mb-8"
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="flex items-center gap-4 mb-8"
            >
              <div className="w-12 h-12 rounded-2xl bg-black/10 flex items-center justify-center">
                <User className="text-black" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
                <p className="text-sm text-gray-500">Provide your personal details as per official documents</p>
              </div>
            </motion.div>
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="space-y-2"
              >
                <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text"
                  placeholder="As per PAN"
                  className={`w-full px-5 py-4 rounded-2xl border-2 transition-all text-base ${
                    errors.organizer_name 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-gray-200 focus:border-black'
                  } focus:outline-none`}
                  value={formData.organizer_name}
                  onChange={(e) => handleInputChange('organizer_name', e.target.value)}
                />
                {errors.organizer_name && (
                  <p className="text-xs text-red-600 font-medium">{errors.organizer_name}</p>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="space-y-2"
              >
                <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                  Contact Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-base text-gray-500 font-medium">+91</span>
                  <input 
                    type="tel"
                    placeholder="10-digit mobile"
                    maxLength={10}
                    className={`w-full pl-16 pr-5 py-4 rounded-2xl border-2 transition-all text-base ${
                      errors.contact_number 
                        ? 'border-red-300 focus:border-red-500' 
                        : 'border-gray-200 focus:border-black'
                    } focus:outline-none`}
                    value={formData.contact_number}
                    onChange={(e) => handleInputChange('contact_number', formatPhone(e.target.value))}
                  />
                </div>
                {errors.contact_number && (
                  <p className="text-xs text-red-600 font-medium">{errors.contact_number}</p>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="space-y-2"
              >
                <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input 
                  type="email"
                  placeholder="your@email.com"
                  className={`w-full px-5 py-4 rounded-2xl border-2 transition-all text-base ${
                    errors.email 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-gray-200 focus:border-black'
                  } focus:outline-none`}
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
                {errors.email && (
                  <p className="text-xs text-red-600 font-medium">{errors.email}</p>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Step 2: Address */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm"
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="flex items-center gap-4 mb-8"
            >
              <div className="w-12 h-12 rounded-2xl bg-black/10 flex items-center justify-center">
                <MapPin className="text-black" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Address</h2>
                <p className="text-sm text-gray-500">Enter your complete address for verification</p>
              </div>
            </motion.div>
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="space-y-2"
              >
                <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                  Street Address <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text"
                  placeholder="Building, street, area"
                  className={`w-full px-5 py-4 rounded-2xl border-2 transition-all text-base ${
                    errors.street_address 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-gray-200 focus:border-black'
                  } focus:outline-none`}
                  value={formData.street_address}
                  onChange={(e) => handleInputChange('street_address', e.target.value)}
                />
                {errors.street_address && (
                  <p className="text-xs text-red-600 font-medium">{errors.street_address}</p>
                )}
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  className="md:col-span-2 space-y-2"
                >
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text"
                    placeholder="City"
                    className={`w-full px-5 py-4 rounded-2xl border-2 transition-all text-base ${
                      errors.city 
                        ? 'border-red-300 focus:border-red-500' 
                        : 'border-gray-200 focus:border-black'
                    } focus:outline-none`}
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                  />
                  {errors.city && (
                    <p className="text-xs text-red-600 font-medium">{errors.city}</p>
                  )}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                  className="space-y-2"
                >
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                    PIN Code <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text"
                    placeholder="6-digit"
                    maxLength={6}
                    className={`w-full px-5 py-4 rounded-2xl border-2 transition-all text-base ${
                      errors.pin_code 
                        ? 'border-red-300 focus:border-red-500' 
                        : 'border-gray-200 focus:border-black'
                    } focus:outline-none`}
                    value={formData.pin_code}
                    onChange={(e) => handleInputChange('pin_code', formatPIN(e.target.value))}
                  />
                  {errors.pin_code && (
                    <p className="text-xs text-red-600 font-medium">{errors.pin_code}</p>
                  )}
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.5 }}
                className="space-y-2"
              >
                <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                  State <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text"
                  placeholder="Enter state"
                  className={`w-full px-5 py-4 rounded-2xl border-2 transition-all text-base ${
                    errors.state 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-gray-200 focus:border-black'
                  } focus:outline-none`}
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                />
                {errors.state && (
                  <p className="text-xs text-red-600 font-medium">{errors.state}</p>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Step 3: KYC Documents */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm"
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="flex items-center gap-4 mb-8"
            >
              <div className="w-12 h-12 rounded-2xl bg-black/10 flex items-center justify-center">
                <FileText className="text-black" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">KYC Documents</h2>
                <p className="text-sm text-gray-500">Upload your KYC documents for verification</p>
              </div>
            </motion.div>
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="space-y-2"
              >
                <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                  PAN Number <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text"
                  placeholder="ABCDE1234F"
                  maxLength={10}
                  className={`w-full px-5 py-4 rounded-2xl border-2 transition-all text-base uppercase ${
                    errors.pan_number 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-gray-200 focus:border-black'
                  } focus:outline-none`}
                  value={formData.pan_number}
                  onChange={(e) => handleInputChange('pan_number', formatPAN(e.target.value))}
                />
                {errors.pan_number && (
                  <p className="text-xs text-red-600 font-medium">{errors.pan_number}</p>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                <ImageUpload
                  label="PAN Card Photo"
                  currentImageUrl={formData.pan_card_photo_url}
                  onImageSelected={(url) => handleInputChange('pan_card_photo_url', url)}
                  bucket="host-documents"
                  folder={user?.id}
                  required
                  error={errors.pan_card_photo_url}
                />
              </motion.div>

              {selectedType === 'full' && (
                <>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 }}
                    className="space-y-2"
                  >
                    <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                      GSTIN (Optional)
                    </label>
                    <input 
                      type="text"
                      placeholder="22AAAAA0000A1Z5"
                      maxLength={15}
                      className={`w-full px-5 py-4 rounded-2xl border-2 transition-all text-base uppercase ${
                        errors.gstin 
                          ? 'border-red-300 focus:border-red-500' 
                          : 'border-gray-200 focus:border-black'
                      } focus:outline-none`}
                      value={formData.gstin}
                      onChange={(e) => handleInputChange('gstin', formatGSTIN(e.target.value))}
                    />
                    {errors.gstin && (
                      <p className="text-xs text-red-600 font-medium">{errors.gstin}</p>
                    )}
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.5 }}
                  >
                    <ImageUpload
                      label="GST Certificate (Optional)"
                      currentImageUrl={formData.gst_certificate_url}
                      onImageSelected={(url) => handleInputChange('gst_certificate_url', url)}
                      bucket="host-documents"
                      folder={user?.id}
                    />
                  </motion.div>
                </>
              )}
            </div>
          </motion.div>
        )}

        {/* Step 4: Bank Details */}
        {step === 4 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm"
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="flex items-center gap-4 mb-8"
            >
              <div className="w-12 h-12 rounded-2xl bg-black/10 flex items-center justify-center">
                <Building2 className="text-black" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Bank Details</h2>
                <p className="text-sm text-gray-500">Provide your bank account details for receiving payouts</p>
              </div>
            </motion.div>
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="space-y-2"
              >
                <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                  Account Holder Name <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text"
                  placeholder="As per bank records"
                  className={`w-full px-5 py-4 rounded-2xl border-2 transition-all text-base ${
                    errors.account_holder_name 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-gray-200 focus:border-black'
                  } focus:outline-none`}
                  value={formData.account_holder_name}
                  onChange={(e) => handleInputChange('account_holder_name', e.target.value)}
                />
                {errors.account_holder_name && (
                  <p className="text-xs text-red-600 font-medium">{errors.account_holder_name}</p>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="space-y-2"
              >
                <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                  Account Number <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text"
                  placeholder="Enter account number"
                  className={`w-full px-5 py-4 rounded-2xl border-2 transition-all text-base ${
                    errors.account_number 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-gray-200 focus:border-black'
                  } focus:outline-none`}
                  value={formData.account_number}
                  onChange={(e) => handleInputChange('account_number', e.target.value)}
                />
                {errors.account_number && (
                  <p className="text-xs text-red-600 font-medium">{errors.account_number}</p>
                )}
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                  className="space-y-2"
                >
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                    IFSC Code <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text"
                    placeholder="ABCD0123456"
                    maxLength={11}
                    className={`w-full px-5 py-4 rounded-2xl border-2 transition-all text-base uppercase ${
                      errors.ifsc_code 
                        ? 'border-red-300 focus:border-red-500' 
                        : 'border-gray-200 focus:border-black'
                    } focus:outline-none`}
                    value={formData.ifsc_code}
                    onChange={(e) => handleInputChange('ifsc_code', formatIFSC(e.target.value))}
                  />
                  {errors.ifsc_code && (
                    <p className="text-xs text-red-600 font-medium">{errors.ifsc_code}</p>
                  )}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                  className="space-y-2"
                >
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                    Beneficiary Name <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text"
                    placeholder="Name"
                    className={`w-full px-5 py-4 rounded-2xl border-2 transition-all text-base ${
                      errors.beneficiary_name 
                        ? 'border-red-300 focus:border-red-500' 
                        : 'border-gray-200 focus:border-black'
                    } focus:outline-none`}
                    value={formData.beneficiary_name}
                    onChange={(e) => handleInputChange('beneficiary_name', e.target.value)}
                  />
                  {errors.beneficiary_name && (
                    <p className="text-xs text-red-600 font-medium">{errors.beneficiary_name}</p>
                  )}
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Fixed bottom section with progress bar and navigation */}
      {typeof step === 'number' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-20">
          {/* Single Continuous Progress Bar - Full Width */}
          <div className="w-full h-1 bg-gray-200 relative overflow-hidden mb-4">
            <div
              className="h-full bg-black transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>

          {/* Navigation Buttons - Full Width with Corners */}
          <div className="px-6 py-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.6 }}
              className="flex items-center justify-between"
            >
              <button
                onClick={handleBack}
                disabled={submitting}
                className="py-2 px-4 text-gray-900 font-medium hover:bg-gray-100 rounded-lg transition-colors underline disabled:opacity-50"
              >
                Back
              </button>
              
              {step < 4 ? (
                <button
                  onClick={handleNext}
                  className="py-2.5 px-6 bg-black text-white font-medium rounded-lg transition-colors hover:bg-gray-800"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className={`py-2.5 px-6 font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${
                    !submitting 
                      ? 'bg-black text-white hover:bg-gray-800' 
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Application'
                  )}
                </button>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
}
