'use client';

// Email alerts: which kinds of thing reach this person's inbox, and how (right away, once a day, or not at all).
// Choosing saves straight away. Also the booking link that goes into "Book a meeting" emails to organizers, and a
// test email. Used by the control room (surface="admin") and the member Sales tab (surface="sales").

import { useEffect, useState } from 'react';
import { Button, Notice, PageHeader, Panel, Skeleton } from '@/components/dashboard/ui/kit';
import { fetchAlertPrefs, fetchGrowthAccess, saveAlertPrefs, sendTestAlert } from '@/services/growth';
import AlertRow from './today/AlertRow';
import ApiNotice from './today/ApiNotice';
import BookingLink from './today/BookingLink';
import { useLoad } from './today/useLoad';

const KINDS = {
    claims: { name: 'Claims', line: 'Claims waiting for your decision' },
    support: { name: 'Support', line: 'Support tickets' },
    reports: { name: 'Reports', line: 'Reports to review' },
    venues: { name: 'Venues', line: 'Venue matches to confirm' },
    accounts: { name: 'Calls', line: 'Organizers worth a call' },
    setup: { name: 'Setup', line: 'Shares and splits not set yet' },
    payouts: { name: 'Payouts', line: 'Organizer payouts that failed' },
};
const titleCase = (key) => `${String(key).charAt(0).toUpperCase()}${String(key).slice(1)}`;

async function loadAlerts() {
    const [prefs, access] = await Promise.all([fetchAlertPrefs(), fetchGrowthAccess().catch(() => null)]);
    return { prefs, canBook: Boolean(access?.can?.contactOrganizers) };
}

export default function AlertsView({ surface = 'admin' }) {
    const alerts = useLoad(loadAlerts);
    const [chosen, setChosen] = useState({});
    const [saved, setSaved] = useState(null);
    const [error, setError] = useState(null);
    const [test, setTest] = useState({ busy: false, done: false, error: null });

    // "Saved" stays for two seconds, then goes.
    useEffect(() => {
        if (!saved) return undefined;
        const timer = setTimeout(() => setSaved(null), 2000);
        return () => clearTimeout(timer);
    }, [saved]);

    const d = alerts.data;
    const stored = d?.prefs.prefs || {};
    const email = d?.prefs.email;

    const choose = async (category, value) => {
        const before = chosen[category] ?? stored[category];
        if (before === value) return;
        setChosen((prev) => ({ ...prev, [category]: value }));
        setError(null);
        setSaved(null);
        try {
            await saveAlertPrefs({ prefs: { [category]: value } });
            setSaved(category);
        } catch (err) {
            setChosen((prev) => ({ ...prev, [category]: before }));
            setError(err.message || 'That did not save. Try again.');
        }
    };

    const sendTest = async () => {
        setTest({ busy: true, done: false, error: null });
        try {
            await sendTestAlert();
            setTest({ busy: false, done: true, error: null });
        } catch (err) {
            setTest({ busy: false, done: false, error: err.message || 'That did not send. Try again.' });
        }
    };

    const showBooking = Boolean(d?.canBook);

    return (
        <div className="space-y-5 md:space-y-6" data-surface={surface}>
            <PageHeader title="Email alerts" subtitle={email ? `Sent to ${email}.` : null} />

            {alerts.error ? <ApiNotice error={alerts.error} /> : null}
            {alerts.loading ? <Skeleton className="h-96" /> : null}

            {d ? (
                <div className={`grid items-start gap-5 ${showBooking ? 'xl:grid-cols-[minmax(0,1fr)_360px]' : ''}`}>
                    <Panel className="min-w-0">
                        {error ? (
                            <Notice tone="error" className="mb-3">
                                {error}
                            </Notice>
                        ) : null}
                        <ul className="space-y-1.5">
                            {(d.prefs.categories || []).map((category) => (
                                <AlertRow
                                    key={category}
                                    name={KINDS[category]?.name || titleCase(category)}
                                    line={KINDS[category]?.line || ''}
                                    value={chosen[category] ?? stored[category]}
                                    saved={saved === category}
                                    onChoose={(value) => choose(category, value)}
                                />
                            ))}
                        </ul>
                        <div className="mt-4 flex flex-wrap items-center gap-3">
                            <Button variant="quiet" disabled={test.busy} onClick={sendTest}>
                                {test.busy ? 'Sending...' : 'Send me a test'}
                            </Button>
                            {test.done ? <span className="text-[13px] font-semibold text-emerald-300">Sent{email ? ` to ${email}` : ''}.</span> : null}
                            {test.error ? <span className="text-[13px] text-red-300">{test.error}</span> : null}
                        </div>
                    </Panel>

                    {showBooking ? (
                        <div className="min-w-0">
                            <BookingLink initial={d.prefs.bookingUrl} />
                        </div>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
}
