'use client';

import React from 'react';
import { QRCode } from 'antd';
import { displayImageSrc } from '@/lib/mediaUrl';
import {
  formatEventDateShort,
  formatLocationLine,
  formatLocationSubline,
  formatTicketDisplayId,
  priceLabelFromPrice,
  tierLabelFromPrice,
  ticketTypeLabel,
} from '@/lib/ticketEmailPreview';

const HEADER_LOGO = '/ticket-email/nobglogo_128x128.png';
const QR_LOGO = '/ticket-email/logo_128x128.png';

/** Dark purple nuggets + edge vignette (upper band + QR zone). */
const FIRE_NUGGET_OVERLAY_STYLE = {
  background: `
    radial-gradient(ellipse 115% 95% at 50% 50%, transparent 38%, rgba(12, 0, 22, 0.55) 74%, rgba(0, 0, 0, 0.85) 100%),
    linear-gradient(180deg, rgba(0, 0, 0, 0.72) 0%, transparent 22%, transparent 78%, rgba(0, 0, 0, 0.78) 100%),
    radial-gradient(ellipse 100% 44% at 50% 76%, rgba(126, 34, 206, 0.55) 0%, rgba(109, 40, 217, 0.42) 38%, rgba(76, 29, 149, 0.15) 65%, transparent 78%),
    radial-gradient(ellipse 88% 40% at 62% 24%, rgba(107, 33, 168, 0.52) 0%, rgba(88, 28, 135, 0.4) 40%, rgba(59, 7, 100, 0.18) 65%, transparent 78%)
  `,
};

/**
 * Client-side ticket email preview (no backend HTML fetch).
 */
export default function TicketEmailPreview({ preview, className = '', compact = false }) {
  if (!preview?.ticketId || !preview?.qrValue) return null;

  const currency = preview.currency ?? 'USD';
  const eventTitle = (preview.eventName || '').trim();
  const ticketDisplayId = formatTicketDisplayId(preview.ticketId);
  const eventDate = formatEventDateShort(preview.eventStartDate);
  const faceUsd = preview.tierPriceUsd ?? preview.ticketPrice;
  const tier = preview.tierLabel ?? tierLabelFromPrice(faceUsd, currency);
  const typeLabel = ticketTypeLabel(preview.isPrivate);
  const priceLabel = priceLabelFromPrice(faceUsd, currency);
  const locationPrimary = formatLocationLine(preview.eventLocation);
  const locationSecondary = formatLocationSubline(preview.eventLocation);
  const coverSrc = displayImageSrc(preview.eventCoverImage);

  const qrSize = compact ? 124 : 156;

  const frameStyle = coverSrc
    ? {
        backgroundImage: `url(${coverSrc})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: '#120018',
      }
    : { backgroundColor: '#120018' };

  return (
    <div className={className}>
      <div
        className={`relative mx-auto w-full max-w-[300px] overflow-hidden rounded-2xl border border-white/10 aspect-[3/4] flex flex-col ${
          compact ? 'max-w-[280px]' : ''
        }`}
        style={frameStyle}
      >
        <div className="absolute inset-0 backdrop-blur-md bg-black/10" aria-hidden />
        <div className="absolute inset-0" style={FIRE_NUGGET_OVERLAY_STYLE} aria-hidden />
        <div
          className={`relative z-10 flex flex-1 flex-col justify-between ${
            compact ? 'px-3 py-3' : 'px-4 py-4'
          }`}
        >
          <div className="flex justify-between items-start gap-2">
            <div className="flex items-center gap-2 min-w-0 shrink">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={HEADER_LOGO}
                alt="PXI"
                width={compact ? 30 : 36}
                height={compact ? 30 : 36}
                className="block shrink-0"
              />
              <span className="text-[9px] font-semibold tracking-[0.2em] text-white/90 uppercase">
                PXI LABS
              </span>
            </div>
            <span className="text-[10px] font-medium tracking-wider text-white/80 uppercase text-right shrink-0 max-w-[42%]">
              {eventDate}
            </span>
          </div>

          <div className="flex flex-1 flex-col justify-center min-h-0">
            <div className={`text-left ${compact ? 'mt-1' : 'mt-2'}`}>
              <p className="text-[8px] font-semibold tracking-widest text-white/45 uppercase mb-1">
                Event
              </p>
              <h3
                className={`text-left font-black italic text-white line-clamp-3 [text-shadow:0_1px_4px_rgba(0,0,0,0.5)] ${
                  compact ? 'text-[20px] leading-6' : 'text-[22px] leading-7'
                }`}
              >
                {eventTitle}
              </h3>
            </div>

            <div className={`grid grid-cols-2 gap-2 ${compact ? 'mt-2' : 'mt-3'}`}>
              <div>
                <p className="text-[8px] font-semibold tracking-widest text-white/45 uppercase mb-1">
                  Location
                </p>
                <p
                  className={`font-semibold text-white leading-tight ${compact ? 'text-xs truncate' : 'text-sm'}`}
                >
                  {locationPrimary}
                </p>
                <p className="text-[10px] font-medium text-purple-300/90 mt-0.5 truncate">
                  {locationSecondary}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-semibold tracking-widest text-white/45 uppercase mb-1">
                  Tier &amp; Type
                </p>
                <p className={`font-semibold text-white leading-tight ${compact ? 'text-xs' : 'text-sm'}`}>
                  {tier}
                </p>
                <p className="text-[10px] font-medium text-fuchsia-400 mt-0.5">{typeLabel}</p>
                <p className="text-[9px] text-white/40 mt-1">{priceLabel}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center shrink-0">
            <div className={`rounded-2xl bg-white ${compact ? 'p-1.5' : 'p-2.5'}`}>
              <QRCode
                value={preview.qrValue}
                size={qrSize}
                color="#000000"
                bgColor="#ffffff"
                icon={QR_LOGO}
                iconSize={Math.round(qrSize * 0.25)}
                bordered={false}
              />
            </div>
            <p
              className={`font-medium tracking-widest text-white/45 uppercase ${
                compact ? 'mt-1.5 text-[8px]' : 'mt-2 text-[10px]'
              }`}
            >
              {ticketDisplayId}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
