import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';

/** What a deep link hands the list it lands on, in navigation state: the
 *  Employee's My Requests from `/requests/:id` (spec 003, Session 2026-09-26),
 *  and History from the Requests Queue for a resolved request. The Admin's
 *  review panel has its own address, `/queue/:id` (spec 008 FR-001b), which
 *  carries the id in the path instead. */
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
 *  resolved request to History (spec 013 FR-016).
 *
 *  `routed` is a link carried in the address instead (`/queue/:id`): `id` from
 *  the path, `base` the list's own address. A routed link that opens stays on
 *  its address; one that opens nothing settles on `base` with the notice. A
 *  new routed id (Back, or another link) is resolved afresh. */
export function useDeepLinkedRequest(
  ids: readonly string[] | null,
  message: string,
  forward?: (id: string) => string | undefined,
  routed?: { id: string | undefined; base: string },
): {
  linked: string | null;
  unavailable: string | null;
  /** The link is still being resolved, or is being forwarded elsewhere: the
   *  page should not show rows it may be about to leave. */
  resolving: boolean;
  dismiss: () => void;
} {
  const location = useLocation();
  const navigate = useNavigate();
  const routedId = routed?.id;
  const [outcome, setOutcome] = useState<Outcome>(() => {
    const id = routedId ?? (location.state as DeepLinkState | null)?.openRequest;
    return id ? { kind: 'pending', id } : { kind: 'none' };
  });

  // Another routed id arrived (Back, a second link): resolve it afresh. The
  // address losing its id closes a panel it had opened; a missed link's
  // notice stays, since settling on `base` is what removed the id.
  const [lastRouted, setLastRouted] = useState(routedId);
  if (routedId !== lastRouted) {
    setLastRouted(routedId);
    if (routedId) setOutcome({ kind: 'pending', id: routedId });
    else if (outcome.kind !== 'missed') setOutcome({ kind: 'none' });
  }

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
  const base = routed?.base;
  useEffect(() => {
    if (!settled || (!hasLinkState && !routedId)) return;
    if (outcome.kind === 'forward') {
      const state: DeepLinkState = { openRequest: outcome.id };
      navigate(outcome.path, { replace: true, state });
    } else if (routedId && base) {
      // A routed link that opened keeps its address; one that missed settles
      // on the list's own.
      if (outcome.kind === 'missed') navigate(base, { replace: true });
    } else {
      navigate({ pathname: location.pathname, search: location.search }, { replace: true, state: null });
    }
  }, [settled, hasLinkState, routedId, base, outcome, navigate, location.pathname, location.search]);

  return {
    linked: outcome.kind === 'open' ? outcome.id : null,
    unavailable: outcome.kind === 'missed' ? message : null,
    resolving: outcome.kind === 'pending' || outcome.kind === 'forward',
    dismiss: () => setOutcome({ kind: 'none' }),
  };
}
