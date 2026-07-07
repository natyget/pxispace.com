'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { canAccessAdminDashboard } from '@/lib/adminAccess';

export default function AdminSectionLayout({ children }) {
    const { user, isAuthenticated, authReady, authRefreshing } = useAuth();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const ready = mounted && authReady && !authRefreshing;

    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 0);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (!ready) return;
        if (!isAuthenticated || !user) {
            router.replace('/login');
            return;
        }
        if (!canAccessAdminDashboard(user)) {
            router.replace('/dashboard');
        }
    }, [ready, isAuthenticated, user, router]);

    if (!ready || !isAuthenticated || !user || !canAccessAdminDashboard(user)) {
        return (
            <div className="flex min-h-[40vh] items-center justify-center text-white/60 text-sm">
                Loading...
            </div>
        );
    }

    return children;
}
