'use client';

import { useCallback, useEffect, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Loading02Icon, ShieldBanIcon } from '@hugeicons/core-free-icons';
import { getBlockedUsers, unblockUser } from '@/services/safety';
import UserAvatar from '@/components/ui/UserAvatar';

export default function BlockedAccountsSection() {
    const [blocks, setBlocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [unblockingId, setUnblockingId] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await getBlockedUsers();
            setBlocks(res.blocks ?? []);
        } catch (e) {
            setError(e?.message || 'Could not load blocked accounts.');
            setBlocks([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const handleUnblock = async (blockedId, label) => {
        if (!window.confirm(`Unblock ${label}? They will appear in your feed again.`)) return;
        setUnblockingId(blockedId);
        try {
            await unblockUser(blockedId);
            setBlocks((prev) => prev.filter((b) => b.blockedUser.id !== blockedId));
        } catch (e) {
            window.alert(e?.message || 'Could not unblock. Please try again.');
        } finally {
            setUnblockingId(null);
        }
    };

    return (
        <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-5 space-y-4">
            <div className="flex items-center gap-2">
                <HugeiconsIcon icon={ShieldBanIcon} size={16} className="text-zinc-400" />
                <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-300">
                    Blocked accounts
                </h2>
            </div>
            <p className="text-sm text-zinc-500 leading-relaxed">
                People you block are hidden from your feed. Unblock them here without opening their profile.
            </p>

            {loading ? (
                <div className="flex items-center gap-2 text-zinc-500 text-sm py-4">
                    <HugeiconsIcon icon={Loading02Icon} size={16} className="animate-spin" />
                    Loading…
                </div>
            ) : error ? (
                <div className="space-y-2">
                    <p className="text-sm text-red-400">{error}</p>
                    <button
                        type="button"
                        onClick={() => void load()}
                        className="text-sm font-semibold text-pxi-purple hover:text-white"
                    >
                        Retry
                    </button>
                </div>
            ) : blocks.length === 0 ? (
                <p className="text-sm text-zinc-500 py-2">You have not blocked anyone.</p>
            ) : (
                <ul className="divide-y divide-white/10">
                    {blocks.map((entry) => {
                        const u = entry.blockedUser;
                        const handle = u.username?.replace(/^@/, '') || 'member';
                        const busy = unblockingId === u.id;
                        return (
                            <li key={entry.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                                <UserAvatar
                                    user={{ avatarUrl: u.avatarUrl, username: handle }}
                                    size={40}
                                    rounded="full"
                                />
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-white truncate">@{handle}</p>
                                    <p className="text-xs text-zinc-500">Blocked</p>
                                </div>
                                <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => void handleUnblock(u.id, `@${handle}`)}
                                    className="shrink-0 rounded-full border border-pxi-purple/40 bg-pxi-purple/15 px-3 py-1.5 text-xs font-bold text-pxi-purple hover:bg-pxi-purple/25 disabled:opacity-50"
                                >
                                    {busy ? '…' : 'Unblock'}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
