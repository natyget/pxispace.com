import Link from "next/link";
import Image from "next/image";
import { StatusBadge } from "./StatusBadge";
import { Calendar, MapPin, Users } from "lucide-react";

interface AlbumCardProps {
  id: string;
  name: string;
  description?: string;
  displayImageUrl?: string;
  location?: string;
  start_time?: number;
  participantsCount: number;
  status: 'live' | 'upcoming' | 'memory';
  viewMode?: 'grid' | 'list';
}

export function AlbumCard({
  id,
  name,
  description,
  displayImageUrl,
  location,
  start_time,
  participantsCount,
  status,
  viewMode = 'grid',
}: AlbumCardProps) {
  const formatDate = (timestamp?: number) => {
    if (!timestamp) return undefined;
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (viewMode === 'list') {
    return (
      <Link href={`/events/${id}`}>
        <div className="glass rounded-2xl p-4 card-hover cursor-pointer">
          <div className="flex gap-4">
            {/* Album Cover - Square for list view */}
            <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-ink flex-shrink-0">
              {displayImageUrl ? (
                <Image
                  src={displayImageUrl}
                  alt={name}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet/20 to-violet-strong/20">
                  <span className="text-2xl opacity-30">📸</span>
                </div>
              )}
              <div className="absolute top-1 right-1">
                <StatusBadge status={status} />
              </div>
            </div>

            {/* Album Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-text-muted mb-1 line-clamp-1">{name}</h3>
              {description && (
                <p className="text-text-secondary/80 text-sm mb-2 line-clamp-2">{description}</p>
              )}

              <div className="flex flex-wrap gap-4 text-sm text-text-secondary/70">
                {start_time && (
                  <div className="flex items-center gap-1">
                    <Calendar size={14} className="text-violet" />
                    <span>{formatDate(start_time)}</span>
                  </div>
                )}
                {location && (
                  <div className="flex items-center gap-1">
                    <MapPin size={14} className="text-violet" />
                    <span className="line-clamp-1">{location}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Users size={14} className="text-violet" />
                  <span>{participantsCount} {participantsCount === 1 ? 'participant' : 'participants'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/events/${id}`}>
      <div className="glass rounded-2xl p-4 card-hover cursor-pointer">
        {/* Album Cover */}
        <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-ink mb-4">
          {displayImageUrl ? (
            <Image
              src={displayImageUrl}
              alt={name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet/20 to-violet-strong/20">
              <span className="text-4xl opacity-30">📸</span>
            </div>
          )}
          <div className="absolute top-3 right-3">
            <StatusBadge status={status} />
          </div>
        </div>

        {/* Album Info */}
        <h3 className="text-lg font-bold text-text-muted mb-2 line-clamp-1">{name}</h3>
        {description && (
          <p className="text-text-secondary/80 text-sm mb-3 line-clamp-2">{description}</p>
        )}

        <div className="flex flex-col gap-2 text-sm text-text-secondary/70">
          {start_time && (
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-violet" />
              <span>{formatDate(start_time)}</span>
            </div>
          )}
          {location && (
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-violet" />
              <span className="line-clamp-1">{location}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Users size={16} className="text-violet" />
            <span>{participantsCount} {participantsCount === 1 ? 'participant' : 'participants'}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

