// Ticket Types

export type TicketStatus = 'valid' | 'used' | 'cancelled' | 'expired';

export interface Ticket {
  id: string;
  booking_id: string;
  user_id: string;
  event_id: string;
  ticket_type_id: string | null;
  ticket_number: string;
  status: TicketStatus;
  checked_in_at: string | null;
  checked_in_by: string | null;
  created_at: string;
  // Joined fields
  event?: {
    id: string;
    title: string;
    cover_image_url: string | null;
    start_date: string;
    end_date: string;
    location_name: string | null;
    location_address: string | null;
  };
  ticket_type?: {
    id: string;
    name: string;
    description: string | null;
  };
}

export interface TicketWithDetails extends Ticket {
  event: {
    id: string;
    title: string;
    cover_image_url: string | null;
    start_date: string;
    end_date: string;
    location_name: string | null;
    location_address: string | null;
    host: {
      id: string;
      full_name: string | null;
    };
  };
  booking: {
    id: string;
    quantity: number;
    total_amount: number;
  };
}

export interface TicketValidationResult {
  valid: boolean;
  ticket?: Ticket;
  message: string;
}
