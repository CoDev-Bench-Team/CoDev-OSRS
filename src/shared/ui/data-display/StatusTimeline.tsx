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
  pending: 'bg-osrs-border-strong', // the file's `Border-Strong`, as `Frame 50/53/54` fill it
  cancelled: 'bg-status-cancelled-fg',
  rejected: 'bg-status-rejected-fg',
};

/** The `Active` variant's halo: a 2px outside ring in the dot's own colour at
 *  10% (`Frame 51`). Whole class strings, one per state, so Tailwind can see
 *  them. A pending node is never the one the request is at. */
const HALO: Record<TimelineNodeState, string> = {
  reached: 'shadow-[0_0_0_2px_color-mix(in_srgb,var(--color-status-pending-fg)_10%,transparent)]',
  pending: '',
  cancelled: 'shadow-[0_0_0_2px_color-mix(in_srgb,var(--color-status-cancelled-fg)_10%,transparent)]',
  rejected: 'shadow-[0_0_0_2px_color-mix(in_srgb,var(--color-status-rejected-fg)_10%,transparent)]',
};

export function StatusTimeline({ nodes }: { nodes: readonly TimelineNode[] }) {
  // The step the request is AT is the last one it has got to — reached, or a
  // stopped ending — so a Cancelled or Rejected request haloes its ending,
  // not the Submitted step before it.
  const current = nodes.findLastIndex((n) => n.state !== 'pending');
  return (
    <ol className="flex flex-col">
      {nodes.map((node, i) => {
        const reached = node.state !== 'pending';
        return (
          <li key={node.label} className="relative flex gap-12 pb-14 last:pb-0" data-state={node.state}>
            {i < nodes.length - 1 ? (
              /* The drawn `Line` runs from this dot's bottom to the next dot's
                 top — 5px into the next item, where that dot sits — in the
                 `Border` stroke colour. Stopping at this item's edge left a 5px
                 break before every dot. */
              <span className="absolute top-[17px] bottom-[-5px] left-[5px] w-1 bg-osrs-border-warm" aria-hidden="true" />
            ) : null}
            {/* 5px down, as `Frame 56` places each dot against its item. */}
            <span
              className={`relative mt-5 h-12 w-12 shrink-0 rounded-circle ${DOT[node.state]} ${i === current ? HALO[node.state] : ''}`}
              aria-hidden="true"
            />
            <span className="flex flex-col gap-4">
              {/* `Status Timeline Item`: the label is `Body 3` with a character
                  override to Inter Bold — Bold 12.5 / 1.45 — black once reached
                  and `Ink-400` while pending; the date or "Pending" is `Label 2`
                  (Inter Medium 12 / 1.3) in `Ink-400`. */}
              <span className={`font-sans text-12-5 font-bold leading-[1.45] ${reached ? 'text-ink-primary' : 'text-ink-muted'}`}>{node.label}</span>
              <span className="font-sans text-12 font-medium leading-[1.3] text-ink-muted">{reached ? (node.when ?? '—') : 'Pending'}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
