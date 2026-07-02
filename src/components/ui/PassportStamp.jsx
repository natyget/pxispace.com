import React from 'react';
import { StampShapeGraphic } from '@/components/passport/StampShapeGraphic';

const TIER_CONFIG = {
  Wanderer: { color: '#B026FF', shape: 'square-border' },
  Seeker: { color: '#60A5FA', shape: 'circle-exit' },
  Voyager: { color: '#34D399', shape: 'diamond-pass' },
  Pathfinder: { color: '#FB923C', shape: 'hexagon-pass' },
  Luminary: { color: '#FCD34D', shape: 'star-burst' },
  Odyssey: { color: '#E5E7EB', shape: 'shield-crest' },
};

export default function PassportStamp({ eventName, date, tier, shape, color, city = "", role = "", size = 'md', className = '' }) {
  const config = tier ? (TIER_CONFIG[tier] || TIER_CONFIG.Wanderer) : { shape: 'square-border', color: '#B026FF' };
  
  const finalShape = shape || config.shape;
  const finalColor = color || config.color;

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
    xl: 'w-48 h-48',
  };

  return (
    <div className={`${sizeClasses[size] || sizeClasses.md} flex-shrink-0 ${className}`}>
      <StampShapeGraphic
        shape={finalShape}
        color={finalColor}
        name={eventName}
        date={date}
        city={city}
        role={role}
      />
    </div>
  );
}
