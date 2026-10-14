'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Panel, WordTabs } from '@/components/dashboard/ui/kit';
import { count } from '@/lib/dashFormat';
import { deleteFeedItem } from '@/services/feed';

const PEOPLE_TABS = [
    { key: 'uploaders', label: 'Uploaders' },
    { key: 'chatters', label: 'Chatters' },
    { key: 'engagers', label: 'Engagers' },
];
const PEOPLE_EMPTY = {
    uploaders: 'No uploads yet.',
    chatters: 'No chat yet.',
    engagers: 'No comments or reactions yet.',
};

/** The five people who did the most, one list at a time. */
function PeopleList({ media, behavior }) {
    const [tab, setTab] = useState('uploaders');
    const people = { uploaders: media?.topUploaders, chatters: behavior?.topChatters, engagers: behavior?.topEngagers }[tab] || [];
    return (
        <div className="min-w-0">
            <h3 className="mb-3 text-[14px] font-semibold text-white/70">People who made it</h3>
            <WordTabs items={PEOPLE_TABS} value={tab} onChange={setTab} />
            {people.length ? (
                <ul className="mt-4 space-y-1.5">
                    {people.map((person, index) => (
                        <li key={person.userId} className="flex items-center gap-3 rounded-2xl bg-pxi-field px-3 py-2.5">
                            <span className="w-4 shrink-0 text-center text-[12px] font-semibold text-white/35">{index + 1}</span>
                            {person.avatarUrl ? (
                                <img src={person.avatarUrl} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
                            ) : (
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-[12px] font-semibold text-white">
                                    {(person.name || person.username || '?').slice(0, 1).toUpperCase()}
                                </span>
                            )}
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-[14px] font-semibold text-white">{person.name || person.username || 'Guest'}</p>
                                {person.username ? <p className="truncate text-[12px] text-white/45">@{person.username}</p> : null}
                            </div>
                            <span className="shrink-0 text-[13px] font-semibold tabular-nums text-white/80">{count(person.count)}</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="mt-4 text-[14px] text-white/50">{PEOPLE_EMPTY[tab]}</p>
            )}
        </div>
    );
}

/** Most-reacted media with host moderation (remove = the backend's Bouncer permissions). */
function TopMoments({ moments, onRemoved, onPromote }) {
    const [busyId, setBusyId] = useState(null);
    const [error, setError] = useState(null);

    const remove = async (mediaId) => {
        if (!window.confirm('Remove this media from the event for everyone? This cannot be undone.')) return;
        setBusyId(mediaId);
        setError(null);
        try {
            await deleteFeedItem(mediaId);
            onRemoved?.(mediaId);
        } catch (err) {
            setError(err.message || 'Failed to remove media');
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="min-w-0">
            <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-[14px] font-semibold text-white/70">Top moments</h3>
                {moments?.length && onPromote ? <Button size="sm" onClick={onPromote}>Marketing kit</Button> : null}
            </div>
            {error ? <p className="mb-3 text-[13px] text-red-300">{error}</p> : null}
            {moments?.length ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                    {moments.map((m) => (
                        <div key={m.mediaId} className="group relative overflow-hidden rounded-2xl bg-pxi-field">
                            <img src={m.thumbnailUrl || m.r2Url} alt="" className="aspect-[3/4] w-full object-cover" loading="lazy" />
                            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-black/70 px-3 py-2">
                                <div className="min-w-0">
                                    <p className="truncate text-[12px] font-semibold text-white">
                                        {m.author?.username ? `@${m.author.username}` : m.author?.name || 'Guest'}
                                    </p>
                                    <p className="text-[11px] text-white/60">{count(m.reactions)} reactions</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => remove(m.mediaId)}
                                    disabled={busyId === m.mediaId}
                                    className="shrink-0 text-[12px] font-semibold text-red-300 opacity-100 transition hover:text-red-200 disabled:opacity-60 md:opacity-0 md:group-hover:opacity-100"
                                >
                                    {busyId === m.mediaId ? '...' : 'Remove'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-[14px] text-white/50">Guests have not reacted to anything yet.</p>
            )}
        </div>
    );
}

export default function AfterPanel({ detail, onPromote, onRemoved }) {
    const router = useRouter();
    return (
        <Panel
            title="After the night"
            id="top-moments-panel"
            action={<Button variant="quiet" size="sm" onClick={() => router.push('/dashboard/events')}>Plan the next event</Button>}
        >
            <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
                <TopMoments moments={detail.behavior?.topMoments} onPromote={onPromote} onRemoved={onRemoved} />
                <PeopleList media={detail.media} behavior={detail.behavior} />
            </div>
        </Panel>
    );
}
