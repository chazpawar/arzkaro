// Booking Types

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'refunded';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface Booking {
  id: string;
  user_id: string;
  event_id: string;
  ticket_type_id: string | null;
  quantity: number;
  total_amount: number;
  currency: string;
  status: BookingStatus;
  payment_intent_id: string | null;
  payment_status: PaymentStatus;
  created_at: string;
  updated_at: string;
  // Joined fields
  event?: {
    id: string;
    title: string;
    cover_image_url: string | null;
    start_date: string;
    end_date: string;
    location_name: string | null;
  };
  ticket_type?: {
    id: string;
    name: string;
    description?: string | null;
  } | null;
}

export interface CreateBooking {
  event_id: string;
  ticket_type_id?: string;
  quantity: number;
}

export interface BookingWithDetails extends Omit<Booking, 'event' | 'ticket_type'> {
  event: {
    id: string;
    title: string;
    cover_image_url: string | null;
    start_date: string;
    end_date: string;
    location_name: string | null;
    location_address: string | null;
    host?: {
      id: string;
      full_name: string | null;
    };
  };
  ticket_type: {
    id: string;
    name: string;
    description: string | null;
  } | null;
}
