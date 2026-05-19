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
    pathname?.startsWith('/features') ||
    pathname?.startsWith('/competitors') ||
    pathname === '/organizers' ||
    pathname?.startsWith('/events') ||
    pathname?.startsWith('/u/') ||
    pathname?.startsWith('/p/');
  const isPublicProfile = pathname?.startsWith('/u/');
  const isPublicPost = pathname?.startsWith('/p/');
  const isPublicAlbum = pathname?.startsWith('/album/');

  return (
    <div
      className={`relative flex flex-col ${
        isPublicAlbum ? 'min-h-dvh lg:h-dvh lg:max-h-dvh lg:overflow-hidden' : 'min-h-screen'
      }`}
    >
      {showNavbar ? <Navbar /> : null}
      <main
        className={
          isPublicAlbum
            ? 'flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto bg-black lg:overflow-hidden'
            : 'flex-1'
        }
      >
        {children}
      </main>
      {!isPublicProfile && !isPublicPost && !isPublicAlbum ? <Footer /> : null}
    </div>
  );
}
