// =============================================
// Supabase Edge Function: Create Event Reminders
// Purpose: Creates notifications 24h before events start
// Schedule: Run hourly via cron job
// =============================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// =============================================
// Main Handler
// =============================================

serve(async (req) => {
  try {
    console.log('[create-event-reminders] Starting event reminders job');

    // Verify authorization (allow cron jobs and service calls)
    const authHeader = req.headers.get('Authorization');
    const cronSecret = Deno.env.get('CRON_SECRET');

    // Allow requests with valid Authorization header or correct cron secret
    if (!authHeader && cronSecret) {
      const providedSecret = req.headers.get('X-Cron-Secret');
      if (providedSecret !== cronSecret) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Call the create_event_reminders function
    const { data, error } = await supabase.rpc('create_event_reminders');

    if (error) {
      console.error('[create-event-reminders] Error calling function:', error);
      throw error;
    }

    console.log('[create-event-reminders] Reminders created:', data);

    return new Response(
      JSON.stringify({
        success: true,
        remindersCreated: data || 0,
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[create-event-reminders] Error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        timestamp: new Date().toISOString(),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
