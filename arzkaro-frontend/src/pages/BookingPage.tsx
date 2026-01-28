// src/pages/BookingPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, MapPin, Calendar } from 'lucide-react';
import { useEvent } from '../hooks/useEvents';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../contexts/ToastContext';
import { razorpayService } from '../services/razorpayService';

interface TicketType {
  id: string;
  name: string;
  description: string | null;
  price: number;
  quantity_available: number;
  quantity_sold: number;
}

interface BookingPageProps {
  eventId: string;
  onBack: () => void;
  onSuccess?: () => void;
  onAuthClick?: () => void;
}

export default function BookingPage({ eventId, onBack, onSuccess, onAuthClick }: BookingPageProps) {
  const { event, ticketTypes: fetchedTicketTypes, loading, error } = useEvent(eventId);
  const { user } = useAuth();
  const { showToast } = useToast();
  const [selectedTicketType, setSelectedTicketType] = useState<TicketType | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  // Use fetched ticket types or create a default one from event
  const ticketTypes: TicketType[] = useMemo(() => {
    return fetchedTicketTypes.length > 0
      ? fetchedTicketTypes
      : event
        ? [{
            id: 'default',
            name: 'General Admission',
            description: 'Standard entry ticket',
            price: event.price || 0,
            quantity_available: 100, // Default if not specified
            quantity_sold: 0,
          }]
        : [];
  }, [fetchedTicketTypes, event]);

  // Auto-select first ticket type
  useEffect(() => {
    if (ticketTypes.length > 0 && !selectedTicketType) {
      setSelectedTicketType(ticketTypes[0]);
    }
  }, [ticketTypes, selectedTicketType]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const unitPrice = selectedTicketType?.price ?? event?.price ?? 0;
  const totalAmount = unitPrice * quantity;
  const maxQuantity = selectedTicketType
    ? Math.min(10, selectedTicketType.quantity_available - selectedTicketType.quantity_sold)
    : 10;

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= maxQuantity) {
      setQuantity(newQuantity);
    }
  };

  const handleConfirmBooking = async () => {
    // Check if user is logged in
    if (!user) {
      if (onAuthClick) {
        onAuthClick();
      } else {
        showToast('Please log in to book tickets', 'info');
      }
      return;
    }

    if (!event || !selectedTicketType) {
      showToast('Please select a ticket type', 'warning');
      return;
    }

    setIsProcessing(true);

    try {
      // Get user details
      const userDetails = {
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Guest',
        email: user.email || '',
        contact: user.user_metadata?.phone || '+919999999999',
      };

      if (totalAmount > 0) {
        // PAID EVENT - Process with Razorpay
        const result = await razorpayService.processPayment(
          event.id,
          selectedTicketType.id,
          quantity,
          user.id,
          userDetails
        );

        if (result.success) {
          showToast('🎉 Booking confirmed! Check your tickets in My Tickets.', 'success');
          if (onSuccess) {
            onSuccess();
          } else {
            onBack();
          }
        } else if (result.cancelled) {
          // User cancelled payment - just show message, don't navigate away
          showToast('Payment cancelled. You can try again when ready.', 'info');
        } else {
          throw new Error(result.error || 'Payment failed');
        }
      } else {
        // FREE EVENT - Direct booking
        const result = await razorpayService.processFreeBooking(
          event.id,
          selectedTicketType.id,
          quantity,
          user.id
        );

        if (result.success) {
          showToast('🎉 Booking confirmed! This one\'s on us! Check your tickets in My Tickets.', 'success');
          if (onSuccess) {
            onSuccess();
          } else {
            onBack();
          }
        } else {
          throw new Error(result.error || 'Booking failed');
        }
      }
    } catch (err: unknown) {
      console.error('Booking error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to complete booking. Please try again.';
      showToast(errorMessage, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#FF785A] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading event details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !event) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center px-4">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Event not found</h2>
          <p className="text-gray-600 mb-6">We couldn't load this event. It may have been removed.</p>
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

  // Sold out check
  const isSoldOut = ticketTypes.every(
    (ticket) => ticket.quantity_available - ticket.quantity_sold <= 0
  );

  if (isSoldOut) {
    return (
      <div className="min-h-screen bg-white">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors inline-flex items-center gap-2"
              aria-label="Go back"
            >
              <ChevronLeft size={24} className="text-gray-900" />
              <span className="text-sm font-medium text-gray-900">Back</span>
            </button>
          </div>
        </div>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center px-4">
            <div className="text-6xl mb-4">🎫</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Sold Out</h2>
            <p className="text-gray-600">All tickets for this event have been sold.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors inline-flex items-center gap-2"
            aria-label="Go back"
          >
            <ChevronLeft size={24} className="text-gray-900" />
            <span className="text-sm font-medium text-gray-900">Back</span>
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 pb-32">
        {/* Event Summary Card */}
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 mb-8 shadow-sm">
          <div className="flex gap-4">
            {/* Event Image */}
            <div className="flex-shrink-0">
              {event.cover_image_url ? (
                <img
                  src={event.cover_image_url}
                  alt={event.title}
                  className="w-24 h-24 object-cover rounded-xl"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/100?text=Event';
                  }}
                />
              ) : (
                <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-pink-400 rounded-xl flex items-center justify-center text-4xl">
                  🎉
                </div>
              )}
            </div>

            {/* Event Info */}
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-gray-900 mb-2 truncate">{event.title}</h2>
              <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                <Calendar size={14} />
                <span>
                  {formatDate(event.start_date)} · {formatTime(event.start_date)}
                </span>
              </div>
              {event.location_name && (
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <MapPin size={14} />
                  <span className="truncate">{event.location_name}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Ticket Type Selection */}
        {ticketTypes.length > 0 && (
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-900 mb-3">Ticket Type</label>
            <div className="space-y-3">
              {ticketTypes.map((ticket) => {
                const available = ticket.quantity_available - ticket.quantity_sold;
                const isSelected = selectedTicketType?.id === ticket.id;
                const isTicketSoldOut = available <= 0;

                return (
                  <button
                    key={ticket.id}
                    onClick={() => !isTicketSoldOut && setSelectedTicketType(ticket)}
                    disabled={isTicketSoldOut}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-[#FF785A] bg-[#FF785A]/5'
                        : isTicketSoldOut
                          ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                          : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`font-semibold ${isTicketSoldOut ? 'text-gray-400' : 'text-gray-900'}`}
                      >
                        {ticket.name}
                      </span>
                      <span
                        className={`font-bold ${isTicketSoldOut ? 'text-gray-400' : 'text-[#FF785A]'}`}
                      >
                        {ticket.price === 0 ? 'Free' : formatPrice(ticket.price)}
                      </span>
                    </div>
                    {ticket.description && (
                      <p className="text-sm text-gray-600 mb-2">{ticket.description}</p>
                    )}
                    <p
                      className={`text-xs ${isTicketSoldOut ? 'text-red-500 font-semibold' : 'text-gray-500'}`}
                    >
                      {isTicketSoldOut ? 'Sold Out' : `${available} left`}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Quantity Selector */}
        <div className="mb-8">
          <label className="block text-sm font-semibold text-gray-900 mb-3">Quantity</label>
          <div className="flex items-center justify-center gap-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <button
              onClick={() => handleQuantityChange(-1)}
              disabled={quantity <= 1}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-white border-2 border-gray-300 text-gray-900 font-bold text-xl hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              -
            </button>
            <div className="min-w-[60px] text-center">
              <span className="text-3xl font-bold text-gray-900">{quantity}</span>
            </div>
            <button
              onClick={() => handleQuantityChange(1)}
              disabled={quantity >= maxQuantity}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-white border-2 border-gray-300 text-gray-900 font-bold text-xl hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              +
            </button>
          </div>
          {maxQuantity < 10 && (
            <p className="text-sm text-gray-600 mt-2 text-center">
              Maximum {maxQuantity} ticket{maxQuantity !== 1 ? 's' : ''} available
            </p>
          )}
        </div>

        {/* Price Summary */}
        <div className="mb-8">
          <label className="block text-sm font-semibold text-gray-900 mb-3">Price Summary</label>
          <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-700">
                {selectedTicketType?.name || 'Ticket'} x {quantity}
              </span>
              <span className="font-semibold text-gray-900">
                {totalAmount === 0 ? 'Free' : formatPrice(totalAmount)}
              </span>
            </div>
            <div className="border-t border-gray-200 my-3"></div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-900">Total</span>
              <span className="font-bold text-2xl text-[#FF785A]">
                {totalAmount === 0 ? 'Free' : formatPrice(totalAmount)}
              </span>
            </div>
            {totalAmount === 0 && (
              <p className="text-sm text-[#FF785A] font-semibold mt-2 text-center">
                This one's on us 🎉
              </p>
            )}
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <svg
              className="w-5 h-5 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h4 className="font-semibold text-blue-900 text-sm mb-1">Instant digital tickets</h4>
            <p className="text-sm text-blue-800">
              You'll get QR code tickets and access to the event chat as soon as the booking goes
              through.
            </p>
          </div>
        </div>
      </div>

      {/* Fixed Footer with Confirm Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-gray-600 mb-1">Total</p>
              <p className="text-2xl font-bold text-gray-900">
                {totalAmount === 0 ? 'Free' : formatPrice(totalAmount)}
              </p>
            </div>
            <button
              onClick={handleConfirmBooking}
              disabled={isProcessing || !selectedTicketType}
              className="px-8 py-4 bg-[#FF785A] text-white text-lg font-semibold rounded-xl hover:bg-[#ff6a47] transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <span>Confirm Booking</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
