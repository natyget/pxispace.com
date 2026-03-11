import { Suspense } from 'react';
import EmailAuthPage from '@/views/auth/EmailAuthPage';

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]" />}>
      <EmailAuthPage />
    </Suspense>
  );
}
