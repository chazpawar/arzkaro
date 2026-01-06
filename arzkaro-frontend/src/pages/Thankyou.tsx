import React, { useEffect, useState } from 'react';

type LastPayment = {
  payment?: any;
  buyer?: {
    fullName?: string;
    email?: string;
    phone?: string;
    gender?: string;
  };
  eventId?: string;
  amountINR?: number;
  timestamp?: string;
};

export default function Thankyou() {
  const [data, setData] = useState<LastPayment | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('lastPayment');
      if (raw) {
        const parsed = JSON.parse(raw) as LastPayment;
        setData(parsed);
        // Optionally clear so refresh doesn't keep old data
        // sessionStorage.removeItem('lastPayment');
      }
    } catch (err) {
      console.warn('Failed to read lastPayment from sessionStorage', err);
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold mb-2">Thank you for your purchase!</h1>
        <p className="text-sm text-gray-600 mb-4">
          Your payment was successful. Tickets and instructions will be sent to your email and WhatsApp within <strong>15–30 minutes</strong>.
        </p>

        {data ? (
          <div className="bg-gray-50 rounded-md p-4 border border-gray-100">
            <div className="mb-2 text-sm">
              <strong>Event:</strong> {data.eventId || 'Event'}
            </div>
            <div className="mb-2 text-sm">
              <strong>Name:</strong> {data.buyer?.fullName || '—'}
            </div>
            <div className="mb-2 text-sm">
              <strong>Email:</strong> {data.buyer?.email || '—'}
            </div>
            <div className="mb-2 text-sm">
              <strong>Phone:</strong> {data.buyer?.phone || '—'}
            </div>
            <div className="mb-2 text-sm">
              <strong>Amount paid:</strong> ₹{data.amountINR ?? '—'}
            </div>
            <div className="mb-2 text-sm">
              <strong>Payment ID:</strong> {data.payment?.razorpay_payment_id || '—'}
            </div>
            <div className="mb-2 text-sm text-gray-500">
              <strong>Time:</strong> {data.timestamp ? new Date(data.timestamp).toLocaleString() : '—'}
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-700 mb-4">
            We don't have a saved payment detail right now. If you completed a payment, please check your email for confirmation. Contact support if you don't receive your ticket.
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <a
            href="/"
            className="inline-block px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium"
          >
            Back to home
          </a>

          <button
            onClick={() => {
              // allow user to clear stored payment if they want
              sessionStorage.removeItem('lastPayment');
              setData(null);
            }}
            className="inline-block px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-medium"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            Clear & Done
          </button>
        </div>

        <style>{`:root{ --accent: #FF785A; }`}</style>
      </div>
    </div>
  );
}
