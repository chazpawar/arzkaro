import { useState, useEffect } from 'react';
import { Ticket as TicketIcon, MapPin, Calendar, MessageCircle } from 'lucide-react';
import { supabase, Ticket, Event } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type TicketWithEvent = Ticket & {
  events: Event;
};

type MyTicketsPageProps = {
  onEventSelect: (eventId: string) => void;
  onChatOpen: (eventId: string) => void;
};

export default function MyTicketsPage({ onEventSelect, onChatOpen }: MyTicketsPageProps) {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<TicketWithEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadTickets();
    }
  }, [user]);

  const loadTickets = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*, events(*)')
        .eq('user_id', user.id)
        .order('purchased_at', { ascending: false });

      if (error) throw error;
      setTickets((data as TicketWithEvent[]) || []);
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white pt-16 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading your tickets...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-16">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-8">
          <TicketIcon size={32} className="text-gray-900" />
          <h1 className="text-5xl font-bold text-gray-900">My Tickets</h1>
        </div>

        {tickets.length === 0 ? (
          <div className="text-center py-16">
            <TicketIcon size={64} className="mx-auto text-gray-300 mb-4" />
            <p className="text-xl text-gray-600 mb-4">You don't have any tickets yet</p>
            <button
              onClick={() => onEventSelect('')}
              className="bg-gray-900 text-white px-6 py-3 rounded-full hover:bg-gray-800 transition"
            >
              Browse Events
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
                  <div className="md:col-span-2">
                    {ticket.events.image_url ? (
                      <img
                        src={ticket.events.image_url}
                        alt={ticket.events.title}
                        className="w-full h-48 object-cover rounded-lg mb-4"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg mb-4" />
                    )}
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {ticket.events.title}
                    </h3>
                    <p className="text-lg text-gray-600 mb-4">{ticket.events.artist_name}</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-gray-700">
                        <MapPin size={18} />
                        <span>
                          {ticket.events.venue}, {ticket.events.city}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <Calendar size={18} />
                        <span>
                          {new Date(ticket.events.event_date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between">
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <p className="text-sm text-gray-600 mb-1">Ticket Number</p>
                      <p className="font-mono text-sm text-gray-900">
                        {ticket.ticket_number.substring(0, 8)}
                      </p>
                      <p className="text-xs text-gray-500 mt-3">
                        Purchased {new Date(ticket.purchased_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <button
                        onClick={() => onChatOpen(ticket.events.id)}
                        className="w-full bg-gray-900 text-white py-3 rounded-lg hover:bg-gray-800 transition flex items-center justify-center gap-2"
                      >
                        <MessageCircle size={20} />
                        Join Event Chat
                      </button>
                      <button
                        onClick={() => onEventSelect(ticket.events.id)}
                        className="w-full border border-gray-300 text-gray-900 py-3 rounded-lg hover:bg-gray-50 transition"
                      >
                        View Event Details
                      </button>
                    </div>
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
