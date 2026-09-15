import type { ReactNode } from 'react';
import { Avatar } from './Avatar';
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
 *  ring, the 32px gutter, brand red on the current item, and the 31px divider. */
export function TopBar({
  nav = [],
  user,
  requestListCount,
  onOpenRequestList,
  actions,
}: {
  nav?: NavItem[];
  user?: { name: string; role: string; initials: string; color?: string };
  requestListCount?: number;
  onOpenRequestList?: () => void;
  actions?: ReactNode;
}) {
  return (
    <header className="w-full bg-surface-bar ring-default">
      <div className="mx-auto flex min-h-layout-topbar-height max-w-layout-content-width flex-wrap items-center gap-16 px-layout-gutter py-12">
        <img src={logoLockup} alt="codev Supply Requests" className="h-[43px] w-auto shrink-0" />

        {nav.length > 0 && (
          <nav className="order-3 flex w-full flex-wrap items-center gap-28 md:order-none md:w-auto md:flex-1 md:justify-center">
            {nav.map((n) => (
              <a
                key={n.label}
                href={n.href ?? '#'}
                aria-current={n.current ? 'page' : undefined}
                className={`flex min-h-touch-target items-center font-sans text-14 leading-tight whitespace-nowrap transition-osrs ${
                  n.current ? 'font-bold text-brand-primary' : 'font-medium text-ink-secondary hover:text-ink-primary'
                }`}
              >
                {n.label}
              </a>
            ))}
          </nav>
        )}

        <div className="ml-auto flex items-center gap-18">
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
              <span className="flex items-center gap-8">
                <Avatar initials={user.initials} color={user.color} />
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="truncate font-sans text-13 leading-tight text-ink-primary">{user.name}</span>
                  <span className="truncate font-sans text-11 leading-tight text-ink-secondary">{user.role}</span>
                </span>
              </span>
            </>
          )}
          {actions}
        </div>
      </div>
    </header>
  );
}
