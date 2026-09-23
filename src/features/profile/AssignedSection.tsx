import { AssignedItemCard } from './AssignedItemCard';
import { useAssignedEquipment } from './useAssignedEquipment';

/** `Currently Assigned` — a conditional section (spec 006 FR-007, FR-011).
 *
 *  With no source it renders nothing, not even the heading: "the system cannot
 *  say" must not look like "nothing is assigned" (FR-008). The empty, loading
 *  and error presentations are undesigned and logged as inventions in
 *  docs/design-system/additions.md. */
export function AssignedSection({ search }: { search: string }) {
  const state = useAssignedEquipment(search);
  if (state.kind === 'unavailable') return null;

  return (
    <section className="flex min-w-0 flex-col gap-16" aria-labelledby="currently-assigned-heading">
      <h2 id="currently-assigned-heading" className="font-display text-24 font-medium leading-body text-ink-heading">
        Currently Assigned
      </h2>
      {state.kind === 'loading' ? (
        <p role="status" className="type-body text-ink-secondary">
          Loading assigned equipment
        </p>
      ) : state.kind === 'failed' ? (
        <p role="alert" className="type-body text-status-rejected-fg">
          Couldn&rsquo;t load your assigned equipment
        </p>
      ) : state.items.length === 0 ? (
        <div className="flex max-w-[603px] flex-col gap-6 rounded-10 bg-surface-card px-20 py-18 shadow-card">
          <p className="type-subhead text-ink-primary">Nothing is assigned to you</p>
          <p className="type-body text-ink-secondary">Equipment issued to you will appear here</p>
        </div>
      ) : (
        <ul className="grid max-w-[1222px] grid-cols-1 gap-x-14 gap-y-20 md:grid-cols-2">
          {state.items.map((item) => (
            <AssignedItemCard key={item.id} item={item} />
          ))}
        </ul>
      )}
    </section>
  );
}
