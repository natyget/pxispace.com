'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ScenePatch from '@/components/scenes/ScenePatch';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { parseHostScenes } from '@/lib/organizerPage';

const FOCUS = 'outline-offset-4 focus-visible:outline-2 focus-visible:outline-white';

/**
 * The scenes this organizer hosts, each as its patch and name with a Join button. The page ships the public list
 * (so it is in the first HTML); a signed-in reader's own answer then replaces it, because only that one knows which
 * of them they are already in. Signed out, Join goes to sign in and comes straight back here.
 *
 * @param {{ organizerId: string, returnPath: string, scenes: object[] }} props
 */
export default function OrganizerScenes({ organizerId, returnPath, scenes: initial }) {
  const { isAuthenticated, authReady } = useAuth();
  const [scenes, setScenes] = useState(initial);
  const [joined, setJoined] = useState(() => new Set());
  const [busy, setBusy] = useState(null);
  const [failed, setFailed] = useState(null);

  useEffect(() => {
    if (!authReady || !isAuthenticated) return undefined;
    let alive = true;
    api
      .get(`/api/scenes?host=${encodeURIComponent(organizerId)}&limit=20`)
      .then((data) => {
        if (!alive) return;
        const mine = parseHostScenes(data, organizerId);
        if (mine.length) setScenes(mine);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [authReady, isAuthenticated, organizerId]);

  const join = async (scene) => {
    setBusy(scene.id);
    setFailed(null);
    try {
      await api.post(`/api/scenes/${encodeURIComponent(scene.slug || scene.id)}/join`, {});
      setJoined((prev) => new Set(prev).add(scene.id));
    } catch (error) {
      setFailed({ id: scene.id, message: error?.message || 'Could not join this scene' });
    } finally {
      setBusy(null);
    }
  };

  if (!scenes.length) return null;

  return (
    <section aria-labelledby="organizer-scenes" className="mt-14">
      <h2 id="organizer-scenes" className="text-[1.5rem] font-bold normal-case leading-none tracking-[-0.02em] text-white">
        Scenes
      </h2>
      <ul className="mt-5 grid gap-3">
        {scenes.map((scene) => {
          const isIn = scene.joined || joined.has(scene.id);
          return (
            <li key={scene.id} className="min-w-0">
              <div className="flex items-center gap-4 rounded-[24px] bg-pxi-surface p-3 pr-4">
                <div className="grid size-[4.5rem] shrink-0 place-items-center">
                  {scene.patch ? <ScenePatch patch={scene.patch} name={scene.name} uid={scene.id} size={64} /> : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 break-words text-[17px] font-extrabold leading-[1.2] text-white">{scene.name}</p>
                  {failed?.id === scene.id ? <p className="mt-1 text-[13px] font-medium text-white/60">{failed.message}</p> : null}
                </div>
                {isIn ? (
                  <span className="shrink-0 px-3 text-[15px] font-bold text-white/60">Joined</span>
                ) : isAuthenticated ? (
                  <button
                    type="button"
                    disabled={busy === scene.id}
                    onClick={() => join(scene)}
                    className={`h-11 shrink-0 rounded-full bg-pxi-purple px-6 text-[15px] font-extrabold text-white disabled:opacity-60 ${FOCUS}`}
                  >
                    Join
                  </button>
                ) : (
                  <Link
                    href={`/login?redirect=${encodeURIComponent(returnPath)}`}
                    className={`inline-flex h-11 shrink-0 items-center rounded-full bg-pxi-purple px-6 text-[15px] font-extrabold text-white ${FOCUS}`}
                  >
                    Join
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
