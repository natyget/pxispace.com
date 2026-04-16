'use client';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { usePathname } from 'next/navigation';

export default function PublicLayout({ children }) {
  const pathname = usePathname();
  const showNavbar =
    pathname === '/' ||
    pathname === '/home' ||
    pathname === '/about' ||
    pathname === '/beta' ||
    pathname?.startsWith('/events') ||
    pathname?.startsWith('/u/') ||
    pathname?.startsWith('/p/');
  const isPublicProfile = pathname?.startsWith('/u/');
  const isPublicPost = pathname?.startsWith('/p/');

  return (
    <div className="relative min-h-screen flex flex-col">
      {showNavbar ? <Navbar /> : null}
      <main className="flex-1">{children}</main>
      {!isPublicProfile && !isPublicPost ? <Footer /> : null}
    </div>
  );
}
