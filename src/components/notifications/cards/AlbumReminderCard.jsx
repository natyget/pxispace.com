'use client';

import { NOTIFICATION_CARD_CLASS, NOTIFICATION_ROW_CLASS } from '../notificationStyles';

export default function AlbumReminderCard({ albumName, time, onClick }) {
  return (
    <button type="button" onClick={onClick} className={`${NOTIFICATION_CARD_CLASS} w-full text-left`}>
      <div className={NOTIFICATION_ROW_CLASS}>
        <div className="w-11 h-11 rounded-full bg-[#0c0c0c] flex items-center justify-center text-lg shrink-0">
          ⏰
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm leading-5 text-white/70">
            Time to capture a moment for{' '}
            <span className="text-white font-bold">{albumName || 'your album'}</span>
          </p>
          {time ? <p className="text-white/35 text-xs font-medium mt-1.5">{time}</p> : null}
        </div>
      </div>
    </button>
  );
}
