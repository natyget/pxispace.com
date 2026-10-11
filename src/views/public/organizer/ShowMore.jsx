'use client';

import { useId, useState } from 'react';

/**
 * The rest of a list, held back behind one button under it. The rows are server-rendered and in the page whether
 * or not they are showing (they are only `hidden`), so a search engine sees every night and the list needs no fetch.
 * A native <details> would put its summary above the rows it opens; a button keeps "Show fewer" at the bottom.
 *
 * @param {{ count: number, noun: string, children: import('react').ReactNode }} props
 *   `count` rows are in `children`; `noun` names them for a screen reader ("past nights").
 */
export default function ShowMore({ count, noun, children }) {
  const [open, setOpen] = useState(false);
  const listId = useId();
  return (
    <>
      <ul id={listId} hidden={!open}>
        {children}
      </ul>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={listId}
        aria-label={open ? `Show fewer ${noun}` : `Show ${count} more ${noun}`}
        className="flex min-h-12 w-full items-center justify-center rounded-[18px] px-3 text-[13px] font-bold text-white/60 outline-offset-4 transition-colors hover:bg-pxi-field hover:text-white focus-visible:outline-2 focus-visible:outline-white motion-reduce:transition-none"
      >
        {open ? 'Show fewer' : `Show ${count} more`}
      </button>
    </>
  );
}
