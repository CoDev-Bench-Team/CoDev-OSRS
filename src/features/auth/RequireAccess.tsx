import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { ForbiddenScreen, LoadingState } from '../../shared/ui';
import { useSession } from './SessionProvider';
import { LANDING } from './navigation';
import type { Role } from './session-source';
import { BackToWork } from './BackToWork';

/** The one guard, applied to every protected route element, so authorization
 *  cannot be forgotten on a screen-by-screen basis (spec 003 FR-010).
 *
 *  **This is a user-experience boundary, not a security boundary.** Everything
 *  here runs in the browser and can be bypassed by anyone willing to edit
 *  client state. Spec 001's SC-005 — that one role cannot complete another
 *  role's action "through the UI or API" — is satisfied only when the API
 *  enforces the same matrix independently, which `ARCHITECT.md` §7 makes an
 *  API responsibility. Nothing here relieves the backend of it. The guard's job
 *  is that an Approver never *sees* the inventory screen; the API's job is that
 *  they cannot *change* inventory.
 *
 *  Resolution order matters:
 *
 *   1. `unknown` never redirects — it waits, which is what stops a signed-in
 *      user seeing a flash of the sign-in screen (FR-018).
 *   2. `signed-out` redirects to sign-in, recording where the visitor was
 *      headed so they are returned to it afterwards (FR-013).
 *   3. A role outside `allow` gets an explanation and a route back, never a
 *      blank screen or a silent bounce (FR-011).
 *
 *  Because it reads live context rather than a value captured when the routes
 *  were defined, a role change mid-session re-evaluates on the next render
 *  (FR-017b). Redirects replace rather than push, so browser back cannot land
 *  on a route that immediately bounces again (FR-016).
 */
export function RequireAccess({ allow, children }: { allow: readonly Role[]; children: ReactNode }) {
  const { status, session } = useSession();
  const location = useLocation();

  if (status === 'unknown') return <LoadingState label="Checking your session" />;

  if (status === 'signed-out' || !session) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }

  if (!allow.includes(session.role)) {
    return <ForbiddenScreen action={<BackToWork to={LANDING[session.role]} />} />;
  }

  return children;
}
