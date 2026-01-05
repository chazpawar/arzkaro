import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { encode as base64Encode } from 'https://deno.land/std@0.168.0/encoding/base64.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateOrderRequest {
  event_id: string;
  ticket_type_id?: string;
  quantity: number;
  user_id: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get Razorpay credentials from environment
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID');
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');

    if (!razorpayKeyId || !razorpayKeySecret) {
      throw new Error('Razorpay credentials not configured');
    }

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    console.log('Supabase URL:', supabaseUrl);
    console.log('Has service role key:', !!supabaseKey);
    console.log('Service role key length:', supabaseKey?.length);

    const supabase = createClient(supabaseUrl, supabaseKey, {
      db: { schema: 'public' },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          apikey: supabaseKey,
        },
      },
    });

    // Parse request body
    const requestData: CreateOrderRequest = await req.json();
    const { event_id, ticket_type_id: _ticket_type_id, quantity, user_id } = requestData;

    // Validate required fields
    if (!event_id || !quantity || !user_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: event_id, quantity, user_id' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Fetch event details using RPC function that bypasses RLS
    console.log('Fetching event with ID:', event_id);

    const { data: eventData, error: eventError } = await supabase.rpc('get_event_for_payment', {
      event_uuid: event_id,
    });

    console.log('Event RPC result:', { eventData, eventError });

    // RPC returns an array, get first item
    const event = eventData && eventData.length > 0 ? eventData[0] : null;

    console.log('Event query result:', { event, eventError });

    if (eventError || !event) {
      console.error('Error fetching event:', eventError);
      console.error('Event error details:', JSON.stringify(eventError, null, 2));
      return new Response(
        JSON.stringify({
          error: 'Event not found',
          details: eventError?.message || 'No event data returned',
          event_id: event_id,
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Calculate amount (price is already in rupees)
    const amountInRupees = event.price * quantity;
    const amountInPaise = Math.round(amountInRupees * 100); // Convert to paise for Razorpay

    console.log(
      `Event: ${event.title}, Price: ₹${event.price}, Quantity: ${quantity}, Total: ₹${amountInRupees}`
    );

    // Create pending booking using RPC to bypass RLS
    const bookingId = crypto.randomUUID();
    const { data: createdBookingId, error: bookingError } = await supabase.rpc(
      'create_pending_booking',
      {
        p_booking_id: bookingId,
        p_event_id: event_id,
        p_user_id: user_id,
        p_quantity: quantity,
        p_total_amount: amountInRupees,
      }
    );

    if (bookingError) {
      console.error('Error creating booking:', bookingError);
      return new Response(
        JSON.stringify({
          error: 'Failed to create booking',
          details: bookingError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Pending booking created:', createdBookingId || bookingId);

    // Create Razorpay order
    const razorpayUrl = 'https://api.razorpay.com/v1/orders';
    const auth = base64Encode(new TextEncoder().encode(`${razorpayKeyId}:${razorpayKeySecret}`));

    const orderPayload = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: bookingId,
      notes: {
        event_id: event_id,
        event_title: event.title,
        user_id: user_id,
        booking_id: bookingId,
        quantity: quantity.toString(),
      },
    };

    console.log('Creating Razorpay order:', orderPayload);

    const response = await fetch(razorpayUrl, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Razorpay API error:', errorText);

      // Delete the pending booking since order creation failed
      await supabase.from('bookings').delete().eq('id', bookingId);

      throw new Error(`Razorpay API error: ${response.status} - ${errorText}`);
    }

    const order = await response.json();
    console.log('Razorpay order created:', order.id);

    // Update booking with razorpay_order_id
    await supabase
      .from('bookings')
      .update({
        razorpay_order_id: order.id,
        payment_intent_id: order.id, // Keep for backward compatibility
      })
      .eq('id', bookingId);

    // Return order details and booking ID
    return new Response(
      JSON.stringify({
        order_id: order.id,
        amount: amountInRupees,
        currency: 'INR',
        booking_id: bookingId,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error creating Razorpay order:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to create order',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
