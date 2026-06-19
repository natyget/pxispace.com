export function senderDisplayForThreadMessage(user) {
  if (!user) return 'Someone';
  const n = String(user.name || '').trim();
  if (n) return n;
  const un = String(user.username || '').trim().replace(/^@/, '');
  if (un) return un;
  return 'Someone';
}

export function bucketedThreadMessageCountLabel(count) {
  const n = Math.max(1, Math.floor(count));
  if (n >= 21) return '20+';
  if (n >= 11) return '10+';
  if (n >= 5) return '5+';
  return String(n);
}

function singleMessageBody(preview, isGif) {
  const trimmed = String(preview || '').trim();
  if (isGif && !trimmed) return 'GIF';
  if (!trimmed) return isGif ? 'GIF' : '';
  return trimmed;
}

export function threadMessageNotificationCopy(params) {
  const count = Math.max(1, params.messageCount ?? 1);
  const album = String(params.albumName || '').trim() || 'album';

  if (count > 1) {
    const x = bucketedThreadMessageCountLabel(count);
    return {
      isMulti: true,
      headline: album,
      subline: `${x} new messages`,
    };
  }

  const name = String(params.senderName || '').trim() || 'Someone';
  return {
    isMulti: false,
    headline: `${name} in ${album}`,
    subline: singleMessageBody(params.messagePreview, Boolean(params.isGif)),
  };
}
