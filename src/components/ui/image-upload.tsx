import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Fonts';
import { Spacing, Typography, BorderRadius, Shadows } from '../../constants/Styles';
import * as StorageService from '../../services/storage-service';

interface ImageUploadProps {
  onImageSelected: (imageUrl: string, imagePath: string) => void;
  currentImageUrl?: string | null;
  label?: string;
  aspectRatio?: [number, number];
  bucket?: string;
  folder?: string;
}

export default function ImageUpload({
  onImageSelected,
  currentImageUrl,
  label = 'Add Cover Image',
  bucket = 'event-images',
  folder,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [localUri, setLocalUri] = useState<string | null>(null);

  const handlePickImage = async () => {
    try {
      setShowOptions(false);
      const asset = await StorageService.pickImage();
      if (asset) {
        setLocalUri(asset.uri);
        await uploadImage(asset.uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
      console.error('Pick image error:', error);
    }
  };

  const handleTakePhoto = async () => {
    try {
      setShowOptions(false);
      const asset = await StorageService.takePhoto();
      if (asset) {
        setLocalUri(asset.uri);
        await uploadImage(asset.uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo. Please try again.');
      console.error('Take photo error:', error);
    }
  };

  const uploadImage = async (uri: string) => {
    try {
      setUploading(true);
      const result = await StorageService.uploadImage(uri, bucket, folder);
      onImageSelected(result.url, result.path);
    } catch (error) {
      Alert.alert('Upload Failed', 'Could not upload image. Please try again.');
      console.error('Upload error:', error);
      setLocalUri(null);
    } finally {
      setUploading(false);
    }
  };

  const displayImage = localUri || currentImageUrl;

  return (
    <>
      <View style={styles.container}>
        <Text style={styles.label}>{label}</Text>
        <Pressable
          style={[styles.uploadBox, displayImage && styles.uploadBoxWithImage]}
          onPress={() => setShowOptions(true)}
          disabled={uploading}
        >
          {uploading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.uploadingText}>Uploading...</Text>
            </View>
          ) : displayImage ? (
            <>
              <Image source={{ uri: displayImage }} style={styles.image} resizeMode="cover" />
              <View style={styles.editOverlay}>
                <Ionicons name="camera" size={24} color={Colors.textInverse} />
                <Text style={styles.editText}>Change</Text>
              </View>
            </>
          ) : (
            <View style={styles.placeholderContent}>
              <View style={styles.iconContainer}>
                <Ionicons name="image-outline" size={40} color={Colors.textSecondary} />
              </View>
              <Text style={styles.placeholderText}>Tap to add image</Text>
              <Text style={styles.placeholderSubtext}>16:9 ratio recommended</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Image Source Selection Modal */}
      <Modal
        visible={showOptions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOptions(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowOptions(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choose Image Source</Text>

            <Pressable style={styles.optionButton} onPress={handleTakePhoto}>
              <View style={[styles.optionIcon, { backgroundColor: Colors.infoLight }]}>
                <Ionicons name="camera" size={24} color={Colors.info} />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Camera</Text>
                <Text style={styles.optionSubtitle}>Take a new photo</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.borderDark} />
            </Pressable>

            <Pressable style={styles.optionButton} onPress={handlePickImage}>
              <View style={[styles.optionIcon, { backgroundColor: Colors.successLight }]}>
                <Ionicons name="images" size={24} color={Colors.success} />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Gallery</Text>
                <Text style={styles.optionSubtitle}>Choose from library</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.borderDark} />
            </Pressable>

            <Pressable
              style={[styles.optionButton, styles.cancelButton]}
              onPress={() => setShowOptions(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  label: {
    ...Typography.bodyMedium,
    fontFamily: Fonts.semiBold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  uploadBox: {
    height: 200,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  uploadBoxWithImage: {
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  editOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  editText: {
    ...Typography.bodySmall,
    color: Colors.textInverse,
    fontFamily: Fonts.semiBold,
  },
  placeholderContent: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  placeholderText: {
    ...Typography.bodyMedium,
    color: Colors.text,
    fontFamily: Fonts.medium,
  },
  placeholderSubtext: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  modalTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    ...Typography.bodyMedium,
    fontFamily: Fonts.semiBold,
    color: Colors.text,
  },
  optionSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  cancelButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  cancelText: {
    ...Typography.bodyMedium,
    color: Colors.text,
    fontFamily: Fonts.semiBold,
    textAlign: 'center',
  },
});
