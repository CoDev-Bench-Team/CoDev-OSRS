import type { DemoAccount, DemoAccountSource, SessionSource } from './session-source';
import type { Session, User } from './types';

/** The seeded session source — today's implementation of the boundary.
 *
 *  Constitution IX permits seeded demo users in source as non-production
 *  placeholders; they are documented in `specs/001-office-supplies-mvp/
 *  quickstart.md`. Nothing here is a credential: there is no password, no
 *  token secret and nothing to leak. Sign-in resolves whichever demo account
 *  the tester picked, which is this source's stand-in for Google's account
 *  chooser.
 *
 *  Two storage keys, and the distinction between them is the whole point:
 *
 *  - `DIRECTORY_KEY` is this source's PRIVATE store. It stands in for the
 *    backend's session table — token → account, with an expiry the source sets
 *    itself. The shell never reads it.
 *  - `REFERENCE_KEY` is what the shell's session amounts to on disk: an opaque
 *    token and the time it was issued. No user, no role, no authorization fact.
 *
 *  So a reload restores the session (FR-008) because the reference is
 *  RESOLVED again rather than believed, and a reference left behind on a shared
 *  device is discarded once its record has expired (spec 003 Edge Cases). Role
 *  is read from the directory on every resolution, never from the reference, so
 *  a role change behind the boundary is picked up rather than cached (FR-017b).
 *
 *  When the contract publishes, `current()` becomes a real session lookup and
 *  the shell above it does not change. */

const DIRECTORY_KEY = 'osrs.demo.sessions';
const REFERENCE_KEY = 'osrs.session';
const SELECTION_KEY = 'osrs.demo.account';

/** A demo session lasts a working day. Long enough that a demo never expires
 *  mid-walkthrough, short enough that yesterday's reference is not reused. */
const LIFETIME_MS = 12 * 60 * 60 * 1000;

/** One seeded user per role, so SC-001 and SC-003 are exercisable.
 *
 *  Four, since the 2026-09-17 amendment: `admin` is what the contract issues and
 *  what a real user signs in as, while `approver` and `supply_admin` are the
 *  split the SPA still models so each pipeline stage can be demonstrated alone.
 *
 *  Maya and Ethan are the design file's two identities, with its avatar colours.
 *  The Approver is a third identity the source never draws — the file merges
 *  Approver and Supply Admin into one "Admin" — so her avatar colour is an
 *  addition, logged in docs/design-system/additions.md. */
const SEEDED_USERS: Record<string, User> = {
  'maya.santos': {
    id: 'maya.santos',
    name: 'Maya Santos',
    email: 'mayas@codev.com',
    initials: 'MS',
    role: 'employee',
    avatarColor: 'var(--color-osrs-avatar-orange)',
  },
  'samantha.reyes': {
    id: 'samantha.reyes',
    name: 'Samantha Reyes',
    email: 'samanthar@codev.com',
    initials: 'SR',
    role: 'approver',
    avatarColor: 'var(--color-osrs-blue-600)',
  },
  'ethan.cruz': {
    id: 'ethan.cruz',
    name: 'Ethan Cruz',
    email: 'ethanc@codev.com',
    initials: 'EC',
    role: 'supply_admin',
    avatarColor: 'var(--color-osrs-avatar-green)',
  },
  /** The role the published contract actually issues (constitution II, amended
   *  2026-09-17). Without it the seeded source could demonstrate every role
   *  except the one real users sign in as. Ethan is the design file's own Admin
   *  identity, so the same person appears under both — the split roles are the
   *  invented ones, and this is the identity the file drew. */
  'ethan.cruz.admin': {
    id: 'ethan.cruz.admin',
    name: 'Ethan Cruz',
    email: 'ethanc@codev.com',
    initials: 'EC',
    role: 'admin',
    avatarColor: 'var(--color-osrs-avatar-green)',
  },
};

const REFUSED_ACCOUNT = 'refused';

const DEMO_ACCOUNTS: readonly DemoAccount[] = [
  { id: 'maya.santos', label: 'Maya Santos', detail: 'Employee' },
  { id: 'ethan.cruz.admin', label: 'Ethan Cruz', detail: 'Admin' },
  { id: 'samantha.reyes', label: 'Samantha Reyes', detail: 'Approver (split role)' },
  { id: 'ethan.cruz', label: 'Ethan Cruz', detail: 'Supply Admin (split role)' },
  { id: REFUSED_ACCOUNT, label: 'Refused account', detail: 'Sign-in fails', refuses: true },
];

/** Storage throws in a private window and can be disabled outright, and a
 *  half-written value should never take the shell down with it. Every read
 *  degrades to "no session", which is the safe direction. */
function read<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* A session that cannot be persisted still works for this tab. */
  }
}

function remove(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

type DirectoryRecord = { account: string; expiresAt: number };
type Directory = Record<string, DirectoryRecord>;
type Reference = { token: string; issuedAt: number };

function directory(): Directory {
  return read<Directory>(DIRECTORY_KEY) ?? {};
}

function newToken(): string {
  return `s_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

function sessionFor(account: string): Session | null {
  const user = SEEDED_USERS[account];
  return user ? { user, role: user.role } : null;
}

/** Storage events fire only in OTHER tabs, which is exactly the multi-tab case
 *  (FR-017a). Same-tab changes are announced directly, so a sign-out reaches
 *  its own tab's subscribers too. */
const listeners = new Set<() => void>();

function announce(): void {
  for (const listener of listeners) listener();
}

/** FR-018 says the shell must show a deliberate loading state while session
 *  status is undetermined. The seeded source resolves in a microtask, so that
 *  state exists for less than a frame and neither a person nor a check can see
 *  it. In DEVELOPMENT ONLY, `?slow-session=<ms>` delays resolution so it can be
 *  observed — `import.meta.env.DEV` is replaced with `false` in a production
 *  build, so this disappears along with the branch. */
async function devThrottle(): Promise<void> {
  if (!import.meta.env.DEV) return;
  const ms = Number(new URLSearchParams(window.location.search).get('slow-session'));
  if (ms > 0) await new Promise((resolve) => setTimeout(resolve, Math.min(ms, 5000)));
}

export const seededSessionSource: SessionSource & DemoAccountSource = {
  async current() {
    await devThrottle();
    const reference = read<Reference>(REFERENCE_KEY);
    if (!reference?.token) return null;

    const record = directory()[reference.token];
    if (!record || record.expiresAt <= Date.now()) {
      // Stale or unknown: discard the reference rather than trusting it.
      remove(REFERENCE_KEY);
      return null;
    }
    const session = sessionFor(record.account);
    if (!session) {
      remove(REFERENCE_KEY);
      return null;
    }
    return session;
  },

  async signIn() {
    const account = this.selected();
    if (account === REFUSED_ACCOUNT || !SEEDED_USERS[account]) {
      // The shell is told nothing but "refused". It does not know why, and
      // guessing would invent an error vocabulary the contract has not
      // published (FR-003b, FR-004).
      throw new Error('sign-in refused');
    }

    const token = newToken();
    const records = directory();
    records[token] = { account, expiresAt: Date.now() + LIFETIME_MS };
    write(DIRECTORY_KEY, records);
    write(REFERENCE_KEY, { token, issuedAt: Date.now() } satisfies Reference);
    announce();

    const session = sessionFor(account);
    if (!session) throw new Error('sign-in refused');
    return session;
  },

  async signOut() {
    const reference = read<Reference>(REFERENCE_KEY);
    if (reference?.token) {
      const records = directory();
      delete records[reference.token];
      write(DIRECTORY_KEY, records);
    }
    remove(REFERENCE_KEY);
    announce();
  },

  subscribe(listener) {
    listeners.add(listener);
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === REFERENCE_KEY || event.key === DIRECTORY_KEY) listener();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener('storage', onStorage);
    };
  },

  accounts() {
    return DEMO_ACCOUNTS;
  },

  selected() {
    const stored = read<string>(SELECTION_KEY);
    return stored && DEMO_ACCOUNTS.some((a) => a.id === stored) ? stored : DEMO_ACCOUNTS[0].id;
  },

  select(id) {
    write(SELECTION_KEY, id);
  },
};
