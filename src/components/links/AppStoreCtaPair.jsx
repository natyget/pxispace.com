'use client';

import { FaGooglePlay } from 'react-icons/fa';
import { PXI_IOS_DOWNLOAD_HREF, PXI_PLAY_STORE_URL } from '@/lib/appStoreLinks';
import IosDownloadLink from '@/components/links/IosDownloadLink';
import { useAppPlatform } from '@/hooks/useAppPlatform';
import { APPLE_MARK } from '@/lib/landingAssets';

const BTN_CLASS =
  'flex w-full max-w-[320px] sm:w-auto sm:max-w-none items-center justify-center gap-3 px-6 py-4 md:px-10 md:py-5 rounded-full bg-white/10 border-0 backdrop-blur-[60px] hover:bg-white/20 transition-all cursor-pointer';

/** Compact side-by-side row (e.g. bottom of a blurred public preview on mobile). */
const BTN_ROW_CLASS =
  'flex min-w-0 flex-1 items-center justify-center gap-2 px-3 py-2.5 rounded-full bg-white/5 backdrop-blur-3xl border-0 hover:bg-white/10 transition-colors cursor-pointer';

/**
 * Store CTAs, one per store the visitor can actually use.
 *
 * PXI ships on both stores now, so this shows BOTH buttons wherever the device
 * is unknown — desktop, and the server render — because a desktop visitor
 * holding an Android phone otherwise has no way to reach the Android build. On
 * a phone it narrows to that phone's store. The two-column layout below is the
 * original shape of this component (hence "Pair"); it only ever rendered one
 * button while iOS was the only build.
 *
 * @param {'default' | 'row'} [variant] — `row`: two equal columns with smaller copy (mobile blur footers).
 */
export default function AppStoreCtaPair({ className = '', variant = 'default', dataCursorHover = false }) {
  const platform = useAppPlatform();
  const dataProps = dataCursorHover ? { 'data-cursor-hover': true } : {};
  const isRow = variant === 'row';
  const btnClass = isRow ? BTN_ROW_CLASS : BTN_CLASS;

  // 'unknown' is the server render and the first client paint, so both buttons
  // are in the HTML and a phone drops the one it cannot use after mount.
  const showIos = platform !== 'android';
  const showAndroid = platform !== 'ios';

  const eyebrowClass = [
    'font-bold uppercase tracking-widest text-white/70 leading-none',
    isRow ? 'text-[8px] mb-0.5' : 'text-[10px] mb-1',
  ].join(' ');
  const nameClass = [isRow ? 'text-xs' : 'text-sm', 'font-bold text-white leading-none'].join(' ');
  const labelWrapClass = ['flex flex-col', isRow ? 'min-w-0 items-start text-left' : 'items-start'].join(' ');
  const markClass = ['object-contain shrink-0', isRow ? 'h-[22px] w-[18px]' : 'h-[26px] w-[21px]'].join(' ');

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
      {showIos ? (
        <IosDownloadLink
          href={PXI_IOS_DOWNLOAD_HREF}
          aria-label="Download on App Store"
          className={btnClass}
          {...dataProps}
        >
          <img src={APPLE_MARK} alt="" className={markClass} aria-hidden />
          <div className={labelWrapClass}>
            <span className={eyebrowClass}>Download on</span>
            <span className={nameClass}>App Store</span>
          </div>
        </IosDownloadLink>
      ) : null}

      {showAndroid ? (
        <IosDownloadLink
          href={PXI_PLAY_STORE_URL}
          aria-label="Get it on Google Play"
          className={btnClass}
          {...dataProps}
        >
          <FaGooglePlay className={[markClass, 'text-white'].join(' ')} aria-hidden />
          <div className={labelWrapClass}>
            <span className={eyebrowClass}>Get it on</span>
            <span className={nameClass}>Google Play</span>
          </div>
        </IosDownloadLink>
      ) : null}
    </div>
  );
}
