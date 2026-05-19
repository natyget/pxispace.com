'use client';

export default function PublicAlbumThreadJoinEvent({ text }) {
  return (
    <div className="my-2.5 flex items-center gap-3">
      <div className="h-px flex-1 bg-white/[0.08]" />
      <p className="shrink-0 text-[11px] font-semibold text-white/35">{text}</p>
      <div className="h-px flex-1 bg-white/[0.08]" />
    </div>
  );
}
