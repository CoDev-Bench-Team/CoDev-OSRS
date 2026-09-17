import { apiSessionSource } from './api-source';
import { seededSessionSource } from './seeded-source';
import type { SessionSource } from './session-source';

/** Which implementation of the session boundary this build runs against.
 *
 *  The client id is the switch because it is the one value the API source
 *  cannot work without: Google will not mint a credential without it, so a
 *  build that lacks it could only ever refuse every sign-in. Falling back to
 *  the seeded source instead keeps the demo, the Playwright targets and the
 *  fidelity gates working when the backend is unreachable or not configured.
 *
 *  The sign-in screen needs no branch of its own. `hasDemoAccounts()` already
 *  asks the active source whether it offers demo accounts, so the seeded
 *  account chooser disappears by itself the moment this returns the API
 *  source — which is exactly the disappearance `session-source.ts` describes. */
export const activeSessionSource: SessionSource = import.meta.env.VITE_GOOGLE_CLIENT_ID
  ? apiSessionSource
  : seededSessionSource;
