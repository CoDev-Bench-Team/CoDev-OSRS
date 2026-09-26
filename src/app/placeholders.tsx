import { Placeholder } from '../shared/ui';
import { DESTINATIONS, type DestinationId } from './destinations';

/** Every product destination ships as a named placeholder (FR-020).
 *
 *  This feature delivers the frame and the empty rooms: the address, the
 *  chrome, the navigation and the guard are real; the contents belong to the
 *  destination's own feature. A page PR later swaps one line here for the real
 *  screen. */
function screen(id: DestinationId) {
  const { title, purpose } = DESTINATIONS[id];
  return <Placeholder name={title} purpose={purpose} />;
}

export const AssetsPlaceholder = () => screen('assets');
export const InventoryPlaceholder = () => screen('inventory');
export const HistoryPlaceholder = () => screen('history');
