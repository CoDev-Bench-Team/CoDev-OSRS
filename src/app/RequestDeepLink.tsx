import { Navigate, useParams } from 'react-router';
import { useSession } from '../features/auth/session-context';
import type { DeepLinkState } from '../features/requests/deep-link';
import { DESTINATIONS } from './destinations';

/** `/requests/:id`: the address a "View request" email links to (spec 003,
 *  Session 2026-09-26). It renders nothing of its own. It forwards to the list
 *  the role works from, carrying the id, and that list opens the panel: the
 *  Admin's Requests Queue, or the Employee's My Requests. Whether the request
 *  exists, or is the Employee's, is decided there, against what that page may
 *  show. */
export function RequestDeepLink() {
  const { id = '' } = useParams();
  const { session } = useSession();
  const to = session?.role === 'admin' ? DESTINATIONS.queue.path : DESTINATIONS.requests.path;
  const state: DeepLinkState = { openRequest: id };
  return <Navigate to={to} replace state={state} />;
}
