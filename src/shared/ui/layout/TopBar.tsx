import { useEffect, useId, useRef, useState, type MouseEventHandler, type ReactNode } from 'react';
import { Avatar } from './Avatar';
import { MdiLightBell } from '../icons/MdiLightBell';
import { MdiLightClipboardText } from '../icons/MdiLightClipboardText';
import logoLockup from '../../../assets/brand/logo-supply-requests.png';

/** `href` stays a real address so middle-click and "open in new tab" work;
 *  `onClick` is how a router intercepts the plain left-click and navigates
 *  client-side instead. The bar itself knows nothing about routing. */
export type NavItem = {
  label: string;
  href?: string;
  current?: boolean;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
};

/** The persistent chrome — a port of the `Top Navigation` component
 *  (figma 88:22807), re-checked against the live file on 2026-09-15.
 *
 *  Drawn geometry, reproduced exactly at the design width: an 87px bar on white
 *  with a hairline bottom border, and one row inset 32px from the left and 75
 *  from the right, holding the 93x43 lockup, the navigation and the account
 *  cluster with `justify-between`. Navigation is 14px on a 1.5 line box, 28px
 *  apart, the current item bold in `--color-brand-primary-alt` and the rest
 *  regular in `--color-ink-muted`. The account cluster runs marker, 1x31px
 *  divider, 34px avatar, then the 13px name over the 11px role.
 *
 *  Two things the frame does not draw:
 *
 *   - **Sign-out.** Spec 003 FR-016 requires one and the source has none, so it
 *     lives behind the account cluster: the bar keeps its drawn silhouette and
 *     the control is one click (or one Enter) away.
 *   - **Below the design width.** The source has only the 1440 frame. The row
 *     wraps, navigation moves to its own line, and the gutters go symmetric.
 *
 *  Both are logged in docs/design-system/additions.md.
 */
export function TopBar({
  nav = [],
  user,
  requestListCount,
  onOpenRequestList,
  notificationCount,
  onSignOut,
  actions,
}: {
  nav?: NavItem[];
  user?: { name: string; role: string; initials: string; color?: string };
  /** Employee-only marker (spec 003 FR-015). */
  requestListCount?: number;
  onOpenRequestList?: () => void;
  /** The admin bar's bell. Presentational: notifications are sent by the API
   *  and this repo has no notification feature to open (FR-024). */
  notificationCount?: number;
  onSignOut?: () => void;
  actions?: ReactNode;
}) {
  // The drawn bar is 87px *including* its hairline, so the height sits on the
  // header and the border is inside it. Putting the minimum on the row instead
  // made every page one pixel taller than the frame.
  return (
    <header className="flex min-h-layout-topbar-height w-full items-center border-b border-line-default bg-surface-bar">
      <div className="mx-auto flex w-full max-w-layout-page-width flex-wrap items-center justify-between gap-16 px-layout-gutter py-12 min-[1440px]:pr-[75px]">
        <img src={logoLockup} alt="codev Supply Requests" className="h-[43px] w-[93px] shrink-0 object-cover" />

        {nav.length > 0 && (
          <nav className="order-3 flex w-full flex-wrap items-center gap-28 md:order-none md:w-auto">
            {nav.map((n) => (
              <a
                key={n.label}
                href={n.href ?? '#'}
                onClick={n.onClick}
                aria-current={n.current ? 'page' : undefined}
                className={`flex min-h-touch-target items-center font-sans text-14 leading-body whitespace-nowrap transition-osrs ${
                  n.current ? 'font-bold text-brand-primary-alt' : 'font-normal text-ink-muted hover:text-ink-primary'
                }`}
              >
                {n.label}
              </a>
            ))}
          </nav>
        )}

        <div className="ml-auto flex items-center gap-18 md:ml-0">
          {typeof notificationCount === 'number' && (
            <span className="relative flex items-center text-ink-primary">
              <MdiLightBell />
              <span className="absolute top-[-4.5px] left-[11px] flex h-22 w-22 items-center justify-center rounded-pill bg-brand-primary-alt font-sans text-11 font-bold leading-tight text-white">
                {notificationCount}
              </span>
              <span className="sr-only">{notificationCount} notifications</span>
            </span>
          )}

          {typeof requestListCount === 'number' && (
            <button
              type="button"
              onClick={onOpenRequestList}
              className="flex min-h-touch-target cursor-pointer items-center gap-8 border-none bg-transparent p-0 transition-osrs hover:opacity-80"
            >
              <span className="flex items-center gap-4 text-ink-primary">
                <MdiLightClipboardText size={24} />
                <span className="font-sans text-11 leading-tight whitespace-nowrap">Request List</span>
              </span>
              <span className="flex h-22 w-22 items-center justify-center rounded-pill bg-brand-primary font-sans text-11 font-bold leading-tight text-white">
                {requestListCount}
              </span>
            </button>
          )}

          {user && (
            <>
              <span className="h-[31px] w-1 shrink-0 bg-osrs-gray-400" aria-hidden="true" />
              <AccountCluster user={user} onSignOut={onSignOut} />
            </>
          )}
          {actions}
        </div>
      </div>
    </header>
  );
}

/** Avatar, name and role — and, when the shell supplies one, the sign-out the
 *  source never drew. With no `onSignOut` it renders as the plain drawn cluster
 *  rather than a dead menu. */
function AccountCluster({
  user,
  onSignOut,
}: {
  user: { name: string; role: string; initials: string; color?: string };
  onSignOut?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const identity = (
    <>
      <Avatar initials={user.initials} color={user.color} />
      {/* The drawn text nodes are 16px and 15px tall on a 1px gap; leaving the
          line boxes to the browser spreads the two lines 4px further apart than
          the frame does. */}
      <span className="flex min-w-0 flex-col items-start gap-1">
        <span className="truncate font-sans text-13 leading-[16px] text-ink-primary">{user.name}</span>
        <span className="truncate font-sans text-11 leading-[15px] text-ink-secondary">{user.role}</span>
      </span>
    </>
  );

  if (!onSignOut) return <span className="flex items-center gap-8">{identity}</span>;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={`${id}-menu`}
        onClick={() => setOpen((o) => !o)}
        className="flex cursor-pointer items-center gap-8 border-none bg-transparent p-0 text-left transition-osrs"
      >
        {identity}
      </button>

      {open && (
        <div
          id={`${id}-menu`}
          role="menu"
          className="absolute top-full right-0 z-popover mt-8 min-w-[160px] rounded-10 bg-surface-card p-4 shadow-card ring-default"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onSignOut();
            }}
            className="w-full cursor-pointer rounded-6 border-none bg-transparent px-12 py-10 text-left type-ui text-ink-primary transition-osrs hover:text-brand-primary"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
