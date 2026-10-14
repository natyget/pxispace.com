'use client';

import { useEffect, useState } from 'react';
import { Button, Field, Panel, StateText } from '@/components/dashboard/ui/kit';
import { saveAlertPrefs } from '@/services/growth';

/** The Calendly or Cal.com link that goes into "Book a meeting" emails to organizers. */
export default function BookingLink({ initial }) {
    const [saved, setSaved] = useState(initial || '');
    const [text, setText] = useState(initial || '');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const [flash, setFlash] = useState(false);

    useEffect(() => {
        if (!flash) return undefined;
        const timer = setTimeout(() => setFlash(false), 2000);
        return () => clearTimeout(timer);
    }, [flash]);

    const changed = text.trim() !== saved;

    const save = async () => {
        setBusy(true);
        setError(null);
        try {
            const res = await saveAlertPrefs({ bookingUrl: text.trim() });
            const next = res.bookingUrl ?? text.trim();
            setSaved(next);
            setText(next);
            setFlash(true);
        } catch (err) {
            setError(err.message || 'That did not save. Try again.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <Panel title="Booking link" subtitle="Used in your Book a meeting emails to organizers.">
            <form
                className="space-y-4"
                onSubmit={(e) => {
                    e.preventDefault();
                    if (changed && !busy) save();
                }}
            >
                <Field
                    label="Calendly or Cal.com link"
                    placeholder="https://calendly.com/your-name"
                    inputMode="url"
                    autoComplete="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    value={text}
                    onChange={(e) => {
                        setText(e.target.value);
                        setFlash(false);
                    }}
                />
                <div className="flex items-center gap-3">
                    <Button type="submit" variant="secondary" disabled={busy || !changed}>
                        {busy ? 'Saving...' : 'Save'}
                    </Button>
                    {flash ? <StateText tone="good">Saved</StateText> : null}
                </div>
                {error ? <p className="text-[12px] text-red-300">{error}</p> : null}
            </form>
        </Panel>
    );
}
