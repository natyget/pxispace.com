'use client';

import { FaGooglePlay } from 'react-icons/fa';
import { PXI_APP_STORE_URL, PXI_PLAY_STORE_URL } from '@/lib/appStoreLinks';
import IosDownloadLink from '@/components/links/IosDownloadLink';
import { APPLE_MARK } from '@/lib/landingAssets';

const BTN_CLASS =
  'flex w-full max-w-[320px] sm:w-auto sm:max-w-none items-center justify-center gap-3 px-6 py-3 rounded-2xl bg-white/10 border border-white/20 hover:bg-white/20 transition-colors cursor-pointer';

/**
 * Matched to landing hero: “Download on App Store” + “Get it on Google Play”.
 */
export default function AppStoreCtaPair({ className = '', dataCursorHover = false }) {
  const dataProps = dataCursorHover ? { 'data-cursor-hover': true } : {};
  return (
    <div
      className={['flex w-full flex-col sm:flex-row items-center justify-center gap-4', className]
        .filter(Boolean)
        .join(' ')}
    >
      <IosDownloadLink
        href={PXI_APP_STORE_URL}
        aria-label="Download on App Store"
        className={BTN_CLASS}
        {...dataProps}
      >
        <img
          src={APPLE_MARK}
          alt=""
          className="h-[26px] w-[21px] object-contain shrink-0"
          aria-hidden
        />
        <div className="flex flex-col items-start">
          <span className="text-[10px] uppercase tracking-widest text-white/70 font-bold leading-none mb-1">
            Download on
          </span>
          <span className="text-sm font-bold text-white leading-none">App Store</span>
        </div>
      </IosDownloadLink>
      <a
        href={PXI_PLAY_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={BTN_CLASS}
        {...dataProps}
      >
        <FaGooglePlay size={26} className="text-white shrink-0" />
        <div className="flex flex-col items-start">
          <span className="text-[10px] uppercase tracking-widest text-white/70 font-bold leading-none mb-1">
            Get it on
          </span>
          <span className="text-sm font-bold text-white leading-none">Google Play</span>
        </div>
      </a>
    </div>
  );
}
