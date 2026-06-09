'use client';

import dynamic from 'next/dynamic';
import Modal from '@/components/ui/Modal';

const CreateEventPage = dynamic(() => import('@/views/dashboard/CreateEventPage'), {
    ssr: false,
    loading: () => (
        <div className="space-y-5">
            <div className="h-5 w-40 animate-pulse rounded-full bg-white/[0.06]" />
            <div className="glow-surface h-80 animate-pulse rounded-2xl" />
            <div className="glow-surface h-56 animate-pulse rounded-2xl" />
        </div>
    ),
});

export default function CreateEventSlideOver({ open, onClose }) {
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
