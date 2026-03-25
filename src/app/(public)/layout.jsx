'use client';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { usePathname } from 'next/navigation';

export default function PublicLayout({ children }) {
  const pathname = usePathname();
  // Listing at /events-new uses its own chrome; event detail /events-new/[id] keeps the global header.
  const isEventsNewDetail = /^\/events-new\/.+/.test(pathname ?? '');
  const showNavbar =
    pathname === '/' ||
    pathname === '/home' ||
    isEventsNewDetail;
  return (
    <div className="relative min-h-screen flex flex-col">
      {showNavbar ? <Navbar /> : null}
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
