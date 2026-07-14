'use client';

// No Navbar here — the auth page owns its own single back-button chrome
// (design law: one top chrome per screen, not a global Navbar stacked with
// the page's own back affordance).
export default function LoginLayout({ children }) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
