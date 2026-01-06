import React, { useEffect, useState } from 'react';

// Forms.tsx
// - Small modal form that collects buyer details
// - Submits the details to Formsubmit.co (AJAX endpoint)
// - Launches Razorpay checkout with a placeholder key
// After successful payment it saves payment+buyer info to sessionStorage and redirects to /thankyou

export type BuyerInfo = {
  fullName: string;
  email: string;
  phone: string;
  gender: string;
};

export type FormsProps = {
  open: boolean;
  amountINR: number; // integer rupee amount (e.g. 499)
  eventId?: string;
  onClose: () => void;
  onPaymentSuccess?: (razorpayPayment: any, buyer: BuyerInfo) => void;
};

// ====== CONFIG - Replace these ======
const FORMSUBMIT_EMAIL = 'thearzkaro@gmail.com'; // replace with your Formsubmit.co receiver email
const RAZORPAY_KEY = 'rzp_live_iZZc7jaS5vFcbq'; // replace with your Razorpay key (test/live)
// ====================================

// Utility: load the Razorpay checkout script
const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function Forms({ open, amountINR, eventId, onClose, onPaymentSuccess }: FormsProps) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [buyer, setBuyer] = useState<BuyerInfo>({
    fullName: '',
    email: '',
    phone: '',
    gender: 'Prefer not to say',
  });

  useEffect(() => {
    if (!open) {
      setErr(null);
      setBuyer({ fullName: '', email: '', phone: '', gender: 'Prefer not to say' });
    }
  }, [open]);

  const isValid = () => {
    const phoneOk = /^\d{10}$/.test(buyer.phone);
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyer.email);
    return buyer.fullName.trim().length >= 2 && emailOk && phoneOk;
  };

  const submitHandler = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setErr(null);

    if (!isValid()) {
      setErr('Please enter valid details (10-digit phone and valid email).');
      return;
    }

    setSubmitting(true);

    // 1) Send buyer info to Formsubmit.co via AJAX (so the organizer gets a copy)
    try {
      const formUrl = `https://formsubmit.co/ajax/${encodeURIComponent(FORMSUBMIT_EMAIL)}`;
      const formData = {
        eventId: eventId || 'unknown',
        fullName: buyer.fullName,
        email: buyer.email,
        phone: buyer.phone,
        gender: buyer.gender,
        amountINR: amountINR,
        _subject: `Ticket purchase for ${eventId || 'Event'}`,
        _template: 'table',
      } as any;

      await fetch(formUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(formData),
      });
    } catch (fErr) {
      // Non-fatal — log & continue to payment. Formsubmit failures should not block checkout.
      console.warn('Formsubmit failed', fErr);
    }

    // 2) Launch Razorpay
    setLoading(true);
    const ok = await loadRazorpayScript();
    if (!ok) {
      setErr('Failed to load payment gateway. Please try again later.');
      setLoading(false);
      setSubmitting(false);
      return;
    }

    try {
      const options = {
        key: RAZORPAY_KEY,
        amount: amountINR * 100, // amount in paise
        currency: 'INR',
        name: 'Ticket Purchase',
        description: `Ticket for ${eventId ?? 'Event'}`,
        image: '', // optional - put your logo URL
        handler: function (response: any) {
          // response.razorpay_payment_id etc.
          try {
            // Save to sessionStorage so Thankyou page can read it
            const payload = {
              payment: response,
              buyer,
              eventId: eventId || '',
              amountINR,
              timestamp: new Date().toISOString(),
            };
            try {
              sessionStorage.setItem('lastPayment', JSON.stringify(payload));
            } catch (sErr) {
              console.warn('Failed to save payment to sessionStorage', sErr);
            }

            // call optional callback
            onPaymentSuccess?.(response, buyer);

            // Close modal actions
            setSubmitting(false);
            setLoading(false);

            // Redirect to thank you page (replace path if your route differs)
            // If you use react-router and prefer client navigation, replace with navigate('/thankyou')
            window.location.href = '/thankyou';
          } catch (innerErr) {
            console.error('Post-payment handling error', innerErr);
            setErr('Payment succeeded but something went wrong. Please check your email for the ticket.');
            setSubmitting(false);
            setLoading(false);
            onClose();
          }
        },
        prefill: {
          name: buyer.fullName,
          email: buyer.email,
          contact: buyer.phone,
        },
        notes: {
          eventId: eventId || '',
          buyerName: buyer.fullName,
          buyerEmail: buyer.email,
        },
        theme: { color: '#FF785A' },
      } as any;

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (payErr) {
      console.error('Razorpay launch failed', payErr);
      setErr('Payment initialization failed. Try again.');
      setLoading(false);
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-end md:items-center justify-center" aria-modal="true" role="dialog">
      <div className="absolute inset-0 bg-black/40" onClick={() => !loading && onClose()} />

      <form
        onSubmit={submitHandler}
        className="relative w-full max-w-md bg-white rounded-t-xl md:rounded-xl shadow-2xl p-6 m-4 md:m-0 flex flex-col"
      >
        <h3 className="text-lg font-bold mb-2">Complete your booking</h3>
        <p className="text-sm text-gray-500 mb-4">Enter your details to continue to payment</p>

        <label className="text-xs font-semibold">Full name</label>
        <input
          value={buyer.fullName}
          onChange={(e) => setBuyer((b) => ({ ...b, fullName: e.target.value }))}
          className="w-full px-3 py-2 rounded-md border border-gray-200 mb-3 focus:outline-none"
          placeholder="Your full name"
          required
        />

        <label className="text-xs font-semibold">Email</label>
        <input
          value={buyer.email}
          onChange={(e) => setBuyer((b) => ({ ...b, email: e.target.value }))}
          className="w-full px-3 py-2 rounded-md border border-gray-200 mb-3 focus:outline-none"
          placeholder="you@example.com"
          type="email"
          required
        />

        <label className="text-xs font-semibold">Phone number</label>
        <input
          value={buyer.phone}
          onChange={(e) => setBuyer((b) => ({ ...b, phone: e.target.value }))}
          className="w-full px-3 py-2 rounded-md border border-gray-200 mb-3 focus:outline-none"
          placeholder="10-digit mobile number"
          inputMode="numeric"
          required
        />

        <label className="text-xs font-semibold">Gender</label>
        <select
          value={buyer.gender}
          onChange={(e) => setBuyer((b) => ({ ...b, gender: e.target.value }))}
          className="w-full px-3 py-2 rounded-md border border-gray-200 mb-3 focus:outline-none"
        >
          <option>Male</option>
          <option>Female</option>
          <option>Non-binary</option>
          <option>Prefer not to say</option>
        </select>

        {err && <div className="text-sm text-red-600 mb-2">{err}</div>}

        <div className="mt-2 flex items-center gap-3">
          <button
            type="submit"
            disabled={submitting || loading}
            className="flex-1 px-4 py-2 rounded-lg bg-[var(--accent)] text-white font-semibold disabled:opacity-60"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            {loading || submitting ? 'Processing…' : `Pay ${amountINR} INR`}
          </button>

          <button
            type="button"
            onClick={() => !loading && onClose()}
            className="px-4 py-2 rounded-lg border border-gray-200 bg-white"
          >
            Cancel
          </button>
        </div>

        <div className="mt-3 text-xs text-gray-500">
          You will be redirected to a secure payments page. By continuing you agree to the terms.
        </div>

        <style>{`:root{ --accent: #FF785A; }`}</style>
      </form>
    </div>
  );
}
