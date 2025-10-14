"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Image from "next/image";
import Link from "next/link";
import { Calendar, MapPin } from "lucide-react";
import { useState } from "react";
import { useParams } from "next/navigation";

export default function EventDetailPage() {
  const params = useParams();
  const albumId = params.id as Id<"albums">;
  const album = useQuery(api.albums.getPublicAlbumById, { albumId });
  const [copied, setCopied] = useState(false);

  const copyInviteLink = () => {
    if (!album?.inviteToken) return;
    const inviteUrl = buildInviteUrl(album.inviteToken);
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openInApp = () => {
    // Use universal link which will open in app if installed, or web if not
    const appUrl = `https://pxispace.com/album/${albumId}${album?.inviteToken ? `?invite=${album.inviteToken}` : ''}`;
    window.location.href = appUrl;
  };

  if (album === undefined) {
    return (
      <main className="relative min-h-screen pt-32">
        <div className="fixed inset-0 -z-10 bg-gradient-to-b from-black via-gray-900 to-black" />
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent" />
        </div>
      </main>
    );
  }

  if (album === null) {
    return (
      <main className="relative min-h-screen pt-32">
        <div className="fixed inset-0 -z-10 bg-gradient-to-b from-black via-gray-900 to-black" />
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Event Not Found</h1>
          <p className="text-gray-400 mb-8">
            This event is either private or doesn&apos;t exist.
          </p>
          <Link href="/" className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-full font-bold inline-block transition-colors">
            Back to Home
          </Link>
        </div>
      </main>
    );
  }

  const buildInviteUrl = (code: string) => {
    return `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://pxispace.com'}/album/${albumId}?invite=${code}`;
  };

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return undefined;
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <main className="relative min-h-screen pt-32 pb-20">
      {/* Dark gradient background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-black via-gray-900 to-black" />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Event Card with Side-by-Side Layout */}
        <div className="bg-gray-900/50 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-gray-800">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Left: Event Image */}
            <div className="relative h-[500px] md:h-auto bg-gradient-to-br from-purple-900 to-pink-900">
              {album.displayImageUrl ? (
                <>
                  <Image
                    src={album.displayImageUrl}
                    alt={album.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-white text-6xl">🎉</div>
                </div>
              )}
              
              {/* Badges on image */}
              {album.participantsCount >= 5 && (
                <div className="absolute top-6 left-6 flex flex-wrap gap-2">
                  <div className="px-3 py-1.5 rounded-full bg-green-500/90 backdrop-blur-md text-white text-xs font-bold">
                    {album.participantsCount} joined
                  </div>
                </div>
              )}
            </div>

            {/* Right: Event Details */}
            <div className="p-8 md:p-10 flex flex-col bg-black/40">
              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-6">
                {album.name}
              </h1>

              {/* Event Details */}
              <div className="space-y-4 mb-8">
                {album.start_time && (
                  <div className="flex items-start gap-3">
                    <Calendar size={20} className="text-purple-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-100">
                        {new Date(album.start_time).toLocaleDateString(undefined, { 
                          weekday: 'long',
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                      <p className="text-sm text-gray-400">
                        {formatTime(album.start_time)}
                        {album.end_time && ` - ${formatTime(album.end_time)}`}
                      </p>
                    </div>
                  </div>
                )}
                
                {album.location && (
                  <div className="flex items-start gap-3">
                    <MapPin size={20} className="text-purple-400 mt-1 flex-shrink-0" />
                    <p className="font-medium text-gray-100">{album.location}</p>
                  </div>
                )}

                {/* Participants */}
                <div className="flex items-center gap-3 p-4 bg-purple-900/30 rounded-xl border border-purple-700/30">
                  <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-lg">👥</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Participants</p>
                    <p className="text-lg font-bold text-white">
                      {album.participantsCount} {album.participantsCount === 1 ? 'person' : 'people'}
                    </p>
                  </div>
                </div>
              </div>

              {/* About */}
              {album.description && (
                <div className="mb-8">
                  <h2 className="text-lg font-bold text-white mb-3">About</h2>
                  <p className="text-gray-300 leading-relaxed">{album.description}</p>
                </div>
              )}

              {/* QR Code & Share Section */}
              {album.inviteToken && (
                <div className="mt-auto">
                  <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 rounded-2xl p-6 border border-purple-700/30 backdrop-blur-sm">
                    <h3 className="text-lg font-bold text-white mb-4 text-center">Join this Event</h3>
                    
                    {/* QR Code */}
                    <div className="bg-white rounded-xl p-4 mb-4 flex justify-center">
                      <Image
                        src={`https://quickchart.io/qr?text=${encodeURIComponent(buildInviteUrl(album.inviteToken))}&margin=1&size=200&format=png`}
                        alt="QR Code"
                        width={200}
                        height={200}
                        className="rounded-lg"
                      />
                    </div>
                    
                    <p className="text-sm text-gray-300 text-center mb-4">
                      Scan with your phone to join
                    </p>

                    {/* Share Link */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={buildInviteUrl(album.inviteToken)}
                        readOnly
                        className="flex-1 px-4 py-3 rounded-xl text-sm bg-black/40 border border-gray-700 text-gray-300 truncate backdrop-blur-sm"
                      />
                      <button
                        onClick={copyInviteLink}
                        className="px-6 py-3 rounded-xl font-bold text-sm bg-purple-600 hover:bg-purple-700 text-white transition-all flex items-center gap-2 whitespace-nowrap"
                      >
                        {copied ? '✓ Copied' : 'Copy'}
                      </button>
                    </div>

                    {/* Open in App Button */}
                    <button
                      onClick={openInApp}
                      className="w-full mt-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-4 rounded-xl font-bold text-base transition-all shadow-lg hover:shadow-xl"
                    >
                      Open in App →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

