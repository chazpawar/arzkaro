// src/pages/MyTicketsPage.tsx
import { useState } from 'react';
import { Ticket as TicketIcon, MapPin, Calendar, Search, Clock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTickets } from '../hooks/useTickets';

type MyTicketsPageProps = {
  onEventSelect: (eventId: string) => void;
  onChatOpen: (eventId: string) => void;
  onTicketSelect: (ticketId: string) => void;
  onAuthClick: () => void;
};

type TabType = 'active' | 'used' | 'expired';

export default function MyTicketsPage({
  onEventSelect,
  onTicketSelect,
  onAuthClick,
}: MyTicketsPageProps) {
  const { user } = useAuth();
  const { validTickets, usedTickets, expiredTickets, loading } = useTickets(user?.id);
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [searchQuery, setSearchQuery] = useState('');

  // Guest mode check
  if (!user) {
    return (
      <div className="min-h-screen bg-white pt-24 flex items-center justify-center">
        <div className="text-center px-4">
          <TicketIcon size={64} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Login Required</h2>
          <p className="text-gray-600 mb-6">Please log in to view your tickets</p>
          <button
            onClick={onAuthClick}
            className="px-6 py-3 bg-[#FF785A] text-white font-semibold rounded-xl hover:bg-[#ff6a47] transition-colors"
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#FF785A] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your tickets...</p>
        </div>
      </div>
    );
  }

  // Get current tab tickets
  const getCurrentTickets = () => {
    let tickets = activeTab === 'active' ? validTickets : activeTab === 'used' ? usedTickets : expiredTickets;
    
    // Apply search filter
    if (searchQuery.trim()) {
      tickets = tickets.filter((ticket) =>
        ticket.event?.title?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return tickets;
  };

  const currentTickets = getCurrentTickets();

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

  const formatPrice = (price: number) => {
    if (price === 0) return 'Free';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      valid: { text: 'Active', color: 'bg-green-100 text-green-800' },
      used: { text: 'Used', color: 'bg-gray-100 text-gray-800' },
      expired: { text: 'Expired', color: 'bg-red-100 text-red-800' },
      cancelled: { text: 'Cancelled', color: 'bg-red-100 text-red-800' },
    };
    const badge = badges[status as keyof typeof badges] || badges.valid;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <TicketIcon size={32} className="text-[#FF785A]" />
            <h1 className="text-3xl font-bold text-gray-900">My Tickets</h1>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-3 font-semibold transition-colors relative ${
              activeTab === 'active'
                ? 'text-[#FF785A] border-b-2 border-[#FF785A]'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Active
            {validTickets.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-[#FF785A] text-white text-xs rounded-full">
                {validTickets.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('used')}
            className={`px-4 py-3 font-semibold transition-colors relative ${
              activeTab === 'used'
                ? 'text-[#FF785A] border-b-2 border-[#FF785A]'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Used
            {usedTickets.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-gray-400 text-white text-xs rounded-full">
                {usedTickets.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('expired')}
            className={`px-4 py-3 font-semibold transition-colors relative ${
              activeTab === 'expired'
                ? 'text-[#FF785A] border-b-2 border-[#FF785A]'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Expired
            {expiredTickets.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-gray-400 text-white text-xs rounded-full">
                {expiredTickets.length}
              </span>
            )}
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF785A] focus:border-transparent"
            />
          </div>
        </div>

        {/* Tickets Grid */}
        {currentTickets.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl">
            <TicketIcon size={64} className="mx-auto text-gray-300 mb-4" />
            <p className="text-xl text-gray-600 mb-4">
              {searchQuery.trim()
                ? 'No tickets found matching your search'
                : activeTab === 'active'
                  ? "You don't have any active tickets"
                  : activeTab === 'used'
                    ? "You haven't used any tickets yet"
                    : "You don't have any expired tickets"}
            </p>
            {activeTab === 'active' && !searchQuery.trim() && (
              <button
                onClick={() => onEventSelect('')}
                className="px-6 py-3 bg-[#FF785A] text-white font-semibold rounded-xl hover:bg-[#ff6a47] transition-colors"
              >
                Browse Events
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentTickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => onTicketSelect(ticket.id)}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
              >
                {/* Event Image */}
                <div className="relative h-48 bg-gradient-to-br from-orange-400 to-pink-400">
                  {ticket.event?.cover_image_url ? (
                    <img
                      src={ticket.event.cover_image_url}
                      alt={ticket.event.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl">
                      🎉
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    {getStatusBadge(ticket.status)}
                  </div>
                </div>

                {/* Ticket Details */}
                <div className="p-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                    {ticket.event?.title || 'Event'}
                  </h3>

                  <div className="space-y-2 mb-4">
                    {ticket.event?.start_date && (
                      <>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar size={14} />
                          <span>{formatDate(ticket.event.start_date)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock size={14} />
                          <span>{formatTime(ticket.event.start_date)}</span>
                        </div>
                      </>
                    )}
                    {ticket.event?.location_name && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin size={14} />
                        <span className="truncate">{ticket.event.location_name}</span>
                      </div>
                    )}
                  </div>

                  {/* Ticket Info */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <div>
                      <p className="text-xs text-gray-500">Quantity</p>
                      <p className="font-semibold text-gray-900">{ticket.booking?.quantity || 1}x</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Price</p>
                      <p className="font-semibold text-[#FF785A]">
                        {formatPrice(ticket.booking?.total_amount || 0)}
                      </p>
                    </div>
                  </div>

                  {/* Verification Code Preview */}
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Verification Code</p>
                    <p className="font-mono text-lg font-bold text-gray-900 tracking-wider">
                      {ticket.verification_code}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
