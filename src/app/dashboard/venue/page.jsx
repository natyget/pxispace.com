import { Suspense } from 'react';
import VenueDashboardPage from '@/views/dashboard/VenueDashboardPage';

export default function Page() {
    return (
        <Suspense fallback={null}>
            <VenueDashboardPage />
        </Suspense>
    );
}
