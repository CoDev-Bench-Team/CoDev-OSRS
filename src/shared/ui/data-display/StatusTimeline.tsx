import type { StatusTone } from '../status';

/** The design file's `Status Timeline` / `Status Timeline Item`.
 *
 *  A vertical list of nodes joined by a hairline. A reached node is filled in
 *  the colour of the status pill it stands for (amber Submitted, green
 *  Approved, pink For Delivery, blue Ready for Pickup, and so on) and carries
 *  its date. That is the project owner's decision, 2026-09-26: the dots follow
 *  the pills, not the few shades the frames paint differently
 *  (drift-2026-09-26). A node not yet reached is grey and reads "Pending".
 *  The two stopped endings take their status colours — slate for Cancelled, as
 *  drawn in `04.2 - Cancelled`, and red for Rejected, which the file does not
 *  draw (docs/design-system/additions.md). */
export type TimelineNodeState = 'reached' | 'pending' | 'cancelled' | 'rejected';

export type TimelineNode = {
  label: string;
  state: TimelineNodeState;
  /** The pill tone a reached node is painted in. Defaults to `pending`, the
   *  Submitted amber. Ignored for pending and stopped nodes, which take their
   *  own colours. */
  tone?: StatusTone;
  /** Shown under the label when reached; pending nodes read "Pending". */
  when?: string;
};

/** A reached dot and its halo, by pill tone. The halo is the `Active`
 *  variant's: a 2px outside ring in the dot's own colour at 10% (`Frame 51`).
 *  Whole class strings, one per tone, so Tailwind can see them. */
const TONE: Record<StatusTone, { dot: string; halo: string }> = {
  pending: { dot: 'bg-status-pending-fg', halo: 'shadow-[0_0_0_2px_color-mix(in_srgb,var(--color-status-pending-fg)_10%,transparent)]' },
  ready: { dot: 'bg-status-ready-fg', halo: 'shadow-[0_0_0_2px_color-mix(in_srgb,var(--color-status-ready-fg)_10%,transparent)]' },
  rejected: { dot: 'bg-status-rejected-fg', halo: 'shadow-[0_0_0_2px_color-mix(in_srgb,var(--color-status-rejected-fg)_10%,transparent)]' },
  completed: { dot: 'bg-status-completed-fg', halo: 'shadow-[0_0_0_2px_color-mix(in_srgb,var(--color-status-completed-fg)_10%,transparent)]' },
  cancelled: { dot: 'bg-status-cancelled-fg', halo: 'shadow-[0_0_0_2px_color-mix(in_srgb,var(--color-status-cancelled-fg)_10%,transparent)]' },
  delivery: { dot: 'bg-status-delivery-fg', halo: 'shadow-[0_0_0_2px_color-mix(in_srgb,var(--color-status-delivery-fg)_10%,transparent)]' },
  pickup: { dot: 'bg-status-pickup-fg', halo: 'shadow-[0_0_0_2px_color-mix(in_srgb,var(--color-status-pickup-fg)_10%,transparent)]' },
  received: { dot: 'bg-status-received-fg', halo: 'shadow-[0_0_0_2px_color-mix(in_srgb,var(--color-status-received-fg)_10%,transparent)]' },
};

/** The not-reached dot: the file's `Border-Strong`, as `Frame 50/53/54` fill it. */
const PENDING_DOT = 'bg-osrs-border-strong';

function tone(node: TimelineNode) {
  switch (node.state) {
    case 'pending':
      return null;
    case 'cancelled':
      return TONE.cancelled;
    case 'rejected':
      return TONE.rejected;
    case 'reached':
      return TONE[node.tone ?? 'pending'];
  }
}

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
              className={`relative mt-5 h-12 w-12 shrink-0 rounded-circle ${tone(node)?.dot ?? PENDING_DOT} ${i === current ? (tone(node)?.halo ?? '') : ''}`}
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
