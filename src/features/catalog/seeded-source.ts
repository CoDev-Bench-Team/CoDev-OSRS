import itemHeadset from '../../assets/items/item-headset.jpg';
import itemHub from '../../assets/items/item-hub.jpg';
import itemKeyboard from '../../assets/items/item-keyboard.jpg';
import itemLaptop from '../../assets/items/item-laptop.jpg';
import itemMonitor from '../../assets/items/item-monitor.jpg';
import itemMouse from '../../assets/items/item-mouse.jpg';
import type { CatalogSource } from './catalog-source';
import type { CatalogItem, CatalogOffice } from './types';

/** Demo data behind the boundary, on the same terms spec 003 established for
 *  seeded sessions and constitution IX permits: non-production placeholders,
 *  never credentials.
 *
 *  The set is chosen to make every state in spec 005 reachable without a
 *  backend: all three stock statuses, including an item sitting exactly on its
 *  threshold; an item that is out at one office and in stock at another; an
 *  item with no image; a name long enough to exercise the card's clamping; and
 *  every category's spec rows. Names and photographs are the ones the
 *  `02 - Catalog` frame draws. */
type SeededAsset = Omit<CatalogItem, 'available'> & { stock: Partial<Record<CatalogOffice, number>> };

const ASSETS: SeededAsset[] = [
  {
    id: 'laptop-latitude-5440',
    name: 'Dell Latitude 5440',
    category: 'Laptop',
    model: 'Latitude 5440',
    description:
      'A premium, ultraportable laptop designed for high performance and portability. It features a lightweight aluminum chassis, a nearly borderless display, and long battery life.',
    image: itemLaptop,
    specs: {
      ram: '16GB',
      storage: '512GB SSD',
      processor: 'Intel Core Ultra 5',
      graphics: 'Integrated Intel Arc Graphics',
      operatingSystem: 'Windows 11 Pro',
    },
    lowQtyAlert: 4,
    stock: { Cebu: 12, Bacolod: 3, Makati: 8, Ortigas: 0, Davao: 6 },
  },
  {
    id: 'monitor-dell-pro-24',
    name: 'Dell Monitor',
    category: 'Monitor',
    model: 'Dell Pro 24 inch',
    image: itemMonitor,
    specs: {},
    lowQtyAlert: 4,
    stock: { Cebu: 4, Bacolod: 6, Makati: 10, Ortigas: 2, Davao: 4 },
  },
  {
    id: 'mice-logitech-m185',
    name: 'Logitech Mouse',
    category: 'Mice',
    model: 'Logitech M185',
    description: 'Compact wireless mouse with a USB receiver.',
    image: itemMouse,
    specs: {},
    lowQtyAlert: 5,
    stock: { Cebu: 30, Bacolod: 12, Makati: 20, Ortigas: 9, Davao: 15 },
  },
  {
    id: 'hub-acer-usb3',
    name: 'Acer USB 3.0 Hub',
    category: 'Type C Hub',
    model: 'Acer 7-in-1',
    image: itemHub,
    specs: {},
    lowQtyAlert: 3,
    stock: { Cebu: 2, Bacolod: 0, Makati: 5, Ortigas: 4, Davao: 1 },
  },
  {
    id: 'other-logitech-keyboard',
    name: 'Logitech Keyboard',
    category: 'Other Devices',
    model: 'Logitech K380',
    image: itemKeyboard,
    specs: {},
    lowQtyAlert: 6,
    stock: { Cebu: 27, Bacolod: 8, Makati: 14, Ortigas: 6, Davao: 10 },
  },
  {
    id: 'headset-a4tech-hu10',
    name: 'A4Tech Hu-10 Headset',
    category: 'Headset',
    model: 'A4Tech Hu-10',
    image: itemHeadset,
    specs: {},
    lowQtyAlert: 2,
    stock: { Cebu: 0, Bacolod: 4, Makati: 0, Ortigas: 3, Davao: 5 },
  },
  {
    id: 'phone-galaxy-a15',
    name: 'Samsung Galaxy A15',
    category: 'Phone',
    model: 'Galaxy A15',
    specs: { ram: '6GB', storage: '128GB' },
    lowQtyAlert: 2,
    stock: { Cebu: 7, Bacolod: 2, Makati: 4, Ortigas: 1, Davao: 3 },
  },
  {
    id: 'ups-apc-back-ups',
    name: 'APC Back-UPS 650VA Uninterruptible Power Supply with Surge Protection',
    category: 'UPS',
    model: 'BX650LI-MS',
    specs: {},
    lowQtyAlert: 2,
    stock: { Cebu: 5, Bacolod: 1, Makati: 3, Ortigas: 2, Davao: 0 },
  },
  {
    id: 'wifi-tplink-archer',
    name: 'TP-Link Archer Router',
    category: 'Wifi',
    model: 'Archer AX23',
    specs: {},
    lowQtyAlert: 1,
    stock: { Cebu: 3, Bacolod: 1, Makati: 2, Ortigas: 2, Davao: 2 },
  },
];

/** The seeded source resolves in a microtask, so loading exists for less than
 *  a frame and neither a person nor a check can see it. In DEVELOPMENT ONLY,
 *  query flags make every SC-004 state reachable without editing code —
 *  `import.meta.env.DEV` is replaced with `false` in a production build, so
 *  these disappear along with the branch.
 *
 *  `?slow-catalog=<ms>` holds the loading screen.
 *  `?empty-catalog` resolves to no items.
 *  `?fail-catalog` rejects, so the page shows the failure Notice. */
async function devCatalogFlags(): Promise<{ empty: boolean; fail: boolean }> {
  if (!import.meta.env.DEV) return { empty: false, fail: false };
  const params = new URLSearchParams(window.location.search);
  const ms = Number(params.get('slow-catalog'));
  if (ms > 0) await new Promise((resolve) => setTimeout(resolve, Math.min(ms, 5000)));
  return { empty: params.has('empty-catalog'), fail: params.has('fail-catalog') };
}

export function seededCatalogSource(): CatalogSource {
  return {
    items: async (office) => {
      const { empty, fail } = await devCatalogFlags();
      if (fail) throw new Error('catalog unavailable');
      if (empty) return [];
      /* An asset with no stock line at this office is still listed, at zero:
         it exists, it just cannot be requested from here (spec 001 Edge
         Cases). */
      return ASSETS.map(({ stock, ...asset }) => ({
        ...asset,
        specs: { ...asset.specs },
        available: stock[office] ?? 0,
      }));
    },
  };
}
