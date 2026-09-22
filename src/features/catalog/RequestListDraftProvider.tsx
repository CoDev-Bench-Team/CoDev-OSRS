import { useMemo, type ReactNode } from 'react';
import { useRequestListCount } from '../../app/request-list-count';
import { RequestListDraftContext } from './request-draft';
import type { CatalogItem } from './types';

/** A minimal provider so the Employee path is demonstrable before Parent C
 *  ships the real drawer. It holds line counts only, and feeds the shell's
 *  existing badge rather than re-implementing one (spec 003 FR-015).
 *
 *  Parent C replaces this provider; the `RequestListDraft` seam does not move. */
export function RequestListDraftProvider({ children }: { children: ReactNode }) {
  const { count, setCount } = useRequestListCount();

  const value = useMemo(
    () => ({
      add: (_item: CatalogItem, quantity: number) => {
        if (quantity > 0) setCount(count + 1);
      },
    }),
    [count, setCount],
  );

  return <RequestListDraftContext value={value}>{children}</RequestListDraftContext>;
}
