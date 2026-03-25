'use client';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { usePathname } from 'next/navigation';

export default function PublicLayout({ children }) {
  const pathname = usePathname();
  const showNavbar =
    pathname === '/' ||
    pathname === '/home' ||
    pathname?.startsWith('/events-new');
  return (
    <div className="relative min-h-screen flex flex-col">
      {showNavbar ? <Navbar /> : null}
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
