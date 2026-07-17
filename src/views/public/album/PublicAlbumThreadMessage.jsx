'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { HugeiconsIcon } from '@hugeicons/react';
import { PlayIcon, PauseIcon } from '@hugeicons/core-free-icons';
import UserAvatar from '@/components/ui/UserAvatar';
import { displayImageSrc } from '@/lib/mediaUrl';
import { formatAlbumPostTime } from './publicAlbumDate';
import { isGifContent } from './buildPublicAlbumTimeline';

function VoiceNotePill({ audioUrl, durationSec }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationSec || 0);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((err) => {
        console.error('Audio play failed:', err);
      });
    }
  }, [playing]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const onEnded = () => {
      setPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }, [audioUrl]);

  const progress = duration > 0 ? Math.min(1, currentTime / duration) : 0;

  return (
    <div className="flex h-9 w-[190px] items-center gap-2.5 rounded-full bg-white/10 px-3 py-2 shadow-inner">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      <button
        type="button"
        onClick={togglePlay}
        className="flex size-5 items-center justify-center text-white outline-none hover:scale-105 active:scale-95 transition-transform"
        aria-label={playing ? 'Pause voice note' : 'Play voice note'}
      >
        <HugeiconsIcon icon={playing ? PauseIcon : PlayIcon} className="size-[16px] text-white" />
      </button>
      <div className="relative h-1 flex-1 rounded-full bg-white/25 overflow-hidden">
        <div
          className="h-full bg-white rounded-full transition-[width] duration-75 ease-out"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
}

// Mirrors the mobile album thread: borderless bubbles, and GIFs render bare
// (rounded media, no tray/header) — the avatar alone carries attribution.
export default function PublicAlbumThreadMessage({ message, rotation = 0 }) {
  const author = message.author;
  const timeLabel = formatAlbumPostTime(message.createdAt);
  const isGif = isGifContent(message.content);
  const gifSrc = isGif ? displayImageSrc(message.content.trim(), null) : null;
  const isVoice = message.messageType === 'voice' && !!message.audioUrl;

  return (
    <div
      className="mb-3 flex w-full items-end justify-start gap-2.5"
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <div className="mb-0.5 size-[38px] shrink-0 overflow-hidden rounded-full">
        <UserAvatar user={{ avatarUrl: author?.avatarUrl }} size={38} className="size-full" />
      </div>
      {isVoice ? (
        <div className="flex flex-col gap-1 items-start max-w-[300px]">
          <div className="flex w-full items-center justify-between gap-3 px-1">
            {author?.username ? (
              <span className="truncate text-[10px] font-bold text-[#9ea2b0]">
                {author.username}
              </span>
            ) : (
              <span />
            )}
            {timeLabel ? (
              <span className="shrink-0 text-[9px] text-[#9ea2b0]/75">{timeLabel}</span>
            ) : null}
          </div>
          <VoiceNotePill audioUrl={message.audioUrl} durationSec={message.audioDurationSec} />
        </div>
      ) : isGif && gifSrc ? (
        <Image
          src={gifSrc}
          alt="GIF"
          width={200}
          height={150}
          unoptimized
          className="h-[150px] w-[200px] max-w-full rounded-[14px] rounded-bl-lg object-cover"
        />
      ) : (
        <div className="max-w-[300px] shrink overflow-hidden rounded-[14px] rounded-bl-lg bg-white/[0.08]">
          <div className="px-2.5 py-1.5">
            <div className="mb-1 flex items-center justify-between gap-2">
              {author?.username ? (
                <span className="truncate text-[10px] font-bold text-[#9ea2b0]">
                  {author.username}
                </span>
              ) : (
                <span />
              )}
              {timeLabel ? (
                <span className="shrink-0 text-[9px] text-[#9ea2b0]/75">{timeLabel}</span>
              ) : null}
            </div>
            <p className="whitespace-pre-wrap text-sm leading-[19px] text-white">
              {message.content}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
