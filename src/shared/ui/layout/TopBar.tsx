import { useEffect, useId, useState, type MouseEvent, type ReactNode } from 'react';
import { Avatar } from './Avatar';
import { REQUEST_LIST_MARKER_PROPS } from './request-list-marker';
import { MdiChevronDown } from '../icons/MdiChevronDown';
import { MdiLightBell } from '../icons/MdiLightBell';
import { MdiLightClipboardText } from '../icons/MdiLightClipboardText';
import logoLockup from '../../../assets/brand/logo-supply-requests.png';

export type NavItem = { label: string; href?: string; current?: boolean };

/** REDESIGN, not a port (spec 002 FR-006).
 *
 *  The UI kit positions this bar by absolute coordinate — logo at (32, 22),
 *  nav at x=618, account cluster at right:64. Those numbers only hold at the
 *  1440 frame the designer drew. Converting to flow layout, and then making it
 *  work down to 360px, is new layout design; it is logged in
 *  docs/design-system/additions.md for ratification.
 *
 *  What is preserved exactly: the 87px height, the white surface, the hairline
 *  ring, the 32px gutter, brand red on the current item, and the 31px divider.
 *
 *  The bar spans the 1440 page width with a 32px gutter, so the logo sits at
 *  x=32 exactly as drawn. (It previously capped at the 1344 CONTENT width and
 *  centred, which put the logo at x=80 and quietly contradicted the preserved
 *  gutter this comment claims. The source reaches 1344 of content from an
 *  ASYMMETRIC pair of gutters — 32 left, 64 right — which a symmetric flow
 *  layout cannot reproduce; spec 003 FR-022 keeps the gutter and lets the
 *  content run 1376 wide. Logged in additions.md.)
 *
 *  Below `md` the navigation collapses into a disclosure (spec 003 FR-022, also
 *  an addition). Above it, the bar is unchanged — the fidelity gates compare
 *  this component at 1440 and must keep passing.
 *
 *  `onNavigate` exists so an application with a router can navigate without a
 *  page load while the markup stays a real `<a href>` — so a nav item can still
 *  be copied, middle-clicked or opened in a new tab. Modified clicks are left
 *  to the browser. */
function NavLink({
  item,
  onNavigate,
  className,
}: {
  item: NavItem;
  onNavigate?: (href: string, event: MouseEvent<HTMLAnchorElement>) => void;
  className?: string;
}) {
  const href = item.href ?? '#';
  return (
    <a
      href={href}
      aria-current={item.current ? 'page' : undefined}
      onClick={(event) => {
        if (!onNavigate || !item.href) return;
        if (event.defaultPrevented || event.button !== 0) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        onNavigate(item.href, event);
      }}
      className={`flex min-h-touch-target items-center font-sans text-14 leading-tight whitespace-nowrap transition-osrs ${
        item.current ? 'font-bold text-brand-primary' : 'font-medium text-ink-secondary hover:text-ink-primary'
      } ${className ?? ''}`}
    >
      {item.label}
    </a>
  );
}

export function TopBar({
  nav = [],
  user,
  requestListCount,
  onOpenRequestList,
  notifications = false,
  notificationCount,
  onNavigate,
  onOpenAccount,
  actions,
}: {
  nav?: NavItem[];
  user?: { name: string; role: string; initials: string; color?: string };
  requestListCount?: number;
  onOpenRequestList?: () => void;
  /** The notification marker the 2026-09-15 export added to both variants. */
  notifications?: boolean;
  /** A count badge on the marker. The export draws one on the Admin bar only. */
  notificationCount?: number;
  onNavigate?: (href: string, event: MouseEvent<HTMLAnchorElement>) => void;
  /** Makes the account cluster the way to the profile screen — which is how
   *  the export reaches it, now that Profile is not a navigation item. */
  onOpenAccount?: () => void;
  actions?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className="w-full bg-surface-bar ring-default">
      <div className="mx-auto flex min-h-layout-topbar-height w-full max-w-layout-page-width flex-wrap items-center gap-16 px-layout-gutter py-12">
        <img src={logoLockup} alt="codev Supply Requests" className="h-[43px] w-auto shrink-0" />

        {nav.length > 0 && (
          <>
            <nav className="hidden md:flex md:flex-1 md:flex-wrap md:items-center md:justify-center md:gap-28">
              {nav.map((n) => (
                <NavLink key={n.label} item={n} onNavigate={onNavigate} />
              ))}
            </nav>

            <button
              type="button"
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => setOpen((v) => !v)}
              className="flex min-h-touch-target cursor-pointer items-center gap-4 rounded-8 border-none bg-transparent px-8 font-sans text-14 font-medium leading-tight text-ink-secondary transition-osrs hover:text-ink-primary md:hidden"
            >
              Menu
              <span className={`flex transition-osrs ${open ? 'rotate-180' : ''}`}>
                <MdiChevronDown size={20} />
              </span>
            </button>
          </>
        )}

        <div className="ml-auto flex flex-wrap items-center gap-18">
          {typeof requestListCount === 'number' && (
            <button
              type="button"
              onClick={onOpenRequestList}
              {...REQUEST_LIST_MARKER_PROPS}
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

          {notifications && (
            <span className="relative flex min-h-touch-target items-center text-ink-primary">
              <MdiLightBell size={24} />
              {typeof notificationCount === 'number' && notificationCount > 0 && (
                <span className="absolute -top-2 left-14 flex h-22 w-22 items-center justify-center rounded-pill bg-brand-primary font-sans text-11 font-bold leading-tight text-white">
                  {notificationCount}
                </span>
              )}
              <span className="sr-only">
                {typeof notificationCount === 'number' && notificationCount > 0
                  ? `${notificationCount} notifications`
                  : 'Notifications'}
              </span>
            </span>
          )}

          {user && (
            <>
              <span className="hidden h-[31px] w-1 shrink-0 bg-osrs-gray-400 sm:block" aria-hidden="true" />
              {onOpenAccount ? (
                <button
                  type="button"
                  onClick={onOpenAccount}
                  className="flex min-h-touch-target cursor-pointer items-center gap-8 rounded-8 border-none bg-transparent p-0 text-left transition-osrs hover:opacity-80"
                >
                  <Avatar initials={user.initials} color={user.color} />
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className="truncate font-sans text-13 leading-tight text-ink-primary">{user.name}</span>
                    <span className="truncate font-sans text-11 leading-tight text-ink-secondary">{user.role}</span>
                  </span>
                </button>
              ) : (
                <span className="flex items-center gap-8">
                  <Avatar initials={user.initials} color={user.color} />
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className="truncate font-sans text-13 leading-tight text-ink-primary">{user.name}</span>
                    <span className="truncate font-sans text-11 leading-tight text-ink-secondary">{user.role}</span>
                  </span>
                </span>
              )}
            </>
          )}
          {actions}
        </div>

        {nav.length > 0 && (
          <nav
            id={panelId}
            className={`order-last w-full flex-col gap-4 border-t border-line-default pt-12 md:hidden ${
              open ? 'flex' : 'hidden'
            }`}
          >
            {nav.map((n) => (
              <NavLink
                key={n.label}
                item={n}
                className="w-full"
                onNavigate={(href, event) => {
                  setOpen(false);
                  onNavigate?.(href, event);
                }}
              />
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
