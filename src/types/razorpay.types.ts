// Razorpay payment types

export interface RazorpayOrder {
  id: string;
  entity: 'order';
  amount: number; // in smallest currency unit (paise for INR)
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: 'created' | 'attempted' | 'paid';
  attempts: number;
  notes: Record<string, string>;
  created_at: number;
}

export interface RazorpayCheckoutOptions {
  key: string; // Razorpay Key ID
  amount: number; // in smallest currency unit (paise for INR)
  currency: string;
  name: string; // Business name
  description: string;
  image?: string; // Logo URL
  order_id: string; // Order ID from Razorpay Orders API
  prefill?: {
    name?: string;
    email?: string;
    contact?: string; // Format: +91XXXXXXXXXX
    method?: 'card' | 'netbanking' | 'wallet' | 'upi' | 'emi';
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string; // Hex color code
    backdrop_color?: string;
  };
  modal?: {
    backdropclose?: boolean;
    escape?: boolean;
    handleback?: boolean;
    confirm_close?: boolean;
    ondismiss?: () => void;
    animation?: boolean;
  };
  readonly?: {
    contact?: boolean;
    email?: boolean;
    name?: boolean;
  };
  hidden?: {
    contact?: boolean;
    email?: boolean;
  };
  send_sms_hash?: boolean; // Auto-read OTP (Android)
  allow_rotation?: boolean; // Screen rotation (Android)
  retry?: {
    enabled: boolean;
    max_count: number;
  };
  timeout?: number; // in seconds
  config?: {
    display: {
      language: 'en' | 'ben' | 'hi' | 'mar' | 'guj' | 'tam' | 'tel';
    };
  };
}

export interface RazorpayPaymentSuccess {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayPaymentError {
  code: string;
  description: string;
  source: string;
  step: string;
  reason: string;
  metadata: {
    order_id: string;
    payment_id?: string;
  };
}

export interface CreateOrderParams {
  amount: number; // in smallest currency unit (paise for INR)
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
  partial_payment?: boolean;
  first_payment_min_amount?: number;
}

export interface VerifyPaymentParams {
  order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface PaymentVerificationResult {
  success: boolean;
  message: string;
}
