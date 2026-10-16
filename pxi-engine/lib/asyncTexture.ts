// <ThreeCanvas> only draws when the Remotion frame changes. A texture that
// arrives later (a video frame, an image, a canvas drawn after fonts load)
// would otherwise miss the screenshot. This hook holds a delayRender handle
// until R3F has actually drawn a frame with the new texture.

import { useLayoutEffect, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { useDelayRender } from 'remotion';
import * as THREE from 'three';

type Loaded = { key: string; texture: THREE.Texture; handle: number };

/** Loads `load(key)` whenever `key` changes; null key = no texture. Mount inside <ThreeCanvas>. */
export const useAsyncTexture = (key: string | null, load: (key: string) => Promise<THREE.Texture>) => {
  const { delayRender, continueRender, cancelRender } = useDelayRender();
  const advance = useThree((s) => s.advance);
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useLayoutEffect(() => {
    if (!key) return;
    const handle = delayRender(`texture ${key.slice(0, 120)}`);
    let cancelled = false;
    let delivered = false;
    load(key)
      .then((texture) => {
        if (cancelled) {
          texture.dispose();
          return;
        }
        delivered = true;
        setLoaded({ key, texture, handle });
      })
      .catch((err) => cancelRender(err));
    return () => {
      cancelled = true;
      if (!delivered) continueRender(handle);
    };
    // `load` is expected to be stable for a given key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, delayRender, continueRender, cancelRender]);

  // Runs after the commit that put the new texture into the materials.
  useLayoutEffect(() => {
    if (!loaded) return;
    advance(performance.now());
    continueRender(loaded.handle);
    const { texture } = loaded;
    return () => texture.dispose();
  }, [loaded, advance, continueRender]);

  return loaded?.texture ?? null;
};

export const loadImageTexture = (url: string) =>
  new THREE.TextureLoader().loadAsync(url).then((t) => {
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  });
