'use client';

import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import { LockIcon } from '@hugeicons/core-free-icons';
import { activeTabFor, isNavItemActive } from '@/lib/dashboardNavConfig';
import { usePageActionSlot } from './usePageAction';

/**
 * Top tabs (Hub, Insights, Operations, Engagement), the sub-tab row for the active tab, and the page's one action
 * at the right of the sub-tab row. Pages outside the nav get the tabs with none active and no sub-row.
 * Renders a skeleton until roles resolve so lock states do not flicker.
 */
export default function DashboardTabs({ tabs = [], rolesReady, pathname, searchParams }) {
    const pageAction = usePageActionSlot();

    if (!rolesReady) {
        return <div aria-hidden="true" className="h-12 w-full animate-pulse rounded-full bg-pxi-field" />;
    }

    const activeTab = activeTabFor(pathname, searchParams, tabs);

    return (
        <div className="flex min-w-0 flex-col gap-3">
            <nav aria-label="Dashboard sections" className="dashboard-scrollbar-none flex w-full gap-1 overflow-x-auto rounded-full bg-pxi-field p-1">
                {tabs.map((tab) => {
                    const active = tab === activeTab;
                    const firstItem = tab.items[0];
                    return (
                        <Link
                            key={tab.key}
                            href={firstItem.path}
                            aria-current={active ? 'page' : undefined}
                            className={`inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-semibold transition-colors md:flex-1 md:text-[15px] ${
                                active ? 'bg-pxi-purple text-white' : 'text-zinc-400 hover:text-white'
                            }`}
                        >
                            <HugeiconsIcon icon={tab.icon} size={16} />
                            <span>{tab.label}</span>
                            {tab.locked ? <HugeiconsIcon icon={LockIcon} size={12} className="opacity-70" /> : null}
                        </Link>
                    );
                })}
            </nav>

            {activeTab ? (
                <div className="flex min-w-0 flex-col gap-3 border-b border-white/[0.08] sm:flex-row sm:items-center sm:justify-between">
                    <div className="dashboard-scrollbar-none flex min-w-0 gap-8 overflow-x-auto">
                        {activeTab.items.map((item) => {
                            const active = isNavItemActive(pathname, item, searchParams);
                            return (
                                <Link
                                    key={item.key}
                                    href={item.path}
                                    aria-current={active ? 'page' : undefined}
                                    // The sub-sections are the page's real navigation, so they read as headings: big, heavy,
                                    // the active one white over a thick purple bar, the others still clearly there.
                                    className={`-mb-px inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-[3px] pb-3 pt-1 text-[17px] font-extrabold tracking-[-0.01em] transition-colors md:text-lg ${
                                        active ? 'border-[#A523EF] text-white' : 'border-transparent text-white/55 hover:text-white'
                                    }`}
                                >
                                    <span>{item.label}</span>
                                    {item.locked ? <HugeiconsIcon icon={LockIcon} size={13} className="opacity-70" /> : null}
                                </Link>
                            );
                        })}
                    </div>
                    {pageAction ? <div className="shrink-0 pb-2 sm:pb-2">{pageAction}</div> : null}
                </div>
            ) : pageAction ? (
                <div className="flex justify-end">{pageAction}</div>
            ) : null}
        </div>
    );
}
