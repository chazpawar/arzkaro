import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import {
  Image as ImageIcon,
  MapPin,
  Calendar,
  IndianRupee,
  Loader2,
  Check,
} from 'lucide-react';
import type { PageName } from '../types/navigation';
import { ImageUploadWithDragDrop } from '../components/ImageUploadWithDragDrop';
import { MultiImageUpload } from '../components/MultiImageUpload';
import { LocationAutocomplete } from '../components/LocationAutocomplete';
import { ItineraryBuilder, type ItineraryDay } from '../components/ItineraryBuilder';
import { InclusionsBuilder } from '../components/InclusionsBuilder';
import { ThingsToKnowBuilder } from '../components/ThingsToKnowBuilder';
import { StyledDatePicker } from '../components/StyledDatePicker';
import { StyledTimePicker } from '../components/StyledTimePicker';

interface CreateListingPageProps {
  onBack: () => void;
  onNavigate: (page: PageName) => void;
}

// Category definitions
const EXPERIENCE_CATEGORIES = {
  Cultural: ['Art', 'Dance', 'Music'],
  Nightlife: ['DJ Night', 'House Party', 'Nightout'],
  Outdoors: ['Camping', 'Cycling', 'Hiking', 'Walking'],
  Play: ['Board Game', 'Gaming'],
  Sports: ['Badminton', 'Basketball', 'Cricket', 'Football', 'Pickleball', 'Volleyball'],
  Wellness: ['Meditation', 'Yoga'],
};

const TRIP_CATEGORIES = [
  'Adventure',
  'Leisure',
  'Offbeat',
  'Spiritual',
  'Nature',
  'Festival',
  'Food & Culture',
  'Getaway',
];

export default function CreateListingPage({ onBack, onNavigate }: CreateListingPageProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [listingType, setListingType] = useState<'experience' | 'trip' | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Trigger animation when step changes
  useEffect(() => {
    setIsAnimating(false);
    const timer = setTimeout(() => setIsAnimating(true), 100);
    return () => clearTimeout(timer);
  }, [currentStep]);

  // Form data state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    coverImage: null as string | null,
    mainCategory: '',
    subcategories: [] as string[],
    customTags: [] as string[],
    location: null as { address: string; latitude: number; longitude: number } | null,
    startDate: '',
    endDate: '',
    thingsToKnow: [] as string[],
    departureLocation: '',
    pickupPoints: [] as string[],
    itinerary: [] as ItineraryDay[],
    whatsIncluded: [] as string[],
    whatsNotIncluded: [] as string[],
    tripImages: [] as string[],
    termsAndConditions: '',
    cancellationPolicy: '',
    maxCapacity: '',
    price: '',
  });

  const totalSteps = listingType === 'experience' ? 9 : 10;

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return listingType !== null;
      case 1:
        return formData.title.trim() && formData.description.trim();
      case 2:
        return formData.coverImage !== null;
      case 3:
        return formData.mainCategory !== '';
      case 4:
        if (listingType === 'experience') {
          return formData.subcategories.length > 0;
        }
        return true;
      case 5:
        return true; // Location is now optional
      case 6:
        if (listingType === 'experience') {
          return formData.startDate && formData.endDate;
        } else {
          return formData.startDate && formData.endDate && formData.departureLocation.trim();
        }
      case 7:
        if (listingType === 'experience') {
          return formData.termsAndConditions.trim() && formData.cancellationPolicy.trim();
        }
        return true;
      case 8:
        if (listingType === 'experience') {
          return formData.maxCapacity && formData.price;
        }
        return formData.termsAndConditions.trim() && formData.cancellationPolicy.trim();
      case 9:
        return formData.maxCapacity && formData.price;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canProceed() && currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      onBack();
    }
  };

  const validateFormData = (): { isValid: boolean; errorMessage: string } => {
    // Check basic requirements
    if (!formData.title.trim()) {
      return { isValid: false, errorMessage: 'Title is required. Please add a title for your listing.' };
    }

    if (!formData.description.trim()) {
      return { isValid: false, errorMessage: 'Description is required. Please describe your listing.' };
    }

    if (!formData.coverImage) {
      return { isValid: false, errorMessage: 'Cover image is required. Please upload a cover image.' };
    }

    if (!formData.mainCategory) {
      return { isValid: false, errorMessage: 'Category is required. Please select a category.' };
    }

    if (listingType === 'experience' && formData.subcategories.length === 0) {
      return { isValid: false, errorMessage: 'At least one subcategory is required. Please select subcategories.' };
    }

    if (!formData.startDate || !formData.endDate) {
      return { isValid: false, errorMessage: 'Start and end dates are required. Please select dates for your listing.' };
    }

    // Validate dates
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (startDate < now) {
      return { isValid: false, errorMessage: 'Start date cannot be in the past. Please select a future date.' };
    }

    if (endDate < startDate) {
      return { isValid: false, errorMessage: 'End date must be after start date. Please correct the dates.' };
    }

    if (listingType === 'trip' && !formData.departureLocation.trim()) {
      return { isValid: false, errorMessage: 'Departure location is required for trips. Please add a departure location.' };
    }

    if (!formData.termsAndConditions.trim()) {
      return { isValid: false, errorMessage: 'Terms and conditions are required. Please add terms and conditions.' };
    }

    if (!formData.cancellationPolicy.trim()) {
      return { isValid: false, errorMessage: 'Cancellation policy is required. Please add a cancellation policy.' };
    }

    if (!formData.maxCapacity || parseInt(formData.maxCapacity) <= 0) {
      return { isValid: false, errorMessage: 'Maximum capacity must be greater than 0. Please enter a valid capacity.' };
    }

    if (!formData.price || parseFloat(formData.price) < 0) {
      return { isValid: false, errorMessage: 'Price must be 0 or greater. Please enter a valid price.' };
    }

    // Validate price format
    const priceValue = parseFloat(formData.price);
    if (isNaN(priceValue)) {
      return { isValid: false, errorMessage: 'Invalid price format. Please enter a valid number.' };
    }

    // Validate capacity format
    const capacityValue = parseInt(formData.maxCapacity);
    if (isNaN(capacityValue)) {
      return { isValid: false, errorMessage: 'Invalid capacity format. Please enter a valid number.' };
    }

    return { isValid: true, errorMessage: '' };
  };

  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();

      // Handle Supabase-specific errors
      if (errorMessage.includes('foreign key')) {
        return 'Invalid user account. Please log in again and try creating the listing.';
      }

      if (errorMessage.includes('unique constraint') || errorMessage.includes('duplicate')) {
        return 'A listing with similar details already exists. Please check your existing listings.';
      }

      if (errorMessage.includes('check constraint')) {
        return 'Invalid data provided. Please check all fields and ensure they meet the requirements.';
      }

      if (errorMessage.includes('not null')) {
        return 'Required fields are missing. Please fill in all required information.';
      }

      if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        return 'Network error. Please check your internet connection and try again.';
      }

      if (errorMessage.includes('timeout')) {
        return 'Request timed out. Please try again.';
      }

      if (errorMessage.includes('permission') || errorMessage.includes('unauthorized')) {
        return 'You do not have permission to create listings. Please contact support.';
      }

      if (errorMessage.includes('storage') || errorMessage.includes('image')) {
        return 'Image upload failed. Please try uploading the cover image again.';
      }

      // Return the original error message if it's user-friendly
      if (error.message.length < 100) {
        return error.message;
      }

      // For long technical error messages, provide a generic one
      return 'Failed to create listing. Please check all fields and try again.';
    }

    return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
  };

  const handleSubmit = async () => {
    if (!user?.id || !listingType) {
      showToast('Please log in to create a listing.', 'error');
      return;
    }

    // Validate form data before submission
    const validation = validateFormData();
    if (!validation.isValid) {
      showToast(validation.errorMessage, 'error');
      return;
    }

    setSubmitting(true);
    try {
      const eventData: Record<string, unknown> = {
        host_id: user.id,
        type: listingType,
        title: formData.title.trim(),
        description: formData.description.trim(),
        cover_image_url: formData.coverImage,
        category: formData.mainCategory,
        tags: listingType === 'experience' ? formData.subcategories : formData.customTags,
        location_name: formData.location?.address || null,
        location_address: formData.location?.address || null,
        location_lat: formData.location?.latitude || null,
        location_lng: formData.location?.longitude || null,
        start_date: new Date(formData.startDate).toISOString(),
        end_date: new Date(formData.endDate).toISOString(),
        max_capacity: parseInt(formData.maxCapacity),
        price: parseFloat(formData.price),
        things_to_know: formData.thingsToKnow.length > 0 ? formData.thingsToKnow : null,
        terms_and_conditions: formData.termsAndConditions.trim(),
        cancellation_policy: formData.cancellationPolicy.trim(),
        is_published: true,
        is_cancelled: false,
      };

      if (listingType === 'trip') {
        eventData.departure_location = formData.departureLocation.trim();
        eventData.pickups = formData.pickupPoints.length > 0 ? formData.pickupPoints : null;
        eventData.itinerary = formData.itinerary.length > 0 ? JSON.stringify(formData.itinerary) : null;
        eventData.whats_included =
          formData.whatsIncluded.length > 0 ? JSON.stringify(formData.whatsIncluded) : null;
        eventData.whats_not_included =
          formData.whatsNotIncluded.length > 0 ? JSON.stringify(formData.whatsNotIncluded) : null;
        eventData.images = formData.tripImages.length > 0 ? formData.tripImages : null;
      }

      console.log('Inserting eventData:', eventData);
      const { error, data } = await supabase.from('events').insert(eventData).select().single();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error('Listing was created but no data was returned. Please check your listings.');
      }

      showToast('Listing created successfully!', 'success');
      onNavigate('host-dashboard');
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      showToast(errorMessage, 'error');
      console.error('Listing creation error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const renderStepContent = () => {
    if (currentStep === 0) {
      return (
        <div className="space-y-6">
          <div className={`text-center mb-8 transition-all duration-500 ${
            isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`} style={{ transitionDelay: '50ms' }}>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Your Listing</h2>
            <p className="text-gray-600">Choose what you'd like to host</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setListingType('experience')}
              className={`p-8 rounded-2xl border-2 transition-all duration-500 hover:scale-105 ${
                isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              } ${listingType === 'experience' ? 'border-black bg-gray-100' : 'border-gray-200 hover:border-gray-300'}`}
              style={{ transitionDelay: '100ms' }}
            >
              <div className="text-center">
                <img
                  src="/others/experiences.png"
                  alt="Experience"
                  className="w-24 h-24 mx-auto mb-3 object-contain"
                />
                <h3 className="text-lg font-bold text-gray-900 mb-1">Experience</h3>
                <p className="text-sm text-gray-600">Short activities & events</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setListingType('trip')}
              className={`p-8 rounded-2xl border-2 transition-all duration-500 hover:scale-105 ${
                isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              } ${listingType === 'trip' ? 'border-black bg-gray-100' : 'border-gray-200 hover:border-gray-300'}`}
              style={{ transitionDelay: '200ms' }}
            >
              <div className="text-center">
                <img
                  src="/others/trips.png"
                  alt="Trip"
                  className="w-24 h-24 mx-auto mb-3 object-contain"
                />
                <h3 className="text-lg font-bold text-gray-900 mb-1">Trip</h3>
                <p className="text-sm text-gray-600">Multi-day adventures</p>
              </div>
            </button>
          </div>
        </div>
      );
    }

    if (currentStep === 1) {
      return (
        <div className="space-y-6">
          <div className={`flex items-center gap-3 mb-6 transition-all duration-500 ${
            isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`} style={{ transitionDelay: '50ms' }}>
            <h2 className="text-2xl font-bold text-gray-900">Tell us about your {listingType}</h2>
          </div>
          <div className="space-y-4">
            <div className={`transition-all duration-500 ${
              isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`} style={{ transitionDelay: '150ms' }}>
              <label className="block text-sm font-medium text-gray-900 mb-2">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Give it a catchy name"
                maxLength={60}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">{formData.title.length}/60 characters</p>
            </div>
            <div className={`transition-all duration-500 ${
              isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`} style={{ transitionDelay: '250ms' }}>
              <label className="block text-sm font-medium text-gray-900 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What should people expect?"
                rows={6}
                maxLength={500}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.description.length}/500 characters
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (currentStep === 2) {
      return (
        <div className="space-y-6">
          <div className={`flex items-center gap-3 mb-6 transition-all duration-500 ${
            isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`} style={{ transitionDelay: '50ms' }}>
            <h2 className="text-2xl font-bold text-gray-900">Upload a cover image</h2>
          </div>
          <div className={`transition-all duration-500 ${
            isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`} style={{ transitionDelay: '150ms' }}>
            <ImageUploadWithDragDrop
              value={formData.coverImage}
              onChange={(url) => setFormData({ ...formData, coverImage: url })}
              aspectRatio="9/16"
              label="Cover Image"
              description="Drag and drop or click to upload (9:16 aspect ratio recommended)"
            />
          </div>
        </div>
      );
    }

    if (currentStep === 3) {
      const categories =
        listingType === 'experience' ? Object.keys(EXPERIENCE_CATEGORIES) : TRIP_CATEGORIES;
      
      const getCategoryImagePath = (category: string) => {
        if (listingType === 'experience') {
          return `/categoriesicons/${category.toLowerCase()}/${category}.png`;
        } else {
          // For trips, handle "Food & Culture" -> "Food.png"
          const imageName = category === 'Food & Culture' ? 'Food' : category;
          return `/trips/${imageName}.png`;
        }
      };
      
      return (
        <div className="space-y-6">
          <div className={`text-center mb-6 transition-all duration-500 ${
            isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`} style={{ transitionDelay: '50ms' }}>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose a category</h2>
            <p className="text-gray-600">Help people find your {listingType}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {categories.map((category, index) => (
              <button
                key={category}
                type="button"
                onClick={() => setFormData({ ...formData, mainCategory: category })}
                className={`p-6 rounded-lg border-2 transition-all duration-500 text-center hover:scale-105 ${
                  isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                } ${formData.mainCategory === category ? 'border-black bg-gray-100 text-gray-900' : 'border-gray-200 hover:border-gray-300 text-gray-700'}`}
                style={{ transitionDelay: `${100 + (index * 50)}ms` }}
              >
                <img
                  src={getCategoryImagePath(category)}
                  alt={category}
                  className="w-16 h-16 mx-auto mb-2 object-contain"
                />
                <p className="font-medium">{category}</p>
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (currentStep === 4 && listingType === 'experience') {
      const subcategories =
        EXPERIENCE_CATEGORIES[formData.mainCategory as keyof typeof EXPERIENCE_CATEGORIES] || [];
      
      const getSubcategoryImagePath = (subcategory: string) => {
        const category = formData.mainCategory.toLowerCase();
        // Keep the original name with spaces for file path
        return `/categoriesicons/${category}/${subcategory}.png`;
      };
      
      return (
        <div className="space-y-6">
          <div className={`text-center mb-6 transition-all duration-500 ${
            isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`} style={{ transitionDelay: '50ms' }}>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Select subcategories</h2>
            <p className="text-gray-600">Choose all that apply</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {subcategories.map((sub, index) => {
              const isSelected = formData.subcategories.includes(sub);
              return (
                <button
                  key={sub}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      setFormData({
                        ...formData,
                        subcategories: formData.subcategories.filter((s) => s !== sub),
                      });
                    } else {
                      setFormData({ ...formData, subcategories: [...formData.subcategories, sub] });
                    }
                  }}
                  className={`p-6 rounded-lg border-2 transition-all duration-500 relative hover:scale-105 ${
                    isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  } ${isSelected ? 'border-black bg-gray-100 text-gray-900' : 'border-gray-200 hover:border-gray-300 text-gray-700'}`}
                  style={{ transitionDelay: `${100 + (index * 50)}ms` }}
                >
                  <div className="flex flex-col items-center text-center">
                    <img
                      src={getSubcategoryImagePath(sub)}
                      alt={sub}
                      className="w-12 h-12 mb-2 object-contain"
                    />
                    <span className="font-medium text-sm">{sub}</span>
                  </div>
                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <Check className="w-5 h-5" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    const locationStep = listingType === 'experience' ? 5 : 4;
    if (currentStep === locationStep) {
      return (
        <div className="space-y-6">
          <div className={`mb-6 transition-all duration-500 ${
            isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`} style={{ transitionDelay: '50ms' }}>
            <div className="flex items-center gap-3 mb-2">
              <MapPin className="w-6 h-6 text-orange-500" />
              <h2 className="text-2xl font-bold text-gray-900">Where will this take place?</h2>
            </div>
            <p className="text-sm text-gray-500 ml-9">Optional - You can skip this and add it later</p>
          </div>
          <div className={`transition-all duration-500 ${
            isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`} style={{ transitionDelay: '150ms' }}>
            <LocationAutocomplete
              value={formData.location}
              onChange={(location) => setFormData({ ...formData, location })}
              label="Location"
              placeholder="Search for a location (optional)..."
            />
          </div>
        </div>
      );
    }

    const dateStep = listingType === 'experience' ? 6 : 5;
    if (currentStep === dateStep) {
      // Get today's date in YYYY-MM-DD format
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];
      
      // Get start date and time
      const startDate = formData.startDate.split('T')[0] || '';
      const startTime = formData.startDate.split('T')[1] || '';
      const endDate = formData.endDate.split('T')[0] || '';
      
      // Determine minDate for end date picker
      const endMinDate = startDate || todayStr;
      
      // Determine minTime for end time picker (only if end date equals start date)
      const endMinTime = endDate === startDate && startTime ? startTime : undefined;
      
      return (
        <div className="space-y-6">
          <div className={`mb-8 transition-all duration-500 ${
            isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`} style={{ transitionDelay: '50ms' }}>
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-6 h-6 text-orange-500" />
              <h2 className="text-2xl font-bold text-gray-900">When does it start and end?</h2>
            </div>
            <p className="text-gray-600 text-sm">Set the date and time for your {listingType}</p>
          </div>

          <div className="space-y-6">
            {/* Start Date & Time */}
            <div className={`bg-gray-50 border border-gray-200 rounded-xl p-5 transition-all duration-500 overflow-visible ${
              isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`} style={{ transitionDelay: '150ms' }}>
              <label className="block text-base font-semibold text-gray-900 mb-4">
                Start Date & Time
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative overflow-visible">
                  <StyledDatePicker
                    value={startDate}
                    onChange={(dateValue) => {
                      const time = formData.startDate.split('T')[1] || '00:00';
                      setFormData({ ...formData, startDate: `${dateValue}T${time}` });
                    }}
                    label="Date"
                    minDate={todayStr}
                  />
                </div>
                <div className="relative overflow-visible">
                  <StyledTimePicker
                    value={startTime}
                    onChange={(timeValue) => {
                      const date = formData.startDate.split('T')[0] || '';
                      setFormData({ ...formData, startDate: `${date}T${timeValue}` });
                    }}
                    label="Time"
                    selectedDate={startDate}
                  />
                </div>
              </div>
            </div>

            {/* End Date & Time */}
            <div className={`bg-gray-50 border border-gray-200 rounded-xl p-5 transition-all duration-500 overflow-visible ${
              isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`} style={{ transitionDelay: '250ms' }}>
              <label className="block text-base font-semibold text-gray-900 mb-4">
                End Date & Time
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative overflow-visible">
                  <StyledDatePicker
                    value={endDate}
                    onChange={(dateValue) => {
                      const time = formData.endDate.split('T')[1] || '00:00';
                      setFormData({ ...formData, endDate: `${dateValue}T${time}` });
                    }}
                    label="Date"
                    minDate={endMinDate}
                  />
                </div>
                <div className="relative overflow-visible">
                  <StyledTimePicker
                    value={formData.endDate.split('T')[1] || ''}
                    onChange={(timeValue) => {
                      const date = formData.endDate.split('T')[0] || '';
                      setFormData({ ...formData, endDate: `${date}T${timeValue}` });
                    }}
                    label="Time"
                    minTime={endMinTime}
                    selectedDate={endDate}
                  />
                </div>
              </div>
            </div>

            {listingType === 'experience' && (
              <div className={`pt-6 border-t border-gray-200 transition-all duration-500 ${
                isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`} style={{ transitionDelay: '450ms' }}>
                <ThingsToKnowBuilder
                  value={formData.thingsToKnow}
                  onChange={(items) => setFormData({ ...formData, thingsToKnow: items })}
                />
              </div>
            )}
          </div>
        </div>
      );
    }

    if (listingType === 'trip' && currentStep === 6) {
      return (
        <div className="space-y-6">
          <h2 className={`text-2xl font-bold text-gray-900 mb-6 transition-all duration-500 ${
            isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`} style={{ transitionDelay: '50ms' }}>Trip Details</h2>
          <div className={`transition-all duration-500 ${
            isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`} style={{ transitionDelay: '150ms' }}>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Departure Location
            </label>
            <input
              type="text"
              value={formData.departureLocation}
              onChange={(e) => setFormData({ ...formData, departureLocation: e.target.value })}
              placeholder="Where will you depart from?"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
          <div className={`transition-all duration-500 ${
            isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`} style={{ transitionDelay: '250ms' }}>
            <ThingsToKnowBuilder
              value={formData.pickupPoints}
              onChange={(items) => setFormData({ ...formData, pickupPoints: items })}
              label="Pickup Points"
              description="Add pickup locations (optional)"
              placeholder="e.g., Central Station, Airport Terminal 2"
            />
          </div>
          <div className={`pt-6 border-t border-gray-200 transition-all duration-500 ${
            isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`} style={{ transitionDelay: '350ms' }}>
            <ItineraryBuilder
              value={formData.itinerary}
              onChange={(itinerary) => setFormData({ ...formData, itinerary })}
            />
          </div>
          <div className={`pt-6 border-t border-gray-200 transition-all duration-500 ${
            isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`} style={{ transitionDelay: '450ms' }}>
            <InclusionsBuilder
              included={formData.whatsIncluded}
              notIncluded={formData.whatsNotIncluded}
              onIncludedChange={(items) => setFormData({ ...formData, whatsIncluded: items })}
              onNotIncludedChange={(items) => setFormData({ ...formData, whatsNotIncluded: items })}
            />
          </div>
          <div className={`pt-6 border-t border-gray-200 transition-all duration-500 ${
            isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`} style={{ transitionDelay: '550ms' }}>
            <ThingsToKnowBuilder
              value={formData.thingsToKnow}
              onChange={(items) => setFormData({ ...formData, thingsToKnow: items })}
            />
          </div>
        </div>
      );
    }

    if (listingType === 'trip' && currentStep === 7) {
      return (
        <div className="space-y-6">
          <div className={`mb-6 transition-all duration-500 ${
            isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`} style={{ transitionDelay: '50ms' }}>
            <div className="flex items-center gap-3 mb-3">
              <ImageIcon className="w-6 h-6 text-orange-500" />
              <h2 className="text-2xl font-bold text-gray-900">Showcase Your Trip</h2>
            </div>
            <p className="text-gray-600 text-sm">
              Add up to 5 images to highlight activities, destinations, or experiences. 
              <span className="text-gray-500 ml-1">(Optional - You can skip this step)</span>
            </p>
          </div>

          

          <div className={`transition-all duration-500 ${
            isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`} style={{ transitionDelay: '250ms' }}>
            <MultiImageUpload
              value={formData.tripImages}
              onChange={(urls) => setFormData({ ...formData, tripImages: urls })}
              maxImages={5}
              label="Trip Gallery"
              description="Click to select multiple images at once or drag and drop (up to 5 images)"
            />
          </div>

          {/* Image counter and progress */}
          {formData.tripImages.length > 0 && (
            <div className={`flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg transition-all duration-500 ${
              isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`} style={{ transitionDelay: '350ms' }}>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-900">
                  {formData.tripImages.length} {formData.tripImages.length === 1 ? 'image' : 'images'} added
                </span>
              </div>
              {formData.tripImages.length < 5 && (
                <span className="text-xs text-green-700">
                  You can add {5 - formData.tripImages.length} more
                </span>
              )}
            </div>
          )}
        </div>
      );
    }

    const termsStep = listingType === 'experience' ? 7 : 8;
    if (currentStep === termsStep) {
      return (
        <div className="space-y-6">
          <h2 className={`text-2xl font-bold text-gray-900 mb-6 transition-all duration-500 ${
            isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`} style={{ transitionDelay: '50ms' }}>Terms & Policies</h2>
          <div className={`transition-all duration-500 ${
            isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`} style={{ transitionDelay: '150ms' }}>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Terms & Conditions
            </label>
            <textarea
              value={formData.termsAndConditions}
              onChange={(e) => setFormData({ ...formData, termsAndConditions: e.target.value })}
              placeholder="Specify the rules and requirements..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-none"
            />
          </div>
          <div className={`transition-all duration-500 ${
            isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`} style={{ transitionDelay: '250ms' }}>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Cancellation Policy
            </label>
            <textarea
              value={formData.cancellationPolicy}
              onChange={(e) => setFormData({ ...formData, cancellationPolicy: e.target.value })}
              placeholder="What's your cancellation policy?"
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-none"
            />
          </div>
        </div>
      );
    }

    const pricingStep = listingType === 'experience' ? 8 : 9;
    if (currentStep === pricingStep) {
      return (
        <div className="space-y-6">
          <div className={`flex items-center gap-3 mb-6 transition-all duration-500 ${
            isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`} style={{ transitionDelay: '50ms' }}>
            <IndianRupee className="w-6 h-6 text-orange-500" />
            <h2 className="text-2xl font-bold text-gray-900">Set capacity & pricing</h2>
          </div>
          <div className={`grid grid-cols-2 gap-4 transition-all duration-500 ${
            isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`} style={{ transitionDelay: '150ms' }}>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Max Capacity</label>
              <input
                type="number"
                min="1"
                value={formData.maxCapacity}
                onChange={(e) => setFormData({ ...formData, maxCapacity: e.target.value })}
                placeholder="20"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Price per person (₹)
              </label>
              <input
                type="number"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="999"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
          </div>
          {formData.price && formData.maxCapacity && (
            <div className={`p-4 bg-green-50 border border-green-200 rounded-lg transition-all duration-500 ${
              isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`} style={{ transitionDelay: '250ms' }}>
              <p className="text-sm text-green-900 font-medium">
                Potential earnings: ₹
                {(
                  parseFloat(formData.price) * parseInt(formData.maxCapacity || '0')
                ).toLocaleString()}
              </p>
              <p className="text-xs text-green-700 mt-1">Based on full capacity</p>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Main content area */}
      <div className="flex-1 overflow-auto pb-32">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div 
            key={currentStep}
            className="bg-white rounded-2xl p-6 md:p-8"
          >
            {renderStepContent()}
          </div>
        </div>
      </div>

      {/* Fixed bottom section with progress bar and navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-20">
        {/* Three-Section Progress Bar - Full Width */}
        {listingType && (() => {
          // Calculate which section of progress to show
          // Experience: 9 steps -> 3 sections of 3 steps each (0-2, 3-5, 6-8)
          // Trip: 10 steps -> 3 sections of 3, 3, 4 steps (0-2, 3-5, 6-9)
          const stepsPerSection = listingType === 'experience' 
            ? [3, 3, 3]  // 3 steps in each section
            : [3, 3, 4]; // 3, 3, 4 steps
          
          // Calculate progress for each section
          const getSectionProgress = (sectionIndex: number) => {
            const sectionStart = stepsPerSection.slice(0, sectionIndex).reduce((a, b) => a + b, 0);
            const sectionEnd = sectionStart + stepsPerSection[sectionIndex];
            const stepsInSection = stepsPerSection[sectionIndex];
            
            if (currentStep < sectionStart) {
              // Section not started
              return 0;
            } else if (currentStep >= sectionEnd) {
              // Section completed
              return 100;
            } else {
              // Section in progress
              const stepsCompleted = (currentStep - sectionStart) + 1;
              return (stepsCompleted / stepsInSection) * 100;
            }
          };
          
          return (
            <div className="flex gap-1 mb-4">
              {[0, 1, 2].map((sectionIndex) => {
                const progress = getSectionProgress(sectionIndex);
                return (
                  <div
                    key={sectionIndex}
                    className="h-1 flex-1 bg-gray-200 relative overflow-hidden"
                  >
                    <div
                      className="h-full bg-black transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* Navigation Buttons - Full Width with Corners */}
        <div className="px-6 py-4">
          <div className={`flex items-center justify-between transition-all duration-500 delay-200 ${
            isAnimating 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-4'
          }`}>
            <button
              type="button"
              onClick={handleBack}
              className="py-2 px-4 text-gray-900 font-medium hover:bg-gray-100 rounded-lg transition-colors underline"
            >
              Back
            </button>
            
            {currentStep < totalSteps - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={!canProceed()}
                className={`py-2.5 px-6 font-medium rounded-lg transition-colors ${
                  canProceed() 
                    ? 'bg-black text-white hover:bg-gray-800' 
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canProceed() || submitting}
                className={`py-2.5 px-6 font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${
                  canProceed() && !submitting 
                    ? 'bg-black text-white hover:bg-gray-800' 
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  'Publish Listing'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
