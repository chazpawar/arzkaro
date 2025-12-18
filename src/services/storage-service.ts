import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../backend/supabase';

export interface ImageUploadResult {
  url: string;
  path: string;
}

/**
 * Request camera permissions
 */
export async function requestCameraPermissions(): Promise<boolean> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  return status === 'granted';
}

/**
 * Request media library permissions
 */
export async function requestMediaLibraryPermissions(): Promise<boolean> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === 'granted';
}

/**
 * Pick an image from the media library
 */
export async function pickImage(): Promise<ImagePicker.ImagePickerAsset | null> {
  try {
    const hasPermission = await requestMediaLibraryPermissions();
    if (!hasPermission) {
      throw new Error('Permission to access media library was denied');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [16, 9], // Good aspect ratio for event covers
      quality: 0.8,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    return result.assets[0];
  } catch (error) {
    console.error('Error picking image:', error);
    throw error;
  }
}

/**
 * Take a photo with the camera
 */
export async function takePhoto(): Promise<ImagePicker.ImagePickerAsset | null> {
  try {
    const hasPermission = await requestCameraPermissions();
    if (!hasPermission) {
      throw new Error('Permission to access camera was denied');
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    return result.assets[0];
  } catch (error) {
    console.error('Error taking photo:', error);
    throw error;
  }
}

/**
 * Upload an image to Supabase Storage
 * @param uri - Local URI of the image
 * @param bucket - Storage bucket name (default: 'event-images')
 * @param folder - Optional folder path within the bucket
 * @returns The public URL and storage path of the uploaded image
 */
export async function uploadImage(
  uri: string,
  bucket = 'event-images',
  folder?: string
): Promise<ImageUploadResult> {
  try {
    // Generate a unique filename
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const extension = uri.split('.').pop() || 'jpg';
    const filename = `${timestamp}_${random}.${extension}`;
    const path = folder ? `${folder}/${filename}` : filename;

    // Fetch the image
    const response = await fetch(uri);
    const blob = await response.blob();

    // Read blob as base64 for React Native compatibility
    const reader = new FileReader();
    const base64Promise = new Promise<string>((resolve, reject) => {
      reader.onloadend = () => {
        const base64 = reader.result as string;
        // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    const base64Data = await base64Promise;

    // Convert base64 to Uint8Array
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage.from(bucket).upload(path, bytes.buffer, {
      contentType: blob.type || 'image/jpeg',
      upsert: false,
    });

    if (error) {
      console.error('Supabase upload error:', error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }

    if (!data) {
      throw new Error('Upload succeeded but no data returned');
    }

    // Get the public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(data.path);

    return {
      url: publicUrl,
      path: data.path,
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}

/**
 * Delete an image from Supabase Storage
 * @param path - Storage path of the image
 * @param bucket - Storage bucket name
 */
export async function deleteImage(path: string, bucket = 'event-images'): Promise<void> {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) {
      console.error('Error deleting image:', error);
      throw new Error(`Failed to delete image: ${error.message}`);
    }
  } catch (error) {
    console.error('Error in deleteImage:', error);
    throw error;
  }
}

/**
 * Upload multiple images
 */
export async function uploadMultipleImages(
  uris: string[],
  bucket = 'event-images',
  folder?: string
): Promise<ImageUploadResult[]> {
  const uploadPromises = uris.map((uri) => uploadImage(uri, bucket, folder));
  return Promise.all(uploadPromises);
}
