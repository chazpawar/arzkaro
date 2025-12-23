import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/constants/Colors';
import { Fonts } from '../src/constants/Fonts';
import { Spacing, BorderRadius } from '../src/constants/Styles';
import { useAuth } from '../src/contexts/auth-context';
import * as StorageService from '../src/services/storage-service';
import { supabase } from '../backend/supabase';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form fields
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [location, setLocation] = useState(profile?.location || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');

  // Update form when profile loads
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setUsername(profile.username || '');
      setPhone(profile.phone || '');
      setLocation(profile.location || '');
      setAvatarUrl(profile.avatar_url || '');
    }
  }, [profile]);

  const handlePickAvatar = async () => {
    try {
      setUploading(true);
      const asset = await StorageService.pickImage();
      if (!asset) {
        setUploading(false);
        return;
      }

      // Upload to storage
      const filePath = `avatars/${user?.id}/${Date.now()}.jpg`;
      const result = await StorageService.uploadImage(asset.uri, 'event-images', filePath);

      setAvatarUrl(result.url);
      setUploading(false);
    } catch (error: any) {
      setUploading(false);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
      console.error('Avatar upload error:', error);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;

    // Validation
    if (!fullName.trim()) {
      Alert.alert('Error', 'Full name is required');
      return;
    }

    // Username validation (if provided)
    if (username.trim() && !/^[a-zA-Z0-9_]+$/.test(username.trim())) {
      Alert.alert('Error', 'Username can only contain letters, numbers, and underscores');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          username: username.trim() || null,
          phone: phone.trim() || null,
          location: location.trim() || null,
          avatar_url: avatarUrl || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      // Refresh profile in context
      await refreshProfile();

      Alert.alert('Success', 'Profile updated successfully!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <Pressable onPress={handleSave} disabled={loading} style={styles.saveButton}>
            {loading ? (
              <ActivityIndicator color={Colors.primary} size="small" />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </Pressable>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar Upload */}
          <View style={styles.avatarSection}>
            <Pressable onPress={handlePickAvatar} disabled={uploading}>
              <View style={styles.avatarContainer}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarPlaceholderText}>
                      {fullName.charAt(0).toUpperCase() || 'U'}
                    </Text>
                  </View>
                )}
                {/* Camera icon overlay */}
                <View style={styles.cameraOverlay}>
                  <Ionicons name="camera" size={20} color={Colors.background} />
                </View>
              </View>
            </Pressable>

            <Text style={styles.changePhotoText}>
              {uploading ? 'Uploading...' : 'Tap to change photo'}
            </Text>
          </View>

          {/* Form Fields */}
          <View style={styles.formSection}>
            {/* Full Name */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>
                Full Name <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter your full name"
                placeholderTextColor={Colors.textTertiary}
                autoCapitalize="words"
              />
            </View>

            {/* Username */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Username</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Choose a username"
                placeholderTextColor={Colors.textTertiary}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text style={styles.fieldHint}>Letters, numbers, and underscores only</Text>
            </View>

            {/* Email (Read-only) */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Email</Text>
              <View style={[styles.input, styles.inputDisabled]}>
                <Text style={styles.inputDisabledText}>{user?.email}</Text>
              </View>
              <Text style={styles.fieldHint}>Email cannot be changed</Text>
            </View>

            {/* Phone */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Phone</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter your phone number"
                placeholderTextColor={Colors.textTertiary}
                keyboardType="phone-pad"
              />
            </View>

            {/* Location */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Location</Text>
              <TextInput
                style={styles.input}
                value={location}
                onChangeText={setLocation}
                placeholder="City, Country"
                placeholderTextColor={Colors.textTertiary}
                autoCapitalize="words"
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: Spacing.xs,
    marginLeft: -Spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: Fonts.semiBold,
    color: Colors.text,
  },
  saveButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    minWidth: 60,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    color: Colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatarContainer: {
    marginBottom: Spacing.md,
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.surfaceSecondary,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  avatarPlaceholderText: {
    fontSize: 36,
    fontFamily: Fonts.semiBold,
    color: Colors.primary,
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.background,
  },
  changePhotoText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  formSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  fieldContainer: {
    marginBottom: Spacing.lg,
  },
  fieldLabel: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  required: {
    color: Colors.error,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    fontSize: 16,
    color: Colors.text,
  },
  inputDisabled: {
    backgroundColor: Colors.surfaceSecondary,
    justifyContent: 'center',
  },
  inputDisabledText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  fieldHint: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
});
