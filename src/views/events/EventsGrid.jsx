'use client';

import React from 'react';
import EventCard from './EventCard';

const EventsGrid = ({ events, favoriteIds, onToggleFavorite, onQuickView }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
      {events.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          favorited={favoriteIds.has(String(event.id))}
          onToggleFavorite={onToggleFavorite}
          onQuickView={onQuickView}
        />
      ))}
    </div>
  );
};

export default EventsGrid;
