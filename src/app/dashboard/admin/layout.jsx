'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { canAccessAdminDashboard } from '@/lib/adminAccess';

export default function AdminSectionLayout({ children }) {
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        if (!isAuthenticated || !user) {
            router.replace('/login');
            return;
        }
        if (!canAccessAdminDashboard(user)) {
            router.replace('/dashboard');
        }
    }, [mounted, isAuthenticated, user, router]);

    if (!mounted || !isAuthenticated || !canAccessAdminDashboard(user)) {
        return (
            <div className="flex min-h-[40vh] items-center justify-center text-white/60 text-sm">
                Loading…
            </div>
        );
    }

    return children;
}
