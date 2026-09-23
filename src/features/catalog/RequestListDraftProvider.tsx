import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useRequestListCount } from '../../app/request-list-count';
import { RequestListDraftContext } from './request-draft';
import type { CatalogItem } from './types';

/** A minimal provider so the Employee path is demonstrable before Parent C
 *  ships the real drawer. It holds line counts only, and feeds the shell's
 *  existing badge rather than re-implementing one (spec 003 FR-015).
 *
 *  The count is held here and incremented with an updater, not read out of the
 *  shell and written back as `count + 1`. The shell's `setCount` takes a value
 *  rather than an updater, so reading it into a closure would drop an increment
 *  if two adds were ever batched into one render. Keeping the tally local makes
 *  the update order-independent, and the badge becomes an external system this
 *  provider synchronises with — which is what the effect below is for.
 *
 *  The tally starts at the shell's current count, not zero: this provider
 *  unmounts with `/catalog`, and starting at 0 would write the badge back to
 *  empty when the Employee returns from Requests or Profile.
 *
 *  Parent C replaces this provider; the `RequestListDraft` seam does not move. */
export function RequestListDraftProvider({ children }: { children: ReactNode }) {
  const { count, setCount } = useRequestListCount();
  const [lines, setLines] = useState(count);

  useEffect(() => {
    setCount(lines);
  }, [lines, setCount]);

  /* No dependency on the tally, so `add` is stable for the life of the
     provider and cannot capture a stale one. */
  const value = useMemo(
    () => ({
      add: (_item: CatalogItem, quantity: number) => {
        if (quantity > 0) setLines((n) => n + 1);
      },
    }),
    [],
  );

  return <RequestListDraftContext value={value}>{children}</RequestListDraftContext>;
}
