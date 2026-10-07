import { isRecord } from '../../shared/api';
import { OFFICES, ROLES, type Office, type Role, type Session } from './types';

/** The signed-in user, kept in `localStorage` so a load renders signed in at
 *  once instead of waiting for `GET /auth/me` (spec 017 FR-058). The session
 *  itself stays the API's HTTP-only cookie: no token and no Google credential
 *  is kept here, only who is signed in (id, role, name, email, office).
 *
 *  `GET /auth/me` still runs, in the background once nothing else is loading,
 *  and its answer replaces what is kept. Signing out, any `401` and a
 *  background read with no session remove it. Storage can be blocked or
 *  throw, so every access is best-effort: without it, a load waits for the
 *  session as it did before. */

const KEY = 'osrs.session';

const text = (value: unknown): string | undefined => (typeof value === 'string' && value ? value : undefined);

/** The kept session, or `null` when there is none or it is not one. */
export function readCachedSession(): Session | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    if (!isRecord(value) || !isRecord(value.user)) return null;
    const role = value.role;
    if (!(ROLES as readonly unknown[]).includes(role)) return null;
    const user = value.user;
    const id = text(user.id);
    if (!id || user.role !== role) return null;
    const office = text(user.office);
    return {
      role: role as Role,
      user: {
        id,
        role: role as Role,
        name: text(user.name),
        email: text(user.email),
        initials: text(user.initials) ?? '',
        office: office && (OFFICES as readonly string[]).includes(office) ? (office as Office) : undefined,
      },
    };
  } catch {
    return null;
  }
}

/** Keep the signed-in session, or forget it (`null`). */
export function cacheSession(session: Session | null): void {
  try {
    if (session) window.localStorage.setItem(KEY, JSON.stringify(session));
    else window.localStorage.removeItem(KEY);
  } catch {
    // Not kept; the next load waits for the session.
  }
}

/** Whether two sessions name the same person with the same details. */
export function sameSession(a: Session | null, b: Session | null): boolean {
  if (!a || !b) return a === b;
  const fields = ['id', 'role', 'name', 'email', 'initials', 'office'] as const;
  return a.role === b.role && fields.every((field) => a.user[field] === b.user[field]);
}
