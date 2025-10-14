"use client";

import { useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";

export default function AlbumDeepLinkPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const albumId = params.id as string;
  const inviteToken = searchParams.get("invite");

  useEffect(() => {
    // Construct the deep link URL
    const appUrl = `pxistudio://album/${albumId}${inviteToken ? `?invite=${inviteToken}` : ''}`;
    const fallbackUrl = 'https://apps.apple.com/us/app/pxistudio/id6753878296';

    // Try to open the app
    window.location.href = appUrl;

    // Fallback to App Store/TestFlight after a delay if app doesn't open
    const fallbackTimer = setTimeout(() => {
      window.location.href = fallbackUrl;
    }, 1500);

    return () => clearTimeout(fallbackTimer);
  }, [albumId, inviteToken]);

  return (
    <main className="relative min-h-screen pt-20">
      <div className="fixed inset-0 -z-10 bg-ink-gradient" />
      <div className="fixed inset-[-20%] -z-10 bg-gradient-radial pointer-events-none" />
      
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-violet border-t-transparent mb-6" />
        <h1 className="text-3xl md:text-4xl font-bold text-text-muted mb-4">
          Opening PXI Studio...
        </h1>
        <p className="text-text-secondary mb-8">
          If the app doesn&apos;t open automatically, you&apos;ll be redirected to download it.
        </p>
        <a
          href="https://apps.apple.com/us/app/pxistudio/id6753878296"
          className="btn-neon-outline px-6 py-3 rounded-full font-bold text-[#eae6ff] inline-block"
        >
          Download on the App Store
        </a>
      </div>
    </main>
  );
}

