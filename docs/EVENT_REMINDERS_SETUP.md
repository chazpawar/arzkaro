# Setting Up Event Reminders Cron Job

## Overview
The event reminders system creates notifications for users 24 hours before their booked events start.

## Architecture
- **Database Function:** `create_event_reminders()` - Creates notifications in batch
- **Edge Function:** `create-event-reminders` - Calls the database function
- **Cron Job:** Runs the edge function every hour

## Setup Instructions

### 1. Deploy the Edge Function

First, deploy the edge function to Supabase:

```bash
# Make sure you're logged in to Supabase CLI
supabase login

# Link your project (if not already linked)
supabase link --project-ref [YOUR-PROJECT-REF]

# Deploy the function
supabase functions deploy create-event-reminders
```

### 2. Set Up the Cron Job

You have three options for setting up the cron job:

#### Option A: Supabase Dashboard (Easiest)

1. Go to your Supabase project dashboard
2. Navigate to **Database** > **Cron Jobs**
3. Click **"Create a new cron job"**
4. Configure:
   - **Name:** `create-event-reminders-hourly`
   - **Schedule:** `0 * * * *` (every hour at minute 0)
   - **Command:**
   ```sql
   SELECT net.http_post(
     url := 'https://[YOUR-PROJECT-REF].supabase.co/functions/v1/create-event-reminders',
     headers := jsonb_build_object(
       'Content-Type', 'application/json',
       'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
     ),
     body := '{}'::jsonb
   ) as request_id;
   ```
   - Replace `[YOUR-PROJECT-REF]` with your actual project reference

5. Click **"Create"**

#### Option B: Using SQL Editor

1. Go to **SQL Editor** in Supabase Dashboard
2. Run this SQL:

```sql
-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Add the cron job
SELECT cron.schedule(
  'create-event-reminders-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://[YOUR-PROJECT-REF].supabase.co/functions/v1/create-event-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{}'::jsonb
  ) as request_id;
  $$
);
```

Replace `[YOUR-PROJECT-REF]` with your project reference.

#### Option C: External Cron Service (Good for Testing)

Use a service like [cron-job.org](https://cron-job.org) or GitHub Actions:

**Configuration:**
- **URL:** `https://[YOUR-PROJECT-REF].supabase.co/functions/v1/create-event-reminders`
- **Method:** POST
- **Schedule:** Every hour (0 * * * *)
- **Headers:**
  - `Authorization: Bearer [YOUR-SERVICE-ROLE-KEY]`
  - `Content-Type: application/json`
- **Body:** `{}`

**Example with curl:**
```bash
curl -X POST \
  https://[YOUR-PROJECT-REF].supabase.co/functions/v1/create-event-reminders \
  -H "Authorization: Bearer [YOUR-SERVICE-ROLE-KEY]" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### 3. Verify the Setup

#### Test the Edge Function Manually

```bash
curl -X POST \
  https://[YOUR-PROJECT-REF].supabase.co/functions/v1/create-event-reminders \
  -H "Authorization: Bearer [YOUR-SERVICE-ROLE-KEY]" \
  -H "Content-Type: application/json"
```

Expected response:
```json
{
  "success": true,
  "remindersCreated": 5,
  "timestamp": "2025-12-30T10:00:00.000Z"
}
```

#### Check Cron Job Status

If using pg_cron, you can check the job status:

```sql
-- View scheduled jobs
SELECT * FROM cron.job;

-- View job run history
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 10;
```

#### Monitor Notifications

Check if notifications are being created:

```sql
-- View event reminder notifications
SELECT 
  n.id,
  n.user_id,
  n.title,
  n.message,
  n.created_at,
  p.username,
  e.title as event_title
FROM notifications n
LEFT JOIN profiles p ON p.id = n.user_id
LEFT JOIN events e ON e.id = n.related_event_id
WHERE n.type = 'event_reminder'
ORDER BY n.created_at DESC
LIMIT 20;
```

## How It Works

1. **Every hour**, the cron job triggers
2. The **edge function** is called
3. The edge function calls the **database function** `create_event_reminders()`
4. The database function:
   - Finds all bookings where:
     - Payment is completed
     - Event starts between 23-24 hours from now
     - User hasn't already received a reminder
   - Creates a notification for each eligible booking
   - Returns the count of notifications created

## Troubleshooting

### No Notifications Being Created

1. **Check if there are eligible events:**
   ```sql
   SELECT 
     b.id,
     b.user_id,
     e.title,
     e.start_date,
     e.start_date - INTERVAL '24 hours' as reminder_time
   FROM bookings b
   JOIN events e ON e.id = b.event_id
   WHERE b.payment_status = 'completed'
     AND e.start_date BETWEEN NOW() + INTERVAL '23 hours' AND NOW() + INTERVAL '24 hours'
   LIMIT 10;
   ```

2. **Check if reminders already exist:**
   ```sql
   SELECT * FROM notifications 
   WHERE type = 'event_reminder'
   AND created_at > NOW() - INTERVAL '24 hours';
   ```

3. **Manually trigger the function:**
   ```sql
   SELECT create_event_reminders();
   ```

### Cron Job Not Running

1. **Verify pg_cron is installed:**
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'pg_cron';
   ```

2. **Check cron job logs:**
   ```sql
   SELECT * FROM cron.job_run_details 
   WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'create-event-reminders-hourly')
   ORDER BY start_time DESC;
   ```

3. **Check edge function logs** in Supabase Dashboard:
   - Go to **Edge Functions** > **create-event-reminders** > **Logs**

## Schedule Customization

If you want to change when reminders are sent, modify:

1. **Cron Schedule:**
   - Current: `0 * * * *` (every hour)
   - Every 30 minutes: `*/30 * * * *`
   - Every 6 hours: `0 */6 * * *`

2. **Reminder Timing** (in database function):
   Edit `supabase/migrations/019_add_notifications_system.sql`:
   ```sql
   -- Change from 24 hours to 48 hours:
   AND e.start_date BETWEEN NOW() + INTERVAL '47 hours' AND NOW() + INTERVAL '48 hours'
   ```

## Cost Considerations

- **Edge Function calls:** ~720 per month (hourly)
- **Database queries:** ~720 per month
- This is well within Supabase free tier limits

## Security

The edge function uses:
- Service role key for authentication
- RLS policies ensure users only see their own notifications
- Cron secret can be added for additional security (optional)

---

**Status:** ⏳ Requires manual setup in Supabase Dashboard  
**Next Steps:** Follow Option A, B, or C above to activate the cron job
