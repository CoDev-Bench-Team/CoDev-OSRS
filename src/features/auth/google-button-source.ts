import type { SessionSource } from './session-source';

/** An optional capability of a `SessionSource`, exactly as `DemoAccountSource`
 *  is one — and for the same reason.
 *
 *  A source backed by Google needs the visitor to press Google's own button,
 *  because that is the only mechanism that reliably produces a credential. The
 *  seeded source needs nothing of the kind. Rather than teach `LoginScreen`
 *  which source it is talking to, the screen asks whether the active source
 *  offers a button to mount — the same question `hasDemoAccounts()` answers
 *  about the account chooser.
 *
 *  So the sign-in screen carries no Google-specific branch and no environment
 *  check: swap the source and the right control appears by itself. FR-003a's
 *  "the SPA implements no authentication mechanism of its own" survives,
 *  because everything Google-shaped stays behind the boundary. */
export interface GoogleButtonSource {
  /** Render the provider's sign-in control into `container`. Rejects if the
   *  provider's script cannot be loaded. */
  mountButton(container: HTMLElement): Promise<void>;
}

export function hasGoogleButton(source: SessionSource): source is SessionSource & GoogleButtonSource {
  return typeof (source as Partial<GoogleButtonSource>).mountButton === 'function';
}
