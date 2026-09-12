'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { HugeiconsIcon } from '@hugeicons/react';
import { SmartPhone01Icon } from '@hugeicons/core-free-icons';
const LogoSVG = '/images/logo.svg';
import { storeLabelForPlatform, storeUrlForPlatform } from '@/lib/appStoreLinks';
import IosDownloadLink from '@/components/links/IosDownloadLink';
import StoreGlyph from '@/components/links/StoreGlyph';
import { useAppPlatform } from '@/hooks/useAppPlatform';

export default function PassportRequiredPage() {
  const router = useRouter();
  const platform = useAppPlatform();
  const store = storeLabelForPlatform(platform);

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center px-4 py-16">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-pxi-purple/8 rounded-full blur-[140px]" />
      </div>

      <div className="relative w-full max-w-md text-center">
        <Link href="/">
          <Image src={LogoSVG} alt="PXI" width={40} height={40} className="h-10 w-10 mx-auto mb-8" priority />
        </Link>

        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-pxi-purple/10 border border-pxi-purple/20 flex items-center justify-center">
          <HugeiconsIcon icon={SmartPhone01Icon} size={32} className="text-pxi-purple" />
        </div>

        <h1 className="text-3xl font-black text-white mb-3 tracking-tight">Get Your PXI Passport</h1>
        <p className="text-zinc-400 text-base leading-relaxed mb-10">
          Your PXI Passport is your digital identity for events. To issue your PXI Passport, please use the PXI mobile app.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
          <IosDownloadLink
            href={storeUrlForPlatform(platform)}
            className="flex items-center gap-3 px-6 py-3.5 rounded-xl bg-white text-black font-semibold text-sm hover:bg-zinc-100 transition-all w-full sm:w-auto justify-center"
          >
            <StoreGlyph className="w-5 h-5 text-black" />
            {store.eyebrow} {store.name}
          </IosDownloadLink>
        </div>

        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
        >
          Continue without PXI Passport
        </button>
      </div>
    </div>
  );
}
