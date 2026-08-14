'use client';

import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  ExpressCheckoutElement,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { HugeiconsIcon } from '@hugeicons/react';
import { Cancel01Icon, Loading02Icon } from '@hugeicons/core-free-icons';
import { api } from '@/services/api';
import Button from '@/components/ui/Button';
import { trackAddPaymentInfo } from '@/lib/analytics';

/**
 * Wallet buttons sit ABOVE the card form, which is what the Express Checkout
 * Element exists for — the Payment Element can only ever render Apple Pay as one
 * tab among equals. Both elements share the one Elements instance (and its
 * clientSecret), so either path confirms the same PaymentIntent.
 *
 * Apple Pay cannot be forced to always appear: Safari on Apple hardware with a
 * card in Wallet is the only place it can render, and the domain must be
 * registered in Stripe. Everywhere else this element renders nothing, so the
 * divider below is conditional to avoid a stranded separator.
 */
const EXPRESS_CHECKOUT_OPTIONS = {
  // One full-width button per row so the wallet reads as the primary action.
  layout: { maxColumns: 1, maxRows: 2 },
  buttonHeight: 52,
  // White on the dark glass modal, per Apple's contrast guidance.
  buttonTheme: { applePay: 'white', googlePay: 'white' },
  buttonType: { applePay: 'buy', googlePay: 'buy' },
  // Matches `features.link: 'never'` on the Elements provider.
  paymentMethods: { link: 'never' },
};

const PaymentForm = ({ onSuccess, onCancel, returnUrl, analytics }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Method the buyer picked in the Payment Element ('card' | 'apple_pay' | …),
  // the only place that value is observable before confirmation.
  const [paymentType, setPaymentType] = useState(null);
  const [walletsAvailable, setWalletsAvailable] = useState(false);

  const resolvedReturnUrl =
    returnUrl ||
    (typeof window !== 'undefined' ? `${window.location.origin}/events?payment=success` : '');

  /** Shared tail of both paths — the card form and the wallet confirm the same intent. */
  const confirmAndFinish = async () => {
    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
      confirmParams: { return_url: resolvedReturnUrl },
    });
    setLoading(false);
    if (confirmError) {
      setError(confirmError.message || 'Payment failed');
      return;
    }
    const status = paymentIntent?.status;
    if (status && status !== 'succeeded' && status !== 'processing') {
      setError('Payment could not be completed. Please try again.');
      return;
    }
    onSuccess();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError(null);
    const { error: submitError } = await elements.submit();
    if (submitError) {
      setLoading(false);
      setError(submitError.message || 'Please complete the payment form.');
      return;
    }
    // Details are complete and accepted by Elements — that is add_payment_info.
    // `purchase` stays server-side (Stripe webhook → Measurement Protocol).
    // Not awaited: the wrapper is sync and fail-silent, and nothing may sit
    // between the buyer and confirmPayment.
    if (analytics) trackAddPaymentInfo({ ...analytics, paymentType: paymentType || undefined });
    await confirmAndFinish();
  };

  /**
   * The wallet sheet has already collected payment details by the time this
   * fires. No `elements.submit()` here: the Elements instance was created with a
   * clientSecret so submit is not required, and calling it would validate the
   * still-empty card form below and reject the wallet payment.
   */
  const handleExpressConfirm = async (event) => {
    if (!stripe || !elements) return;
    setLoading(true);
    setError(null);
    if (analytics) {
      trackAddPaymentInfo({ ...analytics, paymentType: event?.expressPaymentType || undefined });
    }
    await confirmAndFinish();
  };

  return (
    <div className="space-y-6">
      <ExpressCheckoutElement
        options={EXPRESS_CHECKOUT_OPTIONS}
        onConfirm={handleExpressConfirm}
        onCancel={() => setLoading(false)}
        onAvailablePaymentMethodsChange={({ paymentMethods }) =>
          setWalletsAvailable(Boolean(paymentMethods))
        }
      />

      {walletsAvailable && (
        <div className="flex items-center gap-3" aria-hidden>
          <span className="h-px flex-1 bg-white/10" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
            or pay with card
          </span>
          <span className="h-px flex-1 bg-white/10" />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <PaymentElement
          onChange={(event) => setPaymentType(event?.value?.type ?? null)}
          options={{
            layout: 'tabs',
            // Wallets live in the Express Checkout Element above; leaving them on
            // here would render Apple Pay twice.
            wallets: { applePay: 'never', googlePay: 'never' },
          }}
        />
        {error && <p className="text-sm text-red-400 font-bold">{error}</p>}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3.5 rounded-full border-0 bg-white/5 text-white/80 text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all hover:scale-105"
          >
            Cancel
          </button>
          <Button
            type="submit"
            variant="primary"
            className="flex-1 uppercase tracking-widest py-3.5 rounded-full !bg-gradient-to-r from-[#d84aff] to-[#a855f7] text-white font-black text-xs shadow-[0_0_22px_rgba(216,74,255,0.5),0_0_8px_rgba(216,74,255,0.3)] hover:scale-105 transition-all border-0"
            disabled={!stripe || loading}
          >
            {loading ? <HugeiconsIcon icon={Loading02Icon} size={18} className="animate-spin mx-auto" /> : 'Pay now'}
          </Button>
        </div>
      </form>
    </div>
  );
};

/**
 * @param {Object} [props.analytics] event-scoped GA4 dimensions for the ticket
 *   being bought. Omit it (credits / campaign top-ups) and no ecommerce event
 *   is fired — only ticket sales belong in the commerce funnel.
 */
export function StripePaymentModal({ clientSecret, onSuccess, onCancel, open, returnUrl, analytics }) {
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
      <div className="absolute inset-0 bg-black/75 backdrop-blur-[16px]" onClick={onCancel} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pxi-stripe-modal-title"
        className="relative z-[1] w-full max-w-md overflow-hidden rounded-[2.5rem] bg-[rgba(26,26,26,0.6)] backdrop-blur-[36px] shadow-2xl border-0"
      >
        <div className="flex shrink-0 items-center justify-between px-6 pt-6 pb-2">
          <h3 id="pxi-stripe-modal-title" className="text-white text-xl font-black uppercase tracking-tight">
            Complete payment
          </h3>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full p-1.5 text-zinc-500 hover:bg-white/5 hover:text-white transition-colors"
            aria-label="Close"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={20} />
          </button>
        </div>
        <div className="max-h-[min(78dvh,calc(100vh-7rem))] overflow-y-auto overscroll-y-contain px-6 pb-6 pt-4 touch-pan-y [scrollbar-gutter:stable]">
          {stripePromise ? (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                features: {
                  link: 'never',
                },
                appearance: {
                  theme: 'night',
                  variables: {
                    colorPrimary: '#d84aff',
                    colorBackground: 'rgba(255, 255, 255, 0.03)',
                    colorText: '#ffffff',
                    colorTextSecondary: '#a1a1aa',
                    colorDanger: '#f87171',
                    borderRadius: '16px',
                    fontFamily: 'Inter, system-ui, sans-serif',
                  },
                  rules: {
                    '.Tabs': {
                      flexWrap: 'nowrap',
                      overflowX: 'auto',
                    },
                    '.Tab': {
                      border: 'none',
                      boxShadow: 'none',
                      backgroundColor: 'rgba(255, 255, 255, 0.04)',
                      borderRadius: '16px',
                      flex: '0 0 auto',
                      minWidth: '95px',
                    },
                    '.Tab--selected': {
                      backgroundColor: 'rgba(216, 74, 255, 0.15)',
                      color: '#ffffff',
                    },
                    '.Input': {
                      border: 'none',
                      boxShadow: 'none',
                      backgroundColor: 'rgba(255, 255, 255, 0.04)',
                      padding: '12px 20px',
                      borderRadius: '9999px',
                    },
                    '.Input:focus': {
                      boxShadow: '0 0 0 2px rgba(216, 74, 255, 0.4)',
                    },
                    '.Label': {
                      color: '#e4e4e7',
                      fontWeight: '700',
                      fontSize: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '6px',
                    }
                  }
                },
              }}
            >
              <PaymentForm
                onSuccess={onSuccess}
                onCancel={onCancel}
                returnUrl={returnUrl}
                analytics={analytics}
              />
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
