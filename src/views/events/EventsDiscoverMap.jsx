'use client';

import React, { useMemo } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Location01Icon } from '@hugeicons/core-free-icons';

function bboxForEvents(events) {
  const pts = (events || []).filter(
    (e) => e.latitude != null && e.longitude != null && !Number.isNaN(Number(e.latitude)) && !Number.isNaN(Number(e.longitude))
  );
  if (!pts.length) return null;
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLon = Infinity;
  let maxLon = -Infinity;
  for (const e of pts) {
    const lat = Number(e.latitude);
    const lon = Number(e.longitude);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
    minLon = Math.min(minLon, lon);
    maxLon = Math.max(maxLon, lon);
  }
  const pad = 0.04;
  if (minLat === maxLat && minLon === maxLon) {
    return [minLon - pad, minLat - pad, maxLon + pad, maxLat + pad];
  }
  return [minLon - pad, minLat - pad, maxLon + pad, maxLat + pad];
}

const EventsDiscoverMap = ({ events }) => {
  const src = useMemo(() => {
    const box = bboxForEvents(events);
    if (!box) return null;
    const [minLon, minLat, maxLon, maxLat] = box;
    // bbox=left,bottom,right,top — use raw commas; pre-escaped %2C + encodeURIComponent becomes %252C and breaks OSM
    const bboxParam = `${minLon},${minLat},${maxLon},${maxLat}`;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bboxParam)}&layer=mapnik`;
  }, [events]);

  if (!src) {
    return (
      <div className="glass-dark rounded-[2rem] border border-white/10 p-10 text-center text-zinc-500 mb-12">
        <HugeiconsIcon icon={Location01Icon} className="mx-auto mb-3 opacity-40" size={32} />
        <p className="text-sm font-medium">No map locations yet — add coordinates to events in the dashboard.</p>
      </div>
    );
  }

  return (
    <section className="mb-16">
      <h2 className="text-2xl font-black uppercase tracking-tighter text-white mb-4">Map</h2>
      <p className="text-zinc-500 text-sm mb-4 max-w-2xl">
        Explore where public events are happening. Pan and zoom inside the frame (OpenStreetMap).
      </p>
      <div className="relative rounded-[2rem] overflow-hidden border border-white/10 h-[min(420px,50vh)] bg-zinc-900">
        <iframe title="Event locations map" src={src} className="absolute inset-0 w-full h-full border-0" loading="lazy" />
      </div>
    </section>
  );
};

export default EventsDiscoverMap;
