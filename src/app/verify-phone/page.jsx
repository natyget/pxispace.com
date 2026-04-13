import { Suspense } from 'react';
import VerifyPhonePage from '@/views/auth/VerifyPhonePage';

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-black" />}>
      <VerifyPhonePage />
    </Suspense>
  );
}
 