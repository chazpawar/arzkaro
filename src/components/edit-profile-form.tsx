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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from './ui/button';
import { Colors } from '../constants/Colors';
import { BorderRadius, Spacing, Typography } from '../constants/Styles';
import { Fonts } from '../constants/Fonts';
import { updateProfile, isUsernameAvailable } from '../services/user-service';
import { uploadImage, pickImage } from '../services/storage-service';
import type { Profile } from '../types/user.types';

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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Edit Profile</Text>
        <TouchableOpacity onPress={onCancel} disabled={loading}>
          <Ionicons name="close" size={28} color={Colors.text} />
        </TouchableOpacity>
      </View>

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
          <Text style={styles.label}>
            Full Name <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, errors.fullName && styles.inputError]}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Enter your full name"
            placeholderTextColor={Colors.textSecondary}
            editable={!loading}
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

        {/* Bio */}
        <View style={styles.field}>
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.textArea, errors.bio && styles.inputError]}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell us about yourself..."
            placeholderTextColor={Colors.textSecondary}
            editable={!loading}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          {errors.bio && <Text style={styles.errorText}>{errors.bio}</Text>}
        </View>

        {/* Phone */}
        <View style={styles.field}>
          <Text style={styles.label}>Phone</Text>
          <TextInput
            style={[styles.input, errors.phone && styles.inputError]}
            value={phone}
            onChangeText={setPhone}
            placeholder="+1 234 567 8900"
            placeholderTextColor={Colors.textSecondary}
            editable={!loading}
            keyboardType="phone-pad"
          />
          {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
        </View>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.h2,
    color: Colors.text,
    fontFamily: Fonts.bold,
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
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Typography.body,
    color: Colors.text,
  },
  inputError: {
    borderColor: Colors.error,
  },
  textArea: {
    minHeight: 100,
    paddingTop: Spacing.md,
  },
  errorText: {
    ...Typography.bodySmall,
    color: Colors.error,
    marginTop: Spacing.xs,
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
