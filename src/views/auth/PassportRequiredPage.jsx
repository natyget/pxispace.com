'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { HugeiconsIcon } from '@hugeicons/react';
import { SmartPhone01Icon } from '@hugeicons/core-free-icons';
const LogoSVG = '/images/logo.svg';
import { PXI_APP_STORE_URL } from '@/lib/appStoreLinks';
import IosDownloadLink from '@/components/links/IosDownloadLink';

export default function PassportRequiredPage() {
  const router = useRouter();

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
            href={PXI_APP_STORE_URL}
            className="flex items-center gap-3 px-6 py-3.5 rounded-xl bg-white text-black font-semibold text-sm hover:bg-zinc-100 transition-all w-full sm:w-auto justify-center"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-black" xmlns="http://www.w3.org/2000/svg">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
            Download on App Store
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
