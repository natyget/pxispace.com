'use client';

import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { HugeiconsIcon } from '@hugeicons/react';
import { Cancel01Icon, Loading02Icon } from '@hugeicons/core-free-icons';
import { api } from '@/services/api';
import Button from '@/components/ui/Button';

const PaymentForm = ({ onSuccess, onCancel, returnUrl }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError(null);
    // Payment Element: validate + collect wallet / Link state before confirm (required for Apple Pay, Google Pay, Link).
    const { error: submitError } = await elements.submit();
    if (submitError) {
      setLoading(false);
      setError(submitError.message || 'Please complete the payment form.');
      return;
    }
    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
      confirmParams: {
        return_url:
          returnUrl ||
          (typeof window !== 'undefined' ? `${window.location.origin}/events?payment=success` : ''),
      },
    });
    setLoading(false);
    if (confirmError) {
      setError(confirmError.message || 'Payment failed');
      return;
    }
    // Succeeded immediately, or processing (webhook will fulfill). Redirect flows leave the page.
    const status = paymentIntent?.status;
    if (status && status !== 'succeeded' && status !== 'processing') {
      setError('Payment could not be completed. Please try again.');
      return;
    }
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PaymentElement
        options={{
          layout: 'tabs',
          wallets: { applePay: 'auto', googlePay: 'auto' },
        }}
      />
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
          variant="primary"
          className="flex-1 uppercase tracking-widest py-3 !bg-pxi-purple hover:!bg-pxi-purple shadow-[0_0_20px_rgba(216,74,255,0.4)]"
          disabled={!stripe || loading}
        >
          {loading ? <HugeiconsIcon icon={Loading02Icon} size={18} className="animate-spin mx-auto" /> : 'Pay now'}
        </Button>
      </div>
    </form>
  );
};

export function StripePaymentModal({ clientSecret, onSuccess, onCancel, open, returnUrl }) {
  const [stripePromise, setStripePromise] = useState(null);

  useEffect(() => {
    api.get('/api/vendor/config')
      .then((r) => loadStripe(r.publishableKey))
      .then(setStripePromise)
      .catch(() => setStripePromise(null));
  }, []);

  if (!open || !clientSecret) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center sm:py-6">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pxi-stripe-modal-title"
        className="relative z-[1] w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-4">
          <h3 id="pxi-stripe-modal-title" className="text-white text-xl font-black">
            Complete payment
          </h3>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-1 text-zinc-500 hover:bg-white/5 hover:text-white transition-colors"
            aria-label="Close"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={20} />
          </button>
        </div>
        {/* Explicit max-height so Link/card/phone fields can scroll on short viewports */}
        <div className="max-h-[min(78dvh,calc(100vh-7rem))] overflow-y-auto overscroll-y-contain px-5 py-5 touch-pan-y [scrollbar-gutter:stable]">
          {stripePromise ? (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: 'night',
                  variables: {
                    colorPrimary: '#d84aff',
                    borderRadius: '12px',
                  },
                },
              }}
            >
              <PaymentForm onSuccess={onSuccess} onCancel={onCancel} returnUrl={returnUrl} />
            </Elements>
          ) : (
            <div className="flex items-center justify-center py-12 text-zinc-500">
              <HugeiconsIcon icon={Loading02Icon} size={24} className="animate-spin" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
