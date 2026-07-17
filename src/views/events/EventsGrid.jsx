'use client';

import React from 'react';
import EventCard from './EventCard';
import { StaggerGroup, RevealItem, HoverLift } from '@/components/motion/Reveal';

const EventsGrid = ({ events, favoriteIds, onToggleFavorite, onQuickView, detailBasePath = '/events' }) => {
  return (
    <StaggerGroup className="flex flex-wrap justify-center gap-8 lg:gap-10">
      {events.map((event) => (
        <RevealItem key={event.id} className="w-[380px] max-w-full shrink-0">
          <HoverLift>
            <EventCard
              event={event}
              favorited={favoriteIds.has(String(event.id))}
              onToggleFavorite={onToggleFavorite}
              onQuickView={onQuickView}
              detailBasePath={detailBasePath}
            />
          </HoverLift>
        </RevealItem>
      ))}
    </StaggerGroup>
  );
};

export default EventsGrid;
