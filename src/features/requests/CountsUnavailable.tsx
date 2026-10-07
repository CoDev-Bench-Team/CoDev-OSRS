import { Button } from '../../shared/ui';

/** Said under a table's chips when its counts read failed and no counts for
 *  the search on screen are shown (spec 017 FR-055, amended 2026-10-07). The
 *  rows are unaffected; **Try again** reads the counts alone. */
export function CountsUnavailable({ onRetry }: { onRetry: () => void }) {
  return (
    <div role="status" className="mt-12 flex flex-wrap items-center gap-12">
      <p className="m-0 type-meta text-ink-muted">The counts couldn&rsquo;t be loaded.</p>
      <Button variant="ghost" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}
