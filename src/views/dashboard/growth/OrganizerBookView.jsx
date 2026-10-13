'use client';

// Dashboard 2 placeholder: replaced in this branch (see BRIEF-G-W*.md).
import { PageHeader, Notice } from '@/components/dashboard/ui/kit';

export default function OrganizerBookView({ surface = 'admin' }) {
    return (
        <div className="space-y-5 md:space-y-6" data-surface={surface}>
            <PageHeader title="Organizers" subtitle="Who is selling, who needs a call, and who brought them in." />
            <Notice>Being built.</Notice>
        </div>
    );
}
