'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    CheckCircle2,
    Smartphone,
    Shield,
    User,
    AtSign,
    Globe,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function PassportPage() {
    const { user } = useAuth();

    if (!user?.isPassportIssued) {
        return <PassportNotIssued />;
    }

    return <PassportIssued user={user} />;
}

// ─── Passport issued ──────────────────────────────────────────────────────────

function PassportIssued({ user }) {
    const [mounted, setMounted] = useState(false);
    const avatarFallback = user?.name?.charAt(0)?.toUpperCase() || '?';

    useEffect(() => setMounted(true), []);

    return (
        <div className="max-w-xl mx-auto space-y-6">
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <Shield size={14} className="text-pxi-purple" />
                    <span className="text-pxi-purple text-xs font-bold uppercase tracking-widest">
                        PXI Passport
                    </span>
                </div>
                <h1 className="text-2xl font-black text-white tracking-tight">
                    Your Digital Identity
                </h1>
                <p className="text-zinc-500 text-sm mt-1">
                    Your passport has been issued and is active.
                </p>
            </div>

            {/* Passport card */}
            <div
                className="relative overflow-hidden rounded-2xl p-6"
                style={{
                    background: 'linear-gradient(135deg, #1a0a2e 0%, #0d0d0d 60%, #1a0a2e 100%)',
                    border: '1px solid rgba(176,38,255,0.25)',
                    boxShadow: '0 0 40px rgba(176,38,255,0.08)',
                }}
            >
                {/* Corner decoration */}
                <div
                    className="absolute top-0 right-0 w-40 h-40 rounded-full pointer-events-none"
                    style={{ background: '#B026FF', opacity: 0.06, filter: 'blur(40px)', transform: 'translate(30%, -30%)' }}
                />

                {/* Header row */}
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.25em] text-zinc-600 mb-1">
                            PXI STUDIO
                        </p>
                        <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: 'rgba(176,38,255,0.7)' }}>
                            CITIZENSHIP BUREAU
                        </p>
                    </div>
                    <span
                        className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-widest"
                        style={{ background: 'rgba(176,38,255,0.15)', border: '1px solid rgba(176,38,255,0.3)', color: '#B026FF' }}
                    >
                        {user.accountTier || 'CITIZEN'}
                    </span>
                </div>

                {/* Avatar + info */}
                <div className="flex items-center gap-5 mb-6">
                    {mounted && user?.avatarUrl ? (
                        <img
                            src={user.avatarUrl}
                            alt={user?.name ?? ''}
                            className="w-16 h-16 rounded-2xl object-cover"
                            style={{ border: '2px solid rgba(176,38,255,0.3)' }}
                        />
                    ) : (
                        <div
                            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black"
                            style={{
                                background: 'rgba(176,38,255,0.1)',
                                border: '2px solid rgba(176,38,255,0.3)',
                                color: '#B026FF',
                            }}
                        >
                            {avatarFallback}
                        </div>
                    )}
                    <div>
                        <p className="text-white font-black text-xl tracking-tight">{user.name || '—'}</p>
                        <p className="text-zinc-400 text-sm mt-0.5">@{user.handle || '—'}</p>
                        <p className="text-zinc-600 text-xs mt-1 truncate max-w-[200px]">{user.email}</p>
                    </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { icon: CheckCircle2, label: 'STATUS', value: 'ACTIVE' },
                        { icon: User, label: 'TYPE', value: user.isVendor ? 'VENDOR' : 'CITIZEN' },
                        { icon: Globe, label: 'TIER', value: user.accountTier || 'CITIZEN' },
                    ].map(({ icon: Icon, label, value }) => (
                        <div
                            key={label}
                            className="rounded-xl p-3 text-center"
                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                        >
                            <Icon size={13} className="mx-auto mb-1.5 text-zinc-600" />
                            <p className="text-zinc-600 text-[9px] font-bold uppercase tracking-widest mb-0.5">{label}</p>
                            <p className="text-white text-xs font-black tracking-wider">{value}</p>
                        </div>
                    ))}
                </div>
            </div>

            <p className="text-zinc-600 text-xs text-center">
                To update your passport details, use the PXI mobile app.
            </p>
        </div>
    );
}

// ─── Passport not issued ──────────────────────────────────────────────────────

function PassportNotIssued() {
    return (
        <div className="max-w-xl mx-auto">
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                    <Shield size={14} className="text-zinc-500" />
                    <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
                        PXI Passport
                    </span>
                </div>
                <h1 className="text-2xl font-black text-white tracking-tight">
                    Get Your Passport
                </h1>
                <p className="text-zinc-500 text-sm mt-1">
                    Your passport hasn't been issued yet.
                </p>
            </div>

            <div
                className="rounded-2xl p-8 text-center"
                style={{
                    background: 'rgba(24,24,27,0.5)',
                    border: '1px solid rgba(255,255,255,0.05)',
                }}
            >
                <div
                    className="w-16 h-16 mx-auto mb-5 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(176,38,255,0.1)', border: '1px solid rgba(176,38,255,0.2)' }}
                >
                    <Smartphone size={26} style={{ color: '#B026FF' }} />
                </div>

                <h2 className="text-white font-black text-lg mb-2 tracking-tight">
                    Use the PXI Mobile App
                </h2>
                <p className="text-zinc-400 text-sm leading-relaxed mb-8 max-w-sm mx-auto">
                    Your PXI Passport is your digital identity for events. To issue your
                    passport, please use the PXI mobile app — it only takes a minute.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <a
                        href="https://apps.apple.com/app/pxi"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2.5 px-5 py-3 rounded-xl font-semibold text-sm transition-all w-full sm:w-auto justify-center"
                        style={{ background: '#fff', color: '#000' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#e5e5e5'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
                    >
                        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-black" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                        </svg>
                        App Store
                    </a>
                    <a
                        href="https://play.google.com/store/apps/pxi"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2.5 px-5 py-3 rounded-xl font-semibold text-sm transition-all w-full sm:w-auto justify-center"
                        style={{ background: '#fff', color: '#000' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#e5e5e5'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
                    >
                        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-black" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3.18 23.76c.3.17.64.22.98.14l13.12-7.57L14 13l-10.82 10.76zM.54 1.27C.2 1.6 0 2.14 0 2.87v18.27c0 .73.2 1.27.54 1.6L1.63 21.6 12.35 12 1.63 2.41.54 1.27zM20.46 10.37l-2.98-1.72-3.85 3.35 3.85 3.34 3-1.73c.85-.49.85-1.26-.02-1.74zM4.16.1L17.28 7.67l-3.28 2.87L3.18.24A1.2 1.2 0 0 1 4.16.1z" />
                        </svg>
                        Google Play
                    </a>
                </div>
            </div>
        </div>
    );
}
