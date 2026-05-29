'use client';

import Navbar from '@/components/layout/Navbar';

export default function LoginLayout({ children }) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <Navbar />
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
