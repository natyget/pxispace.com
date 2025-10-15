"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useEffect } from "react";
import { ChevronDown, Calendar, MapPin, Users, Clock } from "lucide-react";
import { AlbumCard } from "@/components/AlbumCard";

export default function EventsPage() {
  const albums = useQuery(api.albums.listPublicAlbums);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);

  // Autoplay carousel when there are multiple events
  useEffect(() => {
    if (!albums || albums.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentEventIndex((prevIndex) => 
        prevIndex === albums.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000); // Change event every 5 seconds

    return () => clearInterval(interval);
  }, [albums]);

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return undefined;
    const date = new Date(timestamp);
    return {
      day: date.toLocaleDateString(undefined, { weekday: 'long' }),
      date: date.toLocaleDateString(undefined, { month: 'long', day: 'numeric' }),
      time: date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
    };
  };

  const currentEvent = albums?.[currentEventIndex];

  if (albums === undefined) {
    return (
      <main className="relative min-h-screen">
        <div className="fixed inset-0 -z-10 bg-ink-gradient" />
        <div className="fixed inset-[-20%] -z-10 bg-gradient-radial pointer-events-none" />
        <div className="flex items-center justify-center min-h-screen">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-violet border-t-transparent" />
        </div>
      </main>
    );
  }

  if (albums.length === 0) {
    return (
      <main className="relative min-h-screen">
        <div className="fixed inset-0 -z-10 bg-ink-gradient" />
        <div className="fixed inset-[-20%] -z-10 bg-gradient-radial pointer-events-none" />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-text-secondary text-lg">No public events at the moment.</p>
            <p className="text-text-secondary/60 mt-2">Check back soon for upcoming events!</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen">
      {/* Background */}
      <div className="fixed inset-0 -z-10 bg-ink-gradient" />
      <div className="fixed inset-[-20%] -z-10 bg-gradient-radial pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 pt-6 pb-4">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="text-xl font-bold text-white">pxi</div>
            
            {/* Navigation/Filters */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-text-secondary hover:text-white cursor-pointer">
                <span className="text-sm">Trending</span>
                <ChevronDown size={14} />
              </div>
              <div className="flex items-center gap-2 text-text-secondary hover:text-white cursor-pointer">
                <span className="text-sm">This Week</span>
                <ChevronDown size={14} />
              </div>
              <div className="flex items-center gap-2 text-text-secondary hover:text-white cursor-pointer">
                <span className="text-sm">in Nairobi, KE</span>
                <ChevronDown size={14} />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button className="text-white hover:text-violet transition-colors text-sm">Log In</button>
              <button className="bg-white text-black px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors text-sm">
                Create An Event
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Featured Event Carousel - Top Half */}
      <section className="relative z-10 py-12">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Featured Event</h2>
            <p className="text-text-secondary text-sm">Discover our highlighted events</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center min-h-[40vh]">
            {/* Event Poster/Image */}
            <div className="relative">
              <div className="relative w-full aspect-[4/5] rounded-xl overflow-hidden bg-ink">
                {currentEvent?.displayImageUrl ? (
                  <img
                    src={currentEvent.displayImageUrl}
                    alt={currentEvent.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet/20 to-violet-strong/20">
                    <span className="text-4xl opacity-30">📸</span>
                  </div>
                )}
              </div>
            </div>

            {/* Event Details */}
            <div className="space-y-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2 leading-tight">
                  {currentEvent?.name}
                </h1>
                {currentEvent?.description && (
                  <p className="text-text-primary text-sm mb-2 line-clamp-3">{currentEvent.description}</p>
                )}
              </div>

              <div className="space-y-2">
                {currentEvent?.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="text-violet" size={16} />
                    <span className="text-white text-sm">{currentEvent.location}</span>
                  </div>
                )}
                
                {currentEvent?.start_time && (
                  <div className="flex items-center gap-2">
                    <Calendar className="text-violet" size={16} />
                    <span className="text-white text-sm">
                      {formatDate(currentEvent.start_time)?.day}: {formatDate(currentEvent.start_time)?.date}
                    </span>
                  </div>
                )}

                {currentEvent?.start_time && (
                  <div className="flex items-center gap-2">
                    <Clock className="text-violet" size={16} />
                    <span className="text-white text-sm">{formatDate(currentEvent.start_time)?.time}</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Users className="text-violet" size={16} />
                  <span className="text-white text-sm">
                    {currentEvent?.participantsCount} {currentEvent?.participantsCount === 1 ? 'participant' : 'participants'}
                  </span>
                </div>
              </div>

              <button className="bg-white text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors">
                Get Tickets
              </button>
            </div>
          </div>

          {/* Pagination Dots for Featured Event */}
          {albums.length > 1 && (
            <div className="flex justify-center mt-8">
              <div className="flex gap-2">
                {albums.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentEventIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentEventIndex 
                        ? 'bg-white' 
                        : 'bg-white/30 hover:bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Divider */}
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="border-t border-violet/20"></div>
        </div>
      </div>

      {/* All Events Grid - Bottom Half */}
      <section className="relative z-10 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">All Events</h2>
            <p className="text-text-secondary text-sm">Browse through all available events</p>
          </div>
          
          {albums.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-text-secondary">No public events at the moment.</p>
              <p className="text-text-secondary/60 mt-1">Check back soon for upcoming events!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {albums.map((album) => (
                <AlbumCard
                  key={album._id}
                  id={album._id}
                  name={album.name}
                  description={album.description}
                  displayImageUrl={album.displayImageUrl}
                  location={album.location}
                  start_time={album.start_time}
                  participantsCount={album.participantsCount}
                  status={album.status}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
