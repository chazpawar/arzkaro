import RazorpayCheckout from 'react-native-razorpay';
import { Config } from '../constants/config';
import { supabase } from '../../backend/supabase';
import type {
  RazorpayCheckoutOptions,
  RazorpayPaymentSuccess,
  RazorpayPaymentError,
  CreateOrderParams,
} from '../types/razorpay.types';

/**
 * Razorpay Payment Service
 * Handles payment processing using Razorpay Payment Gateway
 */
class RazorpayService {
  private keyId: string;

  constructor() {
    this.keyId = Config.razorpayKeyId;
  }

  /**
   * Create a Razorpay order on the server
   * This should be called before opening the checkout
   */
  async createOrder(params: CreateOrderParams): Promise<{ order_id: string; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
        body: params,
      });

      if (error) {
        console.error('Error creating Razorpay order:', error);
        return { order_id: '', error: error.message };
      }

      return { order_id: data.id };
    } catch (error) {
      console.error('Exception creating Razorpay order:', error);
      return { order_id: '', error: 'Failed to create order' };
    }
  }

  /**
   * Open Razorpay Checkout with the provided options
   */
  async openCheckout(
    options: Partial<RazorpayCheckoutOptions>
  ): Promise<RazorpayPaymentSuccess | null> {
    try {
      // Validate required fields
      if (!this.keyId) {
        throw new Error('Razorpay Key ID is not configured');
      }

      if (!options.order_id) {
        throw new Error('Order ID is required');
      }

      if (!options.amount) {
        throw new Error('Amount is required');
      }

      // Prepare checkout options with defaults
      const checkoutOptions: RazorpayCheckoutOptions = {
        key: this.keyId,
        amount: options.amount,
        currency: options.currency || 'INR',
        name: options.name || Config.appName,
        description: options.description || 'Event Booking Payment',
        image: options.image || 'https://your-logo-url.com/logo.png', // Replace with your app logo
        order_id: options.order_id,
        prefill: {
          name: options.prefill?.name || '',
          email: options.prefill?.email || '',
          contact: options.prefill?.contact || '',
        },
        notes: options.notes || {},
        theme: {
          color: options.theme?.color || '#FF6B35',
          backdrop_color: options.theme?.backdrop_color || '#000000',
        },
        modal: {
          backdropclose: options.modal?.backdropclose ?? false,
          escape: options.modal?.escape ?? true,
          handleback: options.modal?.handleback ?? true,
          confirm_close: options.modal?.confirm_close ?? true,
          animation: options.modal?.animation ?? true,
        },
        retry: options.retry || {
          enabled: true,
          max_count: 4,
        },
        timeout: options.timeout || 600, // 10 minutes default
      };

      // Open Razorpay Checkout
      const paymentData = await RazorpayCheckout.open(checkoutOptions);

      return paymentData as RazorpayPaymentSuccess;
    } catch (error) {
      const razorpayError = error as RazorpayPaymentError;
      console.error('Razorpay Checkout Error:', razorpayError);

      // Handle specific error cases
      if (razorpayError.code === '0') {
        // User cancelled the payment
        console.log('Payment cancelled by user');
      } else if (razorpayError.code === '2') {
        // Network error
        console.error('Network error during payment');
      } else {
        // Other errors
        console.error('Payment failed:', razorpayError.description);
      }

      return null;
    }
  }

  /**
   * Verify payment signature on the server
   * This should be called after successful payment to verify authenticity
   */
  async verifyPayment(
    orderId: string,
    paymentId: string,
    signature: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('verify-razorpay-payment', {
        body: {
          order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: signature,
        },
      });

      if (error) {
        console.error('Error verifying payment:', error);
        return { success: false, error: error.message };
      }

      return { success: data.success };
    } catch (error) {
      console.error('Exception verifying payment:', error);
      return { success: false, error: 'Failed to verify payment' };
    }
  }

  /**
   * Process a complete payment flow
   * 1. Create order
   * 2. Open checkout
   * 3. Verify payment
   */
  async processPayment(
    eventId: string,
    ticketTypeId: string | undefined,
    quantity: number,
    userId: string,
    userDetails: {
      name: string;
      email: string;
      contact: string;
    }
  ): Promise<{ success: boolean; paymentId?: string; bookingId?: string; error?: string }> {
    try {
      // Step 1: Create order with event details
      console.log('Creating Razorpay order for event:', eventId);
      const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
        body: {
          event_id: eventId,
          ticket_type_id: ticketTypeId,
          quantity: quantity,
          user_id: userId,
        },
      });

      if (error) {
        console.error('Error creating Razorpay order:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        console.error('Error context:', { context: error.context, name: error.name });
        console.error('Response data even with error:', data);

        // Try to read the response body from the error context
        if (error.context && typeof error.context.text === 'function') {
          try {
            const responseText = await error.context.text();
            console.error('Response body:', responseText);
            const responseData = JSON.parse(responseText);
            if (responseData.error) {
              return { success: false, error: responseData.error };
            }
          } catch (e) {
            console.error('Could not parse error response:', e);
          }
        }

        // Try to get the error message from the response body
        if (data && typeof data === 'object' && 'error' in data) {
          return { success: false, error: (data as any).error };
        }

        return { success: false, error: error.message || 'Failed to create order' };
      }

      console.log('Order creation response:', { data, hasData: !!data });

      // Check if data contains an error
      if (data && data.error) {
        console.error('Edge Function returned error in data:', data.error);
        return { success: false, error: data.error };
      }

      const { order_id, amount, booking_id } = data || {};

      if (!order_id) {
        return { success: false, error: 'Failed to create order' };
      }

      console.log('Order created:', order_id, 'Booking ID:', booking_id);

      // Step 2: Open checkout
      console.log('Opening Razorpay checkout...');
      const paymentData = await this.openCheckout({
        order_id,
        amount: amount * 100, // Convert to paise
        currency: 'INR',
        description: `Booking Payment - ${booking_id}`,
        prefill: {
          name: userDetails.name,
          email: userDetails.email,
          contact: userDetails.contact,
        },
        notes: {
          booking_id: booking_id,
        },
      });

      if (!paymentData) {
        return { success: false, error: 'Payment cancelled or failed' };
      }

      console.log('Payment successful:', paymentData.razorpay_payment_id);

      // Step 3: Verify payment
      console.log('Verifying payment...');
      const verificationResult = await this.verifyPayment(
        order_id,
        paymentData.razorpay_payment_id,
        paymentData.razorpay_signature
      );

      if (!verificationResult.success) {
        return {
          success: false,
          error: verificationResult.error || 'Payment verification failed',
        };
      }

      console.log('Payment verified successfully');

      // Update booking with payment details
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          razorpay_payment_id: paymentData.razorpay_payment_id,
          razorpay_signature: paymentData.razorpay_signature,
          payment_status: 'completed',
          status: 'confirmed',
          payment_completed_at: new Date().toISOString(),
        })
        .eq('id', booking_id);

      if (updateError) {
        console.error('Error updating booking:', updateError);
        return {
          success: false,
          error: 'Payment verified but failed to update booking',
        };
      }

      return {
        success: true,
        paymentId: paymentData.razorpay_payment_id,
        bookingId: booking_id,
      };
    } catch (error) {
      console.error('Error processing payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment processing failed',
      };
    }
  }
}

// Export singleton instance
export const razorpayService = new RazorpayService();
