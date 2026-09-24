import type { AssignedItem } from './assigned-source';
import { formatAssignedDate } from './format';

/** One assigned item: name, asset tag, `Assigned <date>` (FR-009).
 *
 *  Renders only what it was given — no tag chip without a tag. A date that is
 *  missing or does not format is said so in words, never filled with a value,
 *  so every card keeps the same two lines (FR-009 as amended 2026-09-23). Card
 *  treatment is the system's structural container (radius 10, card surface,
 *  card shadow); the tag chip takes the info pair, as `05 - Profile` draws it. */
export function AssignedItemCard({ item }: { item: AssignedItem }) {
  const date = item.assignedOn ? formatAssignedDate(item.assignedOn) : null;
  return (
    <li className="flex min-w-0 flex-col gap-6 rounded-10 bg-surface-card px-20 py-18 shadow-card">
      <div className="flex flex-wrap items-center gap-5">
        <span className="break-words type-subhead text-ink-primary">{item.name}</span>
        {item.tag ? (
          <span className="rounded-4 bg-status-info-bg px-6 py-2 type-ui-bold text-status-info-fg">{item.tag}</span>
        ) : null}
      </div>
      <span className="type-body text-ink-secondary">
        {date ? `Assigned ${date}` : 'Assignment date not available'}
      </span>
    </li>
  );
}
