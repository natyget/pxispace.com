import { Suspense } from 'react';
import NotificationsPage from '@/views/dashboard/NotificationsPage';

function NotificationsFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-[#B026FF] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<NotificationsFallback />}>
      <NotificationsPage />
    </Suspense>
  );
}
