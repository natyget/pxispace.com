'use client';

const CHOICES = [
    { key: 'now', label: 'Right away' },
    { key: 'daily', label: 'Daily' },
    { key: 'off', label: 'Off' },
];

/**
 * One kind of alert and how it reaches you. The three words work like the page tabs: the chosen one is white with a
 * purple line under it, the others are quiet. Choosing saves straight away; `saved` shows "Saved" for a moment.
 */
export default function AlertRow({ name, line, value, saved, onChoose }) {
    return (
        <li className="flex flex-col gap-3 rounded-2xl bg-pxi-field px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <div className="min-w-0">
                <p className="text-[14px] font-semibold text-white">{name}</p>
                {line ? <p className="mt-0.5 text-[13px] text-white/50">{line}</p> : null}
            </div>
            <div className="flex shrink-0 items-center gap-5">
                <span aria-live="polite" className="hidden w-12 text-right text-[12px] font-semibold text-emerald-300 sm:inline-block">
                    {saved ? 'Saved' : ''}
                </span>
                <div role="radiogroup" aria-label={`${name} emails`} className="flex items-center gap-5">
                    {CHOICES.map((choice) => {
                        const active = value === choice.key;
                        return (
                            <button
                                key={choice.key}
                                type="button"
                                role="radio"
                                aria-checked={active}
                                onClick={() => onChoose(choice.key)}
                                className={`border-b-2 pb-1 text-[13px] font-semibold transition-colors ${active ? 'border-[#A523EF] text-white' : 'border-transparent text-white/45 hover:text-white'}`}
                            >
                                {choice.label}
                            </button>
                        );
                    })}
                </div>
                {saved ? <span className="text-[12px] font-semibold text-emerald-300 sm:hidden">Saved</span> : null}
            </div>
        </li>
    );
}
