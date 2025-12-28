export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '13.0.5';
  };
  public: {
    Tables: {
      bookings: {
        Row: {
          created_at: string;
          currency: string;
          event_id: string;
          id: string;
          payment_completed_at: string | null;
          payment_error: string | null;
          payment_intent_id: string | null;
          payment_method: string | null;
          payment_status: Database['public']['Enums']['payment_status'];
          quantity: number;
          razorpay_order_id: string | null;
          razorpay_payment_id: string | null;
          razorpay_signature: string | null;
          status: Database['public']['Enums']['booking_status'];
          ticket_type_id: string | null;
          total_amount: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          currency?: string;
          event_id: string;
          id?: string;
          payment_completed_at?: string | null;
          payment_error?: string | null;
          payment_intent_id?: string | null;
          payment_method?: string | null;
          payment_status?: Database['public']['Enums']['payment_status'];
          quantity?: number;
          razorpay_order_id?: string | null;
          razorpay_payment_id?: string | null;
          razorpay_signature?: string | null;
          status?: Database['public']['Enums']['booking_status'];
          ticket_type_id?: string | null;
          total_amount: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          currency?: string;
          event_id?: string;
          id?: string;
          payment_completed_at?: string | null;
          payment_error?: string | null;
          payment_intent_id?: string | null;
          payment_method?: string | null;
          payment_status?: Database['public']['Enums']['payment_status'];
          quantity?: number;
          razorpay_order_id?: string | null;
          razorpay_payment_id?: string | null;
          razorpay_signature?: string | null;
          status?: Database['public']['Enums']['booking_status'];
          ticket_type_id?: string | null;
          total_amount?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'bookings_event_id_fkey';
            columns: ['event_id'];
            isOneToOne: false;
            referencedRelation: 'events';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bookings_ticket_type_id_fkey';
            columns: ['ticket_type_id'];
            isOneToOne: false;
            referencedRelation: 'ticket_types';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bookings_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      dm_conversations: {
        Row: {
          created_at: string;
          id: string;
          updated_at: string;
          user_id_1: string;
          user_id_2: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          updated_at?: string;
          user_id_1: string;
          user_id_2: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          updated_at?: string;
          user_id_1?: string;
          user_id_2?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'dm_conversations_user_id_1_fkey';
            columns: ['user_id_1'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'dm_conversations_user_id_2_fkey';
            columns: ['user_id_2'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      dm_messages: {
        Row: {
          content: string;
          conversation_id: string;
          created_at: string;
          id: string;
          is_deleted: boolean;
          is_read: boolean;
          message_type: Database['public']['Enums']['message_type'];
          sender_id: string;
        };
        Insert: {
          content: string;
          conversation_id: string;
          created_at?: string;
          id?: string;
          is_deleted?: boolean;
          is_read?: boolean;
          message_type?: Database['public']['Enums']['message_type'];
          sender_id: string;
        };
        Update: {
          content?: string;
          conversation_id?: string;
          created_at?: string;
          id?: string;
          is_deleted?: boolean;
          is_read?: boolean;
          message_type?: Database['public']['Enums']['message_type'];
          sender_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'dm_messages_conversation_id_fkey';
            columns: ['conversation_id'];
            isOneToOne: false;
            referencedRelation: 'dm_conversations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'dm_messages_sender_id_fkey';
            columns: ['sender_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      event_groups: {
        Row: {
          created_at: string;
          description: string | null;
          event_id: string;
          id: string;
          name: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          event_id: string;
          id?: string;
          name: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          event_id?: string;
          id?: string;
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'event_groups_event_id_fkey';
            columns: ['event_id'];
            isOneToOne: false;
            referencedRelation: 'events';
            referencedColumns: ['id'];
          },
        ];
      };
      events: {
        Row: {
          category: string | null;
          cover_image_url: string | null;
          created_at: string;
          currency: string;
          current_bookings: number;
          departure_location: string | null;
          description: string | null;
          end_date: string;
          host_id: string;
          id: string;
          images: string[] | null;
          is_cancelled: boolean;
          is_published: boolean;
          itinerary: string | null;
          location_address: string | null;
          location_lat: number | null;
          location_lng: number | null;
          location_name: string | null;
          max_capacity: number | null;
          pickups: string[] | null;
          price: number;
          short_description: string | null;
          start_date: string;
          tags: string[] | null;
          terms_and_conditions: string | null;
          timezone: string;
          title: string;
          type: Database['public']['Enums']['event_type'];
          updated_at: string;
          whats_included: string | null;
          whats_not_included: string | null;
        };
        Insert: {
          category?: string | null;
          cover_image_url?: string | null;
          created_at?: string;
          currency?: string;
          current_bookings?: number;
          departure_location?: string | null;
          description?: string | null;
          end_date: string;
          host_id: string;
          id?: string;
          images?: string[] | null;
          is_cancelled?: boolean;
          is_published?: boolean;
          itinerary?: string | null;
          location_address?: string | null;
          location_lat?: number | null;
          location_lng?: number | null;
          location_name?: string | null;
          max_capacity?: number | null;
          pickups?: string[] | null;
          price: number;
          short_description?: string | null;
          start_date: string;
          tags?: string[] | null;
          terms_and_conditions?: string | null;
          timezone?: string;
          title: string;
          type: Database['public']['Enums']['event_type'];
          updated_at?: string;
          whats_included?: string | null;
          whats_not_included?: string | null;
        };
        Update: {
          category?: string | null;
          cover_image_url?: string | null;
          created_at?: string;
          currency?: string;
          current_bookings?: number;
          departure_location?: string | null;
          description?: string | null;
          end_date?: string;
          host_id?: string;
          id?: string;
          images?: string[] | null;
          is_cancelled?: boolean;
          is_published?: boolean;
          itinerary?: string | null;
          location_address?: string | null;
          location_lat?: number | null;
          location_lng?: number | null;
          location_name?: string | null;
          max_capacity?: number | null;
          pickups?: string[] | null;
          price?: number;
          short_description?: string | null;
          start_date?: string;
          tags?: string[] | null;
          terms_and_conditions?: string | null;
          timezone?: string;
          title?: string;
          type?: Database['public']['Enums']['event_type'];
          updated_at?: string;
          whats_included?: string | null;
          whats_not_included?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'events_host_id_fkey';
            columns: ['host_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      friend_requests: {
        Row: {
          created_at: string;
          id: string;
          receiver_id: string;
          responded_at: string | null;
          sender_id: string;
          status: Database['public']['Enums']['friend_request_status'];
        };
        Insert: {
          created_at?: string;
          id?: string;
          receiver_id: string;
          responded_at?: string | null;
          sender_id: string;
          status?: Database['public']['Enums']['friend_request_status'];
        };
        Update: {
          created_at?: string;
          id?: string;
          receiver_id?: string;
          responded_at?: string | null;
          sender_id?: string;
          status?: Database['public']['Enums']['friend_request_status'];
        };
        Relationships: [
          {
            foreignKeyName: 'friend_requests_receiver_id_fkey';
            columns: ['receiver_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'friend_requests_sender_id_fkey';
            columns: ['sender_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      friendships: {
        Row: {
          created_at: string;
          id: string;
          user_id_1: string;
          user_id_2: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          user_id_1: string;
          user_id_2: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          user_id_1?: string;
          user_id_2?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'friendships_user_id_1_fkey';
            columns: ['user_id_1'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'friendships_user_id_2_fkey';
            columns: ['user_id_2'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      group_members: {
        Row: {
          group_id: string;
          id: string;
          joined_at: string;
          last_read_at: string;
          role: Database['public']['Enums']['group_member_role'];
          user_id: string;
        };
        Insert: {
          group_id: string;
          id?: string;
          joined_at?: string;
          last_read_at?: string;
          role?: Database['public']['Enums']['group_member_role'];
          user_id: string;
        };
        Update: {
          group_id?: string;
          id?: string;
          joined_at?: string;
          last_read_at?: string;
          role?: Database['public']['Enums']['group_member_role'];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'group_members_group_id_fkey';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'event_groups';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'group_members_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      host_balances: {
        Row: {
          available_balance: number | null;
          created_at: string;
          host_id: string;
          id: string;
          total_revenue: number;
          total_withdrawn: number;
          updated_at: string;
        };
        Insert: {
          available_balance?: number | null;
          created_at?: string;
          host_id: string;
          id?: string;
          total_revenue?: number;
          total_withdrawn?: number;
          updated_at?: string;
        };
        Update: {
          available_balance?: number | null;
          created_at?: string;
          host_id?: string;
          id?: string;
          total_revenue?: number;
          total_withdrawn?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      host_requests: {
        Row: {
          account_holder_name: string;
          account_number: string;
          admin_notes: string | null;
          beneficiary_name: string;
          city: string;
          contact_number: string;
          created_at: string;
          email: string;
          gst_certificate_url: string | null;
          gstin: string | null;
          id: string;
          ifsc_code: string;
          organizer_name: string;
          pan_card_photo_url: string;
          pan_number: string;
          pin_code: string;
          rejection_reason: string | null;
          requested_host_type: Database['public']['Enums']['host_type'];
          reviewed_at: string | null;
          reviewed_by: string | null;
          state: string;
          status: Database['public']['Enums']['host_request_status'];
          street_address: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          account_holder_name: string;
          account_number: string;
          admin_notes?: string | null;
          beneficiary_name: string;
          city: string;
          contact_number: string;
          created_at?: string;
          email: string;
          gst_certificate_url?: string | null;
          gstin?: string | null;
          id?: string;
          ifsc_code: string;
          organizer_name: string;
          pan_card_photo_url: string;
          pan_number: string;
          pin_code: string;
          rejection_reason?: string | null;
          requested_host_type: Database['public']['Enums']['host_type'];
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          state: string;
          status?: Database['public']['Enums']['host_request_status'];
          street_address: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          account_holder_name?: string;
          account_number?: string;
          admin_notes?: string | null;
          beneficiary_name?: string;
          city?: string;
          contact_number?: string;
          created_at?: string;
          email?: string;
          gst_certificate_url?: string | null;
          gstin?: string | null;
          id?: string;
          ifsc_code?: string;
          organizer_name?: string;
          pan_card_photo_url?: string;
          pan_number?: string;
          pin_code?: string;
          rejection_reason?: string | null;
          requested_host_type?: Database['public']['Enums']['host_type'];
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          state?: string;
          status?: Database['public']['Enums']['host_request_status'];
          street_address?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'host_requests_reviewed_by_fkey';
            columns: ['reviewed_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'host_requests_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      messages: {
        Row: {
          content: string;
          created_at: string;
          group_id: string;
          id: string;
          is_deleted: boolean;
          message_type: Database['public']['Enums']['message_type'];
          user_id: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          group_id: string;
          id?: string;
          is_deleted?: boolean;
          message_type?: Database['public']['Enums']['message_type'];
          user_id: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          group_id?: string;
          id?: string;
          is_deleted?: boolean;
          message_type?: Database['public']['Enums']['message_type'];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'messages_group_id_fkey';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'event_groups';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'messages_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          date_of_birth: string | null;
          email: string;
          full_name: string | null;
          gender: string | null;
          host_approved_at: string | null;
          host_requested_at: string | null;
          host_type: Database['public']['Enums']['host_type'] | null;
          id: string;
          instagram: string | null;
          interests: string[] | null;
          is_host_approved: boolean;
          is_public: boolean;
          linkedin: string | null;
          location: string | null;
          phone: string | null;
          role: Database['public']['Enums']['user_role'];
          twitter: string | null;
          updated_at: string;
          username: string | null;
          website: string | null;
          youtube: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          date_of_birth?: string | null;
          email: string;
          full_name?: string | null;
          gender?: string | null;
          host_approved_at?: string | null;
          host_requested_at?: string | null;
          host_type?: Database['public']['Enums']['host_type'] | null;
          id: string;
          instagram?: string | null;
          interests?: string[] | null;
          is_host_approved?: boolean;
          is_public?: boolean;
          linkedin?: string | null;
          location?: string | null;
          phone?: string | null;
          role?: Database['public']['Enums']['user_role'];
          twitter?: string | null;
          updated_at?: string;
          username?: string | null;
          website?: string | null;
          youtube?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          date_of_birth?: string | null;
          email?: string;
          full_name?: string | null;
          gender?: string | null;
          host_approved_at?: string | null;
          host_requested_at?: string | null;
          host_type?: Database['public']['Enums']['host_type'] | null;
          id?: string;
          instagram?: string | null;
          interests?: string[] | null;
          is_host_approved?: boolean;
          is_public?: boolean;
          linkedin?: string | null;
          location?: string | null;
          phone?: string | null;
          role?: Database['public']['Enums']['user_role'];
          twitter?: string | null;
          updated_at?: string;
          username?: string | null;
          website?: string | null;
          youtube?: string | null;
        };
        Relationships: [];
      };
      payout_requests: {
        Row: {
          admin_note: string | null;
          approved_at: string | null;
          approved_by: string | null;
          completed_at: string | null;
          created_at: string;
          currency: string;
          earned_amount: number;
          host_id: string;
          id: string;
          processing_started_at: string | null;
          rejection_reason: string | null;
          request_note: string | null;
          requested_amount: number;
          status: Database['public']['Enums']['payout_request_status'];
          updated_at: string;
        };
        Insert: {
          admin_note?: string | null;
          approved_at?: string | null;
          approved_by?: string | null;
          completed_at?: string | null;
          created_at?: string;
          currency?: string;
          earned_amount: number;
          host_id: string;
          id?: string;
          processing_started_at?: string | null;
          rejection_reason?: string | null;
          request_note?: string | null;
          requested_amount: number;
          status?: Database['public']['Enums']['payout_request_status'];
          updated_at?: string;
        };
        Update: {
          admin_note?: string | null;
          approved_at?: string | null;
          approved_by?: string | null;
          completed_at?: string | null;
          created_at?: string;
          currency?: string;
          earned_amount?: number;
          host_id?: string;
          id?: string;
          processing_started_at?: string | null;
          rejection_reason?: string | null;
          request_note?: string | null;
          requested_amount?: number;
          status?: Database['public']['Enums']['payout_request_status'];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'payout_requests_approved_by_fkey';
            columns: ['approved_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'payout_requests_host_id_fkey';
            columns: ['host_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      ticket_types: {
        Row: {
          created_at: string;
          description: string | null;
          event_id: string;
          id: string;
          max_per_order: number;
          name: string;
          price: number;
          quantity_available: number;
          quantity_sold: number;
          sale_end_date: string | null;
          sale_start_date: string | null;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          event_id: string;
          id?: string;
          max_per_order?: number;
          name: string;
          price: number;
          quantity_available: number;
          quantity_sold?: number;
          sale_end_date?: string | null;
          sale_start_date?: string | null;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          event_id?: string;
          id?: string;
          max_per_order?: number;
          name?: string;
          price?: number;
          quantity_available?: number;
          quantity_sold?: number;
          sale_end_date?: string | null;
          sale_start_date?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'ticket_types_event_id_fkey';
            columns: ['event_id'];
            isOneToOne: false;
            referencedRelation: 'events';
            referencedColumns: ['id'];
          },
        ];
      };
      tickets: {
        Row: {
          booking_id: string;
          checked_in_at: string | null;
          checked_in_by: string | null;
          created_at: string;
          event_id: string;
          id: string;
          qr_code: string | null;
          status: Database['public']['Enums']['ticket_status'];
          ticket_type_id: string | null;
          user_id: string;
        };
        Insert: {
          booking_id: string;
          checked_in_at?: string | null;
          checked_in_by?: string | null;
          created_at?: string;
          event_id: string;
          id?: string;
          qr_code?: string | null;
          status?: Database['public']['Enums']['ticket_status'];
          ticket_type_id?: string | null;
          user_id: string;
        };
        Update: {
          booking_id?: string;
          checked_in_at?: string | null;
          checked_in_by?: string | null;
          created_at?: string;
          event_id?: string;
          id?: string;
          qr_code?: string | null;
          status?: Database['public']['Enums']['ticket_status'];
          ticket_type_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'tickets_booking_id_fkey';
            columns: ['booking_id'];
            isOneToOne: false;
            referencedRelation: 'bookings';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tickets_checked_in_by_fkey';
            columns: ['checked_in_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tickets_event_id_fkey';
            columns: ['event_id'];
            isOneToOne: false;
            referencedRelation: 'events';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tickets_ticket_type_id_fkey';
            columns: ['ticket_type_id'];
            isOneToOne: false;
            referencedRelation: 'ticket_types';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tickets_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      withdrawal_requests: {
        Row: {
          account_holder_name: string | null;
          account_number: string | null;
          admin_notes: string | null;
          amount: number;
          bank_name: string | null;
          created_at: string;
          host_id: string;
          id: string;
          ifsc_code: string | null;
          requested_at: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
          status: string;
          updated_at: string;
          upi_id: string | null;
        };
        Insert: {
          account_holder_name?: string | null;
          account_number?: string | null;
          admin_notes?: string | null;
          amount: number;
          bank_name?: string | null;
          created_at?: string;
          host_id: string;
          id?: string;
          ifsc_code?: string | null;
          requested_at?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: string;
          updated_at?: string;
          upi_id?: string | null;
        };
        Update: {
          account_holder_name?: string | null;
          account_number?: string | null;
          admin_notes?: string | null;
          amount?: number;
          bank_name?: string | null;
          created_at?: string;
          host_id?: string;
          id?: string;
          ifsc_code?: string | null;
          requested_at?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: string;
          updated_at?: string;
          upi_id?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      approve_host_request: {
        Args: {
          p_admin_id: string;
          p_admin_notes?: string;
          p_request_id: string;
        };
        Returns: {
          message: string;
          success: boolean;
        }[];
      };
      approve_withdrawal_request: {
        Args: {
          p_admin_id: string;
          p_admin_notes?: string;
          p_request_id: string;
        };
        Returns: boolean;
      };
      can_user_create_event_type: {
        Args: {
          p_event_type: Database['public']['Enums']['event_type'];
          p_user_id: string;
        };
        Returns: boolean;
      };
      create_pending_booking: {
        Args: {
          p_booking_id: string;
          p_event_id: string;
          p_quantity: number;
          p_total_amount: number;
          p_user_id: string;
        };
        Returns: string;
      };
      create_withdrawal_request: {
        Args: { p_amount: number; p_host_id: string };
        Returns: string;
      };
      delete_expired_event_groups: { Args: never; Returns: number };
      generate_unique_verification_code: { Args: never; Returns: string };
      get_admin_withdrawal_stats: { Args: never; Returns: Json };
      get_event_for_payment: {
        Args: { event_uuid: string };
        Returns: {
          host_id: string;
          id: string;
          price: number;
          title: string;
        }[];
      };
      get_host_available_balance: {
        Args: { p_host_id: string };
        Returns: number;
      };
      get_host_withdrawal_stats: { Args: { p_host_id: string }; Returns: Json };
      get_pending_host_requests_count: { Args: never; Returns: number };
      get_unread_count: {
        Args: { p_group_id: string; p_user_id: string };
        Returns: number;
      };
      is_admin: { Args: never; Returns: boolean };
      is_host_or_admin: { Args: never; Returns: boolean };
      mark_group_as_read: {
        Args: { p_group_id: string; p_user_id: string };
        Returns: undefined;
      };
      reject_host_request: {
        Args: {
          p_admin_id: string;
          p_admin_notes?: string;
          p_rejection_reason: string;
          p_request_id: string;
        };
        Returns: {
          message: string;
          success: boolean;
        }[];
      };
      reject_withdrawal_request: {
        Args: {
          p_admin_id: string;
          p_admin_notes: string;
          p_request_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      booking_status: 'pending' | 'confirmed' | 'cancelled' | 'refunded';
      event_type: 'event' | 'experience' | 'trip';
      friend_request_status: 'pending' | 'accepted' | 'rejected';
      group_member_role: 'member' | 'moderator' | 'host';
      host_request_status: 'pending' | 'approved' | 'rejected';
      host_type: 'full' | 'activity';
      message_type: 'text' | 'image' | 'system';
      payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
      payout_request_status: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed';
      ticket_status: 'valid' | 'used' | 'cancelled' | 'expired';
      user_role: 'user' | 'host' | 'admin';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      booking_status: ['pending', 'confirmed', 'cancelled', 'refunded'],
      event_type: ['event', 'experience', 'trip'],
      friend_request_status: ['pending', 'accepted', 'rejected'],
      group_member_role: ['member', 'moderator', 'host'],
      host_request_status: ['pending', 'approved', 'rejected'],
      host_type: ['full', 'activity'],
      message_type: ['text', 'image', 'system'],
      payment_status: ['pending', 'completed', 'failed', 'refunded'],
      ticket_status: ['valid', 'used', 'cancelled', 'expired'],
      user_role: ['user', 'host', 'admin'],
    },
  },
} as const;
