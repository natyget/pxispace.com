import React from 'react';
import { Composition } from 'remotion';
import { Avalanche } from './templates/avalanche';
import { MorningTable } from './templates/morning-table';
import { TicketFlip } from './templates/ticket-flip';
import { defaultProps, templateSchema } from './lib/props';
import { VIDEO } from './lib/tokens';

// One composition per template; all share the 1080×1920 / 30fps / 8.5s master
// and the same three props.
const templates = [
  { id: 'pxi-ticket-flip', component: TicketFlip },
  { id: 'pxi-avalanche', component: Avalanche },
  { id: 'pxi-morning-table', component: MorningTable },
] as const;

export const Root: React.FC = () => (
  <>
    {templates.map(({ id, component }) => (
      <Composition
        key={id}
        id={id}
        component={component}
        schema={templateSchema}
        defaultProps={defaultProps}
        width={VIDEO.width}
        height={VIDEO.height}
        fps={VIDEO.fps}
        durationInFrames={VIDEO.durationInFrames}
      />
    ))}
  </>
);
