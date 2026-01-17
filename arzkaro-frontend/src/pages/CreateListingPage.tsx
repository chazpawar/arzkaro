import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import {
  ChevronLeft,
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
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [listingType, setListingType] = useState<'experience' | 'trip' | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Trigger animation when step changes
  useEffect(() => {
    setIsAnimating(false);
    const timer = setTimeout(() => setIsAnimating(true), 50);
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

  const handleSubmit = async () => {
    if (!user?.id || !listingType) return;

    setSubmitting(true);
    try {
      const eventData: Record<string, unknown> = {
        host_id: user.id,
        type: listingType,
        title: formData.title,
        description: formData.description,
        cover_image_url: formData.coverImage,
        category: formData.mainCategory,
        subcategories: listingType === 'experience' ? formData.subcategories : formData.customTags,
        location_name: formData.location?.address || null,
        location_address: formData.location?.address || null,
        latitude: formData.location?.latitude || null,
        longitude: formData.location?.longitude || null,
        start_date: new Date(formData.startDate).toISOString(),
        end_date: new Date(formData.endDate).toISOString(),
        max_capacity: parseInt(formData.maxCapacity),
        price: parseFloat(formData.price),
        things_to_know: formData.thingsToKnow.length > 0 ? formData.thingsToKnow : null,
        terms_and_conditions: formData.termsAndConditions,
        cancellation_policy: formData.cancellationPolicy,
        is_published: true,
        is_cancelled: false,
      };

      if (listingType === 'trip') {
        eventData.departure_location = formData.departureLocation;
        eventData.pickup_points = formData.pickupPoints.length > 0 ? formData.pickupPoints : null;
        eventData.itinerary = formData.itinerary.length > 0 ? formData.itinerary : null;
        eventData.whats_included =
          formData.whatsIncluded.length > 0 ? formData.whatsIncluded : null;
        eventData.whats_not_included =
          formData.whatsNotIncluded.length > 0 ? formData.whatsNotIncluded : null;
        eventData.images = formData.tripImages.length > 0 ? formData.tripImages : null;
      }

      const { error } = await supabase.from('events').insert(eventData).select().single();

      if (error) throw error;

      alert('Listing created successfully!');
      onNavigate('host-dashboard');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create listing');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStepContent = () => {
    if (currentStep === 0) {
      return (
        <div className="space-y-6">
          <div className="text-center mb-8">
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
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Tell us about your {listingType}</h2>
          </div>
          <div className="space-y-4">
            <div>
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
            <div>
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
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Upload a cover image</h2>
          </div>
          <ImageUploadWithDragDrop
            value={formData.coverImage}
            onChange={(url) => setFormData({ ...formData, coverImage: url })}
            aspectRatio="9/16"
            label="Cover Image"
            description="Drag and drop or click to upload (9:16 aspect ratio recommended)"
          />
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
          <div className="text-center mb-6">
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
                style={{ transitionDelay: `${(index + 1) * 50}ms` }}
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
          <div className="text-center mb-6">
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
                  style={{ transitionDelay: `${(index + 1) * 50}ms` }}
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
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <MapPin className="w-6 h-6 text-orange-500" />
              <h2 className="text-2xl font-bold text-gray-900">Where will this take place?</h2>
            </div>
            <p className="text-sm text-gray-500 ml-9">Optional - You can skip this and add it later</p>
          </div>
          <LocationAutocomplete
            value={formData.location}
            onChange={(location) => setFormData({ ...formData, location })}
            label="Location"
            placeholder="Search for a location (optional)..."
          />
        </div>
      );
    }

    const dateStep = listingType === 'experience' ? 6 : 5;
    if (currentStep === dateStep) {
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="w-6 h-6 text-orange-500" />
            <h2 className="text-2xl font-bold text-gray-900">When does it start and end?</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Start Date & Time
              </label>
              <input
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                End Date & Time
              </label>
              <input
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
            {listingType === 'experience' && (
              <div className="mt-6 pt-6 border-t border-gray-200">
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
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Trip Details</h2>
          <div>
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
          <ThingsToKnowBuilder
            value={formData.pickupPoints}
            onChange={(items) => setFormData({ ...formData, pickupPoints: items })}
            label="Pickup Points"
            description="Add pickup locations (optional)"
            placeholder="e.g., Central Station, Airport Terminal 2"
          />
          <div className="pt-6 border-t border-gray-200">
            <ItineraryBuilder
              value={formData.itinerary}
              onChange={(itinerary) => setFormData({ ...formData, itinerary })}
            />
          </div>
          <div className="pt-6 border-t border-gray-200">
            <InclusionsBuilder
              included={formData.whatsIncluded}
              notIncluded={formData.whatsNotIncluded}
              onIncludedChange={(items) => setFormData({ ...formData, whatsIncluded: items })}
              onNotIncludedChange={(items) => setFormData({ ...formData, whatsNotIncluded: items })}
            />
          </div>
          <div className="pt-6 border-t border-gray-200">
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
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <ImageIcon className="w-6 h-6 text-orange-500" />
              <h2 className="text-2xl font-bold text-gray-900">Showcase Your Trip</h2>
            </div>
            <p className="text-gray-600 text-sm">
              Add up to 5 images to highlight activities, destinations, or experiences. 
              <span className="text-gray-500 ml-1">(Optional - You can skip this step)</span>
            </p>
          </div>

          {/* Helpful Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">💡 Tips for great photos:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Show unique experiences or activities</li>
              <li>• Include scenic views or destinations</li>
              <li>• Highlight what makes your trip special</li>
              <li>• Use high-quality, well-lit images</li>
            </ul>
          </div>

          <MultiImageUpload
            value={formData.tripImages}
            onChange={(urls) => setFormData({ ...formData, tripImages: urls })}
            maxImages={5}
            label="Trip Gallery"
            description="Click to select multiple images at once or drag and drop (up to 5 images)"
          />

          {/* Image counter and progress */}
          {formData.tripImages.length > 0 && (
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
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
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Terms & Policies</h2>
          <div>
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
          <div>
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
          <div className="flex items-center gap-3 mb-6">
            <IndianRupee className="w-6 h-6 text-orange-500" />
            <h2 className="text-2xl font-bold text-gray-900">Set capacity & pricing</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
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
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
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
    <div className="min-h-screen bg-white pb-24">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="text-sm font-medium text-gray-600">
              {listingType && `Step ${currentStep + 1} of ${totalSteps}`}
            </div>
            <div className="w-10" />
          </div>
          {listingType && (
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-orange-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
              />
            </div>
          )}
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div 
          key={currentStep}
          className={`bg-white rounded-2xl p-6 md:p-8 transition-all duration-500 ${
            isAnimating 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-8'
          }`}
        >
          {renderStepContent()}
        </div>
        <div className={`mt-8 flex gap-4 transition-all duration-500 delay-200 ${
          isAnimating 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-4'
        }`}>
          {currentStep > 0 && (
            <button
              type="button"
              onClick={handleBack}
              className="flex-1 py-3 px-6 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
          )}
          {currentStep < totalSteps - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={!canProceed()}
              className={`flex-1 py-3 px-6 font-medium rounded-lg transition-colors ${canProceed() ? 'bg-gray-900 text-white hover:bg-black' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canProceed() || submitting}
              className={`flex-1 py-3 px-6 font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${canProceed() && !submitting ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
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
  );
}
