'use client';

import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { X, Loader2 } from 'lucide-react';
import { api } from '@/services/api';
import Button from '@/components/ui/Button';

const PaymentForm = ({ onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError(null);
    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: typeof window !== 'undefined' ? `${window.location.origin}/events?payment=success` : '',
        payment_method_data: { billing_details: {} },
      },
    });
    setLoading(false);
    if (confirmError) {
      setError(confirmError.message || 'Payment failed');
      return;
    }
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PaymentElement />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl border border-white/10 text-zinc-400 text-sm font-medium hover:bg-white/5 transition-all"
        >
          Cancel
        </button>
        <Button
          type="submit"
          variant="neon"
          className="flex-1 uppercase tracking-widest py-3"
          disabled={!stripe || loading}
        >
          {loading ? <Loader2 size={18} className="animate-spin mx-auto" /> : 'Pay now'}
        </Button>
      </div>
    </form>
  );
};

export function StripePaymentModal({ clientSecret, onSuccess, onCancel, open }) {
  const [stripePromise, setStripePromise] = useState(null);

  useEffect(() => {
    api.get('/api/vendor/config')
      .then((r) => loadStripe(r.publishableKey))
      .then(setStripePromise)
      .catch(() => setStripePromise(null));
  }, []);

  if (!open || !clientSecret) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-white text-xl font-black">Complete payment</h3>
          <button onClick={onCancel} className="text-zinc-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        {stripePromise ? (
          <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'night' } }}>
            <PaymentForm onSuccess={onSuccess} onCancel={onCancel} />
          </Elements>
        ) : (
          <div className="flex items-center justify-center py-8 text-zinc-500">
            <Loader2 size={24} className="animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
