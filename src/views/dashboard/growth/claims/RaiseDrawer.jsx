'use client';

import { Drawer, WordTabs } from '@/components/dashboard/ui/kit';
import OrganizerClaimForm from './OrganizerClaimForm';
import VenueClaimForm from './VenueClaimForm';

const TABS = [
    { key: 'organizer', label: 'Organizer' },
    { key: 'venue', label: 'Venue' },
];

/** The new-claim drawer. `state` is { tab } while open, null when closed. The forms start fresh each time it opens. */
export default function RaiseDrawer({ state, onTab, onClose, onSent, cityName }) {
    const tab = state?.tab || 'organizer';
    return (
        <Drawer open={Boolean(state)} onClose={onClose} title="New claim">
            <WordTabs items={TABS} value={tab} onChange={onTab} className="mb-5" />
            {tab === 'venue' ? <VenueClaimForm cityName={cityName} onSent={onSent} /> : <OrganizerClaimForm onSent={onSent} />}
        </Drawer>
    );
}
