// src/components/SkeletonCard.tsx
import React from 'react';

interface SkeletonCardProps {
  count?: number;
  accentColor?: string; // For future customization
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse">
          {/* Image Skeleton */}
          <div className="h-48 bg-gray-200 relative overflow-hidden">
            <div
              className="absolute inset-0 shimmer"
              style={{
                background: `linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)`,
              }}
            />
          </div>

          {/* Content Skeleton */}
          <div className="p-4 space-y-3">
            {/* Title Skeleton - 2 lines */}
            <div className="space-y-2">
              <div className="h-5 bg-gray-200 rounded w-4/5 relative overflow-hidden">
                <div className="absolute inset-0 shimmer" />
              </div>
              <div className="h-5 bg-gray-200 rounded w-3/5 relative overflow-hidden">
                <div className="absolute inset-0 shimmer" />
              </div>
            </div>

            {/* Location Skeleton */}
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 bg-gray-200 rounded relative overflow-hidden">
                <div className="absolute inset-0 shimmer" />
              </div>
              <div className="h-4 bg-gray-200 rounded w-2/3 relative overflow-hidden">
                <div className="absolute inset-0 shimmer" />
              </div>
            </div>

            {/* Date/Duration Skeleton */}
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 bg-gray-200 rounded relative overflow-hidden">
                <div className="absolute inset-0 shimmer" />
              </div>
              <div className="h-4 bg-gray-200 rounded w-1/2 relative overflow-hidden">
                <div className="absolute inset-0 shimmer" />
              </div>
            </div>

            {/* Price Skeleton */}
            <div className="h-6 bg-gray-200 rounded w-1/3 relative overflow-hidden">
              <div className="absolute inset-0 shimmer" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

// Horizontal scroll skeleton for ForYou page
export const SkeletonHorizontalCard: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="flex-shrink-0 w-64 bg-white rounded-xl overflow-hidden shadow-sm animate-pulse"
        >
          {/* Image Skeleton */}
          <div className="h-40 bg-gray-200 relative overflow-hidden">
            <div className="absolute inset-0 shimmer" />
          </div>

          {/* Content Skeleton */}
          <div className="p-4 space-y-3">
            {/* Title */}
            <div className="h-4 bg-gray-200 rounded w-4/5 relative overflow-hidden">
              <div className="absolute inset-0 shimmer" />
            </div>

            {/* Location */}
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 bg-gray-200 rounded relative overflow-hidden">
                <div className="absolute inset-0 shimmer" />
              </div>
              <div className="h-3 bg-gray-200 rounded w-2/3 relative overflow-hidden">
                <div className="absolute inset-0 shimmer" />
              </div>
            </div>

            {/* Price */}
            <div className="h-5 bg-gray-200 rounded w-1/3 relative overflow-hidden">
              <div className="absolute inset-0 shimmer" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

// Global shimmer animation CSS
export const SkeletonStyles = () => (
  <style>{`
    @keyframes shimmer {
      0% {
        transform: translateX(-100%);
      }
      100% {
        transform: translateX(100%);
      }
    }
    
    .shimmer {
      animation: shimmer 2s infinite;
    }
  `}</style>
);
