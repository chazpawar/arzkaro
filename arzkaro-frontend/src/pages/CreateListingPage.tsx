import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { 
  ChevronLeft, 
  MapPin, 
  IndianRupee,
  Type,
  Loader2
} from 'lucide-react';
import type { PageName } from '../types/navigation';

interface CreateListingPageProps {
  onBack: () => void;
  onNavigate: (page: PageName) => void;
}

export default function CreateListingPage({ onBack, onNavigate }: CreateListingPageProps) {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [listingType, setListingType] = useState<'experience' | 'trip'>('experience');

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Cultural',
    location_name: '',
    location_address: '',
    start_date: '',
    end_date: '',
    max_capacity: '20',
    price: '0',
    cover_image_url: 'https://images.unsplash.com/photo-1514525253361-bee243870eb2?auto=format&fit=crop&q=80',
  });

  const categories = listingType === 'experience' 
    ? ['Cultural', 'Nightlife', 'Outdoors', 'Play', 'Sports', 'Wellness', 'Other']
    : ['Adventure', 'Leisure', 'Offbeat', 'Spiritual', 'Nature', 'Festival', 'Food & Culture', 'Getaway'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('events')
        .insert({
          host_id: user.id,
          type: listingType,
          title: formData.title,
          description: formData.description,
          category: formData.category,
          location_name: formData.location_name,
          location_address: formData.location_address,
          start_date: new Date(formData.start_date).toISOString(),
          end_date: new Date(formData.end_date).toISOString(),
          max_capacity: parseInt(formData.max_capacity),
          price: parseFloat(formData.price),
          cover_image_url: formData.cover_image_url,
          is_published: true,
          is_cancelled: false
        })
        .select()
        .single();

      if (error) throw error;
      
      alert('Listing created successfully!');
      onNavigate('host-dashboard');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create listing');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full mr-4 transition-colors">
              <ChevronLeft size={24} />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Create {listingType === 'experience' ? 'Experience' : 'Trip'}</h1>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`h-1.5 w-12 rounded-full ${s <= step ? 'bg-[#FF785A]' : 'bg-gray-200'}`} />
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Type className="text-[#FF785A]" size={24} />
                  Basic Details
                </h2>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      type="button"
                      onClick={() => setListingType('experience')}
                      className={`py-4 rounded-2xl border-2 font-bold transition-all ${
                        listingType === 'experience' ? 'border-[#FF785A] bg-[#FF785A]/5 text-[#FF785A]' : 'border-gray-100 text-gray-500'
                      }`}
                    >
                      Experience
                    </button>
                    <button 
                      type="button"
                      onClick={() => setListingType('trip')}
                      className={`py-4 rounded-2xl border-2 font-bold transition-all ${
                        listingType === 'trip' ? 'border-[#FF785A] bg-[#FF785A]/5 text-[#FF785A]' : 'border-gray-100 text-gray-500'
                      }`}
                    >
                      Trip
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Listing Title</label>
                    <input 
                      required
                      type="text"
                      placeholder="Give it a catchy name"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FF785A]/20 transition-all"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Category</label>
                    <select 
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FF785A]/20 transition-all appearance-none bg-white"
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                    >
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Description</label>
                    <textarea 
                      required
                      rows={4}
                      placeholder="What should people expect?"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FF785A]/20 transition-all resize-none"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setStep(2)}
                className="w-full py-4 bg-gray-900 text-white font-bold rounded-2xl hover:bg-black transition-all"
              >
                Continue to Logistics
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <MapPin className="text-[#FF785A]" size={24} />
                  Location & Timing
                </h2>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Location Name</label>
                    <input 
                      required
                      type="text"
                      placeholder="e.g. Central Park"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FF785A]/20 transition-all"
                      value={formData.location_name}
                      onChange={(e) => setFormData({...formData, location_name: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Start Date & Time</label>
                      <input 
                        required
                        type="datetime-local"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FF785A]/20 transition-all"
                        value={formData.start_date}
                        onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">End Date & Time</label>
                      <input 
                        required
                        type="datetime-local"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FF785A]/20 transition-all"
                        value={formData.end_date}
                        onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <button 
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-4 bg-gray-100 text-gray-900 font-bold rounded-2xl hover:bg-gray-200 transition-all"
                >
                  Back
                </button>
                <button 
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex-2 py-4 bg-gray-900 text-white font-bold rounded-2xl hover:bg-black transition-all px-12"
                >
                  Continue to Pricing
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <IndianRupee className="text-[#FF785A]" size={24} />
                  Pricing & Capacity
                </h2>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Price per person (₹)</label>
                      <input 
                        required
                        type="number"
                        min="0"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FF785A]/20 transition-all"
                        value={formData.price}
                        onChange={(e) => setFormData({...formData, price: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Max Capacity</label>
                      <input 
                        required
                        type="number"
                        min="1"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FF785A]/20 transition-all"
                        value={formData.max_capacity}
                        onChange={(e) => setFormData({...formData, max_capacity: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Cover Image URL</label>
                    <div className="flex gap-4">
                      <input 
                        required
                        type="url"
                        placeholder="Paste an image URL"
                        className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FF785A]/20 transition-all"
                        value={formData.cover_image_url}
                        onChange={(e) => setFormData({...formData, cover_image_url: e.target.value})}
                      />
                    </div>
                    {formData.cover_image_url && (
                      <div className="mt-4 aspect-video rounded-2xl overflow-hidden border border-gray-100">
                        <img src={formData.cover_image_url} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <button 
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 py-4 bg-gray-100 text-gray-900 font-bold rounded-2xl hover:bg-gray-200 transition-all"
                >
                  Back
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="flex-2 py-4 bg-[#FF785A] text-white font-bold rounded-2xl hover:shadow-xl transition-all px-12 flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Publish Listing'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
