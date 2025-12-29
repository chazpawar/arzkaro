// =============================================
// Supabase Edge Function: Send Promotional Notification
// Purpose: Send promotional notifications to users (admin only)
// =============================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// =============================================
// Types
// =============================================

interface PromotionalNotificationPayload {
  title: string;
  body: string;
  eventId?: string;
  imageUrl?: string;
  filters?: {
    platforms?: ('ios' | 'android')[];
    userIds?: string[];
    excludeUserIds?: string[];
  };
}

interface PushToken {
  user_id: string;
  expo_push_token: string;
  platform: string;
}

interface ExpoPushMessage {
  to: string;
  sound: string;
  title: string;
  body: string;
  data: any;
  priority: string;
  channelId: string;
  badge?: number;
}

interface ExpoPushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: any;
}

// =============================================
// Helper Functions
// =============================================

async function verifyAdmin(supabase: any, authHeader: string | null): Promise<string | null> {
  if (!authHeader) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return null;
  }

  // Check if user is admin
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || profile.role !== 'admin') {
    return null;
  }

  return user.id;
}

async function sendToExpoPushAPI(messages: ExpoPushMessage[]) {
  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(messages),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Expo Push API error: ${errorText}`);
  }

  return await response.json();
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

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin
    const authHeader = req.headers.get('Authorization');
    const adminId = await verifyAdmin(supabase, authHeader);

    if (!adminId) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized. Admin access required.' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('[send-promotional-notification] Admin verified:', adminId);

    // Parse request body
    const payload: PromotionalNotificationPayload = await req.json();

    console.log('[send-promotional-notification] Received payload:', payload);

    // Validate payload
    if (!payload.title || !payload.body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: title and body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build query for push tokens
    let query = supabase
      .from('push_tokens')
      .select('user_id, expo_push_token, platform')
      .gte('last_used_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()); // Active in last 90 days

    // Apply filters
    if (payload.filters) {
      if (payload.filters.platforms && payload.filters.platforms.length > 0) {
        query = query.in('platform', payload.filters.platforms);
      }

      if (payload.filters.userIds && payload.filters.userIds.length > 0) {
        query = query.in('user_id', payload.filters.userIds);
      }

      if (payload.filters.excludeUserIds && payload.filters.excludeUserIds.length > 0) {
        query = query.not('user_id', 'in', `(${payload.filters.excludeUserIds.join(',')})`);
      }
    }

    const { data: tokens, error: tokensError } = await query;

    if (tokensError) {
      console.error('[send-promotional-notification] Error fetching tokens:', tokensError);
      throw tokensError;
    }

    if (!tokens || tokens.length === 0) {
      console.log('[send-promotional-notification] No push tokens found with given filters');
      return new Response(
        JSON.stringify({ message: 'No push tokens found with given filters', sent: 0 }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[send-promotional-notification] Found ${tokens.length} tokens`);

    // Build notification data
    const notificationData: any = {
      type: 'promotional',
      id: crypto.randomUUID(),
    };

    if (payload.eventId) {
      notificationData.eventId = payload.eventId;
    }

    // Build notification messages (in batches of 100)
    const allTickets: ExpoPushTicket[] = [];
    const batchSize = 100;

    for (let i = 0; i < tokens.length; i += batchSize) {
      const batchTokens = tokens.slice(i, i + batchSize);
      
      const messages: ExpoPushMessage[] = batchTokens.map((token: PushToken) => ({
        to: token.expo_push_token,
        sound: 'default',
        title: payload.title,
        body: payload.body,
        data: notificationData,
        priority: 'normal',
        channelId: 'promotional',
      }));

      const tickets = await sendToExpoPushAPI(messages);
      allTickets.push(...tickets.data);

      // Log notifications for this batch
      const notificationLogs = tickets.data.map((ticket: ExpoPushTicket, index: number) => ({
        user_id: batchTokens[index].user_id,
        expo_push_token: batchTokens[index].expo_push_token,
        notification_type: 'promotional',
        title: payload.title,
        body: payload.body,
        data: notificationData,
        status: ticket.status === 'ok' ? 'sent' : 'failed',
        error_message: ticket.message || null,
        expo_receipt_id: ticket.id || null,
        sent_at: new Date().toISOString(),
      }));

      const { error: logError } = await supabase
        .from('notification_logs')
        .insert(notificationLogs);

      if (logError) {
        console.error('[send-promotional-notification] Error logging notifications:', logError);
        // Don't throw - logging is not critical
      }

      // Rate limiting - wait 100ms between batches
      if (i + batchSize < tokens.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    const successCount = allTickets.filter(t => t.status === 'ok').length;
    const failureCount = allTickets.filter(t => t.status === 'error').length;

    console.log(`[send-promotional-notification] Sent: ${successCount}, Failed: ${failureCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        sent: successCount,
        failed: failureCount,
        total: tokens.length,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[send-promotional-notification] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
