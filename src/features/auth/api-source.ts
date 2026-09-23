import { request } from '../../shared/api';
import { awaitGoogleCredential, mountGoogleButton } from './google-identity';
import type { GoogleButtonSource } from './google-button-source';
import type { SessionSource } from './session-source';
import type { Role, Session, User } from './types';

/** The session boundary, satisfied by the backend team's published contract.
 *  <https://codev-osrs-backend.vercel.app/#/>
 *
 *  This is the second implementation spec 003 D3 anticipated: `seeded-source.ts`
 *  answers the same four methods from localStorage, this one answers them from
 *  `/auth/google`, `/auth/me` and `/auth/logout`, and NOTHING above the boundary
 *  changes. `LoginScreen`, `SessionProvider`, `RequireAccess` and the routes are
 *  untouched by this feature.
 *
 *  The session is an httpOnly cookie named `session`. The SPA therefore holds no
 *  token, cannot inspect the session, and cannot forge one — every question
 *  about who is signed in is answered by asking `/auth/me`. That is the same
 *  "resolve, never believe" rule the seeded source follows, and it is what makes
 *  FR-017b (a role changed behind the boundary) work for free: the role is read
 *  from the server on every resolution rather than cached at sign-in. */

/** The `User` schema as the contract publishes it. Only the fields the shell
 *  consumes are declared — `googleSubject`, `location`, `createdAt`,
 *  `updatedAt` and `deletedAt` exist on the wire and are deliberately not
 *  carried into the SPA, because nothing renders them yet and `User` should not
 *  grow fields no screen uses. */
type ContractUser = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
  role: string;
};

/** Only an absolute https URL is passed to an `<img>`. The contract marks
 *  `avatarUrl` required but says nothing about its shape, and an empty string, a
 *  relative path or a `javascript:`/`data:` value should degrade to initials,
 *  not become a request the SPA did not mean to make. */
function photoUrl(value: unknown): string | undefined {
  if (typeof value !== 'string' || value === '') return undefined;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.href : undefined;
  } catch {
    return undefined;
  }
}

/** The contract's `role` enum is `admin | employee`, and that is the product's
 *  role model — confirmed by the product owner on 2026-09-17, not a gap waiting
 *  on a third value. Constitution II was amended to match (v1.3.0); ADR-0003 is
 *  superseded by ADR-0005.
 *
 *  So the mapping is one-to-one and there is nothing to collapse. An admin both
 *  decides on requests and fulfils them, which is what `admin` means in
 *  `navigation.ts` and `destinations.ts`.
 *
 *  A role outside this table is a REFUSAL, never a cast. `Role` is a closed
 *  union (FR-005); widening it here to absorb an unknown string is how an
 *  undefined role would silently acquire whatever access it happened to land
 *  on. */
const ROLE_BY_CONTRACT_ROLE: Readonly<Record<string, Role>> = {
  employee: 'employee',
  admin: 'admin',
};

/** Per role, reusing the two avatar colours the design system documents plus
 *  the blue the seeded source already logged as an addition. No new token is
 *  introduced (FR-021), and two people in the same role looking alike is
 *  acceptable — the initials distinguish them. */
const AVATAR_COLOR: Readonly<Record<Role, string>> = {
  employee: 'var(--color-osrs-avatar-orange)',
  approver: 'var(--color-osrs-blue-600)',
  supply_admin: 'var(--color-osrs-avatar-green)',
  // The design file's own Admin identity is Ethan Cruz, in deep green.
  admin: 'var(--color-osrs-avatar-green)',
};

function initialsOf(firstName: string, lastName: string): string {
  const letters = `${firstName.trim().charAt(0)}${lastName.trim().charAt(0)}`.toUpperCase();
  // A directory record with an empty name should degrade to something the
  // avatar can draw, not to an empty circle.
  return letters || firstName.trim().charAt(0).toUpperCase() || '?';
}

/** The one place the contract's vocabulary meets the SPA's.
 *
 *  Returns `null` rather than throwing when the payload cannot be trusted, so
 *  each caller decides what that means: for `current()` it is "no session", for
 *  `signIn()` it is a refusal. */
function toSession(body: unknown): Session | null {
  if (typeof body !== 'object' || body === null) return null;
  const contract = body as Partial<ContractUser>;

  if (typeof contract.id !== 'number') return null;
  if (typeof contract.email !== 'string') return null;
  if (typeof contract.role !== 'string') return null;

  const role = ROLE_BY_CONTRACT_ROLE[contract.role];
  if (!role) return null;

  const firstName = typeof contract.firstName === 'string' ? contract.firstName : '';
  const lastName = typeof contract.lastName === 'string' ? contract.lastName : '';

  const user: User = {
    // The contract's id is a number; the SPA's is a string, because request
    // detail addresses carry it and a URL segment is text.
    id: String(contract.id),
    name: `${firstName} ${lastName}`.trim() || contract.email,
    email: contract.email,
    // Carried, not derived at render time: a name is not reliably two words.
    initials: initialsOf(firstName, lastName),
    role,
    avatarColor: AVATAR_COLOR[role],
    // BEN-96: the avatar URL the contract returns is used. Spec 003 Story 5
    // AC4 was amended to allow it; initials remain the fallback.
    avatarUrl: photoUrl(contract.avatarUrl),
  };

  return { user, role };
}

/** Cross-tab notification (FR-017a).
 *
 *  An httpOnly cookie fires no events — nothing in JavaScript can observe it
 *  appearing or disappearing — so a sign-out in one tab would otherwise leave
 *  the others presenting a signed-in shell until something happened to fail.
 *  Writing a timestamp to localStorage gives the other tabs a `storage` event
 *  to wake on. The value carries no user, no role and no token: it says only
 *  "ask again", and the answer still comes from `/auth/me`. */
const PING_KEY = 'osrs.session.ping';

const listeners = new Set<() => void>();

function announce(): void {
  try {
    window.localStorage.setItem(PING_KEY, String(Date.now()));
  } catch {
    /* Storage is unavailable in a private window; this tab still works. */
  }
  for (const listener of listeners) listener();
}

function clientId(): string {
  return import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';
}

/** The Google Workspace domain to hint at in the account picker. Optional: with
 *  it unset the chooser simply offers every signed-in Google account. */
function companyDomain(): string | undefined {
  return import.meta.env.VITE_COMPANY_DOMAIN || undefined;
}

export const apiSessionSource: SessionSource & GoogleButtonSource = {
  /** `GoogleButtonSource`: the sign-in screen mounts this and lays it over the
   *  drawn control. Google's button is what the visitor actually clicks,
   *  because One Tap does not reliably appear — see `google-identity.ts`. */
  async mountButton(container) {
    const id = clientId();
    if (!id) throw new Error('google-client-id-missing');
    await mountGoogleButton(container, id, companyDomain());
  },

  async current() {
    const result = await request<unknown>('/auth/me');
    // 401 is the ordinary signed-out answer, not a failure.
    if (result.kind !== 'ok') return null;
    return toSession(result.data);
  },

  async signIn() {
    const id = clientId();
    if (!id) throw new Error('sign-in refused');

    // Opened BEFORE Google's popup, by the press that also clicks Google's
    // button — see `GoogleSignInOverlay`. Rejects if the visitor closes the
    // chooser, if Google reports a problem, or if nothing arrives at all.
    const credential = await awaitGoogleCredential();

    const result = await request<unknown>('/auth/google', {
      method: 'POST',
      body: { credential },
    });

    // Every non-success is the same refusal. The SPA is told nothing more, and
    // guessing would invent an error vocabulary the contract has not published
    // (FR-003b, FR-004). `signIn()` must REJECT, never resolve to signed-out.
    if (result.kind !== 'ok') {
      if (import.meta.env.DEV) console.warn('[osrs-auth] POST /auth/google refused:', result);
      throw new Error('sign-in refused');
    }

    const session = toSession(result.data);
    if (!session) {
      // Almost always the role: the contract returns `admin` or `employee`, and
      // anything outside ROLE_BY_CONTRACT_ROLE is refused rather than cast.
      if (import.meta.env.DEV) console.warn('[osrs-auth] user could not be mapped:', result.data);
      throw new Error('sign-in refused');
    }

    announce();
    return session;
  },

  async signOut() {
    // The cookie is httpOnly, so only the backend can clear it. A failure here
    // is not swallowed into a fake success: `SessionProvider` would otherwise
    // show a signed-out shell over a session that is still live.
    const result = await request<unknown>('/auth/logout', { method: 'POST' });
    if (result.kind === 'failed') throw new Error('sign-out failed');
    announce();
  },

  subscribe(listener) {
    listeners.add(listener);
    const onStorage = (event: StorageEvent) => {
      // `key === null` is a whole-storage clear, which may have taken the ping
      // with it.
      if (event.key === null || event.key === PING_KEY) listener();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener('storage', onStorage);
    };
  },
};
