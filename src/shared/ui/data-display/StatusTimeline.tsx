/** The design file's `Status Timeline` / `Status Timeline Item`.
 *
 *  A vertical list of nodes joined by a hairline. A reached node is filled and
 *  carries its date; a node not yet reached is grey and reads "Pending". The
 *  two stopped endings take their status colours — slate for Cancelled, as
 *  drawn in `04.2 - Cancelled`, and red for Rejected, which the file does not
 *  draw (docs/design-system/additions.md). */
export type TimelineNodeState = 'reached' | 'pending' | 'cancelled' | 'rejected';

export type TimelineNode = {
  label: string;
  state: TimelineNodeState;
  /** Shown under the label when reached; pending nodes read "Pending". */
  when?: string;
};

const DOT: Record<TimelineNodeState, string> = {
  reached: 'bg-status-pending-fg',
  pending: 'bg-line-default',
  cancelled: 'bg-status-cancelled-fg',
  rejected: 'bg-status-rejected-fg',
};

export function StatusTimeline({ nodes }: { nodes: readonly TimelineNode[] }) {
  return (
    <ol className="flex flex-col">
      {nodes.map((node, i) => {
        const reached = node.state !== 'pending';
        return (
          <li key={node.label} className="relative flex gap-12 pb-14 last:pb-0" data-state={node.state}>
            {i < nodes.length - 1 ? (
              <span className="absolute top-14 bottom-0 left-[5px] w-1 bg-line-default" aria-hidden="true" />
            ) : null}
            <span className={`relative mt-2 h-12 w-12 shrink-0 rounded-circle ${DOT[node.state]}`} aria-hidden="true" />
            <span className="flex flex-col gap-4">
              <span className={`font-sans text-12-5 font-bold leading-tight ${reached ? 'text-ink-primary' : 'text-ink-muted'}`}>{node.label}</span>
              <span className="font-sans text-12 font-medium leading-tight text-ink-secondary">{reached ? (node.when ?? '—') : 'Pending'}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
