// src/pages/TicketDetailPage.tsx
import { ChevronLeft, MapPin, Calendar, Info } from 'lucide-react';
import { useTicket } from '../hooks/useTickets';

type TicketDetailPageProps = {
  ticketId: string;
  onBack: () => void;
};

export default function TicketDetailPage({ ticketId, onBack }: TicketDetailPageProps) {
  const { ticket, loading, error } = useTicket(ticketId);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-[#FF785A] mb-4"></div>
          <p className="text-gray-600">Loading ticket...</p>
        </div>
      </div>
    );
  }

  if (error || !ticket || !ticket.event) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Ticket Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'This ticket does not exist.'}</p>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-[#FF785A] text-white font-semibold rounded-xl hover:bg-[#ff6a47] transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const event = ticket.event;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors inline-flex items-center gap-2"
          >
            <ChevronLeft size={24} className="text-gray-900" />
            <span className="text-sm font-medium text-gray-900">Back</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Ticket Card */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-lg">
          {/* Event Image Section */}
          <div className="relative h-64">
            {event.cover_image_url ? (
              <img
                src={event.cover_image_url}
                alt={event.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-orange-400 to-pink-400 flex items-center justify-center">
                <span className="text-6xl">🎵</span>
              </div>
            )}
            {/* Ticket Type Badge */}
            <div className="absolute top-4 right-4 px-4 py-2 bg-white rounded-full shadow-md flex items-center gap-2">
              <span className="text-yellow-500">⭐</span>
              <span className="font-semibold text-gray-900">
                {ticket.ticket_type?.name || 'General'}
              </span>
            </div>
          </div>

          {/* Dashed Separator */}
          <div className="relative h-8 bg-white">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 bg-gray-100 rounded-full -ml-4"></div>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 bg-gray-100 rounded-full -mr-4"></div>
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-gray-300"></div>
          </div>

          {/* Verification Code Section */}
          <div className="px-6 py-8 text-center bg-white">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 flex items-center justify-center">
                <span className="text-6xl">🎫</span>
              </div>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Your Ticket</h2>
            <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">
              Verification Code
            </p>
            <p className="text-5xl font-bold text-gray-900 mb-4 tracking-wider font-mono">
              {ticket.verification_code}
            </p>
            <p className="text-sm text-gray-600 max-w-md mx-auto">
              Show this 6-character code at the venue entrance for verification
            </p>
          </div>

          {/* Dashed Separator */}
          <div className="relative h-8 bg-white">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 bg-gray-100 rounded-full -ml-4"></div>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 bg-gray-100 rounded-full -mr-4"></div>
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-gray-300"></div>
          </div>

          {/* Event Details Section */}
          <div className="px-6 py-8 bg-white">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">{event.title}</h3>

            {/* Date & Time */}
            <div className="flex gap-4 mb-6">
              <div className="flex-shrink-0">
                <div className="w-14 h-14 flex items-center justify-center">
                  <Calendar size={32} className="text-gray-600" />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Date & Time</p>
                <p className="text-base font-semibold text-gray-900">{formatDate(event.start_date)}</p>
                <p className="text-sm text-gray-600">at {formatTime(event.start_date)}</p>
              </div>
            </div>

            {/* Venue */}
            <div className="flex gap-4 mb-6">
              <div className="flex-shrink-0">
                <div className="w-14 h-14 flex items-center justify-center">
                  <MapPin size={32} className="text-gray-600" />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Venue</p>
                <p className="text-base font-semibold text-gray-900">
                  {event.location_name || 'TBA'}
                </p>
                {event.location_address && (
                  <p className="text-sm text-gray-600">{event.location_address}</p>
                )}
              </div>
            </div>

            {/* Ticket Type Information */}
            {ticket.ticket_type && (
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 flex items-center justify-center">
                    <span className="text-2xl">⭐</span>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                    Ticket Type
                  </p>
                  <p className="text-base font-semibold text-gray-900">{ticket.ticket_type.name}</p>
                  {ticket.ticket_type.description && (
                    <p className="text-sm text-gray-600">{ticket.ticket_type.description}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info Note */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex gap-3">
          <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-900">
            Screenshot this ticket for offline access. Share your 6-character verification code
            with event staff for entry.
          </p>
        </div>
      </div>
    </div>
  );
}
