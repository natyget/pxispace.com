'use client';

// The organizer quick view (GET /api/growth/organizers/:id), from the right. Most useful first: who they are and
// what you can do, why to call now, the numbers, what is coming up, how to reach them, who brought them in, past
// nights, and everything the team has done. Email, log, assign and grant credits open inline at the top.

import { useCallback, useEffect, useRef, useState } from 'react';
import { Avatar, Button, Drawer, Notice, Skeleton } from '@/components/dashboard/ui/kit';
import { fetchOrganizer } from '@/services/growth';
import { cityLabel } from '@/lib/dashboardNavConfig';
import { shortDate } from '@/lib/dashFormat';
import LinkButton from './LinkButton';
import OrganizerComposer from './OrganizerComposer';
import { AssignForm, GrantCreditsForm, LogForm } from './OrganizerForms';
import { BroughtInBy, ComingUp, Contact, Numbers, PastNights, Timeline, WhyNow } from './OrganizerSections';
import { NEEDS_LATEST_API, errorLine, isOlderApi, useGrowthAccess } from './useGrowthAccess';

/**
 * organizerId: the open organizer (null closes it). row: their row from the list, so the header shows at once.
 * onChanged(record): the quick view changed something (a touch, a new owner); the list can update its row.
 */
export default function OrganizerDrawer({ organizerId, row = null, surface = 'admin', onClose, onChanged }) {
    if (!organizerId) return null;
    return <OpenDrawer key={organizerId} organizerId={organizerId} row={row} surface={surface} onClose={onClose} onChanged={onChanged} />;
}

function Header({ person }) {
    if (!person) {
        return (
            <div className="flex items-center gap-4" aria-hidden="true">
                <div className="h-14 w-14 animate-pulse rounded-full bg-pxi-field" />
                <div className="space-y-2">
                    <div className="h-5 w-36 animate-pulse rounded-full bg-pxi-field" />
                    <div className="h-3 w-24 animate-pulse rounded-full bg-pxi-field" />
                </div>
            </div>
        );
    }
    return (
        <div className="flex min-w-0 items-center gap-4">
            <Avatar person={person} size={56} />
            <div className="min-w-0">
                <p className="truncate text-[20px] font-semibold leading-6 text-white">{person.name || `@${person.username}`}</p>
                {person.name ? <p className="truncate text-[13px] text-white/50">@{person.username}</p> : null}
                <p className="mt-1 flex flex-wrap gap-x-3 text-[12px] font-normal text-white/45">
                    {person.cityCode ? <span>{cityLabel(person.cityCode)}</span> : null}
                    {person.joinedAt ? <span>Joined {shortDate(person.joinedAt)}</span> : null}
                </p>
            </div>
        </div>
    );
}

function OpenDrawer({ organizerId, row, surface, onClose, onChanged }) {
    const { access } = useGrowthAccess();
    const can = access?.can || {};
    const [state, setState] = useState({ organizer: null, error: null });
    const [mode, setMode] = useState(null); // null | 'email' | 'log' | 'assign' | 'credits'
    const [notice, setNotice] = useState(null);
    const actionRef = useRef(null);

    useEffect(() => {
        let cancelled = false;
        fetchOrganizer(organizerId)
            .then((res) => {
                if (!cancelled) setState({ organizer: res.organizer, error: null });
            })
            .catch((error) => {
                if (!cancelled) setState({ organizer: null, error });
            });
        return () => {
            cancelled = true;
        };
    }, [organizerId]);

    const organizer = state.organizer;

    // Quietly read the record again after a change, so the numbers and owner are what the server says.
    const refresh = useCallback(async () => {
        try {
            const res = await fetchOrganizer(organizerId);
            setState({ organizer: res.organizer, error: null });
            onChanged?.(res.organizer);
        } catch {
            // keep what is on screen
        }
    }, [organizerId, onChanged]);

    const open = (next) => {
        setNotice(null);
        setMode(next);
        requestAnimationFrame(() => actionRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' }));
    };
    const close = () => setMode(null);

    // A new email or log shows at the top of the timeline at once; the record is read again behind it.
    const addTouch = (touch, text, patch = {}) => {
        if (organizer && touch) {
            const next = {
                ...organizer,
                ...patch,
                touches: [touch, ...(organizer.touches || [])],
                lastTouch: { kind: touch.kind, at: touch.at, actor: touch.actor },
            };
            setState({ organizer: next, error: null });
            onChanged?.(next);
        }
        setMode(null);
        setNotice({ tone: 'good', text });
        refresh();
    };

    let body;
    if (state.error) {
        const missing = state.error.status === 404 && state.error.code;
        body = (
            <Notice tone="error">
                {isOlderApi(state.error) && !missing ? NEEDS_LATEST_API : missing ? 'This organizer is not in your book.' : errorLine(state.error, 'Could not load this organizer.')}
            </Notice>
        );
    } else if (!organizer) {
        body = (
            <div className="space-y-4">
                <Skeleton className="h-10 w-2/3" />
                <Skeleton className="h-24" />
                <Skeleton className="h-40" />
            </div>
        );
    } else {
        const unclaimed = !organizer.owner;
        const canContact = Boolean(can.contactOrganizers);
        const hasActions = canContact || (can.raiseClaims && unclaimed) || (can.assign && unclaimed) || surface === 'admin';
        let action = null;
        if (mode === 'email') {
            action = (
                <OrganizerComposer
                    organizer={organizer}
                    surface={surface}
                    onCancel={close}
                    onSent={(touch) => addTouch(touch, 'Email sent. It is on the timeline.')}
                />
            );
        } else if (mode === 'log') {
            action = (
                <LogForm
                    organizer={organizer}
                    onCancel={close}
                    onSaved={(touch, kind) =>
                        addTouch(touch, kind === 'OPT_OUT' ? 'Saved. The team cannot email them now.' : 'Saved to the timeline.', kind === 'OPT_OUT' ? { emailOptedOut: true } : {})
                    }
                />
            );
        } else if (mode === 'assign') {
            action = (
                <AssignForm
                    organizer={organizer}
                    onCancel={close}
                    onDone={() => {
                        setMode(null);
                        setNotice({ tone: 'good', text: 'Saved. The new seller is credited from today.' });
                        refresh();
                    }}
                />
            );
        } else if (mode === 'credits') {
            action = (
                <GrantCreditsForm
                    organizer={organizer}
                    onCancel={close}
                    onDone={(amount, taken) => {
                        setMode(null);
                        setNotice({ tone: 'good', text: taken ? `Took ${amount} in credits from @${organizer.username}.` : `Gave ${amount} in credits to @${organizer.username}.` });
                    }}
                />
            );
        } else if (hasActions) {
            action = (
                <div className="flex flex-wrap gap-2">
                    {canContact ? (
                        <Button variant="primary" onClick={() => open('email')}>
                            Email
                        </Button>
                    ) : null}
                    {canContact ? <Button onClick={() => open('log')}>Log</Button> : null}
                    {can.raiseClaims && unclaimed ? (
                        <LinkButton href={`/dashboard/sales/claims?claim=organizer&username=${encodeURIComponent(organizer.username)}`}>Claim</LinkButton>
                    ) : null}
                    {can.assign && unclaimed ? <Button onClick={() => open('assign')}>Assign</Button> : null}
                    {surface === 'admin' ? <Button onClick={() => open('credits')}>Grant credits</Button> : null}
                </div>
            );
        }

        body = (
            <div className="space-y-7 pt-2">
                {notice ? <Notice tone={notice.tone}>{notice.text}</Notice> : null}
                {action ? (
                    <div ref={actionRef} className={mode ? 'scroll-mt-2 border-b border-white/[0.08] pb-7' : ''}>
                        {action}
                    </div>
                ) : null}
                <WhyNow signal={organizer.signal} />
                <Numbers organizer={organizer} />
                <ComingUp nights={organizer.upcoming} />
                <Contact organizer={organizer} />
                <BroughtInBy organizer={organizer} canAssign={Boolean(can.assign)} onMove={() => open('assign')} />
                <PastNights nights={organizer.past} />
                <Timeline touches={organizer.touches} />
            </div>
        );
    }

    return (
        <Drawer open onClose={onClose} title={<Header person={organizer || row} />}>
            {body}
        </Drawer>
    );
}
