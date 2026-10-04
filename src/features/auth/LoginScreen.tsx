import { useCallback, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router';
import { SessionUnreachable, apiConfigured } from '../../shared/api';
import { CoDevSupplyRequestsLogo, SignInButton } from '../../shared/ui';
import { canRoleReach, landingPath } from '../../app/destinations';
import { DEV_ROLE_OVERRIDE_ENABLED, devRoleOverride, setDevRoleOverride } from './dev-role-override';
import { GoogleSignInOverlay } from './GoogleSignInOverlay';
import { hasGoogleButton } from './google-button-source';
import { onGoogleCredential } from './google-identity';
import type { SessionSource } from './session-source';
import { useSession } from './session-context';
import { API_NOT_CONFIGURED, SIGN_IN_REFUSAL, SessionRefusal } from './session-errors';
import type { Role } from './types';
import loginBackground from '../../assets/login/login-background.png';

function pathAfterSignIn(role: Role, state: unknown): string {
  const requested = (state as { from?: string } | null)?.from;
  const path = requested?.split('?')[0];
  const permitted = path ? canRoleReach(role, path) : false;
  return permitted && requested ? requested : landingPath(role);
}

async function submitSignIn(source: SessionSource, signIn: (credential?: string) => Promise<unknown>): Promise<void> {
  if (!apiConfigured()) throw new SessionRefusal(API_NOT_CONFIGURED);
  if (hasGoogleButton(source)) {
    await signIn();
    return;
  }
  throw new SessionRefusal(SIGN_IN_REFUSAL);
}

function signInFailure(error: unknown): string {
  if (error instanceof SessionRefusal) return error.sessionNotice;
  if (error instanceof SessionUnreachable) return error.message;
  return SIGN_IN_REFUSAL;
}

function startSignIn(
  attempt: Promise<unknown>,
  setRefused: (message: string | null) => void,
  setBusy: (busy: boolean) => void,
): void {
  setRefused(null);
  setBusy(true);
  void attempt.catch((error: unknown) => setRefused(signInFailure(error))).finally(() => setBusy(false));
}

/** TEMPORARY, development only: see `dev-role-override.ts`. */
function DevRoleSelect() {
  const [role, setRole] = useState<Role | ''>(() => devRoleOverride() ?? '');
  return (
    <label className="mt-16 flex items-center gap-8 rounded-10 bg-surface-card px-16 py-8 type-body text-ink-primary shadow-card">
      <span>Dev: sign in as</span>
      <select
        value={role}
        onChange={(event) => {
          const next = event.target.value === 'employee' || event.target.value === 'admin' ? event.target.value : '';
          setRole(next);
          setDevRoleOverride(next || null);
        }}
        className="rounded-8 border border-line-default px-8 py-4"
      >
        <option value="">API role</option>
        <option value="employee">Employee</option>
        <option value="admin">Admin</option>
      </select>
    </label>
  );
}

function SignInNotices({
  refusalText,
  expired,
  busy,
}: {
  refusalText: string | null;
  expired: boolean;
  busy: boolean;
}) {
  return (
    <div className="mt-20 flex flex-col items-center gap-8 empty:mt-0">
      {refusalText ? (
        <p role="alert" className="type-body text-center text-red-error">
          {refusalText}
        </p>
      ) : null}
      {!refusalText && expired ? (
        <p role="status" className="type-body text-center text-ink-secondary">
          Your session ended. Sign in again to continue.
        </p>
      ) : null}
      {busy ? (
        <p role="status" className="type-body text-center text-ink-secondary">
          Signing in…
        </p>
      ) : null}
    </div>
  );
}

/** The sign-in screen, as drawn: the 421×500 card on the full-bleed
 *  photograph, carrying the product lockup, the welcome line, the Google
 *  control and the copyright line. No top bar (Story 5 AC5) — this route sits
 *  outside the layout.
 *
 *  The SPA implements NO authentication (FR-003a, spec 001's 2026-09-12
 *  amendment). The drawn control calls `signIn()` on the session boundary and
 *  that is the whole of the shell's involvement. Whether the backend
 *  authenticates against Google or against seeded users is a backend decision,
 *  settled when the contract publishes.
 *
 *  A refusal leaves the visitor here with a plain message, no session, and the
 *  control back at rest (FR-003b). The message is the published problem text
 *  when the body has a detail or a title, and the shell's existing sentence
 *  otherwise.
 *
 *  The card is composed in flow rather than by absolute coordinate, the same
 *  redesign spec 002 applied to the top bar and page header — but unlike the
 *  bar, this card is a FIXED 421×500 box that never reflows, so its drawn
 *  offsets are reproduced exactly instead of approximated. The four spacing
 *  values below are measured from the file: 59 to the lockup, 94 to the
 *  welcome line, 13 to the control, 112 to the copyright, 55 to the bottom
 *  edge. They sum with the elements to exactly 500. */
export function LoginScreen() {
  const { status, session, signIn, notice, source } = useSession();
  const location = useLocation();
  const [refused, setRefused] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(true);
  const googleButton = status === 'signed-out' && hasGoogleButton(source);
  const checking = status === 'unknown';
  // Not ready: the session is still resolving (FR-018: a signed-in visitor
  // must not be offered sign-in), Google's button is still loading, or a
  // sign-in is under way. The card is drawn as it will be, with the control
  // disabled, rather than a skeleton in its place.
  const disabled = checking || busy || (googleButton && googleLoading);

  const onGoogleUnavailable = useCallback(() => {
    setBusy(false);
    setRefused(SIGN_IN_REFUSAL);
  }, []);

  useEffect(() => {
    if (!googleButton) return;
    return onGoogleCredential(
      (credential) => {
        startSignIn(signIn(credential), setRefused, setBusy);
      },
      (error) => {
        setBusy(false);
        setRefused(error.sessionNotice);
      },
    );
  }, [googleButton, signIn]);

  // One redirect authority, covering both "already signed in" and "just signed
  // in". FR-013: a visitor who asked for a specific destination before signing
  // in arrives THERE, provided their role permits it; otherwise at the screen
  // their work starts from.
  if (status === 'signed-in' && session) {
    return <Navigate to={pathAfterSignIn(session.role, location.state)} replace />;
  }

  const onSignIn = () => {
    startSignIn(submitSignIn(source, signIn), setRefused, setBusy);
  };

  const publishedRefusal = notice !== null && typeof notice === 'object' ? notice.message : null;
  const refusalText = refused ?? publishedRefusal;

  return (
    <div
      className="relative flex min-h-screen w-full flex-col items-center justify-center bg-surface-page px-layout-gutter py-32"
      style={{ backgroundImage: `url(${loginBackground})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      <div className="flex w-[421px] max-w-full flex-col items-center rounded-24 bg-surface-card px-32 pt-[59px] pb-[55px] shadow-card">
        <CoDevSupplyRequestsLogo markHeight={36} className="items-center" />

        <div className="mt-[94px] flex flex-col items-center gap-[13px]">
          <span className="type-body text-ink-primary">Great to have you with us!</span>

          {/* Figma 15:381, taken from the instance's own `derivedSymbolData`
              rather than from the vendored export, which got all of this
              wrong. The pill is 242x64; the plates resolve to 50x64 at x=0
              (mark at 18,16) and 173x57 at x=50 (text at 8,18), so the content
              is packed left and the 32px trailing pad is what is left of the
              fixed width.

              NO BORDER. The root does carry a 1px INSIDE stroke, but
              `styleIdForStrokeFill` binds it to the `Surface` paint style —
              white — so it paints white on a white fill and is invisible.
              `strokePaints` still caches the black it held before that binding,
              and the cache is not the authority: 70 of the file's 823 local
              style bindings disagree with the style they point at, all the same
              way, a style retuned and the node left holding the old value (the
              clearest family being nodes bound to `Codev Red` that still cache
              the retired red the port already resolves as `--osrs-red-500`).
              The 2026-09-12 export read that cache, emitted
              `inset 0 0 0 1px var(--border-strong)`, and two passes of this
              screen inherited a ring the design does not draw.

              The icon plate's fill is switched off in the file too, so the
              control is a plain white box: mark, label, nothing else. */}
          <div className="group relative" style={{ width: 242, height: 64 }} aria-busy={checking || undefined}>
            {/* The drawn pill is what the visitor sees. It paints over
                Google's frame and does not take the click, so the press
                reaches the frame underneath. */}
            <div
              inert={googleButton || undefined}
              className={googleButton ? 'pointer-events-none absolute inset-0 z-20' : undefined}
              style={{ width: 242, height: 64 }}
            >
              <SignInButton
                disabled={disabled}
                darkmode={false}
                iconPlate={false}
                iconPadding="16px 0 16px 18px"
                labelPadding="18px 8px"
                onClick={onSignIn}
                style={{ width: 242, height: 64 }}
                className="rounded-32"
              />
            </div>
            {googleButton ? (
              <GoogleSignInOverlay source={source} onUnavailable={onGoogleUnavailable} onLoadingChange={setGoogleLoading} />
            ) : null}
          </div>
        </div>

        {/* Both notices are live regions so they are announced, not only seen.
            They sit between the control and the copyright line, which is the
            only place the card has room the drawing does not already spend. */}
        <SignInNotices refusalText={refusalText} expired={notice === 'expired'} busy={busy} />
        {checking ? (
          <p role="status" className="sr-only">
            Checking your session
          </p>
        ) : null}

        <span className="mt-[112px] type-body text-ink-primary">© 2026 CoDev. All rights reserved.</span>
      </div>
      {DEV_ROLE_OVERRIDE_ENABLED ? <DevRoleSelect /> : null}

    </div>
  );
}
