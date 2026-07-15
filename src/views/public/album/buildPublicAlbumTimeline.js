function rowTime(item) {
  return new Date(item.data.createdAt || '').getTime();
}

function chatMessageKey(m) {
  return String(m.id || m._id || '').trim();
}

function isGifContent(content) {
  return /^https?:\/\/.+\.gif(\?.*)?$/i.test(String(content || '').trim());
}

export { isGifContent };

/**
 * Merge album media + plain chat (+ optional join events) into chronological thread rows.
 * Mirrors mobile `ThreadView` timeline construction.
 */
export function buildPublicAlbumTimeline(mediaItems, messages, participants = []) {
  const participantJoinEvents = (participants || [])
    .filter((p) => {
      if (!p.joinedAt) return false;
      const t = new Date(p.joinedAt).getTime();
      return Number.isFinite(t) && t > 0;
    })
    .map((p) => ({
      type: /** @type {const} */ ('EVENT'),
      data: {
        id: `join-${p.userId}`,
        text: `${p.username || 'Someone'} joined us!`,
        createdAt: p.joinedAt,
      },
    }));

  const systemMsgJoinEvents = (messages || [])
    .filter((msg) => msg.messageType === 'system')
    .map((msg) => ({
      type: /** @type {const} */ ('EVENT'),
      data: {
        id: `join-${msg.senderId}`,
        text: msg.content,
        createdAt: msg.createdAt,
      },
    }));

  const seenJoinIds = new Set();
  const mergedJoinEvents = [];
  for (const e of [...systemMsgJoinEvents, ...participantJoinEvents]) {
    if (!seenJoinIds.has(e.data.id)) {
      seenJoinIds.add(e.data.id);
      mergedJoinEvents.push(e);
    }
  }

  const chatRows = (messages || [])
    .filter((msg) => msg.messageType !== 'system')
    .filter((msg) => !String(msg.replyToMediaId || '').trim())
    .map((c) => ({ type: /** @type {const} */ ('CHAT'), data: c }));

  const mediaRows = (mediaItems || []).map((m) => ({
    type: /** @type {const} */ ('MEDIA'),
    data: m,
  }));

  const sorted = [...mediaRows, ...chatRows, ...mergedJoinEvents].sort(
    (a, b) => rowTime(a) - rowTime(b),
  );
  return groupAdjacentMediaBursts(sorted);
}

/** Same uploader posting media within this window renders as ONE carousel card. */
const MEDIA_BURST_WINDOW_MS = 10 * 60 * 1000;

function mediaAuthorKey(item) {
  return String(item?.author?.userId || item?.author?.username || '');
}

/**
 * Collapse ADJACENT media rows from the same author (posted within a short window)
 * into a MEDIA_GROUP row — the Instagram-style carousel card. Adjacency is
 * preserved so group items keep their contiguous indices into the media list.
 */
function groupAdjacentMediaBursts(rows) {
  const out = [];
  for (const row of rows) {
    if (row.type === 'MEDIA') {
      const prev = out[out.length - 1];
      const prevItems = prev?.type === 'MEDIA_GROUP' ? prev.data.items : prev?.type === 'MEDIA' ? [prev.data] : null;
      if (prevItems) {
        const last = prevItems[prevItems.length - 1];
        const sameAuthor =
          mediaAuthorKey(last) && mediaAuthorKey(last) === mediaAuthorKey(row.data);
        const gap =
          new Date(row.data.createdAt || '').getTime() -
          new Date(last.createdAt || '').getTime();
        if (sameAuthor && Number.isFinite(gap) && gap >= 0 && gap <= MEDIA_BURST_WINDOW_MS) {
          if (prev.type === 'MEDIA_GROUP') {
            prev.data.items.push(row.data);
          } else {
            out[out.length - 1] = {
              type: /** @type {const} */ ('MEDIA_GROUP'),
              data: { id: `group-${String(prev.data.id || '')}`, items: [prev.data, row.data] },
            };
          }
          continue;
        }
      }
    }
    out.push(row);
  }
  return out;
}

export function timelineRowKey(item, index) {
  if (item.type === 'MEDIA') {
    return `MEDIA-${String(item.data.id || '').trim() || index}`;
  }
  if (item.type === 'MEDIA_GROUP') {
    return `MEDIA_GROUP-${String(item.data.items[0]?.id || '').trim() || index}`;
  }
  return `${item.type}-${item.data.id ?? index}`;
}

/** Prepend an older combined thread page (dedupe by id, chronological). */
export function mergeOlderPublicThreadPage(existingMessages, existingMedia, olderPage) {
  const msgIds = new Set(existingMessages.map((m) => chatMessageKey(m)).filter(Boolean));
  const mediaIds = new Set(existingMedia.map((m) => String(m.id || '').trim()).filter(Boolean));

  const uniqueOlderMsgs = (olderPage.messages || []).filter((m) => {
    const k = chatMessageKey(m);
    return k && !msgIds.has(k);
  });
  const uniqueOlderMedia = (olderPage.mediaItems || []).filter((m) => {
    const k = String(m.id || '').trim();
    return k && !mediaIds.has(k);
  });

  const byTime = (a, b) => new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime();

  return {
    messages: [...uniqueOlderMsgs, ...existingMessages].sort(byTime),
    mediaItems: [...uniqueOlderMedia, ...existingMedia].sort(byTime),
  };
}
