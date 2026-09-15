import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { ForbiddenScreen, LoadingState } from '../../shared/ui';
import { NavButton } from '../../app/NavButton';
import { landingDestination, landingPath, SIGN_IN_PATH } from '../../app/destinations';
import { useSession } from './session-context';
import { ROLE_LABEL, type Role } from './types';

/** The one guard, applied to every protected route element, so authorization
 *  cannot be forgotten screen by screen (FR-010).
 *
 *  Resolution order is fixed, and the order is the design:
 *
 *  1. `unknown` renders the loading state and NEVER redirects. This is what
 *     stops a signed-in user seeing a flash of the sign-in screen while the
 *     session is still resolving (FR-018).
 *  2. `signed-out` redirects to sign-in, recording the address that was asked
 *     for so the visitor is returned to it afterwards (FR-013).
 *  3. A role outside `allow` gets the refusal screen and a route back to a
 *     screen it may use — never a blank page, never a silent redirect (FR-011).
 *  4. Otherwise the destination renders.
 *
 *  Redirects always REPLACE. A pushed redirect leaves an entry in history that
 *  would immediately bounce the user again, which is how a back button turns
 *  into a loop (and why sign-out cannot be undone with back — FR-016).
 *
 *  The guard reads live context rather than a value captured when the routes
 *  were defined, so a role that changes mid-session re-evaluates on the next
 *  render (FR-017b).
 *
 *  This is a user-experience boundary, NOT a security boundary. Everything here
 *  runs in the browser. Spec 001's SC-005 is satisfied only when the API
 *  enforces the same matrix independently — ARCHITECT.md §7 makes that an API
 *  responsibility, and nothing here relieves it. */
export function RequireAccess({ allow, children }: { allow?: readonly Role[]; children: ReactNode }) {
  const { status, session } = useSession();
  const location = useLocation();

  if (status === 'unknown') return <LoadingState label="Checking your session" />;

  if (status === 'signed-out' || !session) {
    return <Navigate to={SIGN_IN_PATH} replace state={{ from: location.pathname + location.search }} />;
  }

  if (allow && !allow.includes(session.role)) {
    const home = landingDestination(session.role);
    return (
      <ForbiddenScreen
        roleLabel={ROLE_LABEL[session.role]}
        action={<NavButton to={landingPath(session.role)} replace>{`Go to ${home.navLabel}`}</NavButton>}
      />
    );
  }

  return <>{children}</>;
}
