import React, { useState, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ImageUploadProps {
  label: string;
  currentImageUrl?: string | null;
  onImageSelected: (imageUrl: string) => void;
  bucket?: string;
  folder?: string;
  required?: boolean;
  error?: string;
}

export default function ImageUpload({
  label,
  currentImageUrl,
  onImageSelected,
  bucket = 'host-documents',
  folder,
  required = false,
  error
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Please upload a valid image file (JPG, PNG, WebP) or PDF');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      setUploadError('File size must be less than 5MB');
      return;
    }

    // Show preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }

    // Upload to Supabase Storage
    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    try {
      setUploading(true);
      setUploadError(null);

      // Generate unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = folder ? `${folder}/${fileName}` : fileName;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      onImageSelected(publicUrl);
      setUploadError(null);
    } catch (err) {
      console.error('Upload error:', err);
      setUploadError(err instanceof Error ? err.message : 'Failed to upload file');
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    onImageSelected('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-bold text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="relative">
        {previewUrl ? (
          // Preview with image
          <div className="relative border-2 border-gray-200 rounded-xl overflow-hidden">
            <div className="h-48 bg-gray-50 flex items-center justify-center">
              {previewUrl.endsWith('.pdf') ? (
                <div className="text-center p-4">
                  <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">PDF Document</p>
                </div>
              ) : (
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="max-h-full max-w-full object-contain"
                />
              )}
            </div>
            <div className="absolute top-2 right-2 flex gap-2">
              <button
                type="button"
                onClick={handleRemove}
                className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors"
                disabled={uploading}
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <button
              type="button"
              onClick={handleClick}
              className="absolute bottom-0 left-0 right-0 bg-black/60 text-white py-2 text-sm font-medium hover:bg-black/70 transition-colors flex items-center justify-center gap-2"
              disabled={uploading}
            >
              <Upload className="w-4 h-4" />
              Change
            </button>
          </div>
        ) : (
          // Upload button
          <button
            type="button"
            onClick={handleClick}
            disabled={uploading}
            className={`w-full h-48 border-2 border-dashed rounded-xl transition-all flex flex-col items-center justify-center gap-3 ${
              uploading 
                ? 'border-gray-300 bg-gray-50 cursor-not-allowed' 
                : error || uploadError
                ? 'border-red-300 bg-red-50 hover:border-red-400'
                : 'border-gray-300 bg-gray-50 hover:border-[#FF785A] hover:bg-[#FF785A]/5'
            }`}
          >
            {uploading ? (
              <>
                <Loader2 className="w-10 h-10 text-[#FF785A] animate-spin" />
                <p className="text-sm text-gray-600">Uploading...</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center">
                  <Upload className="w-8 h-8 text-gray-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700">Click to upload</p>
                  <p className="text-xs text-gray-500 mt-1">JPG, PNG, WebP or PDF (max 5MB)</p>
                </div>
              </>
            )}
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />
      </div>

      {(error || uploadError) && (
        <p className="text-xs text-red-600 mt-1">
          {error || uploadError}
        </p>
      )}
    </div>
  );
}
