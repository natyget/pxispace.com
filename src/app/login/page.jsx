import { Suspense } from 'react';
import EmailAuthPage from '@/views/auth/EmailAuthPage';

function LoginFallback() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center">
      <div className="w-10 h-10 border-2 border-[#B026FF] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <EmailAuthPage />
    </Suspense>
  );
}
