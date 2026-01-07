// src/pages/BookingPage.tsx
import React, { useState } from 'react';
import { ChevronLeft, MapPin } from 'lucide-react';
import { Event } from './ExperienceDetailPage';
import Forms from '../components/Form';

interface TicketType {
  id: string;
  name: string;
  description: string | null;
  price: number;
  quantity_available: number;
  quantity_sold: number;
}

interface BookingPageProps {
  event: Event;
  onBack: () => void;
}

export default function BookingPage({ event, onBack }: BookingPageProps) {
  const [selectedTicketType, setSelectedTicketType] = useState<TicketType | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  // Mock ticket types - in real implementation, fetch from Supabase
  const ticketTypes: TicketType[] = [
    {
      id: '1',
      name: 'General Admission',
      description: 'Standard entry ticket',
      price: event.ticket_price || 0,
      quantity_available: 100,
      quantity_sold: 20,
    },
  ];

  // Auto-select first ticket type
  React.useEffect(() => {
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

  const unitPrice = selectedTicketType?.price ?? event.ticket_price ?? 0;
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

  const handleConfirmBooking = () => {
    setShowPaymentForm(true);
  };

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
              {event.image_url ? (
                <img
                  src={event.image_url}
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
              <p className="text-sm text-gray-600 mb-1">
                {formatDate(event.event_date)} · {formatTime(event.event_date)}
              </p>
              {event.venue && (
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <MapPin size={14} />
                  <span className="truncate">{event.venue}</span>
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
                const isSoldOut = available <= 0;

                return (
                  <button
                    key={ticket.id}
                    onClick={() => !isSoldOut && setSelectedTicketType(ticket)}
                    disabled={isSoldOut}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-[#FF785A] bg-[#FF785A]/5'
                        : isSoldOut
                          ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                          : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`font-semibold ${isSoldOut ? 'text-gray-400' : 'text-gray-900'}`}
                      >
                        {ticket.name}
                      </span>
                      <span
                        className={`font-bold ${isSoldOut ? 'text-gray-400' : 'text-[#FF785A]'}`}
                      >
                        {formatPrice(ticket.price)}
                      </span>
                    </div>
                    {ticket.description && (
                      <p className="text-sm text-gray-600 mb-2">{ticket.description}</p>
                    )}
                    <p
                      className={`text-xs ${isSoldOut ? 'text-red-500 font-semibold' : 'text-gray-500'}`}
                    >
                      {isSoldOut ? 'Sold Out' : `${available} left`}
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
              <span className="font-semibold text-gray-900">{formatPrice(totalAmount)}</span>
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
              className="px-8 py-4 bg-[#FF785A] text-white text-lg font-semibold rounded-xl hover:bg-[#ff6a47] transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm Booking
            </button>
          </div>
        </div>
      </div>

      {/* Payment Form Modal */}
      {showPaymentForm && (
        <Forms
          open={showPaymentForm}
          amountINR={totalAmount}
          eventId={event.id}
          onClose={() => setShowPaymentForm(false)}
          onPaymentSuccess={() => {
            // Handle successful payment
            console.log('Payment successful!');
          }}
        />
      )}
    </div>
  );
}
