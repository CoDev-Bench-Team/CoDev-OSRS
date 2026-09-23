/** Google Identity Services, wrapped so the rest of the SPA never sees it.
 *
 *  `POST /auth/google` takes `{ credential }`, which the contract documents as
 *  "the Google OAuth ID token credential returned by Google Sign-In" — so the
 *  browser obtains it and the SPA runs this flow. Everything Google-shaped is
 *  confined to this file.
 *
 *  **Google's own button is what the visitor clicks.** An earlier pass drove
 *  sign-in from `prompt()` (One Tap) so the drawn control could own the click.
 *  Tested against the real client id, `prompt()` rendered nothing at all and
 *  invoked no callback — One Tap declines silently in ordinary conditions (no
 *  Google session in the profile, restricted third-party cookies, a FedCM
 *  setting), and there is no reliable signal to fall back on. `renderButton` is
 *  the mechanism that actually works, and it is what the Linear requirements
 *  ask for.
 *
 *  So the button is rendered — and then made invisible and laid over the drawn
 *  control, which `GoogleSignInOverlay` does. Google's button receives the
 *  click; the design keeps the 242x64 pill it specifies. Google's button cannot
 *  be restyled into that pill (it caps near 40px tall and draws its own border
 *  and type), so covering it is the only way to satisfy both.
 *
 *  The client id must come from the SAME Google Cloud project the backend
 *  verifies against: a token minted by a different client carries a different
 *  `aud` and the backend rejects it, which looks exactly like a refused
 *  sign-in. */

type CredentialResponse = { credential?: string };

/** Google reports what it cannot do here rather than through the credential
 *  callback: an unusable client id, a popup the browser blocked, a popup the
 *  visitor closed. Without it a failed sign-in is indistinguishable from one
 *  still in progress. */
type GoogleError = { type?: string };

type GoogleAccountsId = {
  initialize(config: {
    client_id: string;
    callback: (response: CredentialResponse) => void;
    error_callback?: (error: GoogleError) => void;
    hd?: string;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
    use_fedcm_for_prompt?: boolean;
  }): void;
  renderButton(
    parent: HTMLElement,
    options: {
      type?: string;
      theme?: string;
      size?: string;
      text?: string;
      shape?: string;
      logo_alignment?: string;
      width?: number;
    },
  ): void;
  cancel(): void;
  disableAutoSelect(): void;
};

declare global {
  interface Window {
    google?: { accounts?: { id?: GoogleAccountsId } };
  }
}

const SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

/** How long to wait for Google before giving up.
 *
 *  Not a deadline for the visitor — it is a backstop against silence. Google
 *  does not always report a closed popup, and reports nothing at all for a
 *  client id its project does not recognise, so without this the promise never
 *  settles and the control sticks on "Signing in…" with no way back. FR-003b
 *  requires it to return to rest so a retry is possible.
 *
 *  Generous on purpose: choosing an account, typing a password and passing 2FA
 *  is slow, and cutting a real sign-in short would be worse than waiting. */
const CREDENTIAL_TIMEOUT_MS = 3 * 60 * 1000;

/** Loaded on demand and memoised, not declared in `index.html`.
 *
 *  A seeded-source run must not reach out to Google at all: it authenticates
 *  nobody, and a request to accounts.google.com on every page load would be a
 *  third-party call the demo does not need. */
let loading: Promise<GoogleAccountsId> | null = null;

function load(): Promise<GoogleAccountsId> {
  if (loading) return loading;

  loading = new Promise<GoogleAccountsId>((resolve, reject) => {
    const ready = () => {
      const id = window.google?.accounts?.id;
      if (id) resolve(id);
      else reject(new Error('google-identity-unavailable'));
    };
    const failed = () => reject(new Error('google-identity-unavailable'));

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      if (window.google?.accounts?.id) ready();
      else existing.addEventListener('load', ready, { once: true });
      existing.addEventListener('error', failed, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener('load', ready, { once: true });
    script.addEventListener('error', failed, { once: true });
    document.head.appendChild(script);
  }).catch((error: unknown) => {
    // A failed load must not poison every later attempt: a flaky network on the
    // first press should not make the control permanently dead.
    loading = null;
    throw error;
  });

  return loading;
}

/** The one in-flight sign-in.
 *
 *  Google's callback belongs to `initialize`, not to a click, so the credential
 *  arrives without a promise to hand it to. This is that promise: the overlay
 *  opens a request the instant the visitor presses, and Google's callback —
 *  whenever it comes — settles it. Only one may be open at a time, which is
 *  also true of the sign-in screen: there is one control. */
type Waiter = { resolve: (credential: string) => void; reject: (error: Error) => void; timer: number };

let waiter: Waiter | null = null;

function settle(outcome: { credential: string } | { error: string }): void {
  const pending = waiter;
  if (!pending) return;
  waiter = null;
  clearTimeout(pending.timer);
  if ('credential' in outcome) {
    pending.resolve(outcome.credential);
  } else {
    // The sign-in screen shows one generic refusal on purpose (FR-004: the SPA
    // does not publish an error vocabulary it does not own). That leaves a
    // developer with nothing to go on, so the reason is logged in development
    // only — `import.meta.env.DEV` is replaced with `false` in a production
    // build, so this and the branch disappear together.
    if (import.meta.env.DEV) console.warn('[osrs-auth] google sign-in failed:', outcome.error);
    pending.reject(new Error(outcome.error));
  }
}

/** `initialize` is idempotent per configuration and must run once, not per
 *  click: re-initialising while Google's button is mounted detaches it. */
let initializedFor: string | null = null;

async function ensureInitialized(clientId: string, companyDomain?: string): Promise<GoogleAccountsId> {
  const id = await load();
  const key = `${clientId}|${companyDomain ?? ''}`;
  if (initializedFor === key) return id;

  id.initialize({
    client_id: clientId,
    // The account-picker hint. It puts work accounts first in the chooser and
    // nothing more: it is a parameter the client sends, so anyone can remove
    // it, and the API stays responsible for deciding which domains may sign in.
    // Never read as an authorization fact here.
    ...(companyDomain ? { hd: companyDomain } : {}),
    callback: (response) => {
      if (response.credential) settle({ credential: response.credential });
      else settle({ error: 'google-no-credential' });
    },
    // An unrecognised client id, a blocked popup, a popup the visitor closed.
    // All mean "no session", and all must release the control rather than
    // leave it spinning.
    error_callback: (error) => settle({ error: error.type ?? 'google-error' }),
    // Never sign someone back in silently: FR-016 requires that a sign-out
    // actually ends access, and auto-select would undo it on the next load.
    auto_select: false,
    cancel_on_tap_outside: false,
    use_fedcm_for_prompt: true,
  });
  initializedFor = key;
  return id;
}

/** Render Google's real sign-in button into `container`.
 *
 *  The caller hides it and lays it over the drawn control. Width is fixed to
 *  the drawn pill's 242px so the two line up; height is Google's own, which
 *  `GoogleSignInOverlay` stretches to cover 64px. */
export async function mountGoogleButton(
  container: HTMLElement,
  clientId: string,
  companyDomain?: string,
): Promise<void> {
  const id = await ensureInitialized(clientId, companyDomain);
  container.replaceChildren();
  id.renderButton(container, {
    type: 'standard',
    theme: 'outline',
    size: 'large',
    text: 'signin_with',
    shape: 'pill',
    logo_alignment: 'left',
    width: 242,
  });
}

/** Open a request for the credential Google's button is about to produce.
 *
 *  Called the moment the visitor presses, BEFORE Google's popup opens, so the
 *  callback always has somewhere to deliver. Rejects if the visitor closes the
 *  chooser, if Google reports a problem, or if nothing arrives at all.
 *
 *  **Repeated presses join the attempt already running rather than replacing
 *  it.** Google's popup takes a moment to appear, so pressing again while
 *  waiting is the natural thing to do. An earlier version superseded the first
 *  attempt, which rejected its promise — and the sign-in screen, seeing a
 *  rejection, showed "Sign-in did not succeed" while the sign-in the visitor
 *  had actually started was still in flight. One press, one attempt, one
 *  outcome. */
let inFlight: Promise<string> | null = null;

export function awaitGoogleCredential(): Promise<string> {
  if (inFlight) return inFlight;

  inFlight = new Promise<string>((resolve, reject) => {
    const timer = window.setTimeout(() => settle({ error: 'google-timeout' }), CREDENTIAL_TIMEOUT_MS);
    waiter = { resolve, reject, timer };
  }).finally(() => {
    inFlight = null;
  });

  return inFlight;
}
