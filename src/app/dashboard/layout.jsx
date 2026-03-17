'use client';

import { Suspense } from 'react';
import DashboardLayout from '@/views/dashboard/DashboardLayout';

function DashboardFallback() {
  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-[#B026FF] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function Layout({ children }) {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <DashboardLayout>{children}</DashboardLayout>
    </Suspense>
  );
}
