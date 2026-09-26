import type { ReactNode } from 'react';
import { Notice } from './Notice';

/** FR-012: an address that matches no destination.
 *
 *  Distinguishable from a refusal on purpose — a mistyped address has to stay
 *  diagnosable. There are no record addresses since 2026-09-26: requests open
 *  in panels, and `/requests/:id` lands here for every role and every id, so
 *  the response never reveals whether a request exists (FR-012a; spec 003,
 *  Session 2026-09-26). */
export function NotFoundScreen({ path, action }: { path?: string; action?: ReactNode }) {
  return (
    <Notice
      eyebrow="Not found"
      title="There is no screen at this address"
      body="The address may be mistyped, or the link may be out of date."
      actions={action}
    >
      {path ? (
        <code className="max-w-full truncate rounded-4 bg-surface-table-header px-8 py-6 font-sans text-12 leading-tight text-ink-secondary">
          {path}
        </code>
      ) : null}
    </Notice>
  );
}
