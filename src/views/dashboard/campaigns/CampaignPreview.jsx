'use client';

import { Panel } from '@/components/dashboard/ui/kit';

/**
 * A message the way the person who gets it sees it, with the footer PXI adds ("Sent via PXI on behalf of", and the
 * opt-out). Used for the live preview while writing and for the message of a campaign that was sent.
 */
export function MessageCard({ channel, subject, body, senderName, placeholder = true }) {
    const name = senderName || 'your event host';
    const text = String(body || '').trim();
    const paragraphs = text ? text.split(/\n{2,}/) : [];
    const hint = placeholder ? <span className="text-white/35">Your message shows here as you type.</span> : null;
    if (channel === 'SMS') {
        return (
            <div className="flex">
                <div className="max-w-[94%] whitespace-pre-line rounded-3xl rounded-bl-lg bg-pxi-field px-4 py-3 text-[14px] leading-6 text-white [overflow-wrap:anywhere]">
                    {`Sent via PXI on behalf of ${name}: `}
                    {text || hint}
                    {'\n\n'}
                    <span className="text-white/50">Reply STOP to unsubscribe.</span>
                </div>
            </div>
        );
    }
    return (
        <div className="rounded-2xl bg-pxi-field p-5">
            <p className={`text-[20px] font-extrabold leading-tight tracking-tight [overflow-wrap:anywhere] ${subject?.trim() ? 'text-white' : 'text-white/35'}`}>
                {subject?.trim() || (placeholder ? 'Your subject' : '')}
            </p>
            <div className="mt-4 space-y-3 text-[14px] leading-6 text-white/80 [overflow-wrap:anywhere]">
                {paragraphs.length ? (
                    paragraphs.map((p, i) => (
                        <p key={i} className="whitespace-pre-line">
                            {p}
                        </p>
                    ))
                ) : (
                    <p>{hint}</p>
                )}
            </div>
            <div className="mt-6 border-t border-white/10 pt-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/50 [overflow-wrap:anywhere]">Sent via PXI on behalf of {name}</p>
                <p className="mt-2 text-[11px] leading-4 text-white/40">
                    You received this because you opted in to event updates via PXI. The host never sees your email address.{' '}
                    <span className="text-[#c77dff]">Unsubscribe</span>
                </p>
            </div>
        </div>
    );
}

/** The live preview beside the composer. */
export default function CampaignPreview({ channel, subject, body, senderName }) {
    return (
        <Panel title="Preview" subtitle={channel === 'SMS' ? 'How the text looks to them.' : 'How the email looks to them.'}>
            <MessageCard channel={channel} subject={subject} body={body} senderName={senderName} />
        </Panel>
    );
}
