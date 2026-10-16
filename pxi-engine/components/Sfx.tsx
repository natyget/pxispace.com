// Foley cues. The sounds are the PXI app's own (pxi-mobile-app/assets/sounds),
// so the ad sounds like the product. A cue is a frame and a sound name.

import React from 'react';
import { Html5Audio, Sequence, staticFile } from 'remotion';

export type SfxName = 'pop' | 'shutter' | 'success' | 'capture-chk';
export type Cue = { at: number; sound: SfxName; volume?: number };

export const Sfx: React.FC<{ cues: readonly Cue[] }> = ({ cues }) => (
  <>
    {cues.map((c, i) => (
      <Sequence key={`${c.sound}-${c.at}-${i}`} from={c.at} layout="none">
        <Html5Audio src={staticFile(`sfx/${c.sound}.wav`)} volume={c.volume ?? 1} />
      </Sequence>
    ))}
  </>
);
