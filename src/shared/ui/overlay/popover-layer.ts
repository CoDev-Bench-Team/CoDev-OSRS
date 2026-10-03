/** Lets a modal dismiss any popover that is open when it appears.
 *
 *  Layering alone is not enough. A popover must sit above a dialog so that a
 *  select inside one is usable — but that also means a popover left open
 *  somewhere else would float above the new scrim. Ordering cannot distinguish
 *  those two cases, so the modal explicitly dismisses what is already open. */
const subscribers = new Set<() => void>();

export function onDismissPopovers(fn: () => void) {
  subscribers.add(fn);
  return () => {
    subscribers.delete(fn);
  };
}

export function dismissPopovers() {
  for (const fn of [...subscribers]) fn();
}

/** Sent on `window` when a modal opens in the top layer (a side panel's
 *  `showModal`), so layers that must stay above it — the toasts — re-raise. */
export const TOP_LAYER_OPENED = 'osrs:top-layer-opened';

/** Sent on `window` when such a modal closes, so those layers move back. */
export const TOP_LAYER_CLOSED = 'osrs:top-layer-closed';
