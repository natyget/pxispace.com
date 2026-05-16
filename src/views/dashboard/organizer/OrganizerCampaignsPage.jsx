'use client';

import { HugeiconsIcon } from '@hugeicons/react';
import { AlarmClockIcon, Megaphone01Icon, SentIcon } from '@hugeicons/core-free-icons';
import SectionCard from '@/components/dashboard/SectionCard';
import MetricCard from '@/components/dashboard/MetricCard';

const campaigns = [
    {
        id: 'cmp-1',
        title: 'Tonight Last-Call Reminder',
        status: 'Scheduled',
        channel: 'Push + in-app',
        eta: '1h before doors',
    },
    {
        id: 'cmp-2',
        title: 'Post-Event Photo Drop',
        status: 'Draft',
        channel: 'Gallery announcement',
        eta: 'After event ends',
    },
    {
        id: 'cmp-3',
        title: 'Loyalty Passport Nudge',
        status: 'Mock',
        channel: 'Passport milestone',
        eta: 'Next sprint integration',
    },
];

export default function OrganizerCampaignsPage() {
    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div>
                <p className="text-xs font-bold tracking-widest uppercase text-pxi-purple">Organizer Studio</p>
                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight mt-1">Campaign Board</h1>
                <p className="text-zinc-500 text-sm mt-1">Mock-first outbound operations, ready for backend integration.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard
                    title="Queued Campaigns"
                    value="3"
                    description="Active board items"
                    icon={Megaphone01Icon}
                    trend="up"
                    source="Mock"
                />
                <MetricCard
                    title="Avg Send Delay"
                    value="12m"
                    description="From queue to dispatch"
                    icon={AlarmClockIcon}
                    trend="neutral"
                    source="Mock"
                />
                <MetricCard
                    title="Delivery Health"
                    value="98%"
                    description="Estimated delivery success"
                    icon={SentIcon}
                    trend="up"
                    source="Derived"
                />
            </div>

            <SectionCard title="Queued Campaigns" subtitle="These modules are mock but architected for API wiring." source="Mock">
                <ul className="space-y-3">
                    {campaigns.map((campaign) => (
                        <li key={campaign.id} className="rounded-xl border border-white/10 bg-black/30 px-4 py-3">
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-semibold text-white">{campaign.title}</p>
                                <span className="inline-flex rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-zinc-300">
                                    {campaign.status}
                                </span>
                            </div>
                            <p className="text-xs text-zinc-500 mt-1">{campaign.channel} · {campaign.eta}</p>
                        </li>
                    ))}
                </ul>
            </SectionCard>
        </div>
    );
}
