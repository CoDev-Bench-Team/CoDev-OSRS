import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { seededSessionSource } from './seeded-source';
import type { Session, SessionSource } from './session-source';

/** `unknown` is the state that makes FR-018 true: while the session is still
 *  being resolved no guard may redirect, so a signed-in user never sees a
 *  flash of the sign-in screen. Only `signed-out` redirects. */
export type SessionStatus = 'unknown' | 'signed-out' | 'signed-in';

type SessionContextValue = {
  status: SessionStatus;
  session: Session | null;
  signIn: () => Promise<Session>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

/** Holds session state for the whole shell. It has exactly one job and does
 *  not navigate: guards are the only redirect authority (plan 003), because
 *  two independent navigators is how redirect loops start. */
export function SessionProvider({
  source = seededSessionSource,
  children,
}: {
  source?: SessionSource;
  children: ReactNode;
}) {
  const [status, setStatus] = useState<SessionStatus>('unknown');
  const [session, setSession] = useState<Session | null>(null);

  const resolve = useCallback(async () => {
    const next = await source.current();
    setSession(next);
    setStatus(next ? 'signed-in' : 'signed-out');
  }, [source]);

  useEffect(() => {
    let live = true;
    void source.current().then((next) => {
      if (!live) return;
      setSession(next);
      setStatus(next ? 'signed-in' : 'signed-out');
    });
    // A sign-out in another tab only updates status here; the guard that
    // re-renders decides where to go (FR-017a).
    const unsubscribe = source.subscribe(() => void resolve());
    return () => {
      live = false;
      unsubscribe();
    };
  }, [source, resolve]);

  const value = useMemo<SessionContextValue>(
    () => ({
      status,
      session,
      async signIn() {
        const next = await source.signIn();
        setSession(next);
        setStatus('signed-in');
        return next;
      },
      async signOut() {
        await source.signOut();
        setSession(null);
        setStatus('signed-out');
      },
    }),
    [status, session, source],
  );

  return <SessionContext value={value}>{children}</SessionContext>;
}

export function useSession(): SessionContextValue {
  const value = use(SessionContext);
  if (!value) throw new Error('useSession must be used inside <SessionProvider>');
  return value;
}
