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

/** Google's sign-in button. A third-party brand asset — never restyle it.
 *
 *  `iconPadding` and `labelPadding` exist because the source component has
 *  them and the design file uses them: the login screen's instance overrides
 *  both to `0 6px` so the control fits the 242x64 pill drawn on the card. The
 *  port had dropped the two props, which is why the login pill could not be
 *  reproduced at its drawn width. Both default to the source's own defaults,
 *  so every other instance renders exactly as before. */
export function SignInButton({
  darkmode = true,
  mobile = false,
  cta = 'Sign in with Google',
  iconPadding,
  labelPadding,
  className,
  onClick,
}: {
  darkmode?: boolean;
  mobile?: boolean;
  cta?: string;
  iconPadding?: string;
  labelPadding?: string;
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
        className={`flex items-center justify-center self-stretch bg-white ${iconPadding ? '' : 'p-16'}`}
        style={{
          ...(darkmode ? { boxShadow: 'inset 0 0 0 2px var(--color-osrs-google-blue)' } : undefined),
          ...(iconPadding ? { padding: iconPadding } : undefined),
        }}
      >
        <GoogleIcon size="32x32" />
      </span>
      <span
        className={`flex items-center ${labelPadding ? '' : 'px-16 py-18'} ${darkmode ? 'bg-osrs-google-blue' : 'bg-white'}`}
        style={labelPadding ? { padding: labelPadding } : undefined}
      >
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
