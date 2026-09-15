import type { ReactNode } from 'react';
import { Notice } from './Notice';

/** FR-012: an address that matches no destination.
 *
 *  Distinguishable from a refusal on purpose — a mistyped address has to stay
 *  diagnosable. The one exception is a RECORD address: `/requests/:id` never
 *  reveals whether the record exists, so a request the user may not see and a
 *  request that does not exist both render `RecordUnavailableScreen` below
 *  instead of this (FR-012a). */
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

/** FR-012a: the single response shared by "this request does not exist" and
 *  "this request is not yours".
 *
 *  Both cases MUST render identically — same words, same shape — or request
 *  identifiers could be enumerated by reading the difference. The id is
 *  deliberately not echoed back. */
export function RecordUnavailableScreen({ action }: { action?: ReactNode }) {
  return (
    <Notice
      eyebrow="Unavailable"
      title="That request is not available"
      body="It may not exist, or it may not be yours to view."
      actions={action}
    />
  );
}
