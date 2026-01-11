// src/components/AttendeesModal.tsx
import React, { useEffect, useState } from 'react';
import { X, User, Lock } from 'lucide-react';
import { getEventAttendees, type Attendee } from '../services/bookingService';
import { useAuth } from '../hooks/useAuth';

type AttendeesModalProps = {
  eventId: string;
  onClose: () => void;
  accentColor?: string;
  onAuthClick?: () => void;
};

export default function AttendeesModal({
  eventId,
  onClose,
  accentColor = '#FF785A',
  onAuthClick,
}: AttendeesModalProps) {
  const { user, isAuthenticated } = useAuth();
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch if user is authenticated
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    if (!eventId) {
      setError('No event ID provided');
      setLoading(false);
      return;
    }

    getEventAttendees(eventId)
      .then((attendeesList) => {
        setAttendees(attendeesList);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching attendees:', err);
        setError(err instanceof Error ? err.message : 'Failed to load attendees');
        setLoading(false);
      });
  }, [eventId, isAuthenticated]);

  const handleAttendeeClick = (userId: string) => {
    // TODO: Navigate to user profile page when implemented
    console.log('Navigate to user profile:', userId);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">
            {!isAuthenticated
              ? 'Who Joined'
              : loading
                ? 'Loading...'
                : `${attendees.length} ${attendees.length === 1 ? 'Person' : 'People'} Joined`}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Not Authenticated - Show Login Prompt */}
          {!isAuthenticated && !loading && (
            <div className="text-center py-12">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: `${accentColor}20` }}
              >
                <Lock size={40} style={{ color: accentColor }} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Login Required</h3>
              <p className="text-gray-600 mb-6">Please log in to view who has joined this event</p>
              <button
                onClick={() => {
                  onAuthClick?.();
                  onClose();
                }}
                className="px-6 py-3 text-white font-semibold rounded-xl transition-colors"
                style={{ backgroundColor: accentColor }}
              >
                Log In
              </button>
            </div>
          )}

          {/* Loading State */}
          {loading && isAuthenticated && (
            <div className="flex items-center justify-center py-12">
              <div
                className="animate-spin rounded-full h-12 w-12 border-b-2"
                style={{ borderColor: accentColor }}
              ></div>
            </div>
          )}

          {/* Error State */}
          {error && isAuthenticated && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">⚠️</div>
              <p className="text-gray-600">{error}</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && attendees.length === 0 && isAuthenticated && (
            <div className="text-center py-12">
              <User size={64} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg">No one has joined yet</p>
              <p className="text-gray-400 text-sm mt-2">Be the first to book!</p>
            </div>
          )}

          {/* Attendees List */}
          {!loading && !error && attendees.length > 0 && isAuthenticated && (
            <div className="space-y-3">
              {attendees.map((attendee) => {
                const displayName =
                  attendee.user.full_name || attendee.user.email.split('@')[0] || 'User';
                const username = attendee.user.email.split('@')[0] || 'user';
                const isCurrentUser = attendee.user_id === user?.id;

                return (
                  <button
                    key={attendee.user_id}
                    onClick={() => handleAttendeeClick(attendee.user_id)}
                    className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors text-left"
                  >
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {attendee.user.avatar_url ? (
                        <img
                          src={attendee.user.avatar_url}
                          alt={displayName}
                          className="w-16 h-16 rounded-full object-cover"
                          onError={(e) => {
                            // Fallback to initials if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            if (target.nextElementSibling) {
                              (target.nextElementSibling as HTMLElement).style.display = 'flex';
                            }
                          }}
                        />
                      ) : null}
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-semibold"
                        style={{
                          backgroundColor: accentColor,
                          display: attendee.user.avatar_url ? 'none' : 'flex',
                        }}
                      >
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 truncate">@{username}</p>
                        {isCurrentUser && (
                          <span
                            className="text-xs font-medium px-2 py-0.5 rounded-full text-white"
                            style={{ backgroundColor: accentColor }}
                          >
                            You
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 truncate">{displayName}</p>
                    </div>

                    {/* Chevron */}
                    <svg
                      className="w-5 h-5 text-gray-400 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
