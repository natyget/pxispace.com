'use client';

import React from 'react';
import EventCard from './EventCard';

const EventsGrid = ({ events, favoriteIds, onToggleFavorite, onQuickView, detailBasePath = '/events' }) => {
  return (
    <div className="flex flex-wrap justify-center gap-8 lg:gap-10">
      {events.map((event) => (
        <div key={event.id} className="w-[380px] max-w-full shrink-0">
          <EventCard
            event={event}
            favorited={favoriteIds.has(String(event.id))}
            onToggleFavorite={onToggleFavorite}
            onQuickView={onQuickView}
            detailBasePath={detailBasePath}
          />
        </div>
      ))}
    </div>
  );
};

export default EventsGrid;
