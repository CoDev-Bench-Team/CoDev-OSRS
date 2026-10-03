/** Google Identity Services, wrapped so the rest of the SPA never sees it.
 *
 *  `POST /auth/google` takes `{ credential }`: the Google ID token. An earlier
 *  pass asked One Tap (`prompt()`) for that token. Against the real client id
 *  it rendered nothing and invoked no callback. Google's own button
 *  (`renderButton`) is the mechanism that produces a credential. The sign-in
 *  screen lays that button over the drawn control.
 *
 *  The client id has to come from the same Google Cloud project the API
 *  verifies. A token from a different client carries a different `aud`, and
 *  the API refuses it. */

import { SIGN_IN_REFUSAL, SessionRefusal } from './session-errors';

type CredentialResponse = { credential?: string };
type GoogleError = { type?: string };

type GoogleAccountsId = {
  initialize(config: {
    client_id: string;
    callback: (response: CredentialResponse) => void;
    error_callback?: (error: GoogleError) => void;
    hd?: string;
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
};

declare global {
  interface Window {
    google?: { accounts?: { id?: GoogleAccountsId } };
  }
}

const SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

/** Backstop against silence. Google does not always report a closed popup, and
 *  reports nothing for a client id its project does not recognise. Choosing an
 *  account and passing 2FA is slow, so this is long on purpose. */
const CREDENTIAL_TIMEOUT_MS = 3 * 60 * 1000;

let loading: Promise<GoogleAccountsId> | null = null;

function load(): Promise<GoogleAccountsId> {
  if (loading) return loading;

  loading = new Promise<GoogleAccountsId>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    if (existing && window.google?.accounts?.id) {
      resolve(window.google.accounts.id);
      return;
    }
    // A script that already failed or finished will not fire load or error
    // again. Drop it so this attempt inserts a live one.
    existing?.remove();

    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    const fail = () => {
      script.remove();
      reject(new SessionRefusal(SIGN_IN_REFUSAL));
    };
    script.addEventListener(
      'load',
      () => {
        const id = window.google?.accounts?.id;
        if (id) resolve(id);
        else fail();
      },
      { once: true },
    );
    script.addEventListener('error', fail, { once: true });
    document.head.appendChild(script);
  }).catch((error: unknown) => {
    loading = null;
    throw error;
  });

  return loading;
}

type Waiter = { resolve: (credential: string) => void; reject: (error: Error) => void; timer: number };

let waiter: Waiter | null = null;

/** A keyboard activation inside Google's cross-origin iframe does not fire
 *  `pointerdown` on this document, so no waiter is open when the callback
 *  arrives. The credential, and a failure, are handed to these listeners
 *  instead of being dropped. */
let deliverWithoutWaiter: ((credential: string) => void) | null = null;
let reportWithoutWaiter: ((error: SessionRefusal) => void) | null = null;

export function onGoogleCredential(
  listener: (credential: string) => void,
  onError?: (error: SessionRefusal) => void,
): () => void {
  deliverWithoutWaiter = listener;
  reportWithoutWaiter = onError ?? null;
  return () => {
    if (deliverWithoutWaiter === listener) deliverWithoutWaiter = null;
    if (reportWithoutWaiter === onError) reportWithoutWaiter = null;
  };
}

function settle(outcome: { credential: string } | { error: string }): void {
  if ('credential' in outcome) {
    const pending = waiter;
    if (!pending) {
      deliverWithoutWaiter?.(outcome.credential);
      return;
    }
    waiter = null;
    clearTimeout(pending.timer);
    pending.resolve(outcome.credential);
    return;
  }

  if (import.meta.env.DEV) console.warn('[osrs-auth] google sign-in failed:', outcome.error);
  const refusal = new SessionRefusal(SIGN_IN_REFUSAL);
  const pending = waiter;
  if (!pending) {
    reportWithoutWaiter?.(refusal);
    return;
  }
  waiter = null;
  clearTimeout(pending.timer);
  pending.reject(refusal);
}

let initializedFor: string | null = null;

async function ensureInitialized(clientId: string, companyDomain?: string): Promise<GoogleAccountsId> {
  const id = await load();
  const key = `${clientId}|${companyDomain ?? ''}`;
  if (initializedFor === key) return id;

  id.initialize({
    client_id: clientId,
    ...(companyDomain ? { hd: companyDomain } : {}),
    callback: (response) => {
      if (response.credential) settle({ credential: response.credential });
      else settle({ error: 'google-no-credential' });
    },
    error_callback: (error) => settle({ error: error.type ?? 'google-error' }),
  });
  initializedFor = key;
  return id;
}

/** Render Google's sign-in button into `container`. The sign-in screen
 *  paints the drawn 242×64 pill over this frame; the frame stays the hit
 *  target. */
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

let inFlight: Promise<string> | null = null;

/** Open a request for the credential Google's button is about to produce.
 *  Repeated presses join the attempt already running. */
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
