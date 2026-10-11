'use client';

import { HugeiconsIcon } from '@hugeicons/react';
import { PauseIcon, PlayIcon } from '@hugeicons/core-free-icons';
import { previewSrc, useSongPreview } from '@/lib/songPreview';

/**
 * The night's top song: a small record with the artwork on its label, "Song" over the title and the artist.
 * Nothing plays by itself. When the listing carries a preview clip, the record is a button: a tap plays about thirty
 * seconds (the same fade the event page uses) and a second tap stops it.
 *
 * @param {{ title: string, artist?: string, artworkUrl?: string | null, previewUrl?: string | null }} props
 */
export default function GoSong({ title, artist = '', artworkUrl = null, previewUrl = null }) {
  const preview = useSongPreview();
  const src = previewSrc(previewUrl);
  const playing = Boolean(src) && preview.playingSrc === src;
  const toggle = () => (playing ? preview.stop() : preview.start(src));

  const record = (
    <>
      <span className={`go-record-disc${playing ? ' is-playing' : ''}`} aria-hidden="true">
        <span className="go-record-label">{artworkUrl ? <img src={artworkUrl} alt="" referrerPolicy="no-referrer" loading="lazy" decoding="async" /> : null}</span>
        <span className="go-record-hole" />
      </span>
      {src ? (
        <span className="go-record-play" aria-hidden="true">
          <HugeiconsIcon icon={playing ? PauseIcon : PlayIcon} size={16} strokeWidth={2.2} />
        </span>
      ) : null}
    </>
  );

  return (
    <div className="go-song">
      {src ? (
        <button type="button" className="go-record" onClick={toggle} aria-pressed={playing} aria-label={playing ? `Pause ${title}` : `Play a preview of ${title}`}>
          {record}
        </button>
      ) : (
        <span className="go-record">{record}</span>
      )}
      <div className="go-song-text">
        <p className="go-song-label">Song</p>
        <p className="go-song-title">{title}</p>
        {artist ? <p className="go-song-artist">{artist}</p> : null}
      </div>
    </div>
  );
}
