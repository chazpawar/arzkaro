// Placeholder for Supabase types
// This file will contain TypeScript types generated from your Supabase database schema

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: Record<string, never>; // Empty object for now
    Views: Record<string, never>; // Empty object for now
    Functions: Record<string, never>; // Empty object for now
  };
}
