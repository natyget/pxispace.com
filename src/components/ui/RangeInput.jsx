'use client';

export default function RangeInput({
  label,
  hint,
  value,
  onChange,
  min,
  max,
  step,
  formatValue = (v) => String(v),
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">
          {label}
          {hint ? (
            <span className="text-zinc-600 normal-case tracking-normal font-normal"> {hint}</span>
          ) : null}
        </label>
        <span className="text-sm font-bold text-white tabular-nums shrink-0">{formatValue(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-pxi-purple cursor-pointer"
      />
      <div className="flex justify-between text-[10px] text-zinc-600 tabular-nums">
        <span>{formatValue(min)}</span>
        <span>{formatValue(max)}</span>
      </div>
    </div>
  );
}
