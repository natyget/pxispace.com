'use client';

import { useState, useEffect } from 'react';
import { Smartphone, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

// ─── MRZ helper ───────────────────────────────────────────────────────────────
function formatMRZ(text, len = 37) {
    if (text.length >= len) return text.substring(0, len);
    return text + '<'.repeat(len - text.length);
}

// ─── SVG assets ───────────────────────────────────────────────────────────────

const PolygonIcon = ({ className }) => (
    <svg viewBox="0 0 87 91" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <g filter="url(#filter0_ddi_poly)">
            <path d="M39.8184 19.6525C40.9842 18.9794 41.5671 18.6429 42.1868 18.5111C42.7351 18.3946 43.3018 18.3946 43.8501 18.5111C44.4698 18.6429 45.0527 18.9794 46.2184 19.6525L58.005 26.4574C59.1707 27.1305 59.7536 27.467 60.1775 27.9378C60.5526 28.3544 60.836 28.8451 61.0092 29.3783C61.205 29.9808 61.205 30.6539 61.205 32V45.6099C61.205 46.956 61.205 47.6291 61.0092 48.2316C60.836 48.7647 60.5526 49.2555 60.1775 49.6721C59.7536 50.1429 59.1707 50.4794 58.005 51.1525L46.2184 57.9574C45.0527 58.6305 44.4698 58.967 43.8501 59.0987C43.3018 59.2153 42.7351 59.2153 42.1868 59.0987C41.5671 58.967 40.9842 58.6305 39.8184 57.9574L28.0319 51.1525C26.8661 50.4794 26.2832 50.1429 25.8593 49.6721C25.4842 49.2555 25.2009 48.7647 25.0277 48.2316C24.8319 47.6291 24.8319 46.956 24.8319 45.6099V32C24.8319 30.6539 24.8319 29.9808 25.0277 29.3783C25.2009 28.8451 25.4842 28.3544 25.8593 27.9378C26.2832 27.467 26.8661 27.1305 28.0319 26.4574L39.8184 19.6525Z" fill="url(#paint0_conic_poly)"/>
            <path d="M39.8184 19.6525C40.9842 18.9794 41.5671 18.6429 42.1868 18.5111C42.7351 18.3946 43.3018 18.3946 43.8501 18.5111C44.4698 18.6429 45.0527 18.9794 46.2184 19.6525L58.005 26.4574C59.1707 27.1305 59.7536 27.467 60.1775 27.9378C60.5526 28.3544 60.836 28.8451 61.0092 29.3783C61.205 29.9808 61.205 30.6539 61.205 32V45.6099C61.205 46.956 61.205 47.6291 61.0092 48.2316C60.836 48.7647 60.5526 49.2555 60.1775 49.6721C59.7536 50.1429 59.1707 50.4794 58.005 51.1525L46.2184 57.9574C45.0527 58.6305 44.4698 58.967 43.8501 59.0987C43.3018 59.2153 42.7351 59.2153 42.1868 59.0987C41.5671 58.967 40.9842 58.6305 39.8184 57.9574L28.0319 51.1525C26.8661 50.4794 26.2832 50.1429 25.8593 49.6721C25.4842 49.2555 25.2009 48.7647 25.0277 48.2316C24.8319 47.6291 24.8319 46.956 24.8319 45.6099V32C24.8319 30.6539 24.8319 29.9808 25.0277 29.3783C25.2009 28.8451 25.4842 28.3544 25.8593 27.9378C26.2832 27.467 26.8661 27.1305 28.0319 26.4574L39.8184 19.6525Z" stroke="url(#paint1_linear_poly)" strokeWidth="5" strokeLinecap="round"/>
        </g>
        <defs>
            <filter id="filter0_ddi_poly" x="0" y="0" width="86.0368" height="90.426" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                <feOffset dy="6.4"/><feGaussianBlur stdDeviation="12.4"/>
                <feComposite in2="hardAlpha" operator="out"/>
                <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.2 0"/>
                <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_poly"/>
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                <feOffset/><feGaussianBlur stdDeviation="7"/>
                <feComposite in2="hardAlpha" operator="out"/>
                <feColorMatrix type="matrix" values="0 0 0 0 0.56 0 0 0 0 0.0039 0 0 0 0 0.71 0 0 0 0.8 0"/>
                <feBlend mode="normal" in2="effect1_dropShadow_poly" result="effect2_dropShadow_poly"/>
                <feBlend mode="normal" in="SourceGraphic" in2="effect2_dropShadow_poly" result="shape"/>
            </filter>
            <linearGradient id="paint1_linear_poly" x1="43.0184" y1="17.8049" x2="43.0184" y2="59.8049" gradientUnits="userSpaceOnUse">
                <stop stopColor="#A300D0"/><stop offset="1" stopColor="#A300D0" stopOpacity="0"/>
            </linearGradient>
            <radialGradient id="paint0_conic_poly" cx="43.0184" cy="38.8049" r="0.5" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#6b1283"/><stop offset="0.15" stopColor="#5c0075"/>
                <stop offset="0.32" stopColor="#a300d0"/><stop offset="0.48" stopColor="#701988"/>
                <stop offset="0.51" stopColor="#a300d0"/><stop offset="0.67" stopColor="#711a89"/>
                <stop offset="0.75" stopColor="#a300d0"/><stop offset="0.94" stopColor="#711a89"/>
                <stop offset="1" stopColor="#6b1283"/>
            </radialGradient>
        </defs>
    </svg>
);

const VectorIcon = ({ className }) => (
    <svg width="41" height="34" viewBox="0 0 41 34" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <g filter="url(#filter0_d_vector)">
            <path d="M12 11H29V21H12V11Z" fill="#BB17E8"/>
            <path fillRule="evenodd" clipRule="evenodd" d="M20.5 13C21.9864 13 23.2194 14.0812 23.4575 15.5H29V16.5H23.4575C23.2194 17.9188 21.9864 19 20.5 19C19.0136 19 17.7806 17.9188 17.5425 16.5H12V15.5H17.5425C17.7806 14.0812 19.0136 13 20.5 13ZM20.5 14C19.3954 14 18.5 14.8954 18.5 16C18.5 17.1046 19.3954 18 20.5 18C21.6046 18 22.5 17.1046 22.5 16C22.5 14.8954 21.6046 14 20.5 14Z" fill="#0C0C0C"/>
        </g>
        <defs>
            <filter id="filter0_d_vector" x="0" y="0" width="41" height="34" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                <feOffset dy="1"/><feGaussianBlur stdDeviation="6"/>
                <feComposite in2="hardAlpha" operator="out"/>
                <feColorMatrix type="matrix" values="0 0 0 0 0.733333 0 0 0 0 0.0901961 0 0 0 0 0.909804 0 0 0 1 0"/>
                <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_vector"/>
                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_vector" result="shape"/>
            </filter>
        </defs>
    </svg>
);

const NeonCurvesSVG = ({ className }) => (
    <svg className={className} viewBox="0 0 361 558" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M-100 0 C50 200 300 100 400 300" stroke="url(#neonGrad)" strokeWidth="1" strokeOpacity="0.3"/>
        <circle cx="300" cy="50" r="100" stroke="url(#neonGrad)" strokeWidth="0.5" strokeOpacity="0.2"/>
        <circle cx="0" cy="500" r="180" stroke="url(#neonGrad)" strokeWidth="0.5" strokeOpacity="0.2"/>
        <defs>
            <linearGradient id="neonGrad" x1="0" y1="0" x2="1" y2="1">
                <stop stopColor="#A300D0"/><stop offset="1" stopColor="#5C0075"/>
            </linearGradient>
        </defs>
    </svg>
);

// Stamp components
const StampGreen = ({ style }) => (
    <svg viewBox="0 0 100 100" fill="none" style={{ ...style, width: 90, height: 90, position: 'absolute', filter: 'drop-shadow(0px 0px 2px #4AF765)', transform: 'rotate(-15deg)', top: 25, left: 50, opacity: 0.9 }}>
        <path d="M50 10 L90 85 H10 L50 10Z" stroke="#4AF765" strokeWidth="2" fill="rgba(20,20,20,0.4)" strokeLinejoin="round"/>
        <path d="M50 16 L84 81 H16 L50 16Z" stroke="#4AF765" strokeWidth="1" strokeLinejoin="round"/>
        <text x="50" y="35" textAnchor="middle" fill="#4AF765" fontSize="7" fontFamily="Courier New, monospace" fontWeight="bold">DEPARTED</text>
        <text x="50" y="50" textAnchor="middle" fill="#4AF765" fontSize="9" fontFamily="Courier New, monospace" fontWeight="bold">ETH DENVER</text>
        <text x="50" y="62" textAnchor="middle" fill="#4AF765" fontSize="6" fontFamily="Courier New, monospace">29 FEB 2024</text>
        <path d="M40 68 H60" stroke="#4AF765" strokeWidth="1"/>
        <text x="50" y="76" textAnchor="middle" fill="#4AF765" fontSize="5" fontFamily="Courier New, monospace">COLORADO</text>
    </svg>
);

const StampRed = () => (
    <svg viewBox="0 0 100 100" fill="none" style={{ width: 90, height: 90, position: 'absolute', filter: 'drop-shadow(0px 0px 2px #FF4D6D)', transform: 'rotate(-15deg)', top: 25, left: 50, opacity: 0.9 }}>
        <path d="M50 5 L89 27.5 V72.5 L50 95 L11 72.5 V27.5 L50 5Z" stroke="#FF4D6D" strokeWidth="2" fill="rgba(20,20,20,0.4)"/>
        <path d="M50 9 L85 29.5 V70.5 L50 91 L15 70.5 V29.5 L50 9Z" stroke="#FF4D6D" strokeWidth="1"/>
        <text x="50" y="25" textAnchor="middle" fill="#FF4D6D" fontSize="6" fontFamily="Courier New, monospace" letterSpacing="1">IMMIGRATION</text>
        <text x="50" y="50" textAnchor="middle" fill="#FF4D6D" fontSize="11" fontFamily="Courier New, monospace" fontWeight="bold">SOLANA</text>
        <text x="50" y="62" textAnchor="middle" fill="#FF4D6D" fontSize="6" fontFamily="Courier New, monospace">BREAKPOINT</text>
        <path d="M30 66 H70" stroke="#FF4D6D" strokeWidth="0.5" strokeDasharray="2 2"/>
        <text x="50" y="78" textAnchor="middle" fill="#FF4D6D" fontSize="7" fontFamily="Courier New, monospace" fontWeight="bold">21 SEP 24</text>
        <text x="25" y="50" fill="#FF4D6D" fontSize="8">★</text>
        <text x="70" y="50" fill="#FF4D6D" fontSize="8">★</text>
    </svg>
);

const StampYellow = () => (
    <svg viewBox="0 0 100 60" fill="none" style={{ width: 110, height: 70, position: 'absolute', filter: 'drop-shadow(0px 0px 2px #FFD60A)', transform: 'rotate(10deg)', top: 130, left: 180, opacity: 0.8 }}>
        <rect x="2" y="2" width="96" height="56" rx="6" stroke="#FFD60A" strokeWidth="2" fill="rgba(236,170,3,0.1)"/>
        <rect x="6" y="6" width="88" height="48" rx="4" stroke="#FFD60A" strokeWidth="1" strokeDasharray="3 2"/>
        <path d="M75 15 L80 18 L76 22 L72 20 L75 15" fill="#FFD60A"/>
        <path d="M74 18 L68 28 L72 30 L78 20" stroke="#FFD60A" strokeWidth="1"/>
        <text x="15" y="20" fill="#FFD60A" fontSize="7" fontFamily="Courier New, monospace" fontWeight="bold">ARRIVAL</text>
        <text x="50" y="38" textAnchor="middle" fill="#FFD60A" fontSize="12" fontFamily="Courier New, monospace" fontWeight="bold">TOKEN 2049</text>
        <text x="50" y="50" textAnchor="middle" fill="#FFD60A" fontSize="8" fontFamily="Courier New, monospace">DUBAI • 18 APR</text>
    </svg>
);

const StampCyan = () => (
    <svg viewBox="0 0 100 100" fill="none" style={{ width: 85, height: 85, position: 'absolute', filter: 'drop-shadow(0px 0px 2px #33E1ED)', transform: 'rotate(5deg)', top: 50, right: 50, opacity: 0.9 }}>
        <circle cx="50" cy="50" r="46" stroke="#33E1ED" strokeWidth="2" fill="rgba(20,20,20,0.4)"/>
        <circle cx="50" cy="50" r="34" stroke="#33E1ED" strokeWidth="1"/>
        <path id="curveTop2" d="M 20 50 A 30 30 0 0 1 80 50" fill="transparent"/>
        <text width="100" textAnchor="middle" fill="#33E1ED" fontSize="7" fontFamily="Courier New, monospace" fontWeight="bold">
            <textPath href="#curveTop2" startOffset="50%">PORT OF BOGOTA</textPath>
        </text>
        <text x="50" y="48" textAnchor="middle" fill="#33E1ED" fontSize="10" fontFamily="Courier New, monospace" fontWeight="bold">DEVCON</text>
        <text x="50" y="60" textAnchor="middle" fill="#33E1ED" fontSize="12" fontFamily="Courier New, monospace" fontWeight="bold">VI</text>
        <text x="50" y="80" textAnchor="middle" fill="#33E1ED" fontSize="6" fontFamily="Courier New, monospace">11 OCT 2022</text>
    </svg>
);

const StampWhite = () => (
    <svg viewBox="0 0 100 60" fill="none" style={{ width: 100, height: 60, position: 'absolute', filter: 'drop-shadow(0px 0px 2px rgba(255,255,255,0.8))', transform: 'rotate(-5deg)', top: 150, left: 60, opacity: 0.7 }}>
        <ellipse cx="50" cy="30" rx="48" ry="28" stroke="white" strokeWidth="2" fill="rgba(20,20,20,0.4)"/>
        <ellipse cx="50" cy="30" rx="44" ry="24" stroke="white" strokeWidth="1"/>
        <text x="50" y="18" textAnchor="middle" fill="white" fontSize="6" fontFamily="Courier New, monospace" letterSpacing="1">FRANCE</text>
        <text x="50" y="32" textAnchor="middle" fill="white" fontSize="10" fontFamily="Courier New, monospace" fontWeight="bold">NFT PARIS</text>
        <line x1="20" y1="38" x2="80" y2="38" stroke="white" strokeWidth="0.5"/>
        <text x="50" y="48" textAnchor="middle" fill="white" fontSize="7" fontFamily="Courier New, monospace">23 FEB 2024</text>
    </svg>
);

const GreenStampPositioned = () => (
    <svg viewBox="0 0 100 100" fill="none" style={{ width: 95, height: 95, position: 'absolute', filter: 'drop-shadow(0px 0px 2px #4AF765)', transform: 'rotate(12deg)', top: 80, left: 120, opacity: 0.8 }}>
        <path d="M50 10 L90 85 H10 L50 10Z" stroke="#4AF765" strokeWidth="2" fill="rgba(20,20,20,0.4)" strokeLinejoin="round"/>
        <path d="M50 16 L84 81 H16 L50 16Z" stroke="#4AF765" strokeWidth="1" strokeLinejoin="round"/>
        <text x="50" y="35" textAnchor="middle" fill="#4AF765" fontSize="7" fontFamily="Courier New, monospace" fontWeight="bold">DEPARTED</text>
        <text x="50" y="50" textAnchor="middle" fill="#4AF765" fontSize="9" fontFamily="Courier New, monospace" fontWeight="bold">ETH DENVER</text>
        <text x="50" y="62" textAnchor="middle" fill="#4AF765" fontSize="6" fontFamily="Courier New, monospace">29 FEB 2024</text>
        <path d="M40 68 H60" stroke="#4AF765" strokeWidth="1"/>
        <text x="50" y="76" textAnchor="middle" fill="#4AF765" fontSize="5" fontFamily="Courier New, monospace">COLORADO</text>
    </svg>
);

// ─── main page ────────────────────────────────────────────────────────────────

export default function PassportPage() {
    const { user } = useAuth();
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!mounted) return null;
    if (!user?.isPassportIssued) return <PassportNotIssued />;
    return <PassportIssued user={user} />;
}

function PassportIssued({ user }) {
    const fullName = user?.name ?? 'PXI CITIZEN';
    const username = user?.username ?? 'citizen';
    const avatarFallback = fullName.charAt(0).toUpperCase();
    const city = user?.city ?? '—';
    const bio = user?.bio ?? '—';
    const instagram = user?.instagramHandle
        ? (user.instagramHandle.startsWith('@') ? user.instagramHandle : `@${user.instagramHandle}`)
        : '—';

    const age = (() => {
        if (!user?.birthdate) return '—';
        const birth = new Date(user.birthdate);
        const today = new Date();
        let a = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) a--;
        return a;
    })();

    const nameParts = fullName.toUpperCase().replace(' ', '<');
    const mrzLine1 = formatMRZ(`PXI<${username.toUpperCase()}<<${nameParts}`);
    const mrzLine2 = formatMRZ(`Issued01Jan26<P0512026XI<<<<<pxispace`);

    const isVendor = user?.isVendor;

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Page header */}
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <Shield size={14} className="text-pxi-purple" />
                    <span className="text-pxi-purple text-xs font-bold uppercase tracking-widest">PXI Passport</span>
                </div>
                <h1 className="text-2xl font-black text-white tracking-tight">Your Digital Identity</h1>
                <p className="text-zinc-500 text-sm mt-1">Your PXI Passport is active.</p>
            </div>

            {/* PXI Passport card — exact blueprint proportions */}
            <div className="flex justify-center">
                <div
                    style={{
                        position: 'relative',
                        width: 361,
                        height: 558,
                        borderRadius: 8,
                        overflow: 'hidden',
                        backgroundColor: '#000000',
                        border: '1px solid rgba(255,255,255,0.9)',
                        boxShadow: '0px 1px 12px rgba(255,255,255,0.25)',
                    }}
                >
                    {/* Shared SVG filters */}
                    <svg width="0" height="0" style={{ position: 'absolute' }}>
                        <defs>
                            <filter id="rough_edges">
                                <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="1" result="noise"/>
                                <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.5"/>
                            </filter>
                        </defs>
                    </svg>

                    {/* ── TOP HALF ── */}
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '50%', overflow: 'hidden', zIndex: 0 }}>
                        {/* Map dot overlay */}
                        <div style={{
                            position: 'absolute', inset: 0,
                            backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
                            backgroundSize: '4px 4px',
                            opacity: 0.25,
                            maskImage: "url('/passport-map.svg')",
                            WebkitMaskImage: "url('/passport-map.svg')",
                            maskSize: 'contain',
                            WebkitMaskSize: 'contain',
                            maskRepeat: 'no-repeat',
                            WebkitMaskRepeat: 'no-repeat',
                            maskPosition: 'center',
                            WebkitMaskPosition: 'center',
                        }} />

                        {/* Stamps */}
                        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                            <StampRed />
                            <StampYellow />
                            <StampCyan />
                            <StampWhite />
                            <GreenStampPositioned />
                        </div>

                        {/* Vertical season text */}
                        <div style={{ position: 'absolute', top: 140, left: -45, zIndex: 10, transformOrigin: 'center', transform: 'rotate(-90deg)' }}>
                            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>
                                Season 01 • 2026
                            </span>
                        </div>

                        {/* ID top-right */}
                        <div style={{ position: 'absolute', top: 13, right: 24, zIndex: 10 }}>
                            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.1em' }}>
                                P0512026XI
                            </span>
                        </div>
                    </div>

                    {/* ── CREASE ── */}
                    <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 80, transform: 'translateY(-50%)', zIndex: 20, pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: '100%', height: '50%', background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.4), rgba(0,0,0,0.95))' }} />
                        <div style={{ position: 'relative', width: '100%', zIndex: 30, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ width: '100%', height: 3, background: '#050505', boxShadow: '0 0 6px 3px rgba(0,0,0,0.9)' }} />
                            <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', width: '100%', borderTop: '2px dashed rgba(255,255,255,0.4)' }} />
                        </div>
                        <div style={{ width: '100%', height: '50%', background: 'linear-gradient(to top, transparent, rgba(0,0,0,0.4), rgba(0,0,0,0.95))' }} />
                    </div>

                    {/* ── BOTTOM HALF ── */}
                    <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, bottom: 0, zIndex: 10, backgroundColor: '#000' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '16px 24px 0', position: 'relative' }}>

                            {/* Header row */}
                            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 200, flexShrink: 0 }}>
                                    <h1 style={{ fontWeight: 'bold', fontSize: 14, color: 'white', textTransform: 'uppercase', letterSpacing: '0.1em', textShadow: '0px 0px 12px #fff', margin: 0 }}>
                                        PXI PASSPORT
                                    </h1>
                                    <div style={{ height: 6, width: '100%', borderTop: '6px solid white' }} />
                                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, marginLeft: -13 }}>
                                        <VectorIcon style={{ width: 45, height: 27, marginRight: -13 }} />
                                        <span style={{ fontSize: 9, color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap', fontWeight: 600 }}>
                                            PASSPORT • PASS • PASAPORTE
                                        </span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>PXI Passport No.</span>
                                    <span style={{ fontSize: 11, color: 'white', textTransform: 'uppercase' }}>P0512018XI</span>
                                </div>
                            </div>

                            {/* Details grid */}
                            <div style={{ display: 'flex', flexDirection: 'row', gap: 16, width: '100%' }}>
                                {/* Photo */}
                                <div style={{ width: 113, flexShrink: 0 }}>
                                    <div style={{ width: 113, height: 130, borderRadius: 6, overflow: 'hidden', boxShadow: '0px 1px 24px 2px rgba(255,255,255,0.3)' }}>
                                        {user?.avatarUrl ? (
                                            <img src={user.avatarUrl} alt={fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', background: 'rgba(176,38,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, fontWeight: 900, color: '#B026FF' }}>
                                                {avatarFallback}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Info */}
                                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, position: 'relative', zIndex: 30 }}>
                                    <InfoRow label="Full name" value={fullName.toUpperCase()} />
                                    <InfoRow label="Username" value={username} />
                                    <div style={{ display: 'flex', flexDirection: 'row', gap: 24, marginBottom: 8 }}>
                                        <InfoRowInline label="Age" value={String(age)} />
                                        <InfoRowInline label="Insta" value={instagram} />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'row', gap: 24 }}>
                                        <InfoRowInline label="City" value={city} />
                                        <InfoRowInline label="Bio" value={bio} truncate />
                                    </div>
                                </div>
                            </div>

                            {/* Level / polygon badge */}
                            <div style={{ position: 'absolute', right: 24, top: 45, display: 'flex', flexDirection: 'column', alignItems: 'center', width: 80, zIndex: 20 }}>
                                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)' }}>LEVEL</span>
                                <span style={{ fontSize: 11, color: 'white', textShadow: '0px 0px 12px #fff' }}>
                                    {isVendor ? 'VENDOR' : 'VOYAGER'}
                                </span>
                                <div style={{ position: 'absolute', top: 30, left: '50%', transform: 'translateX(-50%)', width: 110, height: 110, filter: 'drop-shadow(0px 0px 14px rgba(143,1,182,0.8))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <PolygonIcon style={{ width: '100%', height: '100%' }} />
                                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: 28 }}>
                                        <span style={{ fontWeight: 'bold', color: 'white', fontSize: 40 }}>
                                            {isVendor ? 'v' : 'c'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Separator */}
                            <div style={{ position: 'absolute', bottom: 38, left: 24, right: 24, height: 2, background: 'rgba(255,255,255,0.4)', zIndex: 20 }} />

                            {/* MRZ */}
                            <div style={{ position: 'absolute', bottom: 4, left: 24, right: 24, zIndex: 20 }}>
                                <div style={{ fontFamily: '"Courier New", Courier, monospace', fontSize: 12, color: 'rgba(255,255,255,0.7)', letterSpacing: 1, lineHeight: '16px', textTransform: 'uppercase', overflow: 'hidden' }}>
                                    <p style={{ whiteSpace: 'nowrap', margin: 0 }}>{mrzLine1}</p>
                                    <p style={{ whiteSpace: 'nowrap', margin: 0 }}>{mrzLine2}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Neon curves overlay */}
                    <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', mixBlendMode: 'screen' }}>
                        <NeonCurvesSVG style={{ width: '100%', height: '100%' }} />
                    </div>
                </div>
            </div>

            <p className="text-zinc-600 text-xs text-center">
                To update your PXI Passport details, use the PXI mobile app.
            </p>
        </div>
    );
}

function InfoRow({ label, value }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 8 }}>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', fontWeight: 500 }}>{label}</span>
            <span style={{ fontSize: 12, color: 'white', textTransform: 'uppercase', textShadow: '0px 2px 12px rgba(255,255,255,0.8)' }}>{value}</span>
        </div>
    );
}

function InfoRowInline({ label, value, truncate }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', flex: truncate ? 1 : undefined, width: truncate ? undefined : 60 }}>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', fontWeight: 500 }}>{label}</span>
            <span style={{ fontSize: 12, color: 'white', textShadow: '0px 2px 12px rgba(255,255,255,0.8)', whiteSpace: truncate ? 'nowrap' : undefined, overflow: truncate ? 'hidden' : undefined, textOverflow: truncate ? 'ellipsis' : undefined }}>
                {value}
            </span>
        </div>
    );
}

// ─── PXI Passport not issued ──────────────────────────────────────────────────────

function PassportNotIssued() {
    return (
        <div className="max-w-xl mx-auto">
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                    <Shield size={14} className="text-zinc-500" />
                    <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest">PXI Passport</span>
                </div>
                <h1 className="text-2xl font-black text-white tracking-tight">Get Your PXI Passport</h1>
                <p className="text-zinc-500 text-sm mt-1">Your PXI Passport hasn't been issued yet.</p>
            </div>
            <div className="rounded-2xl p-8 text-center bg-zinc-900/50 border border-white/5">
                <div className="w-16 h-16 mx-auto mb-5 rounded-full flex items-center justify-center bg-pxi-purple/10 border border-pxi-purple/20">
                    <Smartphone size={26} className="text-pxi-purple" />
                </div>
                <h2 className="text-white font-black text-lg mb-2 tracking-tight">Use the PXI Mobile App</h2>
                <p className="text-zinc-400 text-sm leading-relaxed mb-8 max-w-sm mx-auto">
                    Your PXI Passport is your digital identity for events. To issue your PXI Passport, please use the PXI mobile app — it only takes a minute.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <a href="https://apps.apple.com/app/pxi" target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2.5 px-5 py-3 rounded-xl font-semibold text-sm bg-white text-black hover:bg-zinc-200 transition-all w-full sm:w-auto justify-center">
                        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-black"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                        App Store
                    </a>
                    <a href="https://play.google.com/store/apps/pxi" target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2.5 px-5 py-3 rounded-xl font-semibold text-sm bg-white text-black hover:bg-zinc-200 transition-all w-full sm:w-auto justify-center">
                        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-black"><path d="M3.18 23.76c.3.17.64.22.98.14l13.12-7.57L14 13l-10.82 10.76zM.54 1.27C.2 1.6 0 2.14 0 2.87v18.27c0 .73.2 1.27.54 1.6L1.63 21.6 12.35 12 1.63 2.41.54 1.27zM20.46 10.37l-2.98-1.72-3.85 3.35 3.85 3.34 3-1.73c.85-.49.85-1.26-.02-1.74zM4.16.1L17.28 7.67l-3.28 2.87L3.18.24A1.2 1.2 0 0 1 4.16.1z"/></svg>
                        Google Play
                    </a>
                </div>
            </div>
        </div>
    );
}
