import type { ReactNode } from 'react';
import { PageQuestionOutline } from '../icons/PageQuestionOutline';

/** FR-012: an address that matches no destination.
 *
 *  Drawn as the tables' empty state is — an icon over one line — but centred
 *  in the whole page, both ways, with the route home beneath it. It is still
 *  distinguishable from a refusal (`ForbiddenScreen`), so a mistyped address
 *  stays diagnosable. `/requests/:id` does not land here: it is a deep link
 *  that forwards to the Queue or My Requests, which open the request or show a
 *  notice that never echoes the id, so a foreign and a missing request read
 *  the same (FR-012a; spec 003, Session 2026-09-26). */
export function NotFoundScreen({ action }: { action?: ReactNode }) {
  return (
    <div className="flex min-h-[60vh] flex-1 flex-col items-center justify-center gap-12 px-20 py-32 text-center">
      <span className="flex text-ink-muted" aria-hidden="true">
        <PageQuestionOutline size={48} />
      </span>
      <h1 className="m-0 type-body text-ink-secondary">There is no screen at this address</h1>
      {action ? <div className="mt-12">{action}</div> : null}
    </div>
  );
}
