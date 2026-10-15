'use client';

import { Panel } from '@/components/dashboard/ui/kit';
import { exactMoney } from '@/lib/dashFormat';
import LinkButton from './LinkButton';

const BIG = 'text-[32px] font-semibold leading-none tracking-tight text-white';

function Line({ label, value }) {
    return (
        <div className="flex items-baseline justify-between gap-4">
            <dt className="text-[13px] text-white/50">{label}</dt>
            <dd className="text-[14px] font-semibold text-white">{value}</dd>
        </div>
    );
}

/**
 * The money context on the right of Today. `mine` is GET /earnings/me (sales roles), `all` is GET /earnings
 * (super and global admins). Either, both or neither can be given.
 */
export default function MoneyPanels({ mine, all, earningsHref }) {
    return (
        <>
            {mine ? (
                <Panel
                    title="Your earnings"
                    action={
                        <LinkButton href={earningsHref} variant="quiet" size="sm">
                            See earnings
                        </LinkButton>
                    }
                >
                    <p className="text-[12px] text-white/45">Owed to you</p>
                    <p className={`mt-1.5 ${BIG}`}>{exactMoney(mine.totals?.owedCents)}</p>
                    <dl className="mt-5 space-y-2">
                        <Line label="On the way" value={exactMoney(mine.totals?.pendingCents)} />
                        <Line label="Projected" value={exactMoney(mine.totals?.projectedCents)} />
                    </dl>
                </Panel>
            ) : null}
            {all ? (
                <Panel
                    title="Owed to the team"
                    action={
                        <LinkButton href="/dashboard/admin/commissions" variant="quiet" size="sm">
                            See commissions
                        </LinkButton>
                    }
                >
                    <p className={BIG}>{exactMoney(all.totals?.owedCents)}</p>
                </Panel>
            ) : null}
        </>
    );
}
