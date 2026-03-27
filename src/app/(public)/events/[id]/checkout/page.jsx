import { Suspense } from 'react';
import EventCheckout from '@/views/eventDetails/EventCheckout';

function CheckoutFallback() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center text-zinc-500 text-sm">
      Loading checkout...
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<CheckoutFallback />}>
      <EventCheckout basePath="/events" />
    </Suspense>
  );
}
