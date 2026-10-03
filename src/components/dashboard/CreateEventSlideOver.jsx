'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Modal from '@/components/ui/Modal';

const CreateEventPage = dynamic(() => import('@/views/dashboard/CreateEventPage'), {
    ssr: false,
    loading: () => (
        <div className="space-y-5">
            <div className="h-5 w-40 animate-pulse rounded-full bg-pxi-field" />
            <div className="h-80 animate-pulse rounded-2xl bg-pxi-field" />
            <div className="h-56 animate-pulse rounded-2xl bg-pxi-field" />
        </div>
    ),
});

export default function CreateEventSlideOver({ open, onClose }) {
    const router = useRouter();
    const pathname = usePathname();
    const { isAuthenticated, authReady } = useAuth();
    const needsSignIn = open && authReady && !isAuthenticated;

    // A signed-out visitor never sees the sheet: sign-in comes first, then back to this page.
    useEffect(() => {
        if (!needsSignIn) return;
        onClose?.();
        router.push(`/login?redirect=${encodeURIComponent(pathname || '/dashboard/events')}`);
    }, [needsSignIn, onClose, pathname, router]);

    if (!isAuthenticated) return null;

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Create event"
            maxWidth="max-w-4xl"
            className="max-h-[calc(100vh-2rem)] overflow-y-auto"
        >
            <CreateEventPage embedded onCancel={onClose} onCreated={onClose} />
        </Modal>
    );
}
