'use client';

// The email composer, inline in the organizer quick view. The templates come from the API with {first_name},
// {sender_name} and {booking_link} left in; the preview fills them for display only, and what is sent is the raw
// text (the server fills the placeholders and adds PXI's legal footer).

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Button, Field, Notice, TextArea, WordTabs } from '@/components/dashboard/ui/kit';
import { useAuth } from '@/contexts/AuthContext';
import { emailOrganizer, fetchAlertPrefs, fetchEmailTemplates } from '@/services/growth';
import { errorLine } from './useGrowthAccess';
import { firstNameOf } from './bookFormat';

// The Offer template leaves this for what is on offer, and the server will not send an email that still has it.
const OFFER_MARKER = '[your offer]';

const SEND_ERRORS = {
    OPTED_OUT: 'They asked the team to stop emailing.',
    TOO_SOON: 'The team already emailed them 3 times this week.',
    NO_EMAIL: 'No email address on this account.',
};

function viewerNameOf(user) {
    return user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.username || 'The PXI team';
}

export default function OrganizerComposer({ organizer, surface, onSent, onCancel }) {
    const { user } = useAuth();
    const [templates, setTemplates] = useState(null);
    const [bookingUrl, setBookingUrl] = useState('');
    const [tab, setTab] = useState('blank');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const bodyRef = useRef(null);

    // Templates and the sender's booking link, once. A failure leaves the blank page, which still works.
    useEffect(() => {
        let cancelled = false;
        fetchEmailTemplates()
            .then((res) => {
                if (cancelled) return;
                const list = res?.templates || [];
                setTemplates(list);
                if (list.length) {
                    setTab(list[0].key);
                    setSubject(list[0].subject || '');
                    setBody(list[0].body || '');
                }
            })
            .catch(() => {
                if (!cancelled) setTemplates([]);
            });
        fetchAlertPrefs()
            .then((res) => {
                if (!cancelled) setBookingUrl(res?.bookingUrl || '');
            })
            .catch(() => {});
        return () => {
            cancelled = true;
        };
    }, []);

    const tabs = useMemo(() => [...(templates || []).map((t) => ({ key: t.key, label: t.label })), { key: 'blank', label: 'Blank' }], [templates]);

    const pick = (key) => {
        setTab(key);
        setError(null);
        const template = (templates || []).find((t) => t.key === key);
        setSubject(template?.subject || '');
        setBody(template?.body || '');
        // Put the cursor on the offer marker, so typing replaces it.
        const at = (template?.body || '').indexOf(OFFER_MARKER);
        if (at >= 0) {
            requestAnimationFrame(() => {
                const box = bodyRef.current;
                if (!box) return;
                box.focus();
                box.setSelectionRange(at, at + OFFER_MARKER.length);
            });
        }
    };

    const fill = (text) =>
        String(text || '')
            .replaceAll('{first_name}', firstNameOf(organizer))
            .replaceAll('{sender_name}', viewerNameOf(user))
            .replaceAll('{booking_link}', bookingUrl || 'your booking link');

    const optedOut = Boolean(organizer.emailOptedOut);
    const noEmail = !organizer.email;
    const missingLink = body.includes('{booking_link}') && !bookingUrl;
    const offerOpen = body.includes(OFFER_MARKER) || subject.includes(OFFER_MARKER);
    const alertsHref = surface === 'sales' ? '/dashboard/sales/alerts' : '/dashboard/admin/alerts';

    const send = async () => {
        setBusy(true);
        setError(null);
        try {
            const res = await emailOrganizer(organizer.id, { subject: subject.trim(), body, template: tab === 'blank' ? undefined : tab });
            onSent?.(res?.touch || null);
        } catch (err) {
            setError(SEND_ERRORS[err?.code] || errorLine(err, 'Could not send the email.'));
            setBusy(false);
        }
    };

    if (optedOut || noEmail) {
        return (
            <div className="space-y-3">
                <p className="text-[14px] text-amber-300">{optedOut ? SEND_ERRORS.OPTED_OUT : SEND_ERRORS.NO_EMAIL}</p>
                <Button variant="secondary" onClick={onCancel}>
                    Close
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <WordTabs items={tabs} value={tab} onChange={pick} />
            <p className="text-[12px] text-white/45">To {organizer.email}</p>
            <Field label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={150} />
            <TextArea ref={bodyRef} label="Message" rows={8} value={body} onChange={(e) => setBody(e.target.value)} maxLength={4000} />

            {offerOpen ? <p className="text-[13px] text-amber-300">Replace {OFFER_MARKER} with what you are offering.</p> : null}

            {missingLink ? (
                <p className="text-[13px] text-amber-300">
                    You have not saved a booking link yet.{' '}
                    <Link href={alertsHref} className="underline">
                        Add it under Email alerts
                    </Link>
                    .
                </p>
            ) : null}

            {subject.trim() || body.trim() ? (
                <div className="border-t border-white/[0.08] pt-4">
                    <p className="text-[12px] font-medium text-white/45">What they will see</p>
                    <p className="mt-2 text-[14px] font-semibold text-white">{fill(subject)}</p>
                    <p className="mt-1.5 whitespace-pre-wrap text-[13px] leading-5 text-white/60">{fill(body)}</p>
                </div>
            ) : null}

            {error ? <Notice tone="error">{error}</Notice> : null}

            <div className="flex gap-2">
                <Button variant="primary" disabled={busy || offerOpen || !subject.trim() || !body.trim()} onClick={send}>
                    {busy ? 'Sending' : 'Send'}
                </Button>
                <Button variant="quiet" disabled={busy} onClick={onCancel}>
                    Cancel
                </Button>
            </div>
        </div>
    );
}
