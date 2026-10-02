import itemLaptop from '../../assets/items/item-laptop.jpg';
import itemMonitor from '../../assets/items/item-monitor.jpg';
import type { ValidationProblem } from '../../shared/validation';
import { unitRegister } from '../inventory/seeded-unit-register';
import type { AssetSource } from './asset-source';
import { CATEGORIES, type Asset, type AssetDraft } from './types';
import { draftForCategory, missingFields } from './category-fields';

/** Seeded Assets — non-production placeholders under constitution IX, and the
 *  only `AssetSource` until the contract publishes per-asset unit counts
 *  (spec 014 D1).
 *
 *  Stock is not held here. It is counted from the seeded unit register on
 *  every read (spec 015 plan P3; ADR-0008): Available and Reserved at each
 *  office, Assigned per asset, so a unit added, edited or removed on Inventory
 *  moves these figures. The first rows keep the design's own totals — Dell
 *  Latitude 7440 at 18 available / 14 reserved, LG UltraFine 27-inch at 8 / 16,
 *  Logitech MX Master 3S at 4 / 24, a 2m USB-C cable at 0 / 60, and two more at
 *  24 / 16 and 5 / 15, given names here. How each splits across the five
 *  offices is ours, and lives in the register's seed. The rest make every
 *  state reachable: all three stock statuses, an asset with no units
 *  anywhere, every category, and enough rows for a second page.
 *
 *  Module state, so a reload starts over. */

/** An asset as held here: its counts are the register's. */
type StoredAsset = Omit<Asset, 'stock' | 'assigned'>;

const LAPTOP_SPECS = {
  ram: '16GB',
  storage: '512GB SSD',
  processor: 'Intel Core Ultra 5',
  graphics: 'Integrated Intel Arc Graphics',
  operatingSystem: 'Windows 11 Pro',
};

let seq = 100;
const nextId = () => `asset-${++seq}`;

let assets: StoredAsset[] = [
  {
    id: 'asset-1',
    name: 'Dell Latitude 7440',
    category: 'Laptop',
    model: 'Latitude 7440',
    description: 'Business laptop with a 14-inch display.',
    image: itemLaptop,
    specs: { ...LAPTOP_SPECS, processor: 'Intel Core i7-1365U', graphics: 'Intel Iris Xe Graphics' },
    lowStockThreshold: 5,
  },
  {
    id: 'asset-2',
    name: 'LG UltraFine 27-inch',
    category: 'Monitor',
    model: '27UP850-W',
    image: itemMonitor,
    specs: {},
    lowStockThreshold: 6,
  },
  {
    id: 'asset-3',
    name: 'Jabra Evolve2 55',
    category: 'Headset',
    model: 'Evolve2 55 Stereo',
    specs: {},
    lowStockThreshold: 8,
  },
  {
    id: 'asset-4',
    name: 'Logitech MX Master 3S',
    category: 'Mice',
    description: 'Wireless mouse, USB-C receiver.',
    specs: {},
    lowStockThreshold: 5,
  },
  {
    id: 'asset-5',
    name: 'Samsung Galaxy A15',
    category: 'Phone',
    model: 'SM-A155F',
    specs: { ram: '4GB', storage: '128GB' },
    lowStockThreshold: 5,
  },
  {
    id: 'asset-6',
    name: 'USB-C Cable 2m',
    category: 'Other Devices',
    specs: {},
    lowStockThreshold: 10,
  },
  {
    id: 'asset-7',
    name: 'Dell Latitude 5440 Laptop',
    category: 'Laptop',
    model: 'Dell',
    description: '14-inch business laptop for general staff.',
    image: itemLaptop,
    specs: LAPTOP_SPECS,
    lowStockThreshold: 4,
  },
  {
    id: 'asset-8',
    name: 'Logitech Zone Vibe 100',
    category: 'Headset',
    model: 'Zone Vibe 100',
    specs: {},
    lowStockThreshold: 3,
  },
  {
    id: 'asset-9',
    name: 'APC Back-UPS 650VA',
    category: 'UPS',
    description: 'Battery backup for a single workstation.',
    specs: {},
    lowStockThreshold: 2,
  },
  {
    id: 'asset-10',
    name: 'TP-Link Archer AX55',
    category: 'Wifi',
    model: 'Archer AX55',
    specs: {},
    lowStockThreshold: 2,
  },
  {
    id: 'asset-11',
    name: 'Anker 7-in-1 USB-C Hub',
    category: 'Type C Hub',
    specs: {},
    lowStockThreshold: 6,
  },
  {
    id: 'asset-12',
    name: 'Lenovo ThinkPad T14 Gen 4',
    category: 'Laptop',
    model: 'ThinkPad T14 Gen 4',
    specs: { ram: '32GB', storage: '1TB SSD', processor: 'AMD Ryzen 7 PRO 7840U', graphics: 'AMD Radeon 780M', operatingSystem: 'Windows 11 Pro' },
    lowStockThreshold: 4,
  },
  {
    id: 'asset-13',
    name: 'iPhone 15',
    category: 'Phone',
    model: 'A3090',
    specs: { ram: '6GB', storage: '128GB' },
    lowStockThreshold: 2,
  },
  {
    id: 'asset-14',
    name: 'Dell P2723DE 27-inch',
    category: 'Monitor',
    model: 'P2723DE',
    specs: {},
    lowStockThreshold: 4,
  },
  {
    id: 'asset-15',
    name: 'Logitech M185 Wireless Mouse',
    category: 'Mice',
    specs: {},
    lowStockThreshold: 10,
  },
  {
    id: 'asset-16',
    name: 'Belkin 6-Outlet Surge Protector',
    category: 'Other Devices',
    specs: {},
    lowStockThreshold: 3,
  },
];

const withCounts = (a: StoredAsset): Asset => ({
  ...structuredClone(a),
  stock: unitRegister.stockFor(a.id),
  assigned: unitRegister.assignedFor(a.id),
});

/** Resolves after a beat, so loading and saving states are real rather than
 *  skipped. */
const settle = <T,>(value: T) => new Promise<T>((resolve) => setTimeout(() => resolve(value), 250));

function refuse(errors: Record<string, string>): Promise<never> {
  const problem: ValidationProblem = {
    type: 'validation-error',
    title: 'Validation Failed',
    status: 400,
    errors: Object.entries(errors).map(([field, detail]) => ({
      detail,
      pointer: `#/${field.split('.').join('/')}`,
    })),
  };
  return new Promise((_, reject) => setTimeout(() => reject(problem), 250));
}

/** The source checks what a contract would, from the same rule table the form
 *  uses, so it only refuses what a client check missed. */
function check(draft: AssetDraft): Record<string, string> {
  if (!CATEGORIES.includes(draft.category)) return { category: 'Choose a category' };
  return missingFields(draftForCategory(draft));
}

export const seededAssetSource: AssetSource = {
  list: () => settle(assets.map(withCounts)),

  create(input) {
    const errors = check(input);
    if (Object.keys(errors).length) return refuse(errors);
    // A new asset has no units until Inventory adds them.
    const asset: StoredAsset = { ...draftForCategory(input), id: nextId() };
    assets = [asset, ...assets];
    return settle(withCounts(asset));
  },

  update(id, input) {
    const errors = check(input);
    if (Object.keys(errors).length) return refuse(errors);
    const current = assets.find((a) => a.id === id);
    if (!current) return Promise.reject(new Error(`asset ${id} not found`));
    const saved: StoredAsset = { ...current, ...draftForCategory(input) };
    assets = assets.map((a) => (a.id === id ? saved : a));
    return settle(withCounts(saved));
  },
};
