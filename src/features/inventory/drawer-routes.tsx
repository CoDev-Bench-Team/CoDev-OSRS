import { Navigate, useNavigate, useParams } from 'react-router';
import { ItemDrawer } from './ItemDrawer';
import { INVENTORY_ITEMS } from './inventory-data';

/** Both drawers are addresses, not component state (spec 003 FR-008): they can
 *  be linked, reloaded and reached directly by a test, and browser back closes
 *  them. They render through the inventory screen's own `<Outlet/>`, which is
 *  why the screen stays visible behind the scrim exactly as the frames draw it.
 */

export function AddCatalogItemRoute() {
  const navigate = useNavigate();
  return <ItemDrawer title="Add Catalog Item" onClose={() => void navigate('/inventory', { replace: true })} />;
}

export function UpdateStockRoute() {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const item = INVENTORY_ITEMS.find((candidate) => candidate.id === itemId);

  // An item that is not there is not an error worth a screen: the drawer opens
  // over inventory, so the sensible response is inventory without a drawer.
  if (!item) return <Navigate to="/inventory" replace />;

  return <ItemDrawer title="Update stocks" item={item} onClose={() => void navigate('/inventory', { replace: true })} />;
}
