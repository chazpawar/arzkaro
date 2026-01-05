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
import { Spacing, Typography, BorderRadius, Shadows } from '../../constants/Styles';
import { Fonts } from '../../constants/Fonts';
import * as StorageService from '../../services/storage-service';

interface MultiImageUploadProps {
  onImagesChange: (imageUrls: string[]) => void;
  currentImages?: string[];
  maxImages?: number;
  bucket?: string;
  folder?: string;
}

export default function MultiImageUpload({
  onImagesChange,
  currentImages = [],
  maxImages = 5,
  bucket = 'event-images',
  folder,
}: MultiImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<number>(0);

  const handlePickImage = async () => {
    try {
      setShowOptions(false);
      const asset = await StorageService.pickImage();
      if (asset) {
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
      setUploadingIndex(selectedSlot);
      const result = await StorageService.uploadImage(uri, bucket, folder);

      const newImages = [...currentImages];
      if (selectedSlot < newImages.length) {
        newImages[selectedSlot] = result.url;
      } else {
        newImages.push(result.url);
      }

      onImagesChange(newImages);
    } catch (error) {
      Alert.alert('Upload Failed', 'Could not upload image. Please try again.');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
      setUploadingIndex(null);
    }
  };

  const handleRemoveImage = (index: number) => {
    Alert.alert('Remove Image', 'Are you sure you want to remove this image?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          const newImages = currentImages.filter((_, i) => i !== index);
          onImagesChange(newImages);
        },
      },
    ]);
  };

  const handleAddImage = (index: number) => {
    if (currentImages.length >= maxImages) {
      Alert.alert('Limit Reached', `You can only upload up to ${maxImages} images.`);
      return;
    }
    setSelectedSlot(index);
    setShowOptions(true);
  };

  const renderImageSlot = (index: number) => {
    const hasImage = currentImages[index];
    const isUploading = uploadingIndex === index;

    if (isUploading) {
      return (
        <View style={[styles.imageSlot, styles.imageSlotUploading]}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.uploadingText}>Uploading...</Text>
        </View>
      );
    }

    if (hasImage) {
      return (
        <View style={styles.imageSlot}>
          <Image source={{ uri: hasImage }} style={styles.slotImage} resizeMode="cover" />
          <Pressable
            style={styles.removeButton}
            onPress={() => handleRemoveImage(index)}
            hitSlop={8}
          >
            <Ionicons name="close-circle" size={24} color={Colors.error} />
          </Pressable>
          <View style={styles.imageNumberBadge}>
            <Text style={styles.imageNumberText}>{index + 1}</Text>
          </View>
        </View>
      );
    }

    return (
      <Pressable
        style={[styles.imageSlot, styles.emptySlot]}
        onPress={() => handleAddImage(index)}
        disabled={uploading}
      >
        <Ionicons name="camera-outline" size={32} color={Colors.textSecondary} />
        <Text style={styles.emptySlotText}>Add Photo</Text>
      </Pressable>
    );
  };

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.label}>Trip Gallery Images (Optional)</Text>
          <Text style={styles.counter}>
            {currentImages.length}/{maxImages}
          </Text>
        </View>
        <Text style={styles.hint}>Upload 0-5 photos showcasing this trip</Text>

        <View style={styles.grid}>
          {Array.from({ length: maxImages }).map((_, index) => (
            <View key={index} style={styles.gridItem}>
              {renderImageSlot(index)}
            </View>
          ))}
        </View>

        {currentImages.length > 0 && (
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={16} color={Colors.info} />
            <Text style={styles.infoText}>First image will appear first in the gallery</Text>
          </View>
        )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  label: {
    ...Typography.bodyMedium,
    fontFamily: Fonts.semiBold,
    color: Colors.text,
  },
  counter: {
    ...Typography.bodySmall,
    fontFamily: Fonts.bold,
    color: Colors.primary,
    backgroundColor: Colors.primarySoft,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  hint: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  gridItem: {
    width: `${(100 - Spacing.sm) / 2}%`,
  },
  imageSlot: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptySlot: {
    justifyContent: 'center',
    alignItems: 'center',
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  emptySlotText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    fontFamily: Fonts.medium,
  },
  imageSlotUploading: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
  },
  uploadingText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  slotImage: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.background,
    borderRadius: 12,
    ...Shadows.sm,
  },
  imageNumberBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  },
  imageNumberText: {
    ...Typography.caption,
    fontSize: 11,
    fontFamily: Fonts.bold,
    color: Colors.textInverse,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.infoLight,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  infoText: {
    ...Typography.caption,
    color: Colors.info,
    flex: 1,
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
