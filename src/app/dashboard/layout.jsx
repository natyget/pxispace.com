import { Suspense } from 'react';
import DashboardLayout from '@/views/dashboard/DashboardLayout';
import DashboardPageLoading from '@/components/dashboard/DashboardPageLoading';
import { DashboardDataProvider } from '@/lib/dashboardStore';

export default function Layout({ children }) {
  return (
    <DashboardDataProvider>
      <DashboardLayout>
        <Suspense fallback={<DashboardPageLoading />}>{children}</Suspense>
      </DashboardLayout>
    </DashboardDataProvider>
  );
}
