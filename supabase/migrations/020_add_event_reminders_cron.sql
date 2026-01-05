-- =====================================================
-- Migration: Setup Event Reminders Cron Job
-- Description: Sets up hourly cron job for event reminders
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create the cron job to run hourly
SELECT cron.schedule(
  'create-event-reminders-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://rsyuknfgziydxtvmidgd.supabase.co/functions/v1/create-event-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Add documentation comment
COMMENT ON FUNCTION create_event_reminders() IS 
'Creates event reminder notifications for all bookings where the event starts in 24 hours. 
Called hourly via cron job. Returns the number of reminders created.';

-- Verification queries (commented out):
-- SELECT * FROM cron.job WHERE jobname = 'create-event-reminders-hourly';
-- SELECT create_event_reminders(); -- Manual trigger for testing
-- SELECT cron.unschedule('create-event-reminders-hourly'); -- To remove
