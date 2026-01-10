import { supabase } from '../lib/supabase';

// Razorpay types for web
interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  image?: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
  handler: (response: RazorpayPaymentSuccess) => void;
}

interface RazorpayPaymentSuccess {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface Razorpay {
  new (options: RazorpayCheckoutOptions): RazorpayInstance;
}

interface RazorpayInstance {
  open(): void;
  on(event: string, callback: () => void): void;
}

declare global {
  interface Window {
    Razorpay?: Razorpay;
  }
}

/**
 * Load Razorpay checkout script
 */
export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/**
 * Razorpay Service for Web
 * Handles payment processing similar to the mobile app
 */
class RazorpayService {
  private keyId: string;

  constructor() {
    // Razorpay Key ID (public key)
    this.keyId = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_iZZc7jaS5vFcbq';
  }

  /**
   * Add user to event group after booking
   */
  private async addUserToEventGroup(userId: string, eventId: string) {
    try {
      // Find the event group
      const { data: group, error: groupError } = await supabase
        .from('event_groups')
        .select('id')
        .eq('event_id', eventId)
        .maybeSingle();

      if (groupError || !group) {
        console.error('Event group not found:', groupError);
        return;
      }

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', group.id)
        .eq('user_id', userId)
        .maybeSingle();

      if (existingMember) {
        console.log('User is already a member of the event group');
        return;
      }

      // Add user to group
      const { error: memberError } = await supabase.from('group_members').insert({
        group_id: group.id,
        user_id: userId,
        role: 'member',
      });

      if (memberError) {
        console.error('Error adding user to group:', memberError);
      } else {
        console.log('User successfully added to event group');
      }
    } catch (error) {
      console.error('Exception adding user to event group:', error);
    }
  }

  /**
   * Open Razorpay Checkout
   */
  private async openCheckout(
    options: Partial<RazorpayCheckoutOptions>
  ): Promise<RazorpayPaymentSuccess | null> {
    return new Promise((resolve) => {
      if (!window.Razorpay) {
        console.error('Razorpay script not loaded');
        resolve(null);
        return;
      }

      let dismissed = false;

      const checkoutOptions: RazorpayCheckoutOptions = {
        key: this.keyId,
        amount: options.amount || 0,
        currency: options.currency || 'INR',
        name: options.name || 'Arzkaro',
        description: options.description || 'Event Booking Payment',
        image: options.image || '/logo.png',
        order_id: options.order_id || '',
        prefill: options.prefill || {},
        notes: options.notes || {},
        theme: {
          color: options.theme?.color || '#FF785A',
        },
        modal: {
          ondismiss: () => {
            dismissed = true;
            console.log('Payment cancelled by user');
            resolve(null);
          },
        },
        handler: (response: RazorpayPaymentSuccess) => {
          if (!dismissed) {
            resolve(response);
          }
        },
      };

      try {
        const razorpay = new window.Razorpay(checkoutOptions);

        razorpay.on('payment.failed', () => {
          if (!dismissed) {
            dismissed = true;
            console.error('Payment failed');
            resolve(null);
          }
        });

        razorpay.open();
      } catch (error) {
        console.error('Error opening Razorpay:', error);
        resolve(null);
      }
    });
  }

  /**
   * Verify payment signature on the server
   */
  private async verifyPayment(
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
   * Process complete payment flow (same as mobile app)
   * 1. Create order
   * 2. Open checkout
   * 3. Verify payment
   * 4. Update booking
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
  ): Promise<{
    success: boolean;
    paymentId?: string;
    bookingId?: string;
    error?: string;
    cancelled?: boolean;
  }> {
    try {
      // Step 1: Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        return { success: false, error: 'Failed to load Razorpay. Please refresh and try again.' };
      }

      // Step 2: Create order with event details
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
        return { success: false, error: error.message || 'Failed to create order' };
      }

      if (data && data.error) {
        console.error('Edge Function returned error:', data.error);
        return { success: false, error: data.error };
      }

      const { order_id, amount, booking_id } = data || {};

      if (!order_id) {
        return { success: false, error: 'Failed to create order' };
      }

      console.log('Order created:', order_id, 'Booking ID:', booking_id);

      // Step 3: Open Razorpay checkout
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
        return { success: false, error: 'Payment cancelled or failed', cancelled: true };
      }

      console.log('Payment successful:', paymentData.razorpay_payment_id);

      // Step 4: Verify payment
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

      // Step 5: Update booking with payment details
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

      // Step 6: Add user to event group
      console.log('Adding user to event group...');
      await this.addUserToEventGroup(userId, eventId);

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

  /**
   * Process free event booking (no payment required)
   */
  async processFreeBooking(
    eventId: string,
    ticketTypeId: string | undefined,
    quantity: number,
    userId: string
  ): Promise<{
    success: boolean;
    bookingId?: string;
    error?: string;
  }> {
    try {
      console.log('Creating free booking for event:', eventId);

      // Create booking directly via Supabase
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          event_id: eventId,
          user_id: userId,
          ticket_type_id: ticketTypeId,
          quantity: quantity,
          total_amount: 0,
          payment_status: 'completed',
          status: 'confirmed',
          payment_completed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating free booking:', error);
        return { success: false, error: error.message };
      }

      console.log('Free booking created:', data.id);

      // Add user to event group
      await this.addUserToEventGroup(userId, eventId);

      return {
        success: true,
        bookingId: data.id,
      };
    } catch (error) {
      console.error('Error processing free booking:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create booking',
      };
    }
  }
}

// Export singleton instance
export const razorpayService = new RazorpayService();
