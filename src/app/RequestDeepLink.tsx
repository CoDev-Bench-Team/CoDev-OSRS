import { Navigate, useParams } from 'react-router';
import { useSession } from '../features/auth/session-context';
import type { DeepLinkState } from '../features/requests/deep-link';
import { DESTINATIONS, queueRequestPath } from './destinations';

/** `/requests/:id`: the address a "View request" email links to (spec 003,
 *  Session 2026-09-26). It renders nothing of its own. It forwards to the list
 *  the role works from, carrying the id, and that list opens the panel: the
 *  Admin's Requests Queue, or the Employee's My Requests. Whether the request
 *  exists, or is the Employee's, is decided there, against what that page may
 *  show. An Admin is sent to `/queue/:id`, the review panel's own address. */
export function RequestDeepLink() {
  const { id = '' } = useParams();
  const { status, session } = useSession();
  // Which list opens it depends on the role; wait for it.
  if (status === 'unknown') return null;
  // The Admin's review panel has its own address (spec 008 FR-001b).
  if (session?.role === 'admin') return <Navigate to={queueRequestPath(id)} replace />;
  const state: DeepLinkState = { openRequest: id };
  return <Navigate to={DESTINATIONS.requests.path} replace state={state} />;
}
