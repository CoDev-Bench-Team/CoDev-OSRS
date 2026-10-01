import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';

/** What a `/requests/:id` deep link hands the list it lands on: the Admin's
 *  Requests Queue or the Employee's My Requests (spec 003, Session 2026-09-26).
 *  The panel has no address of its own, so the link carries the id in
 *  navigation state and the list opens it once its data is in. */
export type DeepLinkState = { openRequest?: string };

/** The Employee's one sentence for a request that does not exist and for one
 *  that is not theirs. The two MUST read the same, and the id is never echoed,
 *  so a request id cannot be probed by reading the difference (spec 003
 *  FR-012a). */
export const REQUEST_UNAVAILABLE = 'That request is not available. It may not exist, or it may not be yours to view.';

/** The Admin's: an Admin may view every request, so the only way a link opens
 *  nothing is that the request does not exist. */
export const REQUEST_NOT_FOUND = 'That request is not available. It may not exist.';

/** What the link resolved to, decided once, when `ids` first arrives. */
type Outcome =
  | { kind: 'pending'; id: string }
  | { kind: 'open'; id: string }
  | { kind: 'forward'; id: string; path: string }
  | { kind: 'missed' }
  | { kind: 'none' };

/** Resolves the request a deep link asked for, once `ids` — every request this
 *  page may show — has loaded. `linked` is that request's id, for the page to
 *  show as open; an id not among `ids` opens nothing and returns `message` as
 *  the notice. The outcome is decided once, so a later change to `ids` neither
 *  closes a linked panel nor raises the notice. The navigation state is
 *  consumed on arrival, so Back, a reload or a later render never reopens it.
 *  `dismiss` clears both; the page calls it when the Admin or Employee opens
 *  or closes a panel, so an old notice does not sit above a request that did
 *  open and a closed panel stays closed.
 *
 *  `forward` may name another page for the request: the link is passed there
 *  with the same state, for that page to open. The Requests Queue forwards a
 *  resolved request to History (spec 013 FR-016). */
export function useDeepLinkedRequest(
  ids: readonly string[] | null,
  message: string,
  forward?: (id: string) => string | undefined,
): { linked: string | null; unavailable: string | null; dismiss: () => void } {
  const location = useLocation();
  const navigate = useNavigate();
  const [outcome, setOutcome] = useState<Outcome>(() => {
    const id = (location.state as DeepLinkState | null)?.openRequest;
    return id ? { kind: 'pending', id } : { kind: 'none' };
  });

  // Decided during render, the moment the data is in, so the panel opens in
  // the same commit as the rows rather than one effect later.
  if (outcome.kind === 'pending' && ids) {
    const { id } = outcome;
    const path = ids.includes(id) ? forward?.(id) : undefined;
    setOutcome(!ids.includes(id) ? { kind: 'missed' } : path ? { kind: 'forward', id, path } : { kind: 'open', id });
  }

  // Consuming the link navigates, which is the router's business, not render's.
  const settled = outcome.kind !== 'pending' && outcome.kind !== 'none';
  const hasLinkState = !!(location.state as DeepLinkState | null)?.openRequest;
  useEffect(() => {
    if (!settled || !hasLinkState) return;
    if (outcome.kind === 'forward') {
      const state: DeepLinkState = { openRequest: outcome.id };
      navigate(outcome.path, { replace: true, state });
    } else {
      navigate({ pathname: location.pathname, search: location.search }, { replace: true, state: null });
    }
  }, [settled, hasLinkState, outcome, navigate, location.pathname, location.search]);

  return {
    linked: outcome.kind === 'open' ? outcome.id : null,
    unavailable: outcome.kind === 'missed' ? message : null,
    dismiss: () => setOutcome({ kind: 'none' }),
  };
}
