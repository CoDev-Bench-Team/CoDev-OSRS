import type { ReactNode } from 'react';
import { ArrowCircleDownFill } from '../icons/ArrowCircleDownFill';
import { ArrowCounterClockwise } from '../icons/ArrowCounterClockwise';
import { CheckCircleFill } from '../icons/CheckCircleFill';
import { GoogleIcon } from '../icons/GoogleIcon';

/** Three components imported into the .fig from another library. They use that
 *  library's ink (rgb(73,76,80)) and its fonts (Noto Sans, Roboto), not OSRS
 *  red and Inter, and no OSRS screen renders the first two. They are ported for
 *  completeness (spec 002 FR-005, all 17 families) — not as a pattern to copy. */

export function ButtonTemplate({
  state = 'default',
  label,
  icon,
  className,
}: {
  state?: 'default' | 'saved';
  label?: string;
  icon?: ReactNode;
  className?: string;
}) {
  const saved = state === 'saved';
  return (
    <button
      type="button"
      disabled={saved}
      className={`inline-flex w-fit cursor-pointer items-center justify-center gap-8 overflow-hidden rounded-8 border-none px-24 py-12 transition-osrs ${saved ? 'bg-osrs-template-surface opacity-40' : 'bg-white'} ${className ?? ''}`}
      style={{ boxShadow: 'inset 0 0 0 1px var(--color-osrs-template-purple)' }}
    >
      <span className="flex w-22 shrink-0 items-center text-osrs-template-purple">
        {icon ?? (saved ? <CheckCircleFill size={22} /> : <ArrowCircleDownFill size={22} />)}
      </span>
      <span className="font-noto text-16 font-bold leading-tight whitespace-nowrap uppercase text-osrs-template-purple">
        {label ?? (saved ? 'Template saved' : 'Save as template')}
      </span>
    </button>
  );
}

export function ButtonWithIcon({
  label = 'Regenerate List of jobs',
  icon,
  className,
}: {
  label?: string;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={`inline-flex w-fit cursor-pointer items-center gap-4 border-none bg-transparent p-0 text-osrs-template-ink transition-osrs hover:text-osrs-template-muted ${className ?? ''}`}
    >
      <span className="flex w-22 shrink-0 items-center">{icon ?? <ArrowCounterClockwise size={22} />}</span>
      <span className="font-noto text-16 font-medium leading-tight whitespace-nowrap">{label}</span>
    </button>
  );
}

/** Google's sign-in button. A third-party brand asset — never restyle it. */
export function SignInButton({
  darkmode = true,
  mobile = false,
  compact = false,
  cta = 'Sign in with Google',
  className,
  onClick,
}: {
  darkmode?: boolean;
  mobile?: boolean;
  /** The padding override the login card instance carries (figma 28:2677):
   *  the icon block drops its right padding and the label sits on 8px, which
   *  is what brings the control to its drawn 242px. The vendored component
   *  exposes the same thing as free-form `iconPadding` / `labelPadding`; only
   *  this one pairing is ever used, so it is a flag rather than two strings. */
  compact?: boolean;
  cta?: string;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex w-fit cursor-pointer items-center border-none transition-osrs ${darkmode ? 'bg-osrs-google-blue' : 'bg-white'} ${mobile ? 'p-0' : 'pr-32'} ${className ?? ''}`}
    >
      <span
        className={`flex items-center justify-center self-stretch bg-white ${compact ? 'py-16 pl-18' : 'p-16'}`}
        style={darkmode ? { boxShadow: 'inset 0 0 0 2px var(--color-osrs-google-blue)' } : undefined}
      >
        <GoogleIcon size="32x32" />
      </span>
      <span className={`flex items-center py-18 ${compact ? 'px-8' : 'px-16'} ${darkmode ? 'bg-osrs-google-blue' : 'bg-white'}`}>
        <span
          className={`font-google text-18 font-medium leading-tight whitespace-nowrap ${darkmode ? 'text-white' : 'text-osrs-google-gray'}`}
          style={{ letterSpacing: '0.005em' }}
        >
          {cta}
        </span>
      </span>
    </button>
  );
}
