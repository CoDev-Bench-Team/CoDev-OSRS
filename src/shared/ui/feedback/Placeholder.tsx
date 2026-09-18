import type { ReactNode } from 'react';
import { Notice } from './Notice';

/** FR-020: a destination whose own feature has not shipped.
 *
 *  Three things it must not be mistaken for — a not-found screen, an error, or
 *  an empty result — so it says plainly which screen this is and that the
 *  screen itself is still to come. The info tone separates it at a glance from
 *  the red of a refusal and the neutral grey of not-found. */
export function Placeholder({
  name,
  purpose,
  action,
}: {
  name: string;
  purpose: string;
  action?: ReactNode;
}) {
  return (
    <Notice
      eyebrow="Not built yet"
      tone="info"
      title={name}
      body={purpose}
      actions={action}
    >
      <p className="type-body text-ink-body">
        This address is reserved and working — the shell, its navigation and its guards are in place. The screen&rsquo;s
        own feature has not shipped yet.
      </p>
    </Notice>
  );
}
