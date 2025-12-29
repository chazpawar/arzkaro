export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          created_at: string
          currency: string
          event_id: string
          id: string
          payment_completed_at: string | null
          payment_error: string | null
          payment_intent_id: string | null
          payment_method: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          quantity: number
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          razorpay_signature: string | null
          status: Database["public"]["Enums"]["booking_status"]
          ticket_type_id: string | null
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          event_id: string
          id?: string
          payment_completed_at?: string | null
          payment_error?: string | null
          payment_intent_id?: string | null
          payment_method?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          quantity?: number
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          ticket_type_id?: string | null
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          event_id?: string
          id?: string
          payment_completed_at?: string | null
          payment_error?: string | null
          payment_intent_id?: string | null
          payment_method?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          quantity?: number
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          ticket_type_id?: string | null
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_ticket_type_id_fkey"
            columns: ["ticket_type_id"]
            isOneToOne: false
            referencedRelation: "ticket_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dm_conversations: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          user_id_1: string
          user_id_2: string
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id_1: string
          user_id_2: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id_1?: string
          user_id_2?: string
        }
        Relationships: [
          {
            foreignKeyName: "dm_conversations_user_id_1_fkey"
            columns: ["user_id_1"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dm_conversations_user_id_2_fkey"
            columns: ["user_id_2"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dm_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_deleted: boolean
          is_read: boolean
          message_type: Database["public"]["Enums"]["message_type"]
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_deleted?: boolean
          is_read?: boolean
          message_type?: Database["public"]["Enums"]["message_type"]
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_deleted?: boolean
          is_read?: boolean
          message_type?: Database["public"]["Enums"]["message_type"]
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dm_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "dm_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dm_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_groups: {
        Row: {
          created_at: string
          description: string | null
          event_id: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_id: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          event_id?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_groups_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          cancellation_policy: string | null
          category: string | null
          cover_image_url: string | null
          created_at: string
          currency: string
          current_bookings: number
          departure_location: string | null
          description: string | null
          end_date: string
          host_id: string
          id: string
          images: string[] | null
          is_cancelled: boolean
          is_published: boolean
          itinerary: string | null
          location_address: string | null
          location_lat: number | null
          location_lng: number | null
          location_name: string | null
          max_capacity: number | null
          pickups: string[] | null
          price: number
          short_description: string | null
          start_date: string
          tags: string[] | null
          terms_and_conditions: string | null
          things_to_know: string[] | null
          timezone: string
          title: string
          type: Database["public"]["Enums"]["event_type"]
          updated_at: string
          whats_included: string | null
          whats_not_included: string | null
        }
        Insert: {
          cancellation_policy?: string | null
          category?: string | null
          cover_image_url?: string | null
          created_at?: string
          currency?: string
          current_bookings?: number
          departure_location?: string | null
          description?: string | null
          end_date: string
          host_id: string
          id?: string
          images?: string[] | null
          is_cancelled?: boolean
          is_published?: boolean
          itinerary?: string | null
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          max_capacity?: number | null
          pickups?: string[] | null
          price: number
          short_description?: string | null
          start_date: string
          tags?: string[] | null
          terms_and_conditions?: string | null
          things_to_know?: string[] | null
          timezone?: string
          title: string
          type: Database["public"]["Enums"]["event_type"]
          updated_at?: string
          whats_included?: string | null
          whats_not_included?: string | null
        }
        Update: {
          cancellation_policy?: string | null
          category?: string | null
          cover_image_url?: string | null
          created_at?: string
          currency?: string
          current_bookings?: number
          departure_location?: string | null
          description?: string | null
          end_date?: string
          host_id?: string
          id?: string
          images?: string[] | null
          is_cancelled?: boolean
          is_published?: boolean
          itinerary?: string | null
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          max_capacity?: number | null
          pickups?: string[] | null
          price?: number
          short_description?: string | null
          start_date?: string
          tags?: string[] | null
          terms_and_conditions?: string | null
          things_to_know?: string[] | null
          timezone?: string
          title?: string
          type?: Database["public"]["Enums"]["event_type"]
          updated_at?: string
          whats_included?: string | null
          whats_not_included?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      friend_requests: {
        Row: {
          created_at: string
          id: string
          receiver_id: string
          responded_at: string | null
          sender_id: string
          status: Database["public"]["Enums"]["friend_request_status"]
        }
        Insert: {
          created_at?: string
          id?: string
          receiver_id: string
          responded_at?: string | null
          sender_id: string
          status?: Database["public"]["Enums"]["friend_request_status"]
        }
        Update: {
          created_at?: string
          id?: string
          receiver_id?: string
          responded_at?: string | null
          sender_id?: string
          status?: Database["public"]["Enums"]["friend_request_status"]
        }
        Relationships: [
          {
            foreignKeyName: "friend_requests_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friend_requests_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      friendships: {
        Row: {
          created_at: string
          id: string
          user_id_1: string
          user_id_2: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id_1: string
          user_id_2: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id_1?: string
          user_id_2?: string
        }
        Relationships: [
          {
            foreignKeyName: "friendships_user_id_1_fkey"
            columns: ["user_id_1"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_user_id_2_fkey"
            columns: ["user_id_2"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          last_read_at: string
          role: Database["public"]["Enums"]["group_member_role"]
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          last_read_at?: string
          role?: Database["public"]["Enums"]["group_member_role"]
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          last_read_at?: string
          role?: Database["public"]["Enums"]["group_member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "event_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      host_requests: {
        Row: {
          account_holder_name: string
          account_number: string
          admin_notes: string | null
          beneficiary_name: string
          city: string
          contact_number: string
          created_at: string
          email: string
          gst_certificate_url: string | null
          gstin: string | null
          id: string
          ifsc_code: string
          organizer_name: string
          pan_card_photo_url: string
          pan_number: string
          pin_code: string
          rejection_reason: string | null
          requested_host_type: Database["public"]["Enums"]["host_type"]
          reviewed_at: string | null
          reviewed_by: string | null
          state: string
          status: Database["public"]["Enums"]["host_request_status"]
          street_address: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_holder_name: string
          account_number: string
          admin_notes?: string | null
          beneficiary_name: string
          city: string
          contact_number: string
          created_at?: string
          email: string
          gst_certificate_url?: string | null
          gstin?: string | null
          id?: string
          ifsc_code: string
          organizer_name: string
          pan_card_photo_url: string
          pan_number: string
          pin_code: string
          rejection_reason?: string | null
          requested_host_type: Database["public"]["Enums"]["host_type"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          state: string
          status?: Database["public"]["Enums"]["host_request_status"]
          street_address: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_holder_name?: string
          account_number?: string
          admin_notes?: string | null
          beneficiary_name?: string
          city?: string
          contact_number?: string
          created_at?: string
          email?: string
          gst_certificate_url?: string | null
          gstin?: string | null
          id?: string
          ifsc_code?: string
          organizer_name?: string
          pan_card_photo_url?: string
          pan_number?: string
          pin_code?: string
          rejection_reason?: string | null
          requested_host_type?: Database["public"]["Enums"]["host_type"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          state?: string
          status?: Database["public"]["Enums"]["host_request_status"]
          street_address?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "host_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "host_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          group_id: string
          id: string
          is_deleted: boolean
          message_type: Database["public"]["Enums"]["message_type"]
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          group_id: string
          id?: string
          is_deleted?: boolean
          message_type?: Database["public"]["Enums"]["message_type"]
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          group_id?: string
          id?: string
          is_deleted?: boolean
          message_type?: Database["public"]["Enums"]["message_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "event_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_logs: {
        Row: {
          body: string
          created_at: string
          data: Json | null
          delivered_at: string | null
          error_message: string | null
          expo_push_token: string | null
          expo_receipt_id: string | null
          id: string
          notification_type: string
          sent_at: string | null
          status: string
          title: string | null
          user_id: string | null
        }
        Insert: {
          body: string
          created_at?: string
          data?: Json | null
          delivered_at?: string | null
          error_message?: string | null
          expo_push_token?: string | null
          expo_receipt_id?: string | null
          id?: string
          notification_type: string
          sent_at?: string | null
          status?: string
          title?: string | null
          user_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          data?: Json | null
          delivered_at?: string | null
          error_message?: string | null
          expo_push_token?: string | null
          expo_receipt_id?: string | null
          id?: string
          notification_type?: string
          sent_at?: string | null
          status?: string
          title?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          data: Json | null
          id: string
          message: string
          read: boolean
          read_at: string | null
          related_booking_id: string | null
          related_event_id: string | null
          related_user_id: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          message: string
          read?: boolean
          read_at?: string | null
          related_booking_id?: string | null
          related_event_id?: string | null
          related_user_id?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          message?: string
          read?: boolean
          read_at?: string | null
          related_booking_id?: string | null
          related_event_id?: string | null
          related_user_id?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_related_booking_id_fkey"
            columns: ["related_booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_event_id_fkey"
            columns: ["related_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_user_id_fkey"
            columns: ["related_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_requests: {
        Row: {
          admin_note: string | null
          approved_at: string | null
          approved_by: string | null
          completed_at: string | null
          created_at: string
          currency: string
          earned_amount: number
          host_id: string
          id: string
          processing_started_at: string | null
          rejection_reason: string | null
          request_note: string | null
          requested_amount: number
          status: Database["public"]["Enums"]["payout_request_status"]
          updated_at: string
        }
        Insert: {
          admin_note?: string | null
          approved_at?: string | null
          approved_by?: string | null
          completed_at?: string | null
          created_at?: string
          currency?: string
          earned_amount: number
          host_id: string
          id?: string
          processing_started_at?: string | null
          rejection_reason?: string | null
          request_note?: string | null
          requested_amount: number
          status?: Database["public"]["Enums"]["payout_request_status"]
          updated_at?: string
        }
        Update: {
          admin_note?: string | null
          approved_at?: string | null
          approved_by?: string | null
          completed_at?: string | null
          created_at?: string
          currency?: string
          earned_amount?: number
          host_id?: string
          id?: string
          processing_started_at?: string | null
          rejection_reason?: string | null
          request_note?: string | null
          requested_amount?: number
          status?: Database["public"]["Enums"]["payout_request_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payout_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_requests_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          date_of_birth: string | null
          email: string
          full_name: string | null
          gender: string | null
          host_approved_at: string | null
          host_requested_at: string | null
          host_type: Database["public"]["Enums"]["host_type"] | null
          id: string
          instagram: string | null
          interests: string[] | null
          is_host_approved: boolean
          is_public: boolean
          linkedin: string | null
          location: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          twitter: string | null
          updated_at: string
          username: string | null
          website: string | null
          youtube: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          date_of_birth?: string | null
          email: string
          full_name?: string | null
          gender?: string | null
          host_approved_at?: string | null
          host_requested_at?: string | null
          host_type?: Database["public"]["Enums"]["host_type"] | null
          id: string
          instagram?: string | null
          interests?: string[] | null
          is_host_approved?: boolean
          is_public?: boolean
          linkedin?: string | null
          location?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          twitter?: string | null
          updated_at?: string
          username?: string | null
          website?: string | null
          youtube?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string
          full_name?: string | null
          gender?: string | null
          host_approved_at?: string | null
          host_requested_at?: string | null
          host_type?: Database["public"]["Enums"]["host_type"] | null
          id?: string
          instagram?: string | null
          interests?: string[] | null
          is_host_approved?: boolean
          is_public?: boolean
          linkedin?: string | null
          location?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          twitter?: string | null
          updated_at?: string
          username?: string | null
          website?: string | null
          youtube?: string | null
        }
        Relationships: []
      }
      push_tokens: {
        Row: {
          app_version: string | null
          created_at: string
          device_id: string | null
          device_name: string | null
          expo_push_token: string
          id: string
          last_used_at: string
          platform: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          app_version?: string | null
          created_at?: string
          device_id?: string | null
          device_name?: string | null
          expo_push_token: string
          id?: string
          last_used_at?: string
          platform?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          app_version?: string | null
          created_at?: string
          device_id?: string | null
          device_name?: string | null
          expo_push_token?: string
          id?: string
          last_used_at?: string
          platform?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_types: {
        Row: {
          created_at: string
          description: string | null
          event_id: string
          id: string
          max_per_order: number
          name: string
          price: number
          quantity_available: number
          quantity_sold: number
          sale_end_date: string | null
          sale_start_date: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_id: string
          id?: string
          max_per_order?: number
          name: string
          price: number
          quantity_available: number
          quantity_sold?: number
          sale_end_date?: string | null
          sale_start_date?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          event_id?: string
          id?: string
          max_per_order?: number
          name?: string
          price?: number
          quantity_available?: number
          quantity_sold?: number
          sale_end_date?: string | null
          sale_start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_types_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          booking_id: string
          checked_in_at: string | null
          checked_in_by: string | null
          created_at: string
          event_id: string
          id: string
          status: Database["public"]["Enums"]["ticket_status"]
          ticket_type_id: string | null
          user_id: string
          verification_code: string
        }
        Insert: {
          booking_id: string
          checked_in_at?: string | null
          checked_in_by?: string | null
          created_at?: string
          event_id: string
          id?: string
          status?: Database["public"]["Enums"]["ticket_status"]
          ticket_type_id?: string | null
          user_id: string
          verification_code: string
        }
        Update: {
          booking_id?: string
          checked_in_at?: string | null
          checked_in_by?: string | null
          created_at?: string
          event_id?: string
          id?: string
          status?: Database["public"]["Enums"]["ticket_status"]
          ticket_type_id?: string | null
          user_id?: string
          verification_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_checked_in_by_fkey"
            columns: ["checked_in_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_ticket_type_id_fkey"
            columns: ["ticket_type_id"]
            isOneToOne: false
            referencedRelation: "ticket_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_host_request: {
        Args: {
          p_admin_id: string
          p_admin_notes?: string
          p_request_id: string
        }
        Returns: {
          message: string
          success: boolean
        }[]
      }
      can_user_create_event_type: {
        Args: {
          p_event_type: Database["public"]["Enums"]["event_type"]
          p_user_id: string
        }
        Returns: boolean
      }
      cleanup_inactive_push_tokens: { Args: never; Returns: number }
      create_event_reminders: { Args: never; Returns: undefined }
      create_pending_booking: {
        Args: {
          p_booking_id: string
          p_event_id: string
          p_quantity: number
          p_total_amount: number
          p_user_id: string
        }
        Returns: string
      }
      delete_expired_event_groups: { Args: never; Returns: number }
      generate_unique_verification_code: { Args: never; Returns: string }
      get_event_for_payment: {
        Args: { event_uuid: string }
        Returns: {
          host_id: string
          id: string
          price: number
          title: string
        }[]
      }
      get_host_available_balance: {
        Args: { p_host_id: string }
        Returns: number
      }
      get_host_completed_payouts: {
        Args: { p_host_id: string }
        Returns: number
      }
      get_host_pending_payouts: { Args: { p_host_id: string }; Returns: number }
      get_host_total_earnings: { Args: { p_host_id: string }; Returns: number }
      get_pending_host_requests_count: { Args: never; Returns: number }
      get_unread_count: {
        Args: { p_group_id: string; p_user_id: string }
        Returns: number
      }
      get_user_push_tokens: {
        Args: { p_user_id: string }
        Returns: {
          app_version: string | null
          created_at: string
          device_id: string | null
          device_name: string | null
          expo_push_token: string
          id: string
          last_used_at: string
          platform: string | null
          updated_at: string
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "push_tokens"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      is_admin: { Args: never; Returns: boolean }
      is_host_or_admin: { Args: never; Returns: boolean }
      mark_group_as_read: {
        Args: { p_group_id: string; p_user_id: string }
        Returns: undefined
      }
      reject_host_request: {
        Args: {
          p_admin_id: string
          p_admin_notes?: string
          p_rejection_reason: string
          p_request_id: string
        }
        Returns: {
          message: string
          success: boolean
        }[]
      }
      upsert_push_token: {
        Args: {
          p_app_version?: string
          p_device_id?: string
          p_device_name?: string
          p_expo_push_token: string
          p_platform?: string
          p_user_id: string
        }
        Returns: {
          app_version: string | null
          created_at: string
          device_id: string | null
          device_name: string | null
          expo_push_token: string
          id: string
          last_used_at: string
          platform: string | null
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "push_tokens"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      booking_status: "pending" | "confirmed" | "cancelled" | "refunded"
      event_type: "event" | "experience" | "trip"
      friend_request_status: "pending" | "accepted" | "rejected"
      group_member_role: "member" | "moderator" | "host"
      host_request_status: "pending" | "approved" | "rejected"
      host_type: "full" | "activity"
      message_type: "text" | "image" | "system"
      notification_type:
        | "friend_request_accepted"
        | "event_reminder"
        | "booking_confirmed"
        | "event_cancelled"
        | "event_updated"
        | "new_message"
        | "payout_completed"
      payment_status: "pending" | "completed" | "failed" | "refunded"
      payout_request_status:
        | "pending"
        | "approved"
        | "rejected"
        | "processing"
        | "completed"
      ticket_status: "valid" | "used" | "cancelled" | "expired"
      user_role: "user" | "host" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      booking_status: ["pending", "confirmed", "cancelled", "refunded"],
      event_type: ["event", "experience", "trip"],
      friend_request_status: ["pending", "accepted", "rejected"],
      group_member_role: ["member", "moderator", "host"],
      host_request_status: ["pending", "approved", "rejected"],
      host_type: ["full", "activity"],
      message_type: ["text", "image", "system"],
      notification_type: [
        "friend_request_accepted",
        "event_reminder",
        "booking_confirmed",
        "event_cancelled",
        "event_updated",
        "new_message",
        "payout_completed",
      ],
      payment_status: ["pending", "completed", "failed", "refunded"],
      payout_request_status: [
        "pending",
        "approved",
        "rejected",
        "processing",
        "completed",
      ],
      ticket_status: ["valid", "used", "cancelled", "expired"],
      user_role: ["user", "host", "admin"],
    },
  },
} as const
