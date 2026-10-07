import type { ReactNode } from 'react';
import { Navigate, useParams } from 'react-router';
import { useSession } from '../features/auth/session-context';
import { queueRequestPath } from './destinations';

/** `/requests` and `/requests/:id`, the address a "View request" email links
 *  to (spec 003, Session 2026-09-26). One route for the list and a request's
 *  panel over it, so opening and closing the panel never remounts My Requests
 *  (spec 007 FR-001). For an Employee it renders `children`, My Requests,
 *  which opens the request the address names. Whether it exists, or is theirs,
 *  is decided there. An Admin on `/requests/:id` is sent to `/queue/:id`, the
 *  review panel's own address (spec 008 FR-001b). */
export function RequestDeepLink({ children }: { children: ReactNode }) {
  const { id } = useParams();
  const { status, session } = useSession();
  if (id) {
    // Which page opens it depends on the role; wait for it.
    if (status === 'unknown') return null;
    if (session?.role === 'admin') return <Navigate to={queueRequestPath(id)} replace />;
  }
  return <>{children}</>;
}
