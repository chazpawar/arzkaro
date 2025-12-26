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
  Pressable,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from './ui/button';
import { Colors } from '../constants/Colors';
import { BorderRadius, Spacing } from '../constants/Styles';
import { updateProfile, isUsernameAvailable } from '../services/user-service';
import { uploadImage, pickImage } from '../services/storage-service';
import type { Profile, Gender } from '../types/user.types';

interface EditProfileFormProps {
  profile: Profile;
  onSuccess: (updatedProfile: Profile) => void;
  onCancel: () => void;
}

// Available interests
const AVAILABLE_INTERESTS = [
  'Travelling',
  'Music',
  'Party',
  'Dance',
  'Outdoor',
  'Board Games',
  'Sports',
  'Yoga',
  'Meditation',
  'Food',
  'Art',
  'Photography',
  'Gaming',
  'Reading',
  'Fitness',
  'Cooking',
];

const GENDER_OPTIONS: Gender[] = ['Male', 'Female', 'Other', 'Prefer not to say'];

export default function EditProfileForm({ profile, onSuccess, onCancel }: EditProfileFormProps) {
  // Basic fields
  const [fullName] = useState(profile.full_name || ''); // Non-editable
  const [username, setUsername] = useState(profile.username || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [bio, setBio] = useState(profile.bio || '');

  // Non-editable fields (can only be set once)
  const [dateOfBirth, setDateOfBirth] = useState(profile.date_of_birth || '');
  const [gender, setGender] = useState<Gender | null>(profile.gender || null);

  // Social fields
  const [instagram, setInstagram] = useState(profile.instagram || '');
  const [youtube, setYoutube] = useState(profile.youtube || '');
  const [linkedin, setLinkedin] = useState(profile.linkedin || '');
  const [twitter, setTwitter] = useState(profile.twitter || '');

  // Interests
  const [selectedInterests, setSelectedInterests] = useState<string[]>(profile.interests || []);
  const [showAllInterests, setShowAllInterests] = useState(false);

  // Avatar
  const [avatarUri, setAvatarUri] = useState<string | null>(profile.avatar_url);
  const [newAvatarLocalUri, setNewAvatarLocalUri] = useState<string | null>(null);

  // UI states
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showGenderModal, setShowGenderModal] = useState(false);

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

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
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

    // Validate bio length
    if (bio.length > 500) {
      newErrors.bio = 'Bio must be 500 characters or less';
    }

    // Validate date of birth format (YYYY-MM-DD)
    if (dateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
      newErrors.dateOfBirth = 'Date must be in YYYY-MM-DD format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      const isValid = await validateForm();
      if (!isValid) {
        return;
      }

      let finalAvatarUrl = avatarUri;

      // Upload new avatar if selected
      if (newAvatarLocalUri) {
        try {
          const uploadResult = await uploadImage(newAvatarLocalUri, `avatars/${profile.id}`);
          finalAvatarUrl = typeof uploadResult === 'string' ? uploadResult : uploadResult.url;
        } catch (error) {
          console.error('Error uploading avatar:', error);
          Alert.alert('Error', 'Failed to upload avatar. Please try again.');
          return;
        }
      }

      // Prepare update data
      const updates: any = {
        full_name: fullName.trim() || null,
        username: username.trim() || null,
        phone: phone.trim() || null,
        bio: bio.trim() || null,
        avatar_url: finalAvatarUrl,
        instagram: instagram.trim() || null,
        youtube: youtube.trim() || null,
        linkedin: linkedin.trim() || null,
        twitter: twitter.trim() || null,
        interests: selectedInterests,
      };

      // Only update DOB and gender if they haven't been set before
      if (!profile.date_of_birth && dateOfBirth) {
        updates.date_of_birth = dateOfBirth;
      }
      if (!profile.gender && gender) {
        updates.gender = gender;
      }

      const updatedProfile = await updateProfile(profile.id, updates);
      Alert.alert('Success', 'Profile updated successfully!');
      onSuccess(updatedProfile);
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const interestsToShow = showAllInterests ? AVAILABLE_INTERESTS : AVAILABLE_INTERESTS.slice(0, 6);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Avatar Section */}
      <View style={styles.avatarSection}>
        <View style={styles.avatarContainer}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={60} color={Colors.textSecondary} />
            </View>
          )}
          {uploadingAvatar && (
            <View style={styles.avatarLoading}>
              <ActivityIndicator color={Colors.primary} />
            </View>
          )}
        </View>
        <TouchableOpacity
          style={styles.addEditButton}
          onPress={handlePickAvatar}
          disabled={uploadingAvatar}
        >
          <Text style={styles.addEditButtonText}>Add/Edit</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionHeading}>My Profile</Text>

      {/* Full Name - Non Editable */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Full name <Text style={styles.nonEditableTag}>(Non editable)</Text>
        </Text>
        <TextInput
          style={[styles.input, styles.inputDisabled]}
          value={fullName}
          editable={false}
          placeholder="Full name"
          placeholderTextColor={Colors.textTertiary}
        />
        {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
      </View>

      {/* Username - Editable */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          username <Text style={styles.editableTag}>(Editable)</Text>
        </Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          placeholder="username"
          placeholderTextColor={Colors.textTertiary}
          autoCapitalize="none"
        />
        {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}
      </View>

      {/* DOB - Non Editable after first set */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          DOB <Text style={styles.nonEditableTag}>(Non Editable)</Text>
        </Text>
        <TextInput
          style={[styles.input, profile.date_of_birth ? styles.inputDisabled : null]}
          value={dateOfBirth}
          onChangeText={setDateOfBirth}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={Colors.textTertiary}
          editable={!profile.date_of_birth}
        />
        {errors.dateOfBirth && <Text style={styles.errorText}>{errors.dateOfBirth}</Text>}
      </View>

      {/* Gender Picker */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Gender <Text style={styles.nonEditableTag}>(Non Editable)</Text>
        </Text>
        {profile.gender ? (
          <TextInput
            style={[styles.input, styles.inputDisabled]}
            value={profile.gender}
            editable={false}
          />
        ) : (
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setShowGenderModal(true)}
            disabled={!!profile.gender}
          >
            <Text style={[styles.dropdownButtonText, !gender && styles.dropdownPlaceholder]}>
              {gender || 'Select Gender'}
            </Text>
            <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Gender Selection Modal */}
      <Modal
        visible={showGenderModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowGenderModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowGenderModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Gender</Text>
              <TouchableOpacity onPress={() => setShowGenderModal(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            {GENDER_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option}
                style={[styles.modalOption, gender === option && styles.modalOptionSelected]}
                onPress={() => {
                  setGender(option);
                  setShowGenderModal(false);
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    gender === option && styles.modalOptionTextSelected,
                  ]}
                >
                  {option}
                </Text>
                {gender === option && (
                  <Ionicons name="checkmark" size={20} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Phone Number - Editable */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Phone number <Text style={styles.editableTag}>(Editable)</Text>
        </Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="Phone number"
          placeholderTextColor={Colors.textTertiary}
          keyboardType="phone-pad"
        />
        {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
      </View>

      {/* Email - Editable */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Email <Text style={styles.editableTag}>(Editable)</Text>
        </Text>
        <TextInput
          style={[styles.input, styles.inputDisabled]}
          value={profile.email}
          editable={false}
          placeholderTextColor={Colors.textTertiary}
        />
      </View>

      {/* Enter Your Socials Section */}
      <Text style={styles.sectionHeading}>Enter Your Socials</Text>

      {/* Instagram */}
      <View style={styles.socialInputGroup}>
        <View style={styles.socialIconContainer}>
          <Ionicons name="logo-instagram" size={24} color={Colors.text} />
        </View>
        <TextInput
          style={styles.socialInput}
          value={instagram}
          onChangeText={setInstagram}
          placeholder="instagram.com/username"
          placeholderTextColor={Colors.textTertiary}
          autoCapitalize="none"
        />
      </View>

      {/* YouTube */}
      <View style={styles.socialInputGroup}>
        <View style={styles.socialIconContainer}>
          <Ionicons name="logo-youtube" size={24} color={Colors.text} />
        </View>
        <TextInput
          style={styles.socialInput}
          value={youtube}
          onChangeText={setYoutube}
          placeholder="youtube.com/"
          placeholderTextColor={Colors.textTertiary}
          autoCapitalize="none"
        />
      </View>

      {/* LinkedIn */}
      <View style={styles.socialInputGroup}>
        <View style={styles.socialIconContainer}>
          <Ionicons name="logo-linkedin" size={24} color={Colors.text} />
        </View>
        <TextInput
          style={styles.socialInput}
          value={linkedin}
          onChangeText={setLinkedin}
          placeholder="linkedin.com/"
          placeholderTextColor={Colors.textTertiary}
          autoCapitalize="none"
        />
      </View>

      {/* Twitter/X */}
      <View style={styles.socialInputGroup}>
        <View style={styles.socialIconContainer}>
          <Ionicons name="logo-twitter" size={24} color={Colors.text} />
        </View>
        <TextInput
          style={styles.socialInput}
          value={twitter}
          onChangeText={setTwitter}
          placeholder="x.com/"
          placeholderTextColor={Colors.textTertiary}
          autoCapitalize="none"
        />
      </View>

      {/* About Me Section */}
      <Text style={styles.sectionHeading}>About Me</Text>
      <View style={styles.inputGroup}>
        <TextInput
          style={[styles.input, styles.bioInput]}
          value={bio}
          onChangeText={setBio}
          placeholder="Tell us about yourself..."
          placeholderTextColor={Colors.textTertiary}
          multiline
          numberOfLines={5}
          maxLength={500}
        />
        <Text style={styles.characterCount}>{bio.length}/500 characters</Text>
        {errors.bio && <Text style={styles.errorText}>{errors.bio}</Text>}
      </View>

      {/* My Interests Section */}
      <Text style={styles.sectionHeading}>My Interests</Text>
      <View style={styles.interestsContainer}>
        {interestsToShow.map((interest) => (
          <Pressable
            key={interest}
            style={[
              styles.interestChip,
              selectedInterests.includes(interest) && styles.interestChipSelected,
            ]}
            onPress={() => toggleInterest(interest)}
          >
            <Text
              style={[
                styles.interestChipText,
                selectedInterests.includes(interest) && styles.interestChipTextSelected,
              ]}
            >
              {interest}
            </Text>
          </Pressable>
        ))}
      </View>

      {!showAllInterests && (
        <Pressable style={styles.showAllButton} onPress={() => setShowAllInterests(true)}>
          <Text style={styles.showAllText}>Show all &gt;</Text>
        </Pressable>
      )}

      {/* Save/Cancel Buttons */}
      <View style={styles.buttonContainer}>
        <Button
          title={loading ? 'Saving...' : 'Save Changes'}
          onPress={handleSave}
          disabled={loading}
          style={styles.saveButton}
        />
        <Button
          title="Cancel"
          onPress={onCancel}
          variant="ghost"
          disabled={loading}
          style={styles.cancelButton}
        />
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    position: 'relative',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLoading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addEditButton: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg + 4,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  addEditButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  sectionHeading: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  inputGroup: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  nonEditableTag: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  editableTag: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  inputDisabled: {
    backgroundColor: Colors.surfaceSecondary,
    color: Colors.textSecondary,
  },
  bioInput: {
    minHeight: 120,
    textAlignVertical: 'top',
    paddingTop: Spacing.md,
  },
  characterCount: {
    fontSize: 12,
    color: Colors.textTertiary,
    textAlign: 'right',
    marginTop: Spacing.xs,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    marginTop: Spacing.xs,
  },
  dropdownButton: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownButtonText: {
    fontSize: 16,
    color: Colors.text,
  },
  dropdownPlaceholder: {
    color: Colors.textTertiary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  modalOptionSelected: {
    backgroundColor: Colors.surfaceSecondary,
  },
  modalOptionText: {
    fontSize: 16,
    color: Colors.text,
  },
  modalOptionTextSelected: {
    color: Colors.primary,
    fontWeight: '500',
  },
  socialInputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  socialIconContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  interestChip: {
    paddingHorizontal: Spacing.md + 4,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  interestChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  interestChipText: {
    fontSize: 14,
    color: Colors.text,
  },
  interestChipTextSelected: {
    color: Colors.background,
    fontWeight: '500',
  },
  showAllButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.sm,
  },
  showAllText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textDecorationLine: 'underline',
  },
  buttonContainer: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    gap: Spacing.md,
  },
  saveButton: {
    backgroundColor: Colors.primary,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bottomSpacer: {
    height: Spacing.xl * 2,
  },
});
