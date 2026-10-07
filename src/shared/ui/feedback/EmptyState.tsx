import type { ReactNode } from 'react';
import { MdiClipboardTextOutline } from '../icons/MdiClipboardTextOutline';

/** A table body with nothing to show: an icon over one line, centred both
 *  ways. Not drawn in the design file; recorded in
 *  docs/design-system/additions.md.
 *
 *  `className` sets the height. The default is five request rows (5 × 78px),
 *  the skeleton that stands there while the table loads, so the card keeps
 *  its height when the skeleton gives way to this. */
export function EmptyState({
  label,
  icon = <MdiClipboardTextOutline size={48} />,
  className = 'min-h-[390px]',
}: {
  label: string;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex w-full flex-col items-center justify-center gap-12 px-20 py-32 text-center ${className}`}>
      <span className="flex text-ink-muted" aria-hidden="true">
        {icon}
      </span>
      <p className="type-body text-ink-secondary">{label}</p>
    </div>
  );
}
