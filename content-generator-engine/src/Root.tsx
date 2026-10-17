import React from 'react';
import { Composition } from 'remotion';
import { buildStoryboard, type Library } from '../storyboard/build.ts';
import brunch from '../events/brunch.json';
import library from '../footage/library.json';
import { Film } from './Film';
import { DURATION_FRAMES, FPS, HEIGHT, WIDTH, type EventInput, type Storyboard } from './lib/storyboard';

// One composition. Its props are a whole storyboard: storyboard/generate.ts
// plans one per event and passes it in; Studio opens on the brunch plan.
const defaultProps: Storyboard = buildStoryboard(brunch as EventInput, library as Library);

export const Root: React.FC = () => (
  <Composition
    id="pxi-film"
    component={Film}
    defaultProps={defaultProps}
    width={WIDTH}
    height={HEIGHT}
    fps={FPS}
    durationInFrames={DURATION_FRAMES}
  />
);
