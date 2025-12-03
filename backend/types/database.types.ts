// Placeholder for Supabase types
// This file will contain TypeScript types generated from your Supabase database schema

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            // Your tables will be defined here
        }
        Views: {
            // Your views will be defined here
        }
        Functions: {
            // Your functions will be defined here
        }
    }
}
