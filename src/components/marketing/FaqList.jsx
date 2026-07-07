'use client';

import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

/** Simple accordion FAQ list. Pair with buildFaqJsonLd for the schema. */
export default function FaqList({ faqs = [] }) {
  const [open, setOpen] = useState(0);
  if (!faqs.length) return null;

  return (
    <div className="divide-y divide-white/[0.08] border-y border-white/[0.08]">
      {faqs.map((f, i) => {
        const isOpen = open === i;
        return (
          <div key={i} className="py-5">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? -1 : i)}
              className="flex w-full items-center justify-between gap-4 text-left"
              aria-expanded={isOpen}
            >
              <span className="text-lg font-semibold text-white">{f.q}</span>
              {isOpen ? (
                <Minus className="h-5 w-5 shrink-0 text-pxi-purple" />
              ) : (
                <Plus className="h-5 w-5 shrink-0 text-zinc-500" />
              )}
            </button>
            {isOpen ? (
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-zinc-400">{f.a}</p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
