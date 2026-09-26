import { useEffect, useRef, useState } from 'react';
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

/** Opens the request a deep link asked for, once `ids` — every request this
 *  page may show — has loaded. An id not among them opens nothing and returns
 *  `message` as the notice. The navigation state is consumed on arrival, so
 *  Back, a reload or a later render never reopens it. `dismiss` clears the
 *  notice; the page calls it when the Admin or Employee opens a panel, so an
 *  old notice does not sit above a request that did open. */
export function useDeepLinkedRequest(
  ids: readonly string[] | null,
  open: (id: string) => void,
  message: string,
): { unavailable: string | null; dismiss: () => void } {
  const location = useLocation();
  const navigate = useNavigate();
  const [unavailable, setUnavailable] = useState<string | null>(null);
  // The id is read once, on arrival, before the state is cleared below.
  const wanted = useRef((location.state as DeepLinkState | null)?.openRequest ?? null);
  const openRef = useRef(open);
  useEffect(() => {
    openRef.current = open;
  });

  useEffect(() => {
    const id = wanted.current;
    if (!id || !ids) return;
    wanted.current = null;
    if (ids.includes(id)) openRef.current(id);
    else setUnavailable(message);
    navigate({ pathname: location.pathname, search: location.search }, { replace: true, state: null });
  }, [ids, navigate, location.pathname, location.search, message]);

  return { unavailable, dismiss: () => setUnavailable(null) };
}
