import { Suspense } from 'react';
import AdsPage from '@/views/dashboard/AdsPage';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AdsPage />
    </Suspense>
  );
}
