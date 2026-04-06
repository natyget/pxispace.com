'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Instagram } from 'lucide-react';
import { FaTiktok } from 'react-icons/fa';
import { PXI_APP_STORE_URL } from '@/lib/appStoreLinks';
import IosDownloadLink from '@/components/links/IosDownloadLink';

const LogoSVG = '/favicon.svg';

const linkClass = 'text-gray-500 hover:text-pxi-purple transition-colors';

const Footer = () => {
  return (
    <footer className="bg-black pt-24 pb-12 border-t border-gray-900">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 gap-10 pt-12 border-t border-gray-800 text-left sm:grid-cols-2 lg:grid-cols-12 lg:gap-x-8 xl:gap-x-12">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-4">
            <Link href="/" className="inline-flex items-center gap-2 mb-4 cursor-pointer">
              <Image src={LogoSVG} alt="PXI" width={32} height={32} className="h-8 w-8" />
            </Link>
            <p className="text-gray-500 max-w-sm text-sm leading-relaxed">
              Your social life, unfiltered. Plan the party, share the camera roll, and relive the nostalgia.
            </p>
          </div>

          {/* Product */}
          <div className="lg:col-span-2">
            <h4 className="font-semibold mb-4 text-white text-sm tracking-wide uppercase">
              Product
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/" className={linkClass}>
                  Home
                </Link>
              </li>
              <li>
                <Link href="/events" className={linkClass}>
                  Events
                </Link>
              </li>
              <li>
                <Link href="/about" className={linkClass}>
                  About
                </Link>
              </li>
              <li>
                <IosDownloadLink href={PXI_APP_STORE_URL} className={linkClass}>
                  Download the app
                </IosDownloadLink>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="lg:col-span-3">
            <h4 className="font-semibold mb-4 text-white text-sm tracking-wide uppercase">
              Legal
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/legal#privacy" className={linkClass}>
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/legal#terms" className={linkClass}>
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/legal#community" className={linkClass}>
                  Community Standards
                </Link>
              </li>
              <li>
                <Link href="/legal#cookie" className={linkClass}>
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link href="/legal#vendor" className={linkClass}>
                  Vendor Agreement
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="lg:col-span-3">
            <h4 className="font-semibold mb-4 text-white text-sm tracking-wide uppercase">
              Support
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/support" className={linkClass}>
                  Help center
                </Link>
              </li>
              <li>
                <Link href="/support#faq" className={linkClass}>
                  FAQs
                </Link>
              </li>
              <li>
                <a href="mailto:support@pxispace.com" className={linkClass}>
                  Contact support
                </a>
              </li>
              <li>
                <a href="mailto:trust@pxispace.com" className={linkClass}>
                  Trust &amp; safety
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-12 pt-8 border-t border-gray-900 text-gray-600 text-sm">
          <p className="text-center md:text-left">
            &copy; {new Date().getFullYear()} PXI App. All rights reserved.
          </p>
          <div className="flex gap-4 shrink-0">
            <a
              href="https://www.instagram.com/pxilabs/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-white transition-colors"
              aria-label="PXI on Instagram"
            >
              <Instagram size={20} />
            </a>
            <a
              href="https://www.tiktok.com/@pxi.labs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-white transition-colors"
              aria-label="PXI on TikTok"
            >
              <FaTiktok size={20} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
