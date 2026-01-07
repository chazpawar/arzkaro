import React, { useState } from 'react';
import { Camera, Instagram, Youtube, Linkedin, Twitter } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface EditProfilePageProps {
  onBack: () => void;
  onSuccess: () => void;
}

// Available interests matching mobile app
const AVAILABLE_INTERESTS = [
  'Music', 'Travelling', 'Dance', 'Party', 'Outdoor', 'Board Games',
  'Art', 'Sports', 'Yoga', 'Meditation', 'Gaming', 'Wellness',
  'Nightlife', 'Cricket', 'Football', 'Basketball', 'Badminton',
  'Volleyball', 'Cycling', 'Hiking', 'Camping',
];

const GENDER_OPTIONS = ['Male', 'Female', 'Other', 'Prefer not to say'];

export default function EditProfilePage({ onBack, onSuccess }: EditProfilePageProps) {
  const { user, profile, updateProfile, refreshProfile } = useAuth();
  
  const [formData, setFormData] = useState({
    fullName: profile?.full_name || '',
    username: profile?.username || '',
    bio: profile?.bio || '',
    phone: profile?.phone || '',
    dateOfBirth: profile?.date_of_birth || '',
    gender: profile?.gender || '',
    instagram: profile?.instagram || '',
    youtube: profile?.youtube || '',
    linkedin: profile?.linkedin || '',
    twitter: profile?.twitter || '',
    interests: profile?.interests || [],
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar_url || null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAllInterests, setShowAllInterests] = useState(false);

  const displayName = formData.fullName || user?.email?.split('@')[0] || 'User';
  const avatarLetter = displayName.charAt(0).toUpperCase();

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Username validation
    if (formData.username && formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (formData.username && !/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    // Phone validation
    if (formData.phone && !/^\+?[\d\s\-()]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    // Age validation (13+)
    if (formData.dateOfBirth) {
      const dob = new Date(formData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      const dayDiff = today.getDate() - dob.getDate();
      const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

      if (actualAge < 13) {
        newErrors.dateOfBirth = 'You must be at least 13 years old';
      }
    }

    // Social media validation
    if (formData.instagram && !formData.instagram.includes('instagram.com/')) {
      newErrors.instagram = 'Please enter a valid Instagram URL';
    }
    if (formData.youtube && !formData.youtube.includes('youtube.com/')) {
      newErrors.youtube = 'Please enter a valid YouTube URL';
    }
    if (formData.linkedin && !formData.linkedin.includes('linkedin.com/')) {
      newErrors.linkedin = 'Please enter a valid LinkedIn URL';
    }
    if (formData.twitter && !formData.twitter.includes('x.com/') && !formData.twitter.includes('twitter.com/')) {
      newErrors.twitter = 'Please enter a valid X/Twitter URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      let avatarUrl = profile?.avatar_url;

      // Upload avatar if changed
      if (avatarFile && user?.id) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile, { upsert: true });

        if (uploadError) {
          console.error('Error uploading avatar:', uploadError);
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);
          avatarUrl = publicUrl;
        }
      }

      // Update profile
      const { error } = await updateProfile({
        username: formData.username || undefined,
        bio: formData.bio || undefined,
        phone: formData.phone || undefined,
        avatar_url: avatarUrl || undefined,
        date_of_birth: formData.dateOfBirth || undefined,
        gender: formData.gender || undefined,
        instagram: formData.instagram || undefined,
        youtube: formData.youtube || undefined,
        linkedin: formData.linkedin || undefined,
        twitter: formData.twitter || undefined,
        interests: formData.interests.length > 0 ? formData.interests : undefined,
      });

      if (error) {
        throw error;
      }

      await refreshProfile();
      alert('Profile updated successfully!');
      onSuccess();
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const isFieldEditable = (field: 'dateOfBirth' | 'gender'): boolean => {
    if (field === 'dateOfBirth') return !profile?.date_of_birth;
    if (field === 'gender') return !profile?.gender;
    return true;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="text-center">
            <h1 className="text-lg font-semibold text-gray-900">Edit Profile</h1>
            <p className="text-xs text-gray-500">Update your information</p>
          </div>
          <div className="w-10" />
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-4 py-6">
        {/* Avatar Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative group">
            <label htmlFor="avatar-upload" className="cursor-pointer">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt={displayName}
                  className="w-28 h-28 rounded-full object-cover border-3 border-[#FF785A]"
                />
              ) : (
                <div className="w-28 h-28 rounded-full bg-orange-100 border-3 border-[#FF785A] flex items-center justify-center">
                  <span className="text-4xl font-bold text-[#FF785A]">{avatarLetter}</span>
                </div>
              )}
              
              <div className="absolute bottom-0 right-0 w-10 h-10 bg-[#FF785A] rounded-full flex items-center justify-center border-3 border-white shadow-md group-hover:bg-orange-600 transition-colors">
                <Camera className="w-5 h-5 text-white" />
              </div>
            </label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
              disabled={loading}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">Tap to change profile picture</p>
        </div>

        {/* Full Name (Non-editable) */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
          <input
            type="text"
            value={formData.fullName}
            className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-xl text-gray-500 cursor-not-allowed"
            disabled
          />
        </div>

        {/* Username */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            placeholder="Choose a unique username"
            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#FF785A] focus:border-transparent ${
              errors.username ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={loading}
          />
          {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
        </div>

        {/* Date of Birth */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Birth</label>
          <input
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
            max={new Date().toISOString().split('T')[0]}
            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#FF785A] focus:border-transparent ${
              !isFieldEditable('dateOfBirth') ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300'
            } ${errors.dateOfBirth ? 'border-red-500' : ''}`}
            disabled={!isFieldEditable('dateOfBirth') || loading}
          />
          {errors.dateOfBirth && <p className="text-red-500 text-sm mt-1">{errors.dateOfBirth}</p>}
        </div>

        {/* Gender */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Gender</label>
          {isFieldEditable('gender') ? (
            <div className="flex flex-wrap gap-2">
              {GENDER_OPTIONS.map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFormData({ ...formData, gender: option })}
                  className={`px-4 py-2 rounded-full border-2 font-medium transition-colors ${
                    formData.gender === option
                      ? 'border-[#FF785A] bg-orange-50 text-[#FF785A]'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                  disabled={loading}
                >
                  {option}
                </button>
              ))}
            </div>
          ) : (
            <input
              type="text"
              value={formData.gender}
              className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-xl text-gray-500 cursor-not-allowed"
              disabled
            />
          )}
        </div>

        {/* Phone Number */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+91 234 567 8900"
            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#FF785A] focus:border-transparent ${
              errors.phone ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={loading}
          />
          {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
        </div>

        {/* Email (Display only) */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
          <input
            type="email"
            value={profile?.email || ''}
            className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-xl text-gray-500 cursor-not-allowed"
            disabled
          />
        </div>

        {/* Social Media Section */}
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Enter Your Socials</h3>
        </div>

        {/* Instagram */}
        <div className="mb-4">
          <div className={`flex items-center border rounded-xl overflow-hidden ${errors.instagram ? 'border-red-500' : 'border-gray-300'}`}>
            <div className="px-4 py-3 border-r border-gray-300 bg-gray-50">
              <Instagram className="w-6 h-6 text-pink-600" />
            </div>
            <input
              type="url"
              value={formData.instagram}
              onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
              placeholder="instagram.com/username"
              className="flex-1 px-4 py-3 focus:outline-none"
              disabled={loading}
            />
          </div>
          {errors.instagram && <p className="text-red-500 text-sm mt-1">{errors.instagram}</p>}
        </div>

        {/* YouTube */}
        <div className="mb-4">
          <div className={`flex items-center border rounded-xl overflow-hidden ${errors.youtube ? 'border-red-500' : 'border-gray-300'}`}>
            <div className="px-4 py-3 border-r border-gray-300 bg-gray-50">
              <Youtube className="w-6 h-6 text-red-600" />
            </div>
            <input
              type="url"
              value={formData.youtube}
              onChange={(e) => setFormData({ ...formData, youtube: e.target.value })}
              placeholder="youtube.com/channel"
              className="flex-1 px-4 py-3 focus:outline-none"
              disabled={loading}
            />
          </div>
          {errors.youtube && <p className="text-red-500 text-sm mt-1">{errors.youtube}</p>}
        </div>

        {/* LinkedIn */}
        <div className="mb-4">
          <div className={`flex items-center border rounded-xl overflow-hidden ${errors.linkedin ? 'border-red-500' : 'border-gray-300'}`}>
            <div className="px-4 py-3 border-r border-gray-300 bg-gray-50">
              <Linkedin className="w-6 h-6 text-blue-600" />
            </div>
            <input
              type="url"
              value={formData.linkedin}
              onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
              placeholder="linkedin.com/in/username"
              className="flex-1 px-4 py-3 focus:outline-none"
              disabled={loading}
            />
          </div>
          {errors.linkedin && <p className="text-red-500 text-sm mt-1">{errors.linkedin}</p>}
        </div>

        {/* Twitter/X */}
        <div className="mb-6">
          <div className={`flex items-center border rounded-xl overflow-hidden ${errors.twitter ? 'border-red-500' : 'border-gray-300'}`}>
            <div className="px-4 py-3 border-r border-gray-300 bg-gray-50">
              <Twitter className="w-6 h-6 text-black" />
            </div>
            <input
              type="url"
              value={formData.twitter}
              onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
              placeholder="x.com/username"
              className="flex-1 px-4 py-3 focus:outline-none"
              disabled={loading}
            />
          </div>
          {errors.twitter && <p className="text-red-500 text-sm mt-1">{errors.twitter}</p>}
        </div>

        {/* About Me */}
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-900 mb-4">About Me</h3>
        </div>

        <div className="mb-6">
          <textarea
            value={formData.bio}
            onChange={(e) => {
              if (e.target.value.length <= 500) {
                setFormData({ ...formData, bio: e.target.value });
              }
            }}
            placeholder="Tell us about yourself..."
            rows={6}
            maxLength={500}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#FF785A] focus:border-transparent resize-none"
            disabled={loading}
          />
          <p className="text-right text-sm text-gray-500 mt-1">{formData.bio.length}/500 characters</p>
        </div>

        {/* Interests */}
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-900 mb-4">My Interests</h3>
        </div>

        {/* Selected Interests */}
        {formData.interests.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {formData.interests.map(interest => (
              <button
                key={interest}
                type="button"
                onClick={() => toggleInterest(interest)}
                className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-full hover:bg-gray-300 transition-colors"
                disabled={loading}
              >
                {interest}
              </button>
            ))}
          </div>
        )}

        {/* Edit Interests Toggle */}
        <button
          type="button"
          onClick={() => setShowAllInterests(!showAllInterests)}
          className="w-full px-4 py-3 bg-gray-200 text-gray-800 font-medium rounded-xl hover:bg-gray-300 transition-colors mb-4"
          disabled={loading}
        >
          {showAllInterests ? 'Hide interests' : 'Edit interests'}
        </button>

        {/* Available Interests */}
        {showAllInterests && (
          <div className="flex flex-wrap gap-2 mb-6">
            {AVAILABLE_INTERESTS.map(interest => (
              <button
                key={interest}
                type="button"
                onClick={() => toggleInterest(interest)}
                className={`px-4 py-2 border-2 rounded-full font-medium transition-colors ${
                  formData.interests.includes(interest)
                    ? 'border-[#FF785A] bg-orange-50 text-[#FF785A]'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
                disabled={loading}
              >
                {interest}
              </button>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 mt-8 mb-8">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 px-6 py-3 bg-[#FF785A] text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
