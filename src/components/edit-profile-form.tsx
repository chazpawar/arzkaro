import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Platform,
  Pressable,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import Button from './ui/button';
import { Colors } from '../constants/Colors';
import { BorderRadius, Spacing, Typography } from '../constants/Styles';
import { Fonts } from '../constants/Fonts';
import { updateProfile, isUsernameAvailable } from '../services/user-service';
import { uploadImage, pickImage } from '../services/storage-service';
import type { Profile } from '../types/user.types';

// Available interests based on your categories
const AVAILABLE_INTERESTS = [
  'Music',
  'Travelling',
  'Dance',
  'Party',
  'Outdoor',
  'Board Games',
  'Art',
  'Sports',
  'Yoga',
  'Meditation',
  'Gaming',
  'Wellness',
  'Nightlife',
  'Cricket',
  'Football',
  'Basketball',
  'Badminton',
  'Volleyball',
  'Cycling',
  'Hiking',
  'Camping',
];

interface EditProfileFormProps {
  profile: Profile;
  onSuccess: (updatedProfile: Profile) => void;
  onCancel: () => void;
}

export default function EditProfileForm({ profile, onSuccess, onCancel }: EditProfileFormProps) {
  const [fullName, setFullName] = useState(profile.full_name || '');
  const [username, setUsername] = useState(profile.username || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [avatarUri, setAvatarUri] = useState<string | null>(profile.avatar_url);
  const [newAvatarLocalUri, setNewAvatarLocalUri] = useState<string | null>(null);

  // New fields
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(
    profile.date_of_birth ? new Date(profile.date_of_birth) : null
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState(profile.gender || '');
  const [instagram, setInstagram] = useState(profile.instagram || '');
  const [youtube, setYoutube] = useState(profile.youtube || '');
  const [linkedin, setLinkedin] = useState(profile.linkedin || '');
  const [twitter, setTwitter] = useState(profile.twitter || '');
  const [interests, setInterests] = useState<string[]>(profile.interests || []);
  const [showAllInterests, setShowAllInterests] = useState(false);

  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handlePickAvatar = async () => {
    try {
      setUploadingAvatar(true);
      const image = await pickImage();

      if (image) {
        setNewAvatarLocalUri(image.uri);
        setAvatarUri(image.uri); // Show preview immediately
      }
    } catch (error) {
      console.error('Error picking avatar:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const validateForm = async (): Promise<boolean> => {
    const newErrors: Record<string, string> = {};

    // Validate full name
    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    }

    // Validate username if provided
    if (username.trim()) {
      if (username.trim().length < 3) {
        newErrors.username = 'Username must be at least 3 characters';
      } else if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
        newErrors.username = 'Username can only contain letters, numbers, and underscores';
      } else if (username.trim() !== profile.username) {
        // Check if username is available (only if changed)
        const available = await isUsernameAvailable(username.trim(), profile.id);
        if (!available) {
          newErrors.username = 'Username is already taken';
        }
      }
    }

    // Validate phone if provided
    if (phone.trim() && !/^\+?[\d\s\-()]+$/.test(phone.trim())) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    // Validate DOB (must be at least 13 years old)
    if (dateOfBirth) {
      const today = new Date();
      const age = today.getFullYear() - dateOfBirth.getFullYear();
      const monthDiff = today.getMonth() - dateOfBirth.getMonth();
      const dayDiff = today.getDate() - dateOfBirth.getDate();

      const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

      if (actualAge < 13) {
        newErrors.dateOfBirth = 'You must be at least 13 years old';
      }
    }

    // Validate social links if provided
    if (instagram.trim() && !instagram.trim().includes('instagram.com/')) {
      newErrors.instagram = 'Please enter a valid Instagram URL';
    }
    if (youtube.trim() && !youtube.trim().includes('youtube.com/')) {
      newErrors.youtube = 'Please enter a valid YouTube URL';
    }
    if (linkedin.trim() && !linkedin.trim().includes('linkedin.com/')) {
      newErrors.linkedin = 'Please enter a valid LinkedIn URL';
    }
    if (
      twitter.trim() &&
      !twitter.trim().includes('x.com/') &&
      !twitter.trim().includes('twitter.com/')
    ) {
      newErrors.twitter = 'Please enter a valid X/Twitter URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      // Validate form
      const isValid = await validateForm();
      if (!isValid) {
        return;
      }

      let finalAvatarUrl = avatarUri;

      // Upload new avatar if selected
      if (newAvatarLocalUri) {
        try {
          const uploadResult = await uploadImage(newAvatarLocalUri, 'avatars', profile.id);
          finalAvatarUrl = uploadResult.url;
        } catch (error) {
          console.error('Error uploading avatar:', error);
          Alert.alert('Error', 'Failed to upload avatar. Saving other changes...');
        }
      }

      // Update profile
      const updatedProfile = await updateProfile(profile.id, {
        full_name: fullName.trim() || null,
        username: username.trim() || null,
        bio: bio.trim() || null,
        phone: phone.trim() || null,
        avatar_url: finalAvatarUrl,
        date_of_birth: dateOfBirth ? dateOfBirth.toISOString().split('T')[0] : null,
        gender: gender || null,
        instagram: instagram.trim() || null,
        youtube: youtube.trim() || null,
        linkedin: linkedin.trim() || null,
        twitter: twitter.trim() || null,
        interests: interests.length > 0 ? interests : null,
      });

      Alert.alert('Success', 'Profile updated successfully!', [
        {
          text: 'OK',
          onPress: () => onSuccess(updatedProfile),
        },
      ]);
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDateOfBirth(selectedDate);
    }
  };

  const toggleInterest = (interest: string) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter((i) => i !== interest));
    } else {
      setInterests([...interests, interest]);
    }
  };

  const isFieldEditable = (fieldName: 'full_name' | 'date_of_birth' | 'gender'): boolean => {
    // DOB and Gender are non-editable once set
    if (fieldName === 'date_of_birth') {
      return !profile.date_of_birth;
    }
    if (fieldName === 'gender') {
      return !profile.gender;
    }
    // Full name is always non-editable according to your design
    if (fieldName === 'full_name') {
      return false;
    }
    return true;
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handlePickAvatar} disabled={loading || uploadingAvatar}>
            <View style={styles.avatarContainer}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarPlaceholderText}>
                    {fullName.charAt(0).toUpperCase() || '?'}
                  </Text>
                </View>
              )}
              <View style={styles.avatarEditBadge}>
                {uploadingAvatar ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Ionicons name="camera" size={20} color="#FFF" />
                )}
              </View>
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>Tap to change profile picture</Text>
        </View>

        {/* Form Fields */}
        <View style={styles.form}>
          {/* Full Name */}
          <View style={styles.field}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Enter your full name"
              placeholderTextColor={Colors.textSecondary}
              editable={false}
              autoCapitalize="words"
            />
            {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
          </View>

          {/* Username */}
          <View style={styles.field}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={[styles.input, errors.username && styles.inputError]}
              value={username}
              onChangeText={setUsername}
              placeholder="Choose a unique username"
              placeholderTextColor={Colors.textSecondary}
              editable={!loading}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}
          </View>

          {/* Date of Birth */}
          <View style={styles.field}>
            <Text style={styles.label}>DOB</Text>
            <Pressable
              onPress={() => isFieldEditable('date_of_birth') && setShowDatePicker(true)}
              disabled={!isFieldEditable('date_of_birth') || loading}
            >
              <View
                style={[styles.input, !isFieldEditable('date_of_birth') && styles.inputDisabled]}
              >
                <Text style={dateOfBirth ? styles.inputText : styles.placeholderText}>
                  {dateOfBirth ? dateOfBirth.toLocaleDateString() : 'Select your date of birth'}
                </Text>
              </View>
            </Pressable>
            {errors.dateOfBirth && <Text style={styles.errorText}>{errors.dateOfBirth}</Text>}
            {showDatePicker && (
              <DateTimePicker
                value={dateOfBirth || new Date()}
                mode="date"
                display="default"
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            )}
          </View>

          {/* Gender */}
          <View style={styles.field}>
            <Text style={styles.label}>Gender</Text>
            {isFieldEditable('gender') ? (
              <View style={styles.genderContainer}>
                {['Male', 'Female', 'Other', 'Prefer not to say'].map((option) => (
                  <Pressable
                    key={option}
                    onPress={() => setGender(option)}
                    disabled={loading}
                    style={[styles.genderOption, gender === option && styles.genderOptionSelected]}
                  >
                    <Text
                      style={[
                        styles.genderOptionText,
                        gender === option && styles.genderOptionTextSelected,
                      ]}
                    >
                      {option}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <View style={[styles.input, styles.inputDisabled]}>
                <Text style={styles.inputText}>{gender || 'Not specified'}</Text>
              </View>
            )}
          </View>

          {/* Phone */}
          <View style={styles.field}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={[styles.input, errors.phone && styles.inputError]}
              value={phone}
              onChangeText={setPhone}
              placeholder="+91 234 567 8900"
              placeholderTextColor={Colors.textSecondary}
              editable={!loading}
              keyboardType="phone-pad"
            />
            {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
          </View>

          {/* Email (Non-editable, display only) */}
          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <View style={[styles.input, styles.inputDisabled]}>
              <Text style={styles.inputText}>{profile.email}</Text>
            </View>
          </View>

          {/* Social Media Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Enter Your Socials</Text>
          </View>

          {/* Instagram */}
          <View style={styles.field}>
            <View style={styles.socialInputContainer}>
              <View style={styles.socialIconContainer}>
                <Ionicons name="logo-instagram" size={24} color="#E4405F" />
              </View>
              <TextInput
                style={[styles.socialInput, errors.instagram && styles.inputError]}
                value={instagram}
                onChangeText={setInstagram}
                placeholder="instagram.com/username"
                placeholderTextColor={Colors.textSecondary}
                editable={!loading}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            {errors.instagram && <Text style={styles.errorText}>{errors.instagram}</Text>}
          </View>

          {/* YouTube */}
          <View style={styles.field}>
            <View style={styles.socialInputContainer}>
              <View style={styles.socialIconContainer}>
                <Ionicons name="logo-youtube" size={24} color="#FF0000" />
              </View>
              <TextInput
                style={[styles.socialInput, errors.youtube && styles.inputError]}
                value={youtube}
                onChangeText={setYoutube}
                placeholder="youtube.com/channel"
                placeholderTextColor={Colors.textSecondary}
                editable={!loading}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            {errors.youtube && <Text style={styles.errorText}>{errors.youtube}</Text>}
          </View>

          {/* LinkedIn */}
          <View style={styles.field}>
            <View style={styles.socialInputContainer}>
              <View style={styles.socialIconContainer}>
                <Ionicons name="logo-linkedin" size={24} color="#0077B5" />
              </View>
              <TextInput
                style={[styles.socialInput, errors.linkedin && styles.inputError]}
                value={linkedin}
                onChangeText={setLinkedin}
                placeholder="linkedin.com/in/username"
                placeholderTextColor={Colors.textSecondary}
                editable={!loading}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            {errors.linkedin && <Text style={styles.errorText}>{errors.linkedin}</Text>}
          </View>

          {/* Twitter/X */}
          <View style={styles.field}>
            <View style={styles.socialInputContainer}>
              <View style={styles.socialIconContainer}>
                <Ionicons name="logo-twitter" size={24} color="#000000" />
              </View>
              <TextInput
                style={[styles.socialInput, errors.twitter && styles.inputError]}
                value={twitter}
                onChangeText={setTwitter}
                placeholder="x.com/username"
                placeholderTextColor={Colors.textSecondary}
                editable={!loading}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            {errors.twitter && <Text style={styles.errorText}>{errors.twitter}</Text>}
          </View>

          {/* Bio / About Me */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>About Me</Text>
          </View>

          <View style={styles.field}>
            <TextInput
              style={[styles.input, styles.textArea, errors.bio && styles.inputError]}
              value={bio}
              onChangeText={(text) => {
                if (text.length <= 500) {
                  setBio(text);
                }
              }}
              placeholder="Tell us about yourself..."
              placeholderTextColor={Colors.textSecondary}
              editable={!loading}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              maxLength={500}
            />
            <Text style={styles.charCount}>{bio.length}/500 characters</Text>
            {errors.bio && <Text style={styles.errorText}>{errors.bio}</Text>}
          </View>

          {/* Interests Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Interests</Text>
          </View>

          {/* Selected Interests */}
          {interests.length > 0 && (
            <View style={styles.selectedInterestsContainer}>
              {interests.map((interest) => (
                <Pressable
                  key={interest}
                  style={styles.interestChipSelected}
                  onPress={() => toggleInterest(interest)}
                  disabled={loading}
                >
                  <Text style={styles.interestChipTextSelected}>{interest}</Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* Edit Interests Button */}
          <Pressable
            style={styles.editInterestsButton}
            onPress={() => setShowAllInterests(!showAllInterests)}
            disabled={loading}
          >
            <Text style={styles.editInterestsButtonText}>
              {showAllInterests ? 'Hide interests' : 'Edit interests'}
            </Text>
          </Pressable>

          {/* Available Interests */}
          {showAllInterests && (
            <View style={styles.availableInterestsContainer}>
              {AVAILABLE_INTERESTS.map((interest) => (
                <Pressable
                  key={interest}
                  style={[
                    styles.interestChip,
                    interests.includes(interest) && styles.interestChipSelected,
                  ]}
                  onPress={() => toggleInterest(interest)}
                  disabled={loading}
                >
                  <Text
                    style={[
                      styles.interestChipText,
                      interests.includes(interest) && styles.interestChipTextSelected,
                    ]}
                  >
                    {interest}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button
            title="Cancel"
            onPress={onCancel}
            variant="secondary"
            size="large"
            fullWidth
            disabled={loading}
          />
          <Button
            title={loading ? 'Saving...' : 'Save Changes'}
            onPress={handleSave}
            variant="primary"
            size="large"
            fullWidth
            disabled={loading}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    paddingHorizontal: Spacing.lg,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.primaryLight,
  },
  avatarPlaceholderText: {
    fontSize: 48,
    color: '#FFF',
    fontFamily: Fonts.bold,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.background,
  },
  avatarHint: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  form: {
    gap: Spacing.lg,
  },
  field: {
    gap: Spacing.xs,
  },
  label: {
    ...Typography.body,
    color: Colors.text,
    fontFamily: Fonts.semiBold,
  },
  required: {
    color: Colors.error,
  },
  nonEditableTag: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontFamily: Fonts.regular,
  },
  editableTag: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontFamily: Fonts.regular,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Typography.body,
    color: Colors.text,
  },
  inputDisabled: {
    backgroundColor: Colors.border + '20',
    color: Colors.textSecondary,
  },
  inputText: {
    ...Typography.body,
    color: Colors.text,
  },
  placeholderText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  inputError: {
    borderColor: Colors.error,
  },
  textArea: {
    minHeight: 120,
    paddingTop: Spacing.md,
  },
  charCount: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'right',
    marginTop: Spacing.xs,
  },
  errorText: {
    ...Typography.bodySmall,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
  sectionHeader: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text,
    fontFamily: Fonts.bold,
  },
  genderContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  genderOption: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  genderOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '15',
  },
  genderOptionText: {
    ...Typography.body,
    color: Colors.text,
  },
  genderOptionTextSelected: {
    color: Colors.primary,
    fontFamily: Fonts.semiBold,
  },
  socialInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  socialIconContainer: {
    padding: Spacing.md,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  socialInput: {
    flex: 1,
    padding: Spacing.md,
    ...Typography.body,
    color: Colors.text,
  },
  selectedInterestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  editInterestsButton: {
    backgroundColor: Colors.border,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  editInterestsButtonText: {
    ...Typography.body,
    color: Colors.text,
    fontFamily: Fonts.medium,
  },
  availableInterestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  interestChip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  interestChipSelected: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  interestChipText: {
    ...Typography.body,
    color: Colors.text,
  },
  interestChipTextSelected: {
    color: Colors.text,
    fontFamily: Fonts.semiBold,
  },
  toggleField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  toggleInfo: {
    flex: 1,
    gap: 4,
  },
  toggleHint: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  toggle: {
    width: 56,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.border,
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: Colors.primary,
  },
  toggleThumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  toggleThumbActive: {
    transform: [{ translateX: 24 }],
  },
  actions: {
    gap: Spacing.md,
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
  },
});
