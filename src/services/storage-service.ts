import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
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
      mediaTypes: ['images'],
      allowsEditing: false, // Don't force cropping
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
      allowsEditing: false, // Don't force cropping
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
 */
export async function uploadImage(
  uri: string,
  bucket = 'event-images',
  folder?: string
): Promise<ImageUploadResult> {
  try {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const filename = `${timestamp}_${random}.jpg`;
    const path = folder ? `${folder}/${filename}` : filename;

    // Get Supabase session for auth token
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) {
      throw new Error('Not authenticated. Please log in to upload images.');
    }

    // Convert HEIC to JPEG without cropping using ImageManipulator
    // This preserves the full image while ensuring JPEG format
    let processedUri = uri;
    if (uri.toLowerCase().endsWith('.heic') || uri.toLowerCase().includes('.heic')) {
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [], // No transformations - just format conversion
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );
      processedUri = manipResult.uri;
    }

    // Read file as base64
    const response = await fetch(processedUri);
    const blob = await response.blob();

    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    // Convert to binary
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    // Upload using XMLHttpRequest (more stable than fetch in RN)
    const supabaseUrl = (supabase as any).supabaseUrl;
    const supabaseKey = (supabase as any).supabaseKey;
    const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${path}`;

    return new Promise<ImageUploadResult>((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.open('POST', uploadUrl);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.setRequestHeader('apikey', supabaseKey);
      xhr.setRequestHeader('Content-Type', 'image/jpeg');
      xhr.setRequestHeader('x-upsert', 'false');

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
          console.log('✅ Upload successful:', path);
          resolve({ url: publicUrl, path });
        } else {
          console.error('Upload failed:', xhr.status, xhr.responseText);
          reject(new Error(`Upload failed: ${xhr.status} - ${xhr.responseText}`));
        }
      };

      xhr.onerror = (e) => {
        console.error('XHR Error Event:', e);
        reject(new Error('Network request failed - check console for details'));
      };
      xhr.ontimeout = () => reject(new Error('Upload timeout'));

      xhr.timeout = 30000; // 30 second timeout
      xhr.send(bytes.buffer);
    });
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
