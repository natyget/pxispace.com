'use client';

import { useState, useEffect, useId } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Smartphone, Shield, CheckCircle2, Loader2, RefreshCw, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/auth';
import { getPassportLevelDisplay } from '../../utils/odysseyTier';
import { PXI_APP_STORE_URL } from '@/lib/appStoreLinks';
import IosDownloadLink from '@/components/links/IosDownloadLink';

// ─── MRZ helper ───────────────────────────────────────────────────────────────
function formatMRZ(text, len = 37) {
    if (text.length >= len) return text.substring(0, len);
    return text + '<'.repeat(len - text.length);
}

const ODYSSEY_TIER_BANDS = [
    { min: 0, max: 500 },
    { min: 501, max: 2500 },
    { min: 2501, max: 7000 },
    { min: 7001, max: 15000 },
    { min: 15001, max: 30000 },
    { min: 30001, max: null },
];

function getLevelProgress(odysseyXp) {
    const xp = Math.max(0, Math.floor(Number(odysseyXp) || 0));
    const band = ODYSSEY_TIER_BANDS.find((b) => b.max === null || xp <= b.max) ?? ODYSSEY_TIER_BANDS[0];
    if (band.max === null) return 1;
    const range = Math.max(1, band.max - band.min);
    const withinTier = Math.max(0, Math.min(1, (xp - band.min) / range));
    return Math.max(0.08, withinTier);
}

function HeaderPolygonBadge({ letter, progress }) {
    const size = 64;
    const stroke = 6;
    const center = size / 2;
    const radius = center - stroke - 1;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference * (1 - Math.max(0.08, Math.min(1, progress)));

    return (
        <div className="relative w-[34px] h-[36px] flex items-center justify-center overflow-visible">
            <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                className="absolute"
                aria-hidden
            >
                <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke="rgba(176,38,255,0.5)"
                    strokeWidth={stroke}
                    fill="none"
                />
                <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke="#C85AFF"
                    strokeWidth={stroke}
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${circumference} ${circumference}`}
                    strokeDashoffset={dashOffset}
                    transform={`rotate(-90 ${center} ${center})`}
                />
            </svg>
            <svg
                width="34"
                height="36"
                viewBox="22 17 42 45"
                preserveAspectRatio="xMidYMid meet"
                fill="none"
                aria-hidden
            >
                <path
                    d="M39.8184 19.6525C40.9842 18.9794 41.5671 18.6429 42.1868 18.5111C42.7351 18.3946 43.3018 18.3946 43.8501 18.5111C44.4698 18.6429 45.0527 18.9794 46.2184 19.6525L58.005 26.4574C59.1707 27.1305 59.7536 27.467 60.1775 27.9378C60.5526 28.3544 60.836 28.8451 61.0092 29.3783C61.205 29.9808 61.205 30.6539 61.205 32V45.6099C61.205 46.956 61.205 47.6291 61.0092 48.2316C60.836 48.7647 60.5526 49.2555 60.1775 49.6721C59.7536 50.1429 59.1707 50.4794 58.005 51.1525L46.2184 57.9574C45.0527 58.6305 44.4698 58.967 43.8501 59.0987C43.3018 59.2153 42.7351 59.2153 42.1868 59.0987C41.5671 58.967 40.9842 58.6305 39.8184 57.9574L28.0319 51.1525C26.8661 50.4794 26.2832 50.1429 25.8593 49.6721C25.4842 49.2555 25.2009 48.7647 25.0277 48.2316C24.8319 47.6291 24.8319 46.956 24.8319 45.6099V32C24.8319 30.6539 24.8319 29.9808 25.0277 29.3783C25.2009 28.8451 25.4842 28.3544 25.8593 27.9378C26.2832 27.467 26.8661 27.1305 28.0319 26.4574L39.8184 19.6525Z"
                    fill="#7F1B99"
                />
                <path
                    d="M39.8184 19.6525C40.9842 18.9794 41.5671 18.6429 42.1868 18.5111C42.7351 18.3946 43.3018 18.3946 43.8501 18.5111C44.4698 18.6429 45.0527 18.9794 46.2184 19.6525L58.005 26.4574C59.1707 27.1305 59.7536 27.467 60.1775 27.9378C60.5526 28.3544 60.836 28.8451 61.0092 29.3783C61.205 29.9808 61.205 30.6539 61.205 32V45.6099C61.205 46.956 61.205 47.6291 61.0092 48.2316C60.836 48.7647 60.5526 49.2555 60.1775 49.6721C59.7536 50.1429 59.1707 50.4794 58.005 51.1525L46.2184 57.9574C45.0527 58.6305 44.4698 58.967 43.8501 59.0987C43.3018 59.2153 42.7351 59.2153 42.1868 59.0987C41.5671 58.967 40.9842 58.6305 39.8184 57.9574L28.0319 51.1525C26.8661 50.4794 26.2832 50.1429 25.8593 49.6721C25.4842 49.2555 25.2009 48.7647 25.0277 48.2316C24.8319 47.6291 24.8319 46.956 24.8319 45.6099V32C24.8319 30.6539 24.8319 29.9808 25.0277 29.3783C25.2009 28.8451 25.4842 28.3544 25.8593 27.9378C26.2832 27.467 26.8661 27.1305 28.0319 26.4574L39.8184 19.6525Z"
                    stroke="rgba(176,38,255,0.9)"
                    strokeWidth="5"
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-[13px] leading-[15px] font-extrabold text-white text-shadow-[0_0_3px_rgba(255,255,255,0.35)]">
                    {letter}
                </span>
            </div>
        </div>
    );
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
    if (!user?.isPassportIssued) return <PassportNotIssued user={user} />;
    return <PassportIssued user={user} />;
}

function PassportIssued({ user }) {
    const chipFilterId = useId().replace(/:/g, '');
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

    const passportNumber = `P${String(user?.id || '0512026').slice(0, 7).toUpperCase()}XI`;
    const formatIssuedDate = (dateString) => {
        if (!dateString) return '01JAN26';
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
        const year = String(date.getFullYear()).slice(-2);
        return `${day}${month}${year}`;
    };
    const nameParts = fullName.toUpperCase().replace(' ', '<');
    const mrzLine1 = formatMRZ(`PXI<${username.toUpperCase()}<<${nameParts}`, 36);
    const mrzLine2 = formatMRZ(`ISSUED${formatIssuedDate(user?.passportIssuedAt)}<${passportNumber}<<<PXISPACE`, 36);

    const { levelText, badgeLetter } = getPassportLevelDisplay(user);
    const levelProgress = getLevelProgress(user?.odysseyXp);
    const passportType = user?.isVendor
        ? 'Diplomat'
        : user?.isPassportIssued
          ? 'Citizen'
          : 'Partial';

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="relative px-2">
                <div className="flex items-center justify-between">
                    <HeaderPolygonBadge letter={badgeLetter} progress={levelProgress} />
                    <h1 className="absolute left-0 right-0 text-center text-[22px] font-bold text-white tracking-wide pointer-events-none">
                        PXI Passport
                    </h1>
                    {user?.isVendor ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 sm:px-3 py-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                            <CheckCircle2 size={12} />
                            <span className="sm:hidden">Vendor</span>
                            <span className="hidden sm:inline">You are vendor!</span>
                        </span>
                    ) : (
                        <Link href="/dashboard/vendor-upgrade" className="inline-flex items-center rounded-full bg-pxi-purple/20 border border-pxi-purple/30 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-pxi-purple hover:bg-pxi-purple/30">
                            Vendor Setup
                        </Link>
                    )}
                </div>
                <div className="mt-4 flex items-center justify-center">
                    <button className="text-center">
                        <p className="text-white text-base font-bold">{user?.friendsCount ?? 0}</p>
                        <p className="text-[10px] uppercase tracking-widest text-white/45">Friends</p>
                    </button>
                </div>
            </div>

            <div className="flex justify-center">
                <div className="relative w-[min(95vw,361px)] h-[558px] overflow-hidden rounded-[8px] border border-white bg-black shadow-[0_1px_12px_rgba(255,255,255,0.25)]">
                    <div
                        className="absolute left-0 right-0 top-0 h-1/2 z-[1] opacity-35 pointer-events-none"
                        style={{
                            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.35) 1px, transparent 1px)',
                            backgroundSize: '4px 4px',
                        }}
                    />
                    <div className="absolute inset-0 opacity-25 pointer-events-none">
                        <NeonCurvesSVG className="w-full h-full" />
                    </div>
                    <div className="absolute inset-0 pointer-events-none opacity-90">
                        <StampRed />
                        <StampYellow />
                        <StampCyan />
                        <StampWhite />
                        <GreenStampPositioned />
                    </div>

                    <div className="absolute top-[8px] right-[8px] z-20 text-[12px] text-white/60 tracking-[0.08em] uppercase">
                        {passportNumber}
                    </div>
                    <div className="absolute left-[-182px] top-[128px] z-20 -rotate-90 text-[16px] tracking-[0.24em] text-white/55 uppercase">
                        SEASON 01 2026
                    </div>

                    <div className="absolute inset-x-0 top-1/2 z-20 h-[80px] -translate-y-1/2 pointer-events-none">
                        <div className="h-1/2 bg-gradient-to-b from-transparent via-black/55 to-black/90" />
                        <div className="relative h-0">
                            <div className="h-[3px] bg-[#050505] shadow-[0_0_6px_3px_rgba(0,0,0,0.9)]" />
                            <div className="absolute left-0 right-0 top-[-1px] border-t-2 border-dashed border-white/40" />
                        </div>
                        <div className="h-1/2 bg-gradient-to-t from-transparent via-black/55 to-black/90" />
                    </div>

                    <div className="absolute left-0 right-0 bottom-0 top-1/2 z-10 min-h-0 overflow-y-auto bg-[#0f0f0f] px-3 py-2 sm:px-4 sm:py-2">
                        <div className="mx-auto w-full max-w-[380px] shrink-0 overflow-hidden rounded-lg px-2 sm:px-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0 flex-1 pr-1">
                                            <h2 className="text-[14px] font-bold uppercase tracking-[0.16em] text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">
                                                PXI PASSPORT
                                            </h2>
                                            <div className="mt-1 h-[6px] border-t-[6px] border-white" />
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <p className="text-[9px] uppercase text-white/70">PXI Passport No.</p>
                                            <p className="text-[11px] uppercase text-white/90">{passportNumber}</p>
                                        </div>
                                    </div>

                                    <div className="mt-1.5 grid grid-cols-[88px_minmax(0,1fr)_minmax(0,1fr)] items-center gap-x-2.5 sm:grid-cols-[100px_minmax(0,1fr)_minmax(0,1fr)] sm:gap-x-3">
                                        <div className="col-span-2 flex min-w-0 items-center gap-1">
                                            <svg
                                                width="41"
                                                height="34"
                                                viewBox="0 0 41 34"
                                                fill="none"
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-[22px] w-[38px] shrink-0 sm:h-[24px] sm:w-[40px]"
                                                aria-hidden
                                            >
                                                <g filter={`url(#${chipFilterId})`}>
                                                    <path d="M12 11H29V21H12V11Z" fill="#BB17E8" />
                                                    <path
                                                        fillRule="evenodd"
                                                        clipRule="evenodd"
                                                        d="M20.5 13C21.9864 13 23.2194 14.0812 23.4575 15.5H29V16.5H23.4575C23.2194 17.9188 21.9864 19 20.5 19C19.0136 19 17.7806 17.9188 17.5425 16.5H12V15.5H17.5425C17.7806 14.0812 19.0136 13 20.5 13ZM20.5 14C19.3954 14 18.5 14.8954 18.5 16C18.5 17.1046 19.3954 18 20.5 18C21.6046 18 22.5 17.1046 22.5 16C22.5 14.8954 21.6046 14 20.5 14Z"
                                                        fill="#0C0C0C"
                                                    />
                                                </g>
                                                <defs>
                                                    <filter
                                                        id={chipFilterId}
                                                        x="0"
                                                        y="0"
                                                        width="41"
                                                        height="34"
                                                        filterUnits="userSpaceOnUse"
                                                        colorInterpolationFilters="sRGB"
                                                    >
                                                        <feFlood floodOpacity="0" result="BackgroundImageFix" />
                                                        <feColorMatrix
                                                            in="SourceAlpha"
                                                            type="matrix"
                                                            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                                                            result="hardAlpha"
                                                        />
                                                        <feOffset dy="1" />
                                                        <feGaussianBlur stdDeviation="6" />
                                                        <feComposite in2="hardAlpha" operator="out" />
                                                        <feColorMatrix
                                                            type="matrix"
                                                            values="0 0 0 0 0.733333 0 0 0 0 0.0901961 0 0 0 0 0.909804 0 0 0 1 0"
                                                        />
                                                        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_vector" />
                                                        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_vector" result="shape" />
                                                    </filter>
                                                </defs>
                                            </svg>
                                            <span className="whitespace-nowrap text-[7px] font-semibold uppercase tracking-[0.03em] text-white sm:text-[8px]">
                                                PASSPORT • PASS • PASAPORTE
                                            </span>
                                        </div>
                                        <div className="flex min-w-0 flex-col items-start justify-center">
                                            <p className="text-[9px] font-semibold uppercase leading-none text-white/80">LEVEL {levelText}</p>
                                            <div className="mt-1 h-1 w-[72px] overflow-hidden rounded-full bg-[rgba(176,38,255,0.22)] sm:w-[80px]">
                                                <div
                                                    className="h-full rounded-full bg-pxi-purple"
                                                    style={{ width: `${Math.round(levelProgress * 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-1 grid grid-cols-[88px_minmax(0,1fr)_minmax(0,1fr)] items-start gap-x-2.5 sm:grid-cols-[100px_minmax(0,1fr)_minmax(0,1fr)] sm:gap-x-3">
                                        <div className="relative h-[118px] w-full max-w-[88px] overflow-hidden rounded-[6px] shadow-[0_1px_24px_2px_rgba(255,255,255,0.3)] sm:h-[128px] sm:max-w-[100px]">
                                            {user?.avatarUrl ? (
                                                <Image src={user.avatarUrl} alt={fullName} fill unoptimized className="object-cover" sizes="112px" />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center bg-pxi-purple/20 text-2xl font-black text-pxi-purple">
                                                    {avatarFallback}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex min-h-0 min-w-0 flex-col gap-1.5 pl-1 pr-1 sm:pl-2 sm:pr-2">
                                            <div>
                                                <p className="text-[9px] font-medium uppercase text-white/70">Full name</p>
                                                <p className="text-[11px] font-semibold uppercase leading-snug text-white/90 drop-shadow-[0_0_8px_rgba(255,255,255,0.35)] sm:text-[12px]">
                                                    {fullName.toUpperCase()}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-medium uppercase text-white/70">username</p>
                                                <p className="truncate text-[11px] text-white/90 drop-shadow-[0_0_8px_rgba(255,255,255,0.35)] sm:text-[12px]">
                                                    {username}
                                                </p>
                                            </div>
                                            <p className="text-[11px] text-white/90 sm:text-[12px]">Age {typeof age === 'number' ? age : '—'}</p>
                                            <div>
                                                <p className="text-[9px] font-medium uppercase text-white/70">City</p>
                                                <p className="line-clamp-2 text-[11px] text-white/90 sm:text-[12px]">{city}</p>
                                            </div>
                                        </div>
                                        <div className="flex min-h-0 min-w-0 flex-col gap-2">
                                            <div className="shrink-0">
                                                <div className="flex items-end">
                                                    <span className="text-[28px] font-extrabold leading-[30px] text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.35)] sm:text-[36px] sm:leading-9">
                                                        {passportType.charAt(0).toUpperCase()}
                                                    </span>
                                                    <span className="mb-0.5 ml-0.5 text-[11px] font-semibold capitalize text-white sm:text-[13px]">
                                                        {passportType.slice(1)}
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="truncate text-[11px] text-white/90 sm:text-[12px]" title={instagram}>
                                                Insta {instagram}
                                            </p>
                                            <div className="min-h-0 flex-1">
                                                <p className="text-[9px] font-medium uppercase text-white/70">Bio</p>
                                                <p className="line-clamp-3 text-[11px] leading-snug text-white/90 sm:text-[12px]">{bio}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-3 h-[2px] w-full bg-white/40 sm:mt-3" />
                                    <div className="pt-1.5 font-mono text-[10px] uppercase leading-4 tracking-[0.12em] text-white/70 sm:pt-2 sm:text-[11px]">
                                        <p className="truncate">{mrzLine1}</p>
                                        <p className="truncate">{mrzLine2}</p>
                                    </div>
                        </div>
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

function PassportNotIssued({ user }) {
    const { updateUser } = useAuth();
    const [checkingVendor, setCheckingVendor] = useState(false);
    const [vendorStatusMsg, setVendorStatusMsg] = useState('');
    const [vendorChecks, setVendorChecks] = useState(null); // {chargesEnabled,payoutsEnabled,currentlyDue}

    const handleCheckVendorVerification = async () => {
        if (!user?.id) return;
        setCheckingVendor(true);
        setVendorStatusMsg('');
        setVendorChecks(null);
        try {
            const result = await authService.checkVendorStatus();
            if (result?.isVendor) {
                updateUser({ isVendor: true });
                setVendorStatusMsg('Vendor verification completed. You can now create paid events.');
                return;
            }
            if (result?.code === 'NO_STRIPE_ACCOUNT') {
                setVendorStatusMsg("No Stripe verification found yet. Start vendor setup below.");
                return;
            }
            setVendorChecks(result?.stripeStatus || null);
            setVendorStatusMsg('Verification is still in progress. Complete any outstanding Stripe requirements.');
        } catch (err) {
            setVendorStatusMsg(err?.message || 'Could not check vendor verification right now.');
        } finally {
            setCheckingVendor(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto">
            <div className="mb-6">
                <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                        <Shield size={14} className="text-zinc-500" />
                        <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest">PXI Passport</span>
                    </div>
                    {user?.isVendor ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 sm:px-3 py-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                            <CheckCircle2 size={12} />
                            <span className="sm:hidden">Vendor</span>
                            <span className="hidden sm:inline">You are vendor!</span>
                        </span>
                    ) : (
                        <Link href="/dashboard/vendor-upgrade" className="inline-flex items-center rounded-full bg-pxi-purple/20 border border-pxi-purple/30 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-pxi-purple hover:bg-pxi-purple/30">
                            Vendor Setup
                        </Link>
                    )}
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
                    <IosDownloadLink href={PXI_APP_STORE_URL}
                        className="flex items-center gap-2.5 px-5 py-3 rounded-xl font-semibold text-sm bg-white text-black hover:bg-zinc-200 transition-all w-full sm:w-auto justify-center">
                        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-black"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                        App Store
                    </IosDownloadLink>
                    <a href="https://play.google.com/store/apps/pxi" target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2.5 px-5 py-3 rounded-xl font-semibold text-sm bg-white text-black hover:bg-zinc-200 transition-all w-full sm:w-auto justify-center">
                        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-black"><path d="M3.18 23.76c.3.17.64.22.98.14l13.12-7.57L14 13l-10.82 10.76zM.54 1.27C.2 1.6 0 2.14 0 2.87v18.27c0 .73.2 1.27.54 1.6L1.63 21.6 12.35 12 1.63 2.41.54 1.27zM20.46 10.37l-2.98-1.72-3.85 3.35 3.85 3.34 3-1.73c.85-.49.85-1.26-.02-1.74zM4.16.1L17.28 7.67l-3.28 2.87L3.18.24A1.2 1.2 0 0 1 4.16.1z"/></svg>
                        Google Play
                    </a>
                </div>

                {/* Vendor verification integration */}
                <div className="mt-8 rounded-xl border border-white/10 bg-black/30 p-4 text-left">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-[10px] font-bold tracking-widest uppercase text-pxi-purple">Vendor verification</p>
                            <p className="text-xs text-zinc-400 mt-1">Check Stripe status or continue setup to unlock paid events.</p>
                        </div>
                        {user?.isVendor ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                                <CheckCircle2 size={12} />
                                Verified
                            </span>
                        ) : null}
                    </div>

                    {!!vendorStatusMsg && (
                        <p className="mt-3 text-xs text-zinc-300">{vendorStatusMsg}</p>
                    )}

                    {vendorChecks && (
                        <div className="mt-3 space-y-1 text-xs text-zinc-400">
                            <p>
                                Charges: <span className={vendorChecks.chargesEnabled ? 'text-emerald-400' : 'text-amber-400'}>
                                    {vendorChecks.chargesEnabled ? 'Enabled' : 'Pending'}
                                </span>
                            </p>
                            <p>
                                Payouts: <span className={vendorChecks.payoutsEnabled ? 'text-emerald-400' : 'text-amber-400'}>
                                    {vendorChecks.payoutsEnabled ? 'Enabled' : 'Pending'}
                                </span>
                            </p>
                            {(vendorChecks.currentlyDue?.length ?? 0) > 0 && (
                                <p className="text-amber-400">Outstanding requirements: {vendorChecks.currentlyDue.length}</p>
                            )}
                        </div>
                    )}

                    <div className="mt-4 flex flex-col sm:flex-row gap-2">
                        <button
                            type="button"
                            onClick={handleCheckVendorVerification}
                            disabled={checkingVendor}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-white/10 disabled:opacity-50"
                        >
                            {checkingVendor ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                            Check verification
                        </button>
                        <Link
                            href="/dashboard/vendor-upgrade"
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-pxi-purple px-3 py-2 text-xs font-semibold text-white hover:brightness-110"
                        >
                            Continue vendor setup
                            <ArrowRight size={13} />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
