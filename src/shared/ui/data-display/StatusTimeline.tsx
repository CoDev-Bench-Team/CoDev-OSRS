import type { StatusTone } from '../status';

/** The design file's `Status Timeline` / `Status Timeline Item`.
 *
 *  A vertical list of nodes joined by a hairline. A reached node is filled in
 *  the colour of the status pill it stands for — amber Submitted, green
 *  Approved, pink For Delivery, blue Ready for Pickup, purple Complete — and
 *  carries its date; a node not yet reached is grey and reads "Pending". The
 *  two stopped endings take their status colours — slate for Cancelled, as
 *  drawn in `04.2 - Cancelled`, and red for Rejected, which the file does not
 *  draw (docs/design-system/additions.md). The latest reached node, where the
 *  request stands now, wears a halo in its pill's tint. */
export type TimelineNodeState = 'reached' | 'pending' | 'cancelled' | 'rejected';

export type TimelineNode = {
  label: string;
  state: TimelineNodeState;
  /** The pill tone a reached node is painted in. Defaults to `pending`, the
   *  Submitted amber. Ignored for pending and stopped nodes. */
  tone?: StatusTone;
  /** Shown under the label when reached; pending nodes read "Pending". */
  when?: string;
};

/** Each dot as the frames paint it (drift-2026-09-26 §4): a 12px fill, and on
 *  the current step a 2px outside ring at 10% of that same colour. These are
 *  the frames' own values, and three differ from the pill ink of the same
 *  status: Submitted is amber-600, Approved green-600 and Rejected red-700.
 *  No frame draws a reached Ready for Pickup or Complete dot, so those two
 *  follow their pill ink, and Complete's halo uses the lightest purple, since
 *  the token layer has no purple tint. Written out in full so Tailwind sees
 *  every class. */
const TONE_DOT: Record<StatusTone, string> = {
  pending: 'bg-osrs-amber-600 ring-osrs-amber-tint',
  ready: 'bg-osrs-green-600 ring-osrs-green-tint',
  rejected: 'bg-osrs-red-700 ring-osrs-red-tint',
  completed: 'bg-status-completed-fg ring-osrs-purple-50',
  cancelled: 'bg-osrs-ink-700 ring-osrs-ink-tint',
  delivery: 'bg-osrs-pink-500 ring-osrs-pink-tint',
  pickup: 'bg-status-pickup-fg ring-osrs-blue-tint',
};

function dotClass(node: TimelineNode): string {
  switch (node.state) {
    case 'pending':
      return 'bg-line-default';
    case 'cancelled':
      return TONE_DOT.cancelled;
    case 'rejected':
      return TONE_DOT.rejected;
    case 'reached':
      return TONE_DOT[node.tone ?? 'pending'];
  }
}

export function StatusTimeline({ nodes }: { nodes: readonly TimelineNode[] }) {
  const current = nodes.findLastIndex((node) => node.state !== 'pending');
  return (
    <ol className="flex flex-col">
      {nodes.map((node, i) => {
        const reached = node.state !== 'pending';
        return (
          <li key={node.label} className="relative flex gap-12 pb-14 last:pb-0" data-state={node.state}>
            {i < nodes.length - 1 ? (
              <span className="absolute top-14 bottom-0 left-[5px] w-1 bg-line-default" aria-hidden="true" />
            ) : null}
            <span className={`relative mt-2 h-12 w-12 shrink-0 rounded-circle ${dotClass(node)} ${i === current ? 'ring-2' : ''}`} aria-hidden="true" />
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
