// Supabase Database Types
// Generated from database schema - keep in sync with migrations

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = 'user' | 'host' | 'admin';
export type EventType = 'event' | 'experience' | 'trip';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'refunded';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type TicketStatus = 'valid' | 'used' | 'cancelled' | 'expired';
export type GroupMemberRole = 'member' | 'moderator' | 'host';
export type MessageType = 'text' | 'image' | 'system';
export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected';
export type HostRequestStatus = 'pending' | 'approved' | 'rejected';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          username: string | null;
          bio: string | null;
          avatar_url: string | null;
          phone: string | null;
          role: UserRole;
          is_host_approved: boolean;
          host_requested_at: string | null;
          host_approved_at: string | null;
          is_public: boolean;
          location: string | null;
          website: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          username?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          role?: UserRole;
          is_host_approved?: boolean;
          host_requested_at?: string | null;
          host_approved_at?: string | null;
          is_public?: boolean;
          location?: string | null;
          website?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          username?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          role?: UserRole;
          is_host_approved?: boolean;
          host_requested_at?: string | null;
          host_approved_at?: string | null;
          is_public?: boolean;
          location?: string | null;
          website?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      host_requests: {
        Row: {
          id: string;
          user_id: string;
          reason: string;
          business_name: string | null;
          business_type: string | null;
          status: HostRequestStatus;
          reviewed_by: string | null;
          reviewed_at: string | null;
          admin_notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          reason: string;
          business_name?: string | null;
          business_type?: string | null;
          status?: HostRequestStatus;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          admin_notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          reason?: string;
          business_name?: string | null;
          business_type?: string | null;
          status?: HostRequestStatus;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          admin_notes?: string | null;
          created_at?: string;
        };
      };
      events: {
        Row: {
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
        };
        Insert: {
          id?: string;
          host_id: string;
          type: EventType;
          title: string;
          description?: string | null;
          short_description?: string | null;
          cover_image_url?: string | null;
          images?: string[];
          location_name?: string | null;
          location_address?: string | null;
          location_lat?: number | null;
          location_lng?: number | null;
          start_date: string;
          end_date: string;
          timezone?: string;
          max_capacity?: number | null;
          current_bookings?: number;
          price: number;
          currency?: string;
          is_published?: boolean;
          is_cancelled?: boolean;
          category?: string | null;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          host_id?: string;
          type?: EventType;
          title?: string;
          description?: string | null;
          short_description?: string | null;
          cover_image_url?: string | null;
          images?: string[];
          location_name?: string | null;
          location_address?: string | null;
          location_lat?: number | null;
          location_lng?: number | null;
          start_date?: string;
          end_date?: string;
          timezone?: string;
          max_capacity?: number | null;
          current_bookings?: number;
          price?: number;
          currency?: string;
          is_published?: boolean;
          is_cancelled?: boolean;
          category?: string | null;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      ticket_types: {
        Row: {
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
        };
        Insert: {
          id?: string;
          event_id: string;
          name: string;
          description?: string | null;
          price: number;
          quantity_available: number;
          quantity_sold?: number;
          max_per_order?: number;
          sale_start_date?: string | null;
          sale_end_date?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          name?: string;
          description?: string | null;
          price?: number;
          quantity_available?: number;
          quantity_sold?: number;
          max_per_order?: number;
          sale_start_date?: string | null;
          sale_end_date?: string | null;
          created_at?: string;
        };
      };
      bookings: {
        Row: {
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
        };
        Insert: {
          id?: string;
          user_id: string;
          event_id: string;
          ticket_type_id?: string | null;
          quantity?: number;
          total_amount: number;
          currency?: string;
          status?: BookingStatus;
          payment_intent_id?: string | null;
          payment_status?: PaymentStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          event_id?: string;
          ticket_type_id?: string | null;
          quantity?: number;
          total_amount?: number;
          currency?: string;
          status?: BookingStatus;
          payment_intent_id?: string | null;
          payment_status?: PaymentStatus;
          created_at?: string;
          updated_at?: string;
        };
      };
      tickets: {
        Row: {
          id: string;
          booking_id: string;
          user_id: string;
          event_id: string;
          ticket_type_id: string | null;
          qr_code: string;
          status: TicketStatus;
          checked_in_at: string | null;
          checked_in_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          user_id: string;
          event_id: string;
          ticket_type_id?: string | null;
          qr_code: string;
          status?: TicketStatus;
          checked_in_at?: string | null;
          checked_in_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          user_id?: string;
          event_id?: string;
          ticket_type_id?: string | null;
          qr_code?: string;
          status?: TicketStatus;
          checked_in_at?: string | null;
          checked_in_by?: string | null;
          created_at?: string;
        };
      };
      event_groups: {
        Row: {
          id: string;
          event_id: string;
          name: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          name: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
        };
      };
      group_members: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          role: GroupMemberRole;
          joined_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          user_id: string;
          role?: GroupMemberRole;
          joined_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          user_id?: string;
          role?: GroupMemberRole;
          joined_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          content: string;
          message_type: MessageType;
          is_deleted: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          user_id: string;
          content: string;
          message_type?: MessageType;
          is_deleted?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          user_id?: string;
          content?: string;
          message_type?: MessageType;
          is_deleted?: boolean;
          created_at?: string;
        };
      };
      friend_requests: {
        Row: {
          id: string;
          sender_id: string;
          receiver_id: string;
          status: FriendRequestStatus;
          created_at: string;
          responded_at: string | null;
        };
        Insert: {
          id?: string;
          sender_id: string;
          receiver_id: string;
          status?: FriendRequestStatus;
          created_at?: string;
          responded_at?: string | null;
        };
        Update: {
          id?: string;
          sender_id?: string;
          receiver_id?: string;
          status?: FriendRequestStatus;
          created_at?: string;
          responded_at?: string | null;
        };
      };
      friendships: {
        Row: {
          id: string;
          user_id_1: string;
          user_id_2: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id_1: string;
          user_id_2: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id_1?: string;
          user_id_2?: string;
          created_at?: string;
        };
      };
      dm_conversations: {
        Row: {
          id: string;
          user_id_1: string;
          user_id_2: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id_1: string;
          user_id_2: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id_1?: string;
          user_id_2?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      dm_messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          message_type: MessageType;
          is_read: boolean;
          is_deleted: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          message_type?: MessageType;
          is_read?: boolean;
          is_deleted?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sender_id?: string;
          content?: string;
          message_type?: MessageType;
          is_read?: boolean;
          is_deleted?: boolean;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}

// Helper types for easier access
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
