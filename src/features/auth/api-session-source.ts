import { ApiProblemError, SessionUnreachable, apiConfigured, apiRequest, onSessionEnded, problemMessage } from '../../shared/api';
import type { GoogleButtonSource } from './google-button-source';
import { awaitGoogleCredential, mountGoogleButton } from './google-identity';
import { cacheSession } from './session-cache';
import type { SessionSource } from './session-source';
import { SIGN_IN_REFUSAL, SessionRefusal } from './session-errors';
import { OFFICES, type Office, type Role, type Session, type User } from './types';

const CHANNEL = 'osrs.session';

/** The Web client id BEN-96 configures. It is not an API field, and it is not
 *  written into source. Empty when `VITE_GOOGLE_CLIENT_ID` is unset. */
export function publishedGoogleClientId(): string {
  return import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() ?? '';
}

function companyDomain(): string | undefined {
  const domain = import.meta.env.VITE_COMPANY_DOMAIN?.trim();
  return domain || undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/** Map the live current user into the shell session. `name` is the shell's
 *  own field, filled from the published `firstName` and `lastName` (or a
 *  published `name` when one is present). An unrecognised role is not a
 *  session. `avatarUrl` is ignored. */
export function sessionFromCurrentUser(body: unknown): Session | null {
  if (!isRecord(body)) return null;
  const role: Role | null = body.role === 'employee' || body.role === 'admin' ? body.role : null;
  if (!role) return null;
  const id = typeof body.id === 'number' || typeof body.id === 'string' ? String(body.id) : '';
  if (!id) return null;

  const email = text(body.email) || undefined;
  const publishedName = text(body.name);
  const joined = [text(body.firstName), text(body.lastName)].filter(Boolean).join(' ');
  const name = publishedName || joined || undefined;
  const location = text(body.location);
  const office: Office | undefined = (OFFICES as readonly string[]).includes(location) ? (location as Office) : undefined;
  const user: User = {
    id,
    role,
    name,
    email,
    initials: name ? initialsFrom(name) : '',
    office,
  };
  return { user, role };
}

function refusal(error: ApiProblemError): SessionRefusal {
  return new SessionRefusal(problemMessage(error.problem, SIGN_IN_REFUSAL));
}

function rethrow(error: unknown): never {
  if (error instanceof SessionRefusal) throw error;
  if (error instanceof ApiProblemError) throw refusal(error);
  if (error instanceof SessionUnreachable) throw error;
  throw new SessionUnreachable();
}

function wake(): void {
  const channel = new BroadcastChannel(CHANNEL);
  channel.postMessage({ type: 'changed' });
  channel.close();
}

/** `rethrow` for reading the current session. A 5xx there is the API (or
 *  the proxy in front of it) failing, not a refusal: it must not end a
 *  session (spec 017 FR-058). Sign-in keeps the problem's own words. */
function rethrowKeeping(error: unknown): never {
  if (error instanceof ApiProblemError && error.status >= 500) throw new SessionUnreachable();
  rethrow(error);
}

let signingIn: Promise<Session> | null = null;

/** Set when this document must not treat a still-valid cookie as signed in.
 *  A refresh starts clean and asks `GET /auth/me` again. Cleared only by a
 *  successful sign-in. Not written to browser storage. */
let signedOutLocally = false;

async function performSignIn(credential?: string): Promise<Session> {
  let token = credential;
  if (!token) {
    if (!publishedGoogleClientId()) throw new SessionRefusal(SIGN_IN_REFUSAL);
    try {
      token = await awaitGoogleCredential();
    } catch (error) {
      if (error instanceof SessionRefusal) throw error;
      throw new SessionRefusal(SIGN_IN_REFUSAL);
    }
  }
  const payload: { credential?: string } = { credential: token };
  try {
    const body = await apiRequest<unknown>('/auth/google', { method: 'POST', body: payload });
    const session = sessionFromCurrentUser(body);
    if (!session) throw new SessionRefusal(SIGN_IN_REFUSAL);
    signedOutLocally = false;
    wake();
    return session;
  } catch (error) {
    rethrow(error);
  } finally {
    payload.credential = undefined;
  }
}

/** The published session. Of browser storage it only removes the kept user
 *  (session-cache.ts) as a session ends; the provider keeps it. Google's
 *  button is mounted only when a client id is configured. */
export const apiSessionSource: SessionSource & Partial<GoogleButtonSource> = {
  ...(publishedGoogleClientId()
    ? {
        async mountButton(container: HTMLElement) {
          await mountGoogleButton(container, publishedGoogleClientId(), companyDomain());
        },
      }
    : {}),
  async current() {
    // No API, no session: sign-in says so (spec 017 FR-001a).
    if (signedOutLocally || !apiConfigured()) return null;
    try {
      const body = await apiRequest<unknown>('/auth/me');
      return sessionFromCurrentUser(body);
    } catch (error) {
      if (error instanceof ApiProblemError && error.status === 401) return null;
      rethrowKeeping(error);
    }
  },

  async signIn(credential) {
    if (signingIn) return signingIn;
    signingIn = performSignIn(credential).finally(() => {
      signingIn = null;
    });
    return signingIn;
  },

  async signOut() {
    // Forgotten before the API is asked, so a reload mid-way does not
    // restore the person.
    cacheSession(null);
    await apiRequest('/auth/logout', { method: 'POST' });
    signedOutLocally = true;
    wake();
  },

  subscribe(listener) {
    const channel = new BroadcastChannel(CHANNEL);
    const onMessage = () => listener();
    channel.addEventListener('message', onMessage);
    const onVisible = () => {
      if (document.visibilityState === 'visible') listener();
    };
    document.addEventListener('visibilitychange', onVisible);
    let ending = false;
    const offSession = onSessionEnded(() => {
      if (ending) return;
      ending = true;
      // A 403 on submit, receive, or sign still has a live cookie. Drop this
      // document before re-reading /auth/me, or that read restores the person.
      // signOut() wakes other tabs only after logout succeeds. If logout fails,
      // the flag above still holds, so this tab does not come back.
      signedOutLocally = true;
      cacheSession(null);
      void apiSessionSource.signOut().catch((error: unknown) => {
        // The cookie may still be valid. This document stays signed out.
        if (import.meta.env.DEV) console.warn('[osrs-auth] logout did not clear the session:', error);
      }).finally(() => {
        ending = false;
        listener();
      });
    });
    return () => {
      channel.removeEventListener('message', onMessage);
      channel.close();
      document.removeEventListener('visibilitychange', onVisible);
      offSession();
    };
  },
};
