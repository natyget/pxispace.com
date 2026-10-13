'use client';

// Dashboard 2 placeholder: replaced in this branch (see BRIEF-G-W*.md).
import { PageHeader, Notice } from '@/components/dashboard/ui/kit';

export default function EarningsView({ surface = 'admin' }) {
    return (
        <div className="space-y-5 md:space-y-6" data-surface={surface}>
            <PageHeader title="Earnings" subtitle="What you have earned, what is on the way, and what has been paid." />
            <Notice>Being built.</Notice>
        </div>
    );
}
