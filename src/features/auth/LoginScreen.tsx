import { useState } from 'react';
import { Navigate, useLocation } from 'react-router';
import { CoDevSupplyRequestsLogo, LoadingState, SignInButton } from '../../shared/ui';
import { canRoleReach, landingPath } from '../../app/destinations';
import { hasDemoAccounts, type DemoAccountSource } from './session-source';
import { useSession } from './session-context';
import loginBackground from '../../assets/login/login-background.png';

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
 *  control back at rest (FR-003b). The message does not say why: the SPA does
 *  not know why, and guessing would invent an error vocabulary the contract has
 *  not published (FR-004).
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
  const [refused, setRefused] = useState(false);
  const [busy, setBusy] = useState(false);

  // FR-018 again: a signed-in visitor must never see this card flash past
  // while the session resolves.
  if (status === 'unknown') return <LoadingState label="Checking your session" />;

  // One redirect authority, covering both "already signed in" and "just signed
  // in". FR-013: a visitor who asked for a specific destination before signing
  // in arrives THERE, provided their role permits it; otherwise at the screen
  // their work starts from.
  if (status === 'signed-in' && session) {
    const requested = (location.state as { from?: string } | null)?.from;
    const path = requested?.split('?')[0];
    const permitted = path ? canRoleReach(session.role, path) : false;
    return <Navigate to={permitted && requested ? requested : landingPath(session.role)} replace />;
  }

  const onSignIn = () => {
    setRefused(false);
    setBusy(true);
    void signIn()
      .catch(() => setRefused(true))
      .finally(() => setBusy(false));
  };

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
          <SignInButton
            darkmode={false}
            iconPlate={false}
            iconPadding="16px 0 16px 18px"
            labelPadding="18px 8px"
            onClick={onSignIn}
            style={{ width: 242, height: 64 }}
            className="rounded-32"
          />
        </div>

        {/* Both notices are live regions so they are announced, not only seen.
            They sit between the control and the copyright line, which is the
            only place the card has room the drawing does not already spend. */}
        <div className="mt-20 flex flex-col items-center gap-8 empty:mt-0">
          {refused ? (
            <p role="alert" className="type-body text-center text-red-error">
              Sign-in did not succeed. Please try again.
            </p>
          ) : null}
          {!refused && notice === 'expired' ? (
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

        <span className="mt-[112px] type-body text-ink-primary">© 2026 CoDev. All rights reserved.</span>
      </div>

      {/* The chooser is not part of the design. It is pinned to the corner so
          the card keeps the position it is drawn at — centred in the frame —
          instead of being pushed up by an affordance the file does not have. */}
      {hasDemoAccounts(source) ? <DemoAccountChooser source={source} /> : null}
    </div>
  );
}

/** The seeded source's stand-in for Google's account chooser.
 *
 *  A source that authenticates nobody has to be told whom to sign in as, and a
 *  tester has to reach both roles to exercise SC-001 and SC-003. This is
 *  NOT part of the session boundary: it renders only while the active source
 *  exposes demo accounts, so it disappears by itself the day an implementation
 *  backed by the published contract replaces the seeded one.
 *
 *  It is also not a role switcher (D5). It chooses who signs IN; changing role
 *  still means signing out and signing in again. */
function DemoAccountChooser({ source }: { source: DemoAccountSource }) {
  const [selected, setSelected] = useState(() => source.selected());

  return (
    <div className="mt-24 flex w-[421px] max-w-full flex-col gap-12 rounded-10 bg-surface-card p-20 shadow-card lg:absolute lg:top-32 lg:left-layout-gutter lg:mt-0 lg:w-[280px]">
      <div className="flex flex-col gap-4">
        <span className="type-eyebrow uppercase text-ink-secondary">Demo sign-in</span>
        <p className="type-body text-ink-body">
          The backend contract has not published yet, so sign-in resolves a seeded account. Choose who signs in.
        </p>
      </div>
      <fieldset className="flex flex-col gap-8 border-none p-0">
        <legend className="sr-only">Seeded demo account</legend>
        {/* The label is the 44px touch target, so the radio inside it opts out
            of the base-layer minimum (index.css) and keeps its drawn 16px. At
            44px it overflowed the 240px row and wrapped each label mid-phrase. */}
        {source.accounts().map((account) => (
          <label key={account.id} className="flex min-h-touch-target cursor-pointer items-center gap-8">
            <input
              type="radio"
              name="demo-account"
              value={account.id}
              checked={selected === account.id}
              onChange={() => {
                setSelected(account.id);
                source.select(account.id);
              }}
              className="h-16 min-h-0 w-16 min-w-0 shrink-0 accent-brand-primary"
            />
            <span className="type-ui-bold text-ink-primary">{account.label}</span>
            <span className="type-ui text-ink-secondary">{account.detail}</span>
          </label>
        ))}
      </fieldset>
    </div>
  );
}
