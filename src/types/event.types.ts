// Event Types

export type EventType = 'event' | 'experience' | 'trip';

export interface Event {
  id: string;
  host_id: string;
  type: EventType;
  title: string;
  description: string | null;
  short_description: string | null;
  cover_image_url: string | null;
  images: string[];
  location_name: string | null;
  location_address: string | null;
  location_lat: number | null;
  location_lng: number | null;
  start_date: string;
  end_date: string;
  timezone: string;
  max_capacity: number | null;
  current_bookings: number;
  price: number;
  currency: string;
  is_published: boolean;
  is_cancelled: boolean;
  category: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  // Joined fields
  host?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface CreateEvent {
  type: EventType;
  title: string;
  description?: string;
  short_description?: string;
  cover_image_url?: string;
  images?: string[];
  location_name?: string;
  location_address?: string;
  location_lat?: number;
  location_lng?: number;
  start_date: string;
  end_date: string;
  timezone?: string;
  max_capacity?: number;
  price: number;
  currency?: string;
  category?: string;
  tags?: string[];
}

export interface UpdateEvent extends Partial<CreateEvent> {
  is_published?: boolean;
  is_cancelled?: boolean;
}

export interface TicketType {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  price: number;
  quantity_available: number;
  quantity_sold: number;
  max_per_order: number;
  sale_start_date: string | null;
  sale_end_date: string | null;
  created_at: string;
}

export interface CreateTicketType {
  name: string;
  description?: string;
  price: number;
  quantity_available: number;
  max_per_order?: number;
  sale_start_date?: string;
  sale_end_date?: string;
}

export interface EventFilters {
  type?: EventType;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  startDate?: string;
  endDate?: string;
  location?: string;
  search?: string;
}
