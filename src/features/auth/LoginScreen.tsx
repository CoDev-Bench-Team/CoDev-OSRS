import { useState } from 'react';
import { Navigate, useLocation, useNavigate, type Location } from 'react-router';
import { CoDevSupplyRequestsLogo, SignInButton } from '../../shared/ui';
import { useSession } from './SessionProvider';
import { LANDING } from './navigation';
import background from '../../assets/login/login-dotted-background.png';

/** The sign-in screen — figma `01 - Login`, second variant (28:2673).
 *
 *  The second variant sets the card on the dotted dark ground rather than the
 *  photograph the first variant uses; `src/assets/login/login-background.png`
 *  is that first variant's image and is left in place for it.
 *
 *  Drawn geometry, which this reproduces exactly at the design width: a
 *  421x500 card, 24px radius — the only 24px radius in the product — on the
 *  card shadow, centred in the 1440x1024 frame. Inside it, by frame
 *  coordinate: the lockup at y=59 with a 36px mark, "Great to have you with
 *  us!" at y=214, the Google control at y=248 in its 242x64 box, and the
 *  copyright at y=424. Every one of those is horizontally centred in the card,
 *  so the absolute coordinates become flow layout with the drawn gaps — which
 *  is also what keeps the card usable below 421px, where absolute offsets
 *  would simply clip (FR-022).
 *
 *  The SPA implements no authentication (FR-003a, spec 001 amendment of
 *  2026-09-12). The control calls the session boundary and nothing else.
 */
export function LoginScreen() {
  const { status, session, signIn } = useSession();
  const navigate = useNavigate();
  const location = useLocation() as Location<{ from?: string } | null>;
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSignIn() {
    if (busy) return;
    setBusy(true);
    setFailed(false);
    try {
      const session = await signIn();
      // FR-013: a visitor who asked for a specific destination while signed
      // out returns to it, not to the landing screen. The guard recorded it.
      const from = location.state?.from;
      navigate(from ?? LANDING[session.role], { replace: true });
    } catch {
      // FR-003b: no session, stay here, say so without inventing a reason —
      // the SPA does not know why, and guessing would invent an error
      // vocabulary the backend contract has not published.
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  // Sign-in is a signed-out destination. Someone who is already signed in and
  // opens it is sent to their own work rather than being offered a second
  // session (spec 003, Destination Set).
  if (status === 'signed-in' && session) return <Navigate to={LANDING[session.role]} replace />;

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-surface-page p-16">
      <img
        src={background}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      />

      <div className="relative flex h-[500px] w-[421px] max-w-full flex-col items-center overflow-hidden rounded-24 bg-surface-card pt-[59px] shadow-card">
        <CoDevSupplyRequestsLogo markHeight={36} />

        <p className="mt-[94px] type-body text-ink-primary">Great to have you with us!</p>

        <SignInButton
          darkmode={false}
          compact
          onClick={() => void onSignIn()}
          className="mt-[13px] rounded-32"
        />

        {failed ? (
          <p role="alert" className="mt-12 px-32 text-center type-caption text-status-rejected-fg">
            Sign-in did not succeed. Please try again.
          </p>
        ) : null}

        <p className="mt-auto mb-[55px] type-body text-ink-primary">© 2026 CoDev. All rights reserved.</p>
      </div>
    </main>
  );
}
