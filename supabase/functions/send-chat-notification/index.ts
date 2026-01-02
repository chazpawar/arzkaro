// =============================================
// Supabase Edge Function: Send Chat Notification
// Trigger: When a new message is sent in group chat or DM
// =============================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// =============================================
// Types
// =============================================

interface NotificationPayload {
  userId: string;
  title: string;
  body: string;
  data: {
    type: 'chat';
    conversationId?: string;
    groupId?: string;
    eventId?: string;
    messageId: string;
    senderId: string;
  };
  priority?: 'default' | 'high';
  channelId?: string;
}

interface PushToken {
  expo_push_token: string;
  platform: string;
}

interface ExpoPushMessage {
  to: string;
  sound: string;
  title: string;
  body: string;
  data: any;
  priority?: 'default' | 'normal' | 'high';
  channelId?: string;
  badge?: number;
}

interface ExpoPushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: any;
}

// =============================================
// Main Handler
// =============================================

serve(async (req) => {
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const payload: NotificationPayload = await req.json();

    console.log('[send-chat-notification] Received payload:', payload);

    // Validate payload
    if (!payload.userId || !payload.title || !payload.body || !payload.data) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user's push tokens
    const { data: tokens, error: tokensError } = await supabase
      .from('push_tokens')
      .select('expo_push_token, platform')
      .eq('user_id', payload.userId)
      .gte('last_used_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()); // Active in last 90 days

    if (tokensError) {
      console.error('[send-chat-notification] Error fetching tokens:', tokensError);
      throw tokensError;
    }

    if (!tokens || tokens.length === 0) {
      console.log('[send-chat-notification] No push tokens found for user:', payload.userId);
      return new Response(JSON.stringify({ message: 'No push tokens found for user' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`[send-chat-notification] Found ${tokens.length} tokens for user:`, payload.userId);

    // Build notification messages
    const messages: ExpoPushMessage[] = tokens.map((token: PushToken) => ({
      to: token.expo_push_token,
      sound: 'default',
      title: payload.title,
      body: payload.body,
      data: payload.data,
      priority: payload.priority || 'high',
      channelId: payload.channelId || 'chat',
      badge: 1,
    }));

    // Send to Expo Push API
    const expoPushResponse = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    if (!expoPushResponse.ok) {
      const errorText = await expoPushResponse.text();
      console.error('[send-chat-notification] Expo push API error:', errorText);
      throw new Error(`Expo Push API error: ${errorText}`);
    }

    const tickets = await expoPushResponse.json();
    console.log('[send-chat-notification] Expo push tickets:', tickets);

    // Log notifications
    const notificationLogs = tickets.data.map((ticket: ExpoPushTicket, index: number) => ({
      user_id: payload.userId,
      expo_push_token: tokens[index].expo_push_token,
      notification_type: 'chat',
      title: payload.title,
      body: payload.body,
      data: payload.data,
      status: ticket.status === 'ok' ? 'sent' : 'failed',
      error_message: ticket.message || null,
      expo_receipt_id: ticket.id || null,
      sent_at: new Date().toISOString(),
    }));

    const { error: logError } = await supabase.from('notification_logs').insert(notificationLogs);

    if (logError) {
      console.error('[send-chat-notification] Error logging notifications:', logError);
      // Don't throw - logging is not critical
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent: tickets.data.filter((t: ExpoPushTicket) => t.status === 'ok').length,
        failed: tickets.data.filter((t: ExpoPushTicket) => t.status === 'error').length,
        tickets: tickets.data,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[send-chat-notification] Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
