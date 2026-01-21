// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Missing Supabase credentials in .env file');
  console.warn('Please create .env file with:');
  console.warn('VITE_SUPABASE_URL=your_supabase_url');
  console.warn('VITE_SUPABASE_ANON_KEY=your_supabase_anon_key');
}

// Create client with implicit flow for OAuth (for web apps)
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      // IMPORTANT: Enable auto-detect for implicit flow
      detectSessionInUrl: true,
      // Use implicit flow for web (Supabase handles token exchange automatically)
      flowType: 'implicit',
      // Automatically refresh tokens
      autoRefreshToken: true,
      // Persist session to localStorage
      persistSession: true,
      // Storage key prefix
      storageKey: 'sb-auth-token',
    },
  }
);

console.log('✅ Supabase client initialized with implicit flow');

export type Profile = {
  id: string;
  username?: string | null;
  avatar_url?: string | null;
  email?: string | null;
  bio?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type Event = {
  id: string;
  title: string;
  description: string;
  artist_name: string;
  city: string;
  venue: string;
  event_date: string;
  ticket_price: number;
  image_url: string | null;
  video_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type Ticket = {
  id: string;
  event_id: string;
  user_id: string;
  purchased_at: string;
  ticket_number: string;
};

export type ChatMessage = {
  id: string;
  event_id: string;
  user_id: string;
  message: string;
  created_at: string;
  profiles?: Profile;
};
