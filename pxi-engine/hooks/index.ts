// Hook registry. Add a hook by writing a `Hook` in this folder and listing it
// here and in `lib/props.ts` (the `hook` enum).
//
// Planned bank (not built yet): flash-in-face (disposable fires at the lens),
// prints-from-above (a roll pours into frame), date-stamp-cold-open (black, the
// orange 11:47 pm stamp flickers on, then the flash).

import { ticketAtLens } from './ticket-at-lens';
import type { Hook } from './types';

export const HOOKS = {
  'ticket-at-lens': ticketAtLens,
} as const satisfies Record<string, Hook>;

export type HookId = keyof typeof HOOKS;

export const getHook = (id: HookId | undefined): Hook => HOOKS[id ?? 'ticket-at-lens'];
