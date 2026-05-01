'use client';

import { EventManageProvider } from '@/views/dashboard/event-manage/EventManageContext';
import EventManageLayoutInner from '@/views/dashboard/event-manage/EventManageLayoutInner';

export default function DashboardEventManageLayout({ children }) {
  return (
    <EventManageProvider>
      <div className="max-w-2xl mx-auto px-4 pt-4 pb-16">
        <EventManageLayoutInner>{children}</EventManageLayoutInner>
      </div>
    </EventManageProvider>
  );
}
