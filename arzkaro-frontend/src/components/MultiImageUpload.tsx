import React, { useState, useRef } from 'react';
import { Upload, X, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface MultiImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  maxImages?: number;
  maxSizeMB?: number;
  bucketName?: string;
  label?: string;
  description?: string;
}

export function MultiImageUpload({
  value = [],
  onChange,
  maxImages = 5,
  maxSizeMB = 5,
  bucketName = 'event-images',
  label = 'Upload Images',
  description = 'Upload up to 5 images',
}: MultiImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canAddMore = value.length < maxImages;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (canAddMore) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (!canAddMore) return;

    const files = Array.from(e.dataTransfer.files);
    const remainingSlots = maxImages - value.length;
    const filesToUpload = files.slice(0, remainingSlots);

    await uploadFiles(filesToUpload);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !canAddMore) return;

    const filesArray = Array.from(files);
    const remainingSlots = maxImages - value.length;
    const filesToUpload = filesArray.slice(0, remainingSlots);

    await uploadFiles(filesToUpload);
  };

  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Set max dimensions
          const MAX_WIDTH = 1920;
          const MAX_HEIGHT = 1920;
          
          let width = img.width;
          let height = img.height;
          
          // Calculate new dimensions
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Convert to blob with compression
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                reject(new Error('Compression failed'));
              }
            },
            'image/jpeg',
            0.85 // 85% quality
          );
        };
        img.onerror = () => reject(new Error('Failed to load image'));
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
    });
  };

  const uploadFiles = async (files: File[]) => {
    setUploadError(null);
    setUploadingCount(files.length);

    const newUrls: string[] = [];

    for (const file of files) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setUploadError('Please upload only image files');
        continue;
      }

      // Validate file size
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > maxSizeMB) {
        setUploadError(`File size must be less than ${maxSizeMB}MB`);
        continue;
      }

      try {
        // Compress image before uploading
        const compressedFile = await compressImage(file);
        
        // Generate unique file name
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.jpg`;
        const filePath = fileName;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(filePath, compressedFile);

        if (uploadError) {
          throw uploadError;
        }

        // Get public URL
        const { data } = supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath);

        newUrls.push(data.publicUrl);
      } catch (error) {
        console.error('Upload error:', error);
        setUploadError(error instanceof Error ? error.message : 'Failed to upload image');
      }
    }

    setUploadingCount(0);
    onChange([...value, ...newUrls]);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = (indexToRemove: number) => {
    onChange(value.filter((_, index) => index !== indexToRemove));
  };

  const handleClick = () => {
    if (canAddMore && uploadingCount === 0) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-900 mb-2">
          {label}
        </label>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {/* Existing images */}
        {value.map((url, index) => (
          <div key={index} className="relative group aspect-video">
            <div className="relative rounded-lg overflow-hidden border-2 border-gray-200 h-full">
              <img
                src={url}
                alt={`Upload ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => handleRemove(index)}
                className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                type="button"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        ))}

        {/* Upload area - only show if can add more */}
        {canAddMore && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClick}
            className={`
              aspect-video relative rounded-lg border-2 border-dashed cursor-pointer transition-all
              ${isDragging
                ? 'border-black bg-gray-50'
                : 'border-gray-300 hover:border-gray-400'
              }
              ${uploadingCount > 0 ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
              {uploadingCount > 0 ? (
                <>
                  <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin mb-2" />
                  <p className="text-xs text-gray-600">Uploading {uploadingCount} image{uploadingCount > 1 ? 's' : ''}...</p>
                </>
              ) : (
                <>
                  {isDragging ? (
                    <Upload className="w-8 h-8 text-black mb-2" />
                  ) : (
                    <Plus className="w-8 h-8 text-gray-400 mb-2" />
                  )}
                  <p className="text-xs font-medium text-gray-900 mb-1">
                    Add Images
                  </p>
                  <p className="text-xs text-gray-500">
                    {value.length}/{maxImages} uploaded
                  </p>
                </>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploadingCount > 0 || !canAddMore}
            />
          </div>
        )}
      </div>

      {description && (
        <p className="mt-2 text-sm text-gray-500">{description}</p>
      )}

      {uploadError && (
        <p className="mt-2 text-sm text-red-600">{uploadError}</p>
      )}
    </div>
  );
}
