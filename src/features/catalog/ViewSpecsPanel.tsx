import type { ReactNode } from 'react';
import { Button, SidePanel, StatusPill } from '../../shared/ui';
import type { RequestAction } from './request-action';
import { specRows } from './specs';
import { stockStatus } from './stock';
import type { CatalogItem, CatalogOffice } from './types';

/** `02.1 - Catalog - View Specs`: the right-hand sheet `View specs >` opens.
 *
 *  Built on the shared `SidePanel` (the one My Requests uses), not a second
 *  sheet: focus, Esc, the scrim and the slide all behave the same way on both
 *  screens.
 *
 *  Rows are the item's category-dependent specs only (spec 005 FR-015), then
 *  its description and the office the availability was read for. The footer's
 *  action is the card's own — same label, same gate, same quantity — so the
 *  two can never disagree about what may be requested. */
export function ViewSpecsPanel({
  item,
  office,
  action,
  onAdd,
  onClose,
}: {
  item: CatalogItem;
  office: CatalogOffice;
  action: RequestAction;
  onAdd?: () => void;
  onClose: () => void;
}) {
  const rows = specRows(item);
  const description = item.description?.trim();

  return (
    <SidePanel
      title={`Specs for ${item.name}`}
      /* The design's `H2`: Space Grotesk Medium 22. There is no 22px step in
         the token scale, so the size is the source's own value. */
      header={<h2 className="truncate font-display text-[22px] font-medium leading-display text-ink-heading">View Specs</h2>}
      onClose={onClose}
      footer={
        action ? (
          <Button
            /* The shared Button has no disabled treatment of its own; this is
               the card's, so the panel's disabled action reads the same. */
            className="w-full disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-brand-primary"
            disabled={!action.enabled}
            onClick={() => {
              onAdd?.();
              onClose();
            }}
          >
            {action.label}
          </Button>
        ) : undefined
      }
    >
      {item.image ? (
        <img src={item.image} alt="" className="h-[158px] w-full shrink-0 rounded-8 object-cover ring-default" />
      ) : null}
      <dl className="flex flex-col gap-8">
        <Field label="Item Name">
          <span className="flex flex-wrap items-center gap-6">
            <span className="min-w-0">{item.name}</span>
            <StatusPill inventory={stockStatus(item)} />
          </span>
        </Field>
        {rows.map((row) => (
          <Field key={row.label} label={row.label}>
            {row.value}
          </Field>
        ))}
        {description ? <Field label="Description">{description}</Field> : null}
        <Field label="Office">
          {/* The design's `Site Office Label`: an outlined tag on a 10% warm
              tint (near-white), its label in `Label 1` and `Ink-400`. */}
          <span className="inline-flex rounded-8 bg-surface-card p-10 font-sans text-11-5 font-bold leading-display text-ink-muted ring-default">
            {office}
          </span>
        </Field>
      </dl>
    </SidePanel>
  );
}

/** One label / value pair: the label in `Body 1` / `Ink-400`, the value in
 *  Inter Bold 11 / `Ink-900` beneath it, as the design draws every row of this
 *  panel. */
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-6 pb-10">
      <dt className="type-body text-ink-muted">{label}</dt>
      <dd className="m-0 font-sans text-11 font-bold leading-display break-words text-ink-strong">{children}</dd>
    </div>
  );
}
