import type { Role, Session, SessionSource, User } from './session-source';

/** The seeded implementation of the session boundary (spec 003 D3, FR-003).
 *
 *  There is no authentication here, and deliberately so: FR-003a says the SPA
 *  renders the designed Google control and delegates, and whether the backend
 *  authenticates against Google or against seeded users is a backend decision
 *  settled when the REST contract publishes. Until then the drawn control
 *  resolves to the seeded Supply Admin, because the Supply Admin's screens are
 *  the ones that exist.
 *
 *  These are non-production placeholders, permitted in source by constitution
 *  IX and documented in specs/001-office-supplies-mvp/quickstart.md. No
 *  password, no token, no secret — there is nothing here to leak.
 */

export const SEEDED_USERS: Record<Role, User> = {
  employee: {
    id: 'usr-maya-santos',
    name: 'Maya Santos',
    email: 'maya.santos@codev.local',
    initials: 'MS',
    role: 'employee',
  },
  approver: {
    id: 'usr-samantha-reyes',
    name: 'Samantha Reyes',
    email: 'samantha.reyes@codev.local',
    initials: 'SR',
    role: 'approver',
  },
  supply_admin: {
    id: 'usr-ethan-cruz',
    name: 'Ethan Cruz',
    email: 'ethan.cruz@codev.local',
    initials: 'EC',
    role: 'supply_admin',
  },
};

/** Whom the drawn sign-in control resolves to while the contract is unpublished. */
const SIGNS_IN_AS: Role = 'supply_admin';

/** Storage holds a *reference*, never a session (plan 003 §Session Persistence).
 *
 *  A reload has to keep the user signed in (FR-008) while a session left behind
 *  on a shared machine must not be silently reused. Persisting the session
 *  itself satisfies the first and breaks the second, so what is written here is
 *  an opaque token and the moment it was issued — no user, no role, no
 *  authorization fact of any kind. Every load re-resolves it, and role is read
 *  from the source rather than from storage, so a role change is picked up on
 *  the next resolution rather than cached (FR-017b). */
const KEY = 'osrs.session-ref';
const LIFETIME_MS = 8 * 60 * 60 * 1000;

type SessionRef = { token: string; issuedAt: number };

function readRef(): SessionRef | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      typeof (parsed as SessionRef).token !== 'string' ||
      typeof (parsed as SessionRef).issuedAt !== 'number'
    ) {
      return null;
    }
    return parsed as SessionRef;
  } catch {
    // A private window, cleared site data, or a browser refusing storage. A
    // reference that cannot be read is a reference that does not exist.
    return null;
  }
}

function writeRef(ref: SessionRef | null) {
  try {
    if (ref) localStorage.setItem(KEY, JSON.stringify(ref));
    else localStorage.removeItem(KEY);
  } catch {
    // Storage is a convenience for surviving reload, not a requirement for
    // signing in. Losing it costs the user a re-authentication, nothing more.
  }
}

const sessionFor = (role: Role): Session => ({ user: SEEDED_USERS[role], role });

export const seededSessionSource: SessionSource = {
  async current() {
    const ref = readRef();
    if (!ref) return null;
    if (Date.now() - ref.issuedAt > LIFETIME_MS) {
      writeRef(null);
      return null;
    }
    return sessionFor(SIGNS_IN_AS);
  },

  async signIn() {
    writeRef({ token: crypto.randomUUID(), issuedAt: Date.now() });
    return sessionFor(SIGNS_IN_AS);
  },

  async signOut() {
    writeRef(null);
  },

  subscribe(onChange) {
    // `storage` fires in every *other* tab, which is exactly what FR-017a
    // needs: sign out here and the other tabs stop acting as signed in.
    const listener = (e: StorageEvent) => {
      if (e.key === null || e.key === KEY) onChange();
    };
    window.addEventListener('storage', listener);
    return () => window.removeEventListener('storage', listener);
  },
};
