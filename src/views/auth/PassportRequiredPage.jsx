'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Smartphone } from 'lucide-react';
const LogoSVG = "/images/logo.svg";
import { useAuth } from '../../contexts/AuthContext';

export default function PassportRequiredPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center px-4 py-16">
            {/* Background glow */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-pxi-purple/8 rounded-full blur-[140px]" />
            </div>

            <div className="relative w-full max-w-md text-center">
                <Link href="/">
                    <Image src={LogoSVG} alt="PXI" width={40} height={40} className="h-10 w-10 mx-auto mb-8" priority />
                </Link>

                {/* Icon */}
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-pxi-purple/10 border border-pxi-purple/20 flex items-center justify-center">
                    <Smartphone size={32} className="text-pxi-purple" />
                </div>

                <h1 className="text-3xl font-black text-white mb-3 tracking-tight">
                    Get Your PXI Passport
                </h1>
                <p className="text-zinc-400 text-base leading-relaxed mb-10">
                    Your PXI Passport is your digital identity for events.
                    To issue your PXI Passport, please use the PXI mobile app.
                </p>

                {/* App Store Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
                    <a
                        href="https://apps.apple.com/app/pxi"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-6 py-3.5 rounded-xl bg-white text-black font-semibold text-sm hover:bg-zinc-100 transition-all w-full sm:w-auto justify-center"
                    >
                        <svg
                            viewBox="0 0 24 24"
                            className="w-5 h-5 fill-black"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                        </svg>
                        Download on App Store
                    </a>
                    <a
                        href="https://play.google.com/store/apps/pxi"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-6 py-3.5 rounded-xl bg-white text-black font-semibold text-sm hover:bg-zinc-100 transition-all w-full sm:w-auto justify-center"
                    >
                        <svg
                            viewBox="0 0 24 24"
                            className="w-5 h-5 fill-black"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path d="M3.18 23.76c.3.17.64.22.98.14l13.12-7.57L14 13l-10.82 10.76zM.54 1.27C.2 1.6 0 2.14 0 2.87v18.27c0 .73.2 1.27.54 1.6L1.63 21.6 12.35 12 1.63 2.41.54 1.27zM20.46 10.37l-2.98-1.72-3.85 3.35 3.85 3.34 3-1.73c.85-.49.85-1.26-.02-1.74zM4.16.1L17.28 7.67l-3.28 2.87L3.18.24A1.2 1.2 0 0 1 4.16.1z" />
                        </svg>
                        Get it on Google Play
                    </a>
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
