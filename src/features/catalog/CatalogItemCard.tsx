import { useState } from 'react';
import { SupplyCard } from '../../shared/ui';
import { useSession } from '../auth/session-context';
import { useRequestListDraft } from '../requests/create/request-draft';
import { requestAction } from './request-action';
import { clampQuantity, stockStatus } from './stock';
import type { CatalogItem, CatalogOffice } from './types';
import { ViewSpecsPanel } from './ViewSpecsPanel';

/** One catalog tile, and the View Specs panel it opens.
 *
 *  One card is one asset (spec 005 D5): the card no longer offers a model
 *  choice. The quantity can never exceed what is available at the selected
 *  office (FR-010). Adding changes no stock — the reservation happens on
 *  submit, which is Parent C's and the API's job. */
export function CatalogItemCard({
  item,
  office,
  homeOffice,
}: {
  item: CatalogItem;
  office: CatalogOffice;
  homeOffice: CatalogOffice | undefined;
}) {
  const { session } = useSession();
  const draft = useRequestListDraft();
  const [quantity, setQuantity] = useState(1);
  const [specsOpen, setSpecsOpen] = useState(false);

  const action = requestAction(item, office, session?.role, homeOffice);
  const add = action?.enabled ? () => draft.add(item, clampQuantity(quantity, item.available)) : undefined;

  return (
    <>
      <SupplyCard
        category={item.category}
        name={item.name}
        model={null}
        image={item.image ?? null}
        inventory={stockStatus(item)}
        quantity={quantity}
        maxQuantity={Math.max(1, item.available)}
        onQuantityChange={(n) => setQuantity(clampQuantity(n, item.available))}
        onViewSpecs={() => setSpecsOpen(true)}
        /* An Admin reads the same card; they are simply not offered the
           action (Story 3 AC2). */
        actionLabel={action ? action.label : null}
        actionDisabled={!action?.enabled}
        onAction={add}
      />
      {specsOpen ? (
        <ViewSpecsPanel
          item={item}
          office={office}
          action={action}
          onAdd={add}
          onClose={() => setSpecsOpen(false)}
        />
      ) : null}
    </>
  );
}
