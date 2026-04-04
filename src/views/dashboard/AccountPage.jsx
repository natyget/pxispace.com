'use client';

import { useState } from 'react';
import { UserCog, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/auth';

const DELETION_ITEMS = [
    'Your profile, name, username, and avatar',
    'All uploaded photos and videos',
    'Your PXI Passport and digital identity',
    'All biometric face data (FaceVector)',
    'Event history, tickets, and scrapbooks',
    'Odyssey points and activity feed',
    'Your Stripe connection and payout history',
];

export default function AccountPage() {
    const { logout } = useAuth();

    const [showConfirm, setShowConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState('');

    const handleDelete = async () => {
        setDeleting(true);
        setError('');
        try {
            await authService.deleteAccount();
            await logout();
            // Force full reload so session is terminated immediately (no ghost account)
            window.location.href = '/';
        } catch (err) {
            const status = err?.status;
            const code = err?.code;
            const msg = err?.data?.error || err?.message;
            if (status === 400 && msg === 'Account already deleted') {
                await logout();
                window.location.href = '/';
                return;
            }
            if (status === 401 || code === 'ACCOUNT_DELETED' || code === 'INVALID_TOKEN') {
                await logout();
                window.location.href = '/';
                return;
            }
            setError(msg || 'Failed to delete account. Please try again.');
            setDeleting(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <UserCog size={14} className="text-pxi-purple" />
                    <span className="text-pxi-purple text-xs font-bold uppercase tracking-widest">
                        Account
                    </span>
                </div>
                <h1 className="text-2xl font-black text-white tracking-tight">
                    Account Settings
                </h1>
                <p className="text-zinc-500 text-sm mt-1">
                    Delete your account and associated data.
                </p>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                    <AlertTriangle size={15} className="text-red-400" />
                    <h2 className="text-red-400 font-bold text-sm uppercase tracking-widest">
                        Danger Zone
                    </h2>
                </div>

                {!showConfirm ? (
                    <>
                        <p className="text-zinc-400 text-sm leading-relaxed">
                            Permanently delete your PXI account and all associated data.
                            This action cannot be undone.
                        </p>
                        <button
                            onClick={() => setShowConfirm(true)}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/30 text-red-400 text-sm font-bold hover:bg-red-500/10 transition-all"
                        >
                            <Trash2 size={14} />
                            Delete My Account
                        </button>
                    </>
                ) : (
                    <div className="space-y-4">
                        <p className="text-white font-bold text-sm">
                            The following will be permanently deleted:
                        </p>
                        <ul className="space-y-2">
                            {DELETION_ITEMS.map((item) => (
                                <li key={item} className="flex items-start gap-2 text-zinc-400 text-sm">
                                    <span className="text-red-500 mt-0.5 flex-shrink-0">×</span>
                                    {item}
                                </li>
                            ))}
                        </ul>

                        {error && (
                            <p className="text-red-400 text-sm px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20">
                                {error}
                            </p>
                        )}

                        <div className="flex items-center gap-3 pt-1">
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {deleting ? (
                                    <>
                                        <Loader2 size={14} className="animate-spin" />
                                        Deleting…
                                    </>
                                ) : (
                                    <>
                                        <Trash2 size={14} />
                                        Yes, Permanently Delete
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => { setShowConfirm(false); setError(''); }}
                                disabled={deleting}
                                className="px-4 py-2.5 rounded-xl border border-white/10 text-zinc-400 text-sm font-medium hover:bg-white/5 transition-all disabled:opacity-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
