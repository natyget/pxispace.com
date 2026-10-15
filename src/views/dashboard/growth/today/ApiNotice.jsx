'use client';

import { Notice } from '@/components/dashboard/ui/kit';

/** A load that failed. A 404 from /api/growth means the API is older than this page. */
export default function ApiNotice({ error, className = '' }) {
    if (!error) return null;
    if (error.status === 404) return <Notice className={className}>This needs the latest PXI API.</Notice>;
    return (
        <Notice tone="error" className={className}>
            {error.message || 'That did not load. Try again.'}
        </Notice>
    );
}
