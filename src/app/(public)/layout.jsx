'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { PxiLoadingLanding } from '@/components/loading/PxiLoading';
import { usePathname } from 'next/navigation';

export default function PublicLayout({ children }) {
  const pathname = usePathname();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (pathname === '/' || pathname === '/home') {
      const timer = setTimeout(() => setHydrated(true), 1800);
      return () => clearTimeout(timer);
    } else {
      setHydrated(true);
    }
  }, [pathname]);

  const isLanding = pathname === '/' || pathname === '/home';
  const showNavbar =
    pathname === '/' ||
    pathname === '/home' ||
    pathname === '/about' ||
    pathname === '/beta' ||
    pathname?.startsWith('/features') ||
    pathname?.startsWith('/competitors') ||
    pathname === '/organizers' ||
    pathname?.startsWith('/events') ||
    pathname?.startsWith('/u/') ||
    pathname?.startsWith('/p/');
  const isPublicProfile = pathname?.startsWith('/u/');
  const isPublicPost = pathname?.startsWith('/p/');
  const isPublicAlbum = pathname?.startsWith('/album/');
  const isPublicEventFlow =
    (pathname?.startsWith('/events/') && pathname !== '/events') ||
    (pathname?.startsWith('/events-old/') && pathname !== '/events-old');

  return (
    <>
      {isLanding && !hydrated ? <PxiLoadingLanding /> : null}
      <div
        className={`relative flex flex-col ${
          isPublicAlbum ? 'h-dvh max-h-dvh overflow-hidden' : 'min-h-screen'
        }`}
      >
      {showNavbar ? <Navbar /> : null}
      <main
        className={
          isPublicAlbum
            ? 'flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-black'
            : 'flex-1'
        }
      >
        {children}
      </main>
      {!isLanding && !isPublicProfile && !isPublicPost && !isPublicAlbum && !isPublicEventFlow ? (
        <Footer />
      ) : null}
      </div>
    </>
  );
}
