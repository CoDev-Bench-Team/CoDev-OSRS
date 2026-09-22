import { useState } from 'react';
import { SupplyCard } from '../../shared/ui';
import { useSession } from '../auth/session-context';
import { useRequestListDraft } from './request-draft';
import { clampQuantity, isRequestable, stockStatus } from './stock';
import type { CatalogItem } from './types';

/** One catalog tile.
 *
 *  This is where the two role rules live: only an Employee is offered the
 *  action that starts a request (FR-008, constitution II), and the quantity can
 *  never exceed what is on the shelf (FR-010). Adding changes no stock — the
 *  deduction happens on submit, which is Parent C's and the API's job. */
export function CatalogItemCard({ item }: { item: CatalogItem }) {
  const { session } = useSession();
  const draft = useRequestListDraft();
  const [quantity, setQuantity] = useState(1);

  const employee = session?.role === 'employee';
  const requestable = isRequestable(item);
  const status = stockStatus(item);

  return (
    <SupplyCard
      category={item.type}
      name={item.name}
      model={item.model}
      image={item.image ?? null}
      stock={status}
      onHand={item.onHand}
      quantity={quantity}
      maxQuantity={Math.max(1, item.onHand)}
      onQuantityChange={(n) => setQuantity(clampQuantity(n, item.onHand))}
      /* Approvers and Supply Admins read the same card; they are simply not
         offered the action (Story 3 AC2). */
      actionLabel={employee ? (requestable ? 'Add to Request List' : 'Out of stock') : null}
      actionDisabled={!requestable}
      onAction={
        employee && requestable ? () => draft.add(item, clampQuantity(quantity, item.onHand)) : undefined
      }
    />
  );
}
