'use client';

import { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import { senderDisplayForInvite } from '@/lib/notifications/inviteNotificationCopy';
import SenderAvatar from '../SenderAvatar';
import ConfirmModal from '../ConfirmModal';
import { NOTIFICATION_CARD_CLASS, GRADIENT_INNER_CLASS, GRADIENT_RING_CLASS } from '../notificationStyles';

function requestDecisionFromData(data) {
  const d = data?.requestDecision;
  if (d === 'accepted' || d === 'rejected') return d;
  return null;
}

export default function FriendRequestCard({ notification, onAccept, onReject }) {
  const [decision, setDecision] = useState(() => requestDecisionFromData(notification.data));
  const [busy, setBusy] = useState(null);
  const [showAcceptConfirm, setShowAcceptConfirm] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);

  const decisionFromProps = requestDecisionFromData(notification.data);
  useEffect(() => {
    if (decisionFromProps) setDecision(decisionFromProps);
  }, [notification.id, decisionFromProps]);

  const requestId = notification.data?.requestId;
  const displayName = senderDisplayForInvite(notification.user);
  const displayDecision = decision ?? decisionFromProps;

  const runAccept = async () => {
    if (!requestId || !onAccept || displayDecision || busy) return;
    setBusy('accept');
    try {
      await onAccept(notification.id, requestId);
      setDecision('accepted');
    } finally {
      setBusy(null);
    }
  };

  const runReject = async () => {
    if (!requestId || !onReject || displayDecision || busy) return;
    setBusy('reject');
    try {
      await onReject(notification.id, requestId);
      setDecision('rejected');
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <div className={NOTIFICATION_CARD_CLASS}>
        <div className="flex items-center gap-3 py-3 pl-3 pr-3.5">
          <div className="flex flex-1 items-center gap-3 min-w-0">
            <SenderAvatar user={notification.user} size={44} />
            <div className="min-w-0">
              <p className="text-white font-bold text-base leading-tight truncate">{displayName}</p>
              <p className="text-white/40 text-[13px] mt-0.5">wants to connect.</p>
            </div>
          </div>

          {displayDecision ? (
            <span
              className={`shrink-0 px-3 py-2 rounded-full text-xs font-extrabold tracking-wide border ${
                displayDecision === 'accepted'
                  ? 'bg-emerald-500/15 border-emerald-500/35 text-white/90'
                  : 'bg-red-500/15 border-red-500/35 text-white/90'
              }`}
            >
              {displayDecision === 'accepted' ? 'Accepted' : 'Declined'}
            </span>
          ) : (
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setShowRejectConfirm(true)}
                disabled={!!busy}
                className="w-10 h-10 rounded-full border border-white/[0.14] bg-[#0a0a0a] flex items-center justify-center hover:bg-white/5 disabled:opacity-50"
                aria-label="Decline"
              >
                {busy === 'reject' ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <X size={18} color="#fff" strokeWidth={2.25} />
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowAcceptConfirm(true)}
                disabled={!!busy}
                className={GRADIENT_RING_CLASS}
                aria-label="Accept"
              >
                <span className={`${GRADIENT_INNER_CLASS} w-9 h-9`}>
                  {busy === 'accept' ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Check size={18} color="#fff" strokeWidth={2.5} />
                  )}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        open={showAcceptConfirm}
        title="Accept friend request?"
        description={`Accept friend request from ${displayName}?`}
        confirmLabel="Accept"
        onClose={() => setShowAcceptConfirm(false)}
        onConfirm={() => {
          setShowAcceptConfirm(false);
          void runAccept();
        }}
      />
      <ConfirmModal
        open={showRejectConfirm}
        title="Reject friend request?"
        description={`Reject friend request from ${displayName}?`}
        confirmLabel="Reject"
        confirmClassName="bg-red-500/90 hover:bg-red-500 text-white"
        onClose={() => setShowRejectConfirm(false)}
        onConfirm={() => {
          setShowRejectConfirm(false);
          void runReject();
        }}
      />
    </>
  );
}
