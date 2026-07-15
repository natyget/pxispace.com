import { THREAD_MEDIA_TILT_DEG } from './albumLayoutConstants';
import { publicAlbumMediaId } from './useAlbumThreadActiveVideo';

export function threadMediaTiltForOrdinal(ordinal) {
  return ordinal % 2 === 0 ? -THREAD_MEDIA_TILT_DEG : THREAD_MEDIA_TILT_DEG;
}

/**
 * Assign tilt once per media id (chronological ordinal); existing ids keep first value.
 * Mirrors mobile `ThreadView` `syncStableMediaRotations`.
 */
export function syncStableMediaRotations(timeline, rotationById) {
  let mediaOrdinal = 0;
  /** @type {Map<string, number>} */
  const lookup = new Map();

  for (const row of timeline) {
    if (row.type !== 'MEDIA' && row.type !== 'MEDIA_GROUP') continue;
    const items = row.type === 'MEDIA_GROUP' ? row.data.items : [row.data];
    for (const item of items) {
      const id = publicAlbumMediaId(item);
      if (id && !rotationById.has(id)) {
        rotationById.set(id, threadMediaTiltForOrdinal(mediaOrdinal));
      }
      const rotation =
        id && rotationById.has(id) ? rotationById.get(id) : threadMediaTiltForOrdinal(mediaOrdinal);
      if (id) lookup.set(id, rotation);
      mediaOrdinal += 1;
    }
  }

  return lookup;
}
