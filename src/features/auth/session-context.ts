import { createContext, use } from 'react';
import type { SessionSource } from './session-source';
import type { Session, SessionStatus } from './types';

/** Why the session's ended it. `expired` is the case FR-017 names: a session
 *  that was valid stopped being valid without the user asking, so sign-in owes
 *  them an explanation rather than a bare form. */
export type SessionNotice = null | 'expired';

export type SessionContextValue = {
  status: SessionStatus;
  /** The active implementation of the boundary. The shell never calls it
   *  directly — that is what `signIn` and `signOut` below are for — but the
   *  sign-in screen asks whether it offers demo accounts, which is how the
   *  seeded account chooser disappears on its own once a source backed by the
   *  published contract replaces it. */
  source: SessionSource;
  session: Session | null;
  notice: SessionNotice;
  /** Rejects when sign-in is refused; never resolves to a signed-out state. */
  signIn: () => Promise<Session>;
  signOut: () => Promise<void>;
};

export const SessionContext = createContext<SessionContextValue | null>(null);

/** The shell's only way to a user and a role. Lives apart from the provider
 *  component so the module exports a hook or a component, never both — which
 *  is what keeps fast refresh working. */
export function useSession(): SessionContextValue {
  const value = use(SessionContext);
  if (!value) throw new Error('useSession must be used inside <SessionProvider>');
  return value;
}
