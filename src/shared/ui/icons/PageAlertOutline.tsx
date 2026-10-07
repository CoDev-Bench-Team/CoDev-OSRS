import type { SVGProps } from 'react';

/** A page with an exclamation mark: a screen that failed to render. Ours, not
 *  from the design file (recorded in docs/design-system/additions.md). The
 *  sibling of `PageQuestionOutline`, on the same 24px grid and 2px weight, and
 *  paints with `currentColor`. */
export function PageAlertOutline({ size = 24, className, ...rest }: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="presentation"
      aria-hidden="true"
      className={className}
      {...rest}
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M12 11v4" />
      <path d="M12 18.5h.01" />
    </svg>
  );
}
