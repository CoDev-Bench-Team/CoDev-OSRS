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
