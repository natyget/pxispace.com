'use client';

// Dashboard 2 placeholder: replaced in this branch (see BRIEF-G-W*.md).
import { PageHeader, Notice } from '@/components/dashboard/ui/kit';

export default function TeamView({ surface = 'admin' }) {
    return (
        <div className="space-y-5 md:space-y-6" data-surface={surface}>
            <PageHeader title="Your team" subtitle="Your ambassadors and the part of your share each one gets." />
            <Notice>Being built.</Notice>
        </div>
    );
}
