import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createHmac } from 'https://deno.land/std@0.168.0/node/crypto.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyPaymentRequest {
  order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get Razorpay secret from environment
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');

    if (!razorpayKeySecret) {
      throw new Error('Razorpay secret not configured');
    }

    // Parse request body
    const requestData: VerifyPaymentRequest = await req.json();

    // Validate required fields
    if (
      !requestData.order_id ||
      !requestData.razorpay_payment_id ||
      !requestData.razorpay_signature
    ) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify signature
    const message = `${requestData.order_id}|${requestData.razorpay_payment_id}`;
    const generatedSignature = createHmac('sha256', razorpayKeySecret)
      .update(message)
      .digest('hex');

    console.log('Verifying payment signature');
    console.log('Order ID:', requestData.order_id);
    console.log('Payment ID:', requestData.razorpay_payment_id);

    const isValid = generatedSignature === requestData.razorpay_signature;

    if (!isValid) {
      console.error('Signature verification failed');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid signature',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Payment signature verified successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Payment verified successfully',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error verifying payment:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to verify payment',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
