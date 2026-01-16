import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getHostEvents } from '../services/hostService';
import type { AppEvent } from '../hooks/useEvents';
import type { PageName } from '../types/navigation';
import { ChevronLeft, Plus, Loader2, Calendar, LayoutGrid, LayoutList } from 'lucide-react';

interface MyListingsPageProps {
  onBack: () => void;
  onNavigate: (page: PageName) => void;
  onEventClick: (id: string) => void;
}

export default function MyListingsPage({ onBack, onNavigate, onEventClick }: MyListingsPageProps) {
  const { user } = useAuth();
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  useEffect(() => {
    async function fetchListings() {
      if (!user?.id) return;
      try {
        const data = await getHostEvents(user.id);
        setEvents(data);
      } catch (err) {
        console.error('Error fetching listings:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchListings();
  }, [user?.id]);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full mr-4 transition-colors">
              <ChevronLeft size={24} />
            </button>
            <h1 className="text-xl font-bold text-gray-900">My Listings</h1>
          </div>
          <button 
            onClick={() => onNavigate('create-listing')}
            className="px-4 py-2 bg-[#FF785A] text-white font-bold rounded-full text-sm flex items-center gap-2 hover:shadow-lg transition-all"
          >
            <Plus size={18} />
            Create New
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#FF785A]" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">No listings yet</h2>
            <p className="text-gray-500 mb-8">Ready to host your first experience or trip?</p>
            <button 
              onClick={() => onNavigate('create-listing')}
              className="px-8 py-3 bg-gray-900 text-white font-bold rounded-full hover:bg-black transition-all"
            >
              Get Started
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-500 font-medium">{events.length} total listings</p>
              <div className="flex bg-white rounded-lg border border-gray-200 p-1">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-gray-100 text-gray-900' : 'text-gray-400'}`}
                >
                  <LayoutGrid size={18} />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-gray-100 text-gray-900' : 'text-gray-400'}`}
                >
                  <LayoutList size={18} />
                </button>
              </div>
            </div>

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {events.map((event) => (
                  <div 
                    key={event.id}
                    onClick={() => onEventClick(event.id)}
                    className="bg-white rounded-2xl overflow-hidden border border-gray-200 hover:shadow-xl transition-all cursor-pointer group"
                  >
                    <div className="aspect-video relative overflow-hidden">
                      <img 
                        src={event.cover_image_url || 'https://via.placeholder.com/400x225'} 
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        {event.type}
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 mb-1 truncate">{event.title}</h3>
                      <p className="text-xs text-gray-500 mb-3">{event.category}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-[#FF785A]">₹{event.price}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          event.is_published ? 'bg-green-50 text-green-600' : (event.is_cancelled ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-400')
                        }`}>
                          {event.is_published ? 'PUBLISHED' : (event.is_cancelled ? 'CANCELLED' : 'DRAFT')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Listing</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {events.map((event) => (
                      <tr 
                        key={event.id}
                        onClick={() => onEventClick(event.id)}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <img 
                              src={event.cover_image_url || 'https://via.placeholder.com/100'} 
                              alt={event.title}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                            <div>
                              <div className="font-bold text-gray-900 text-sm">{event.title}</div>
                              <div className="text-xs text-gray-500">{event.category}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-medium text-gray-600 capitalize">{event.type}</span>
                        </td>
                        <td className="px-6 py-4 font-bold text-sm">₹{event.price}</td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            event.is_published ? 'bg-green-50 text-green-600' : (event.is_cancelled ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-400')
                          }`}>
                            {event.is_published ? 'PUBLISHED' : (event.is_cancelled ? 'CANCELLED' : 'DRAFT')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-500">
                          {new Date(event.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
