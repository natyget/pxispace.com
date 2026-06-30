'use client';

import { FaGooglePlay } from 'react-icons/fa';
import { PXI_APP_STORE_URL, PXI_PLAY_STORE_URL } from '@/lib/appStoreLinks';
import IosDownloadLink from '@/components/links/IosDownloadLink';
import { APPLE_MARK } from '@/lib/landingAssets';

const BTN_CLASS =
  'flex w-full max-w-[320px] sm:w-auto sm:max-w-none items-center justify-center gap-3 px-6 py-4 md:px-10 md:py-5 rounded-full bg-white/10 border-0 backdrop-blur-[60px] hover:bg-white/20 transition-all cursor-pointer';

/** Compact side-by-side row (e.g. bottom of a blurred public preview on mobile). */
const BTN_ROW_CLASS =
  'flex min-w-0 flex-1 items-center justify-center gap-2 px-3 py-2.5 rounded-full bg-white/5 backdrop-blur-3xl border-0 hover:bg-white/10 transition-colors cursor-pointer';

/**
 * Matched to landing hero: “Download on App Store” (Google Play hidden).
 * @param {'default' | 'row'} [variant] — `row`: two equal columns with smaller copy (mobile blur footers).
 */
export default function AppStoreCtaPair({ className = '', variant = 'default', dataCursorHover = false }) {
  const dataProps = dataCursorHover ? { 'data-cursor-hover': true } : {};
  const isRow = variant === 'row';
  const btnClass = isRow ? BTN_ROW_CLASS : BTN_CLASS;
  return (
    <div
      className={[
        'flex items-center justify-center',
        isRow ? 'w-full flex-row gap-2' : 'w-full flex-col gap-4 sm:flex-row',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <IosDownloadLink
        href={PXI_APP_STORE_URL}
        aria-label="Download on App Store"
        className={btnClass}
        {...dataProps}
      >
        <img
          src={APPLE_MARK}
          alt=""
          className={['object-contain shrink-0', isRow ? 'h-[22px] w-[18px]' : 'h-[26px] w-[21px]'].join(' ')}
          aria-hidden
        />
        <div className={['flex flex-col', isRow ? 'min-w-0 items-start text-left' : 'items-start'].join(' ')}>
          <span
            className={[
              'font-bold uppercase tracking-widest text-white/70 leading-none',
              isRow ? 'text-[8px] mb-0.5' : 'text-[10px] mb-1',
            ].join(' ')}
          >
            Download on
          </span>
          <span className={[isRow ? 'text-xs' : 'text-sm', 'font-bold text-white leading-none'].join(' ')}>
            App Store
          </span>
        </div>
      </IosDownloadLink>
    </div>
  );
}
