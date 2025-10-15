"use client";

import { useEffect, useRef } from "react";

interface LoadingAnimationProps {
  onComplete: () => void;
}

export function LoadingAnimation({ onComplete }: LoadingAnimationProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Autoplay video on mount
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay might be blocked, that's okay
      });
    }

    // Complete after video duration (or fallback timer)
    const timer = setTimeout(() => {
      onComplete();
    }, 5000); // 5 second fallback

    return () => {
      clearTimeout(timer);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        muted
        playsInline
        autoPlay
        loop={false}
        onEnded={onComplete}
      >
        <source src="/assets/logo.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
