-- =============================================
-- Migration: Fix DM Notification Trigger Column Names
-- Description: Fix user1_id/user2_id -> user_id_1/user_id_2 in notify_chat_message function
-- Issue: The trigger was using incorrect column names causing "column user1_id does not exist" errors
-- =============================================

CREATE OR REPLACE FUNCTION notify_chat_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sender_id UUID;
  v_sender_name TEXT;
  v_sender_avatar TEXT;
  v_recipient_user_ids UUID[];
  v_recipient UUID;
  v_notification_title TEXT;
  v_notification_body TEXT;
  v_event_id UUID;
  v_group_id UUID;
  v_conversation_id UUID;
  v_supabase_url TEXT;
  v_supabase_anon_key TEXT;
  v_edge_function_url TEXT;
BEGIN
  -- Determine sender ID based on table (CRITICAL FIX)
  -- messages table uses user_id, dm_messages table uses sender_id
  IF TG_TABLE_NAME = 'messages' THEN
    v_sender_id := NEW.user_id;  -- Group messages use user_id
  ELSIF TG_TABLE_NAME = 'dm_messages' THEN
    v_sender_id := NEW.sender_id;  -- DM messages use sender_id
  END IF;

  -- Get sender information using the correct ID
  SELECT full_name, avatar_url INTO v_sender_name, v_sender_avatar
  FROM profiles
  WHERE id = v_sender_id;

  -- Use email username if full name not available
  IF v_sender_name IS NULL THEN
    SELECT split_part(email, '@', 1) INTO v_sender_name
    FROM auth.users
    WHERE id = v_sender_id;
  END IF;

  -- Default if still null
  v_sender_name := COALESCE(v_sender_name, 'Someone');

  -- Check if this is a group message or DM
  IF TG_TABLE_NAME = 'messages' THEN
    -- Group/Event message
    v_group_id := NEW.group_id;
    
    -- Get event ID from event_groups
    SELECT event_id INTO v_event_id
    FROM event_groups
    WHERE id = v_group_id;

    -- Get all group members except the sender
    SELECT array_agg(user_id) INTO v_recipient_user_ids
    FROM group_members
    WHERE group_id = v_group_id
    AND user_id != v_sender_id;

    v_notification_title := 'New message in group';
    v_notification_body := v_sender_name || ': ' || LEFT(NEW.content, 100);

  ELSIF TG_TABLE_NAME = 'dm_messages' THEN
    -- Direct message
    v_conversation_id := NEW.conversation_id;

    -- Get the other user in the conversation
    -- FIXED: Changed user1_id/user2_id to user_id_1/user_id_2
    SELECT ARRAY[
      CASE 
        WHEN user_id_1 = v_sender_id THEN user_id_2
        ELSE user_id_1
      END
    ] INTO v_recipient_user_ids
    FROM dm_conversations
    WHERE id = v_conversation_id;

    v_notification_title := v_sender_name;
    v_notification_body := LEFT(NEW.content, 100);
  END IF;

  -- Send notification to each recipient
  IF v_recipient_user_ids IS NOT NULL THEN
    FOREACH v_recipient IN ARRAY v_recipient_user_ids
    LOOP
      -- Get Supabase configuration
      SELECT current_setting('app.settings.supabase_url', true) INTO v_supabase_url;
      SELECT current_setting('app.settings.supabase_anon_key', true) INTO v_supabase_anon_key;

      -- Fallback to environment variables if settings not found
      v_supabase_url := COALESCE(v_supabase_url, current_setting('supabase_url', true));
      v_supabase_anon_key := COALESCE(v_supabase_anon_key, current_setting('supabase_anon_key', true));

      -- If still not found, use project-specific URL
      IF v_supabase_url IS NULL THEN
        v_supabase_url := 'https://rsyuknfgziydxtvmidgd.supabase.co';
      END IF;

      v_edge_function_url := v_supabase_url || '/functions/v1/send-chat-notification';

      -- Call Edge Function asynchronously using pg_net (if available)
      -- Note: This requires pg_net extension to be enabled
      BEGIN
        PERFORM
          net.http_post(
            url := v_edge_function_url,
            headers := jsonb_build_object(
              'Content-Type', 'application/json',
              'Authorization', 'Bearer ' || v_supabase_anon_key
            ),
            body := jsonb_build_object(
              'userId', v_recipient,
              'title', v_notification_title,
              'body', v_notification_body,
              'data', jsonb_build_object(
                'type', 'chat',
                'messageId', NEW.id,
                'senderId', v_sender_id,
                'conversationId', v_conversation_id,
                'groupId', v_group_id,
                'eventId', v_event_id
              ),
              'priority', 'high',
              'channelId', 'chat'
            )
          );
      EXCEPTION
        WHEN OTHERS THEN
          -- Log error but don't fail the transaction
          RAISE WARNING 'Failed to send chat notification: %', SQLERRM;
      END;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION notify_chat_message IS 'Triggers push notifications when new chat messages are sent (fixed column names user_id_1/user_id_2)';

-- =============================================
-- Migration Complete!
-- =============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 025: Fixed DM notification trigger column names';
  RAISE NOTICE '   - Changed user1_id -> user_id_1';
  RAISE NOTICE '   - Changed user2_id -> user_id_2';
  RAISE NOTICE '   - DM send functionality should now work correctly';
END;
$$;
