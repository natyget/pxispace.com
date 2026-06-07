'use client';

import { useRef, useState, useLayoutEffect, useMemo } from 'react';
import { buildPassportFooterLine, renderPassportFooterSegments } from '@/components/passport/passportVisualParts';
import {
    PASSPORT_FOOTER_TEXT_CLASS,
    PASSPORT_FOOTER_CHEV_CLASS,
} from '@/components/passport/PassportCardShell';

const PASSPORT_FOOTER_CHEV_GLYPH = 6.0;

/** Footer token e.g. `ISSUED19APR26` — matches mobile NewPassportCard. */
export function formatPassportIssuedDate(dateString) {
    if (!dateString) return 'ISSUED??????';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'ISSUED??????';
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    const year = String(date.getFullYear()).slice(-2);
    return `ISSUED${day}${month}${year}`;
}

/**
 * MRZ-style passport footer (PXI<<username<<name + issued line).
 * Width-measured chevron fill — keep in sync with mobile NewPassportCard footer block.
 */
export function PassportMrzFooter({
    userId,
    username = '',
    fullName = '',
    /** Prefer profile createdAt (mobile); fallback passportIssuedAt on web API. */
    issuedAt,
    /** `card` = absolute footer in passport bottom panel; `inline` = stacked in content flow. */
    variant = 'card',
    separatorClassName,
    containerClassName,
}) {
    const footerRef = useRef(null);
    const [footerWidth, setFooterWidth] = useState(0);

    useLayoutEffect(() => {
        const node = footerRef.current;
        if (!node) return;
        const update = () => setFooterWidth(node.offsetWidth || 0);
        update();
        if (typeof ResizeObserver === 'undefined') return;
        const ro = new ResizeObserver(update);
        ro.observe(node);
        return () => ro.disconnect();
    }, []);

    const { lineOne, lineTwo } = useMemo(() => {
        const passportNumber = `P${String(userId || '').slice(0, 7).toUpperCase()}XI`;
        const footerChevronCount =
            footerWidth > 0
                ? Math.max(5, Math.min(220, Math.floor(footerWidth / PASSPORT_FOOTER_CHEV_GLYPH)))
                : 56;

        const mrzUsername = String(username).replace(/^@/, '').toUpperCase();
        const footerUsername = mrzUsername.replace(/\s+/g, '<');
        const footerFullName = String(fullName).toUpperCase().replace(/\s+/g, '<');
        const passportFooterIssued = formatPassportIssuedDate(issuedAt);

        return {
            lineOne: buildPassportFooterLine(
                ['PXI', footerUsername, footerFullName],
                footerChevronCount,
            ),
            lineTwo: buildPassportFooterLine(
                [passportFooterIssued, passportNumber, 'PXISPACE'],
                footerChevronCount,
            ),
        };
    }, [userId, username, fullName, issuedAt, footerWidth]);

    const lineClass = `${PASSPORT_FOOTER_TEXT_CLASS} overflow-hidden whitespace-nowrap`;
    const lineStyle = { letterSpacing: '1px' };

    if (variant === 'inline') {
        return (
            <>
                <div
                    className={separatorClassName ?? 'mt-3 h-[2px] w-full bg-zinc-500/40'}
                    aria-hidden
                />
                <div
                    ref={footerRef}
                    className={containerClassName ?? 'w-full overflow-hidden pt-1.5 font-mono uppercase'}
                >
                    <p className={`${lineClass} mb-[2px]`} style={lineStyle}>
                        {renderPassportFooterSegments(lineOne, PASSPORT_FOOTER_CHEV_CLASS)}
                    </p>
                    <p className={lineClass} style={lineStyle}>
                        {renderPassportFooterSegments(lineTwo, PASSPORT_FOOTER_CHEV_CLASS)}
                    </p>
                </div>
            </>
        );
    }

    return (
        <>
            <div
                className={separatorClassName ?? 'absolute left-6 right-6 h-[2px] bg-zinc-500/40'}
                style={{ bottom: 38 }}
                aria-hidden
            />
            <div
                ref={footerRef}
                className={containerClassName ?? 'absolute left-6 right-6 overflow-hidden'}
                style={{ bottom: 4 }}
            >
                <p className={`${lineClass} mb-[2px]`} style={lineStyle}>
                    {renderPassportFooterSegments(lineOne, PASSPORT_FOOTER_CHEV_CLASS)}
                </p>
                <p className={lineClass} style={lineStyle}>
                    {renderPassportFooterSegments(lineTwo, PASSPORT_FOOTER_CHEV_CLASS)}
                </p>
            </div>
        </>
    );
}
