'use client';

// First version: the quick view header and the numbers from the book row. The full quick view (coming up, contact,
// brought in by, past nights, timeline, email and log) replaces this in the next commit.
import { Drawer, KpiStrip, PersonLine } from '@/components/dashboard/ui/kit';
import { count, money } from '@/lib/dashFormat';

export default function OrganizerDrawer({ organizerId, row = null, onClose }) {
    if (!organizerId) return null;
    return (
        <Drawer open onClose={onClose} title={row ? <PersonLine person={row} size={44} /> : 'Organizer'}>
            {row ? (
                <div className="pt-3">
                    <KpiStrip
                        className="xl:w-full!"
                        items={[
                            { label: 'PXI revenue', value: money(row.lifetime?.pxiRevenueCents) },
                            { label: 'Tickets', value: count(row.lifetime?.tickets) },
                            { label: 'Nights', value: count(row.lifetime?.events) },
                        ]}
                    />
                </div>
            ) : null}
        </Drawer>
    );
}
