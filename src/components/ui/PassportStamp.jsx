import React from 'react';
import { StampShapeGraphic } from '@/components/passport/StampShapeGraphic';

const TIER_CONFIG = {
  Platinum: { color: '#c4b5fd', shape: 'star-burst' },
  Gold: { color: '#fbbf24', shape: 'diamond-pass' },
  Silver: { color: '#a1a1aa', shape: 'hexagon-pass' },
  Bronze: { color: '#fb923c', shape: 'square-border' },
};

export default function PassportStamp({ eventName, date, tier, size = 'md', className = '' }) {
  const config = TIER_CONFIG[tier] || TIER_CONFIG.Bronze;
  
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
    xl: 'w-48 h-48',
  };

  return (
    <div className={`${sizeClasses[size] || sizeClasses.md} ${className}`}>
      <StampShapeGraphic
        shape={config.shape}
        color={config.color}
        name={eventName}
        date={date}
        city=""
        role=""
      />
    </div>
  );
}
