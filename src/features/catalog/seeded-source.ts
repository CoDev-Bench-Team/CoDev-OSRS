import itemLaptop from '../../assets/items/item-laptop.jpg';
import itemMonitor from '../../assets/items/item-monitor.jpg';
import type { CatalogSource } from './catalog-source';
import type { CatalogItem } from './types';

/** Demo data behind the boundary, on the same terms spec 003 established for
 *  seeded sessions and constitution IX permits: non-production placeholders,
 *  never credentials.
 *
 *  The set is chosen to make every state in spec 005 reachable without a
 *  backend — all three stock statuses including an item sitting exactly on its
 *  threshold, an item with no image, and a name long enough to exercise the
 *  card's clamping. `type` values are the contract's, not the mock's invented
 *  categories. */
const ITEMS: CatalogItem[] = [
  { id: 'laptop-latitude', name: 'Business Laptop', model: 'Dell Latitude', type: 'Laptop', image: itemLaptop, onHand: 12, lowQtyAlert: 4 },
  { id: 'monitor-ultrafine', name: 'Monitor', model: 'LG UltraFine 27"', type: 'Monitor', image: itemMonitor, onHand: 4, lowQtyAlert: 4 },
  { id: 'headset-zone', name: 'Wireless Headset', model: 'Logitech Zone Vibe', type: 'Headset', onHand: 0, lowQtyAlert: 2 },
  { id: 'keyboard-mx', name: 'Wireless Keyboard', model: 'Logitech MX Keys', type: 'Accessory', image: itemLaptop, onHand: 27, lowQtyAlert: 6 },
  {
    id: 'dock-thunderbolt',
    name: 'Thunderbolt Docking Station with Dual Display Output',
    model: 'CalDigit TS4',
    type: 'Accessory',
    onHand: 2,
    lowQtyAlert: 5,
  },
];

/** Resolves on the next tick so the page's loading state is real rather than
 *  skipped, which is what makes FR-011 demonstrable. */
export function seededCatalogSource(): CatalogSource {
  return {
    items: async () => ITEMS.map((i) => ({ ...i })),
  };
}
