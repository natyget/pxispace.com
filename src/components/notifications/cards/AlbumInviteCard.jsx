'use client';

import {
  inviteAcceptedStatusText,
  inviteRoleAccentColor,
  inviteRoleLabelForCard,
  isLineupStyleInvite,
  senderDisplayForInvite,
} from '@/lib/notifications/inviteNotificationCopy';
import { formatInviteRespondedAt } from '@/lib/notifications/notificationTime';
import { displayImageSrc } from '@/lib/mediaUrl';
import NotificationMediaThumb from '../NotificationMediaThumb';
import { NOTIFICATION_CARD_CLASS, PASS_BTN_CLASS, RSVP_INNER_CLASS, RSVP_OUTER_CLASS } from '../notificationStyles';

const COVER_W = 84;
const COVER_H = Math.round((COVER_W * 4) / 3);
const AVATAR = 32;
const AVATAR_STEP = AVATAR - AVATAR / 3;
const MAX_AVATARS = 5;

function memberAvatarUri(userId, avatarUrl) {
  return displayImageSrc(avatarUrl, null) || `https://i.pravatar.cc/300?u=${userId}`;
}

function buildMemberSlots(previewMembers, totalMembers, sender) {
  const members = [...(previewMembers ?? [])];
  if (sender?.id && !members.some((m) => m.userId === sender.id)) {
    members.unshift({ userId: sender.id, avatarUrl: sender.avatarUrl });
  }
  if (members.length === 0 && sender?.id) {
    members.push({ userId: sender.id, avatarUrl: sender.avatarUrl });
  }
  const total = Math.max(totalMembers, members.length);
  if (total <= MAX_AVATARS) {
    return {
      slots: members.slice(0, MAX_AVATARS).map((m) => ({ kind: 'avatar', member: m })),
      width: AVATAR + Math.max(0, Math.min(total, MAX_AVATARS) - 1) * AVATAR_STEP,
    };
  }
  const overflow = total - (MAX_AVATARS - 1);
  return {
    slots: [
      ...members.slice(0, MAX_AVATARS - 1).map((m) => ({ kind: 'avatar', member: m })),
      { kind: 'overflow', count: overflow },
    ],
    width: AVATAR + (MAX_AVATARS - 1) * AVATAR_STEP,
  };
}

function MemberAvatarStack({ previewMembers, totalMembers, sender }) {
  const { slots, width } = buildMemberSlots(previewMembers, totalMembers, sender);
  return (
    <div className="relative h-8 mb-1" style={{ width }}>
      {slots.map((slot, index) => (
        <div
          key={slot.kind === 'overflow' ? `o-${slot.count}` : slot.member.userId}
          className="absolute top-0 w-8 h-8 rounded-full border-2 border-[#050505] overflow-hidden bg-[#0c0c0c]"
          style={{ left: index * AVATAR_STEP, zIndex: MAX_AVATARS - index }}
        >
          {slot.kind === 'overflow' ? (
            <div className="w-full h-full flex items-center justify-center bg-[#101010] text-[10px] font-extrabold text-white/90">
              +{slot.count}
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={memberAvatarUri(slot.member.userId, slot.member.avatarUrl)}
              alt=""
              className="w-full h-full object-cover"
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default function AlbumInviteCard({ item, onAccept, onReject, onCoverClick }) {
  const coverUri =
    item.data?.thumbnailUrl?.trim() ||
    item.data?.coverImage?.trim() ||
    item.postImage?.trim() ||
    null;
  const senderName = senderDisplayForInvite(item.user);
  const roleLabel = inviteRoleLabelForCard(item.data, item.notificationType);
  const roleColor = inviteRoleAccentColor(item.data, item.notificationType);
  const lineupInvite = isLineupStyleInvite(item.data, item.notificationType);
  const eventTitle =
    String(item.data?.eventName || '').trim() ||
    item.target ||
    item.data?.albumName ||
    'Event';
  const ir = item.inviteResponse;
  const resolved = ir === 'accepted' || ir === 'declined' || item.isAccepted;
  const at = formatInviteRespondedAt(item.inviteRespondedAt);
  const previewMembers = item.data?.previewMembers;
  const memberCount = item.data?._count?.members ?? previewMembers?.length ?? 0;

  return (
    <div className={`${NOTIFICATION_CARD_CLASS} flex flex-row items-stretch min-h-[136px]`}>
      <div className="flex-1 min-w-0 py-3 pl-4 pr-2.5 flex flex-col justify-between gap-2">
        <button type="button" onClick={() => onCoverClick?.(item)} className="text-left">
          <MemberAvatarStack
            previewMembers={previewMembers}
            totalMembers={memberCount}
            sender={item.user ? { id: item.user.id, avatarUrl: item.user.avatarUrl } : undefined}
          />
          <p className="text-[13px] leading-snug mt-1">
            <span className="text-white/90 font-bold">{senderName}</span>
            {roleLabel && roleColor ? (
              <>
                <span className="text-white/40 font-medium"> invited you as </span>
                <span className="font-extrabold" style={{ color: roleColor }}>
                  {roleLabel}
                </span>
                <span className="text-white/40 font-medium"> to</span>
              </>
            ) : (
              <span className="text-white/40 font-medium"> invited you to</span>
            )}
          </p>
          <p className="text-white font-extrabold text-[22px] leading-tight tracking-tight mt-2 line-clamp-2">
            {eventTitle}
          </p>
        </button>

        {resolved ? (
          <div
            className={`mt-1 py-2.5 px-3 rounded-xl border text-[13px] leading-snug font-semibold ${
              ir === 'declined'
                ? 'bg-red-500/10 border-red-500/30 text-red-200'
                : 'bg-emerald-500/10 border-emerald-500/30 text-white/90'
            }`}
          >
            {ir === 'declined'
              ? `You passed on this invite${at ? ` · ${at}` : ''}`
              : `${inviteAcceptedStatusText(roleLabel, lineupInvite)}${at ? ` · ${at}` : ''}`}
          </div>
        ) : (
          <div className="flex flex-row gap-2.5 mt-1">
            <button type="button" onClick={() => onAccept?.(item)} className={RSVP_OUTER_CLASS}>
              <span className={RSVP_INNER_CLASS}>
                RSVP<span className="ml-0.5">⚡</span>
              </span>
            </button>
            <button type="button" onClick={() => onReject?.(item)} className={PASS_BTN_CLASS}>
              Pass
            </button>
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => onCoverClick?.(item)}
        className="shrink-0 self-center mr-3"
        aria-label="View event"
      >
        <NotificationMediaThumb url={coverUri} width={COVER_W} height={COVER_H} borderRadius={12} />
      </button>
    </div>
  );
}
