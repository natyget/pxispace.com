import { Suspense } from 'react';
import VendorUpgradePage from '@/views/dashboard/VendorUpgradePage';

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]" />}>
      <VendorUpgradePage />
    </Suspense>
  );
}
