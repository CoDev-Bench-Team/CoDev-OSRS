import type { ReactNode } from 'react';
import { Notice } from './Notice';

/** FR-012: an address that matches no destination.
 *
 *  Distinguishable from a refusal on purpose — a mistyped address has to stay
 *  diagnosable. `/requests/:id` does not land here: it is a deep link that
 *  forwards to the Queue or My Requests, which open the request or show a
 *  notice that never echoes the id, so a foreign and a missing request read
 *  the same (FR-012a; spec 003, Session 2026-09-26). */
export function NotFoundScreen({ path, action }: { path?: string; action?: ReactNode }) {
  return (
    <Notice
      eyebrow="Not found"
      title="There is no screen at this address"
      body="The address may be mistyped, or the link may be out of date."
      actions={action}
    >
      {path ? (
        <code className="max-w-full truncate rounded-4 bg-surface-table-header px-8 py-6 my-0 font-sans text-12 leading-tight text-ink-secondary">
          {path}
        </code>
      ) : null}
    </Notice>
  );
}
