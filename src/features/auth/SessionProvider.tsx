import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { SessionUnreachable } from '../../shared/api';
import { clearAllDrafts } from '../../shared/form-draft-cache';
import { apiSessionSource } from './api-session-source';
import type { SessionSource } from './session-source';
import { SessionContext, type SessionNotice } from './session-context';
import { SessionRefusal } from './session-errors';
import type { Session, SessionStatus } from './types';

function refusalNotice(error: unknown): SessionNotice | null {
  if (error instanceof SessionRefusal) return { kind: 'refused', message: error.sessionNotice };
  if (error instanceof SessionUnreachable) return { kind: 'refused', message: error.message };
  return null;
}

/** The status machine and the one place the session boundary is called.
 *
 *  `unknown` is the initial state and it NEVER redirects (spec 003 plan,
 *  "Avoiding redirect loops and flicker"). Guards render the loading state
 *  while it holds, which is what stops a signed-in user seeing a flash of the
 *  sign-in screen on every load (FR-018).
 *
 *  The provider also never navigates. It updates status; the guard that
 *  re-renders decides where to go. Two independent navigators is how redirect
 *  loops start. */
export function SessionProvider({
  source = apiSessionSource,
  children,
}: {
  source?: SessionSource;
  children: ReactNode;
}) {
  const [status, setStatus] = useState<SessionStatus>('unknown');
  const [session, setSession] = useState<Session | null>(null);
  const [notice, setNotice] = useState<SessionNotice>(null);

  // Signed out, by choice or by expiry: no unsaved form draft outlives the
  // person who typed it (shared/form-draft-cache.ts).
  useEffect(() => {
    if (status === 'signed-out') clearAllDrafts();
  }, [status]);

  /** Resolutions can overlap — a storage event during the first load, say — and
   *  the last one to *start* is the one whose answer is current. */
  const resolution = useRef(0);
  /** A sign-out the user asked for is not an expiry, so it must not produce the
   *  "your session ended" explanation. */
  const signingOut = useRef(false);
  const signedIn = useRef(false);

  const resolve = useCallback(async () => {
    const ticket = ++resolution.current;
    let next: Session | null;
    try {
      next = await source.current();
    } catch (error) {
      if (ticket !== resolution.current) return;
      // A refusal or an unreachable API stays on sign-in.
      const refused = refusalNotice(error);
      if (refused) setNotice(refused);
      signedIn.current = false;
      setSession(null);
      setStatus('signed-out');
      return;
    }
    if (ticket !== resolution.current) return;

    if (next) {
      signedIn.current = true;
      setSession(next);
      setStatus('signed-in');
      return;
    }
    // Losing a session we had, without asking to, is the invalidated case.
    // A `401` from the current-user read arrives here as `null`.
    if (signedIn.current && !signingOut.current) setNotice('expired');
    signedIn.current = false;
    setSession(null);
    setStatus('signed-out');
  }, [source]);

  useEffect(() => {
    void resolve();
    // A change behind the boundary — another tab signing out (FR-017a), a role
    // change (FR-017b) — only wakes us. What is true is decided by re-resolving.
    return source.subscribe(() => {
      void resolve();
    });
  }, [resolve, source]);

  const signIn = useCallback(async (credential?: string) => {
    try {
      const next = await source.signIn(credential);
      ++resolution.current; // this answer supersedes any resolution in flight
      signedIn.current = true;
      setNotice(null);
      setSession(next);
      setStatus('signed-in');
      return next;
    } catch (error) {
      const refused = refusalNotice(error);
      if (refused) setNotice(refused);
      throw error;
    }
  }, [source]);

  const signOut = useCallback(async () => {
    signingOut.current = true;
    try {
      await source.signOut();
      ++resolution.current;
      signedIn.current = false;
      setNotice(null);
      setSession(null);
      setStatus('signed-out');
    } finally {
      signingOut.current = false;
    }
  }, [source]);

  const value = useMemo(
    () => ({ status, session, notice, source, signIn, signOut }),
    [status, session, notice, source, signIn, signOut],
  );

  return <SessionContext value={value}>{children}</SessionContext>;
}
