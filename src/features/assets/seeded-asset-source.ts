import itemLaptop from '../../assets/items/item-laptop.jpg';
import itemMonitor from '../../assets/items/item-monitor.jpg';
import type { ValidationProblem } from '../../shared/validation';
import { OFFICES, type Office } from '../auth/types';
import type { AssetSource } from './asset-source';
import { CATEGORIES, type Asset, type AssetDraft, type StockLevels } from './types';
import { draftForCategory, missingFields } from './category-fields';

/** Seeded Assets and Inventory — non-production placeholders under
 *  constitution IX, and the only `AssetSource` until the stock model is
 *  settled (spec 008 D1).
 *
 *  The first rows are the design's own: `03 - Inventory` draws Dell Latitude
 *  7440 at 32 / 18 / 14, LG UltraFine 27-inch at 24 / 8 / 16, Logitech MX
 *  Master 3S at 28 / 4 / 24 and a 2m USB-C cable at 60 / 0 / 60, plus two
 *  unnamed rows at 40 / 24 / 16 and 20 / 5 / 15, given names here. How each
 *  total splits across the five offices is ours. The rest make every state
 *  reachable: all three stock statuses, an asset with no stock anywhere, every
 *  category, an asset with custom specs, and enough rows for a second page.
 *
 *  Module state, so an edit on Assets is on Inventory after navigating, and a
 *  reload starts over. */

type Split = [cebu: number, bacolod: number, makati: number, ortigas: number, davao: number];

function stock(totals: Split, reserved: Split = [0, 0, 0, 0, 0]): Record<Office, StockLevels> {
  return Object.fromEntries(OFFICES.map((o, i) => [o, { total: totals[i], reserved: reserved[i] }])) as Record<
    Office,
    StockLevels
  >;
}

const LAPTOP_SPECS = {
  ram: '16GB',
  storage: '512GB SSD',
  processor: 'Intel Core Ultra 5',
  graphics: 'Integrated Intel Arc Graphics',
  operatingSystem: 'Windows 11 Pro',
};

let seq = 100;
const nextId = () => `asset-${++seq}`;

let assets: Asset[] = [
  {
    id: 'asset-1',
    name: 'Dell Latitude 7440',
    category: 'Laptop',
    model: 'Latitude 7440',
    description: 'Business laptop with a 14-inch display.',
    image: itemLaptop,
    specs: { ...LAPTOP_SPECS, processor: 'Intel Core i7-1365U', graphics: 'Intel Iris Xe Graphics' },
    customSpecs: [],
    lowStockThreshold: 5,
    deployed: 3,
    stock: stock([12, 5, 8, 4, 3], [6, 2, 4, 2, 0]),
  },
  {
    id: 'asset-2',
    name: 'LG UltraFine 27-inch',
    category: 'Monitor',
    model: '27UP850-W',
    image: itemMonitor,
    specs: {},
    customSpecs: [],
    lowStockThreshold: 6,
    deployed: 11,
    stock: stock([8, 4, 6, 3, 3], [6, 2, 5, 2, 1]),
  },
  {
    id: 'asset-3',
    name: 'Jabra Evolve2 55',
    category: 'Headset',
    model: 'Evolve2 55 Stereo',
    specs: {},
    customSpecs: [],
    lowStockThreshold: 8,
    deployed: 21,
    stock: stock([12, 6, 10, 6, 6], [5, 2, 4, 3, 2]),
  },
  {
    id: 'asset-4',
    name: 'Logitech MX Master 3S',
    category: 'Mice',
    description: 'Wireless mouse, USB-C receiver.',
    specs: {},
    customSpecs: [],
    lowStockThreshold: 5,
    deployed: 17,
    stock: stock([10, 4, 7, 4, 3], [9, 3, 6, 3, 3]),
  },
  {
    id: 'asset-5',
    name: 'Samsung Galaxy A15',
    category: 'Phone',
    model: 'SM-A155F',
    specs: { ram: '4GB', storage: '128GB' },
    customSpecs: [],
    lowStockThreshold: 5,
    deployed: 8,
    stock: stock([6, 3, 5, 3, 3], [5, 2, 4, 2, 2]),
  },
  {
    id: 'asset-6',
    name: 'USB-C Cable 2m',
    category: 'Other Devices',
    specs: {},
    customSpecs: [],
    lowStockThreshold: 10,
    deployed: 44,
    stock: stock([20, 10, 15, 8, 7], [20, 10, 15, 8, 7]),
  },
  {
    id: 'asset-7',
    name: 'Dell Latitude 5440 Laptop',
    category: 'Laptop',
    model: 'Dell',
    description: '14-inch business laptop for general staff.',
    image: itemLaptop,
    specs: LAPTOP_SPECS,
    customSpecs: [{ key: 'External Keyboard', value: 'Logitech MX Keys' }],
    lowStockThreshold: 4,
    deployed: 9,
    stock: stock([6, 2, 4, 0, 3], [1, 0, 1, 0, 0]),
  },
  {
    id: 'asset-8',
    name: 'Logitech Zone Vibe 100',
    category: 'Headset',
    model: 'Zone Vibe 100',
    specs: {},
    customSpecs: [],
    lowStockThreshold: 3,
    deployed: 6,
    stock: stock([0, 0, 0, 0, 0]),
  },
  {
    id: 'asset-9',
    name: 'APC Back-UPS 650VA',
    category: 'UPS',
    description: 'Battery backup for a single workstation.',
    specs: {},
    customSpecs: [],
    lowStockThreshold: 2,
    deployed: 4,
    stock: stock([4, 2, 2, 1, 1]),
  },
  {
    id: 'asset-10',
    name: 'TP-Link Archer AX55',
    category: 'Wifi',
    model: 'Archer AX55',
    specs: {},
    customSpecs: [],
    lowStockThreshold: 2,
    deployed: 2,
    stock: stock([3, 1, 2, 1, 1], [1, 0, 0, 0, 0]),
  },
  {
    id: 'asset-11',
    name: 'Anker 7-in-1 USB-C Hub',
    category: 'Type C Hub',
    specs: {},
    customSpecs: [],
    lowStockThreshold: 6,
    deployed: 12,
    stock: stock([10, 4, 6, 4, 4], [2, 0, 1, 0, 0]),
  },
  {
    id: 'asset-12',
    name: 'Lenovo ThinkPad T14 Gen 4',
    category: 'Laptop',
    model: 'ThinkPad T14 Gen 4',
    specs: { ram: '32GB', storage: '1TB SSD', processor: 'AMD Ryzen 7 PRO 7840U', graphics: 'AMD Radeon 780M', operatingSystem: 'Windows 11 Pro' },
    customSpecs: [],
    lowStockThreshold: 4,
    deployed: 5,
    stock: stock([5, 0, 3, 2, 0], [3, 0, 2, 1, 0]),
  },
  {
    id: 'asset-13',
    name: 'iPhone 15',
    category: 'Phone',
    model: 'A3090',
    specs: { ram: '6GB', storage: '128GB' },
    customSpecs: [],
    lowStockThreshold: 2,
    deployed: 3,
    stock: stock([2, 0, 2, 0, 0], [2, 0, 1, 0, 0]),
  },
  {
    id: 'asset-14',
    name: 'Dell P2723DE 27-inch',
    category: 'Monitor',
    model: 'P2723DE',
    specs: {},
    customSpecs: [],
    lowStockThreshold: 4,
    deployed: 7,
    stock: stock([6, 2, 4, 2, 2]),
  },
  {
    id: 'asset-15',
    name: 'Logitech M185 Wireless Mouse',
    category: 'Mice',
    specs: {},
    customSpecs: [],
    lowStockThreshold: 10,
    deployed: 30,
    stock: stock([15, 5, 10, 5, 5], [2, 1, 1, 0, 0]),
  },
  {
    id: 'asset-16',
    name: 'Belkin 6-Outlet Surge Protector',
    category: 'Other Devices',
    specs: {},
    customSpecs: [],
    lowStockThreshold: 3,
    deployed: 5,
    stock: stock([0, 0, 0, 0, 0]),
  },
];

const clone = (a: Asset): Asset => structuredClone(a);

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

function find(id: string): Asset {
  const asset = assets.find((a) => a.id === id);
  if (!asset) throw new Error(`asset ${id} not found`);
  return asset;
}

export const seededAssetSource: AssetSource = {
  list: () => settle(assets.map(clone)),

  create(input) {
    const errors = check(input);
    if (Object.keys(errors).length) return refuse(errors);
    const asset: Asset = {
      ...draftForCategory(input),
      id: nextId(),
      lowStockThreshold: 5,
      deployed: 0,
      stock: stock([0, 0, 0, 0, 0]),
    };
    assets = [...assets, asset];
    return settle(clone(asset));
  },

  update(id, input) {
    const errors = check(input);
    if (Object.keys(errors).length) return refuse(errors);
    const saved: Asset = { ...find(id), ...draftForCategory(input) };
    assets = assets.map((a) => (a.id === id ? saved : a));
    return settle(clone(saved));
  },

  setStock(id, { lowStockThreshold, totals }) {
    const current = find(id);
    const errors: Record<string, string> = {};
    if (!Number.isInteger(lowStockThreshold) || lowStockThreshold < 0) {
      errors.lowStockThreshold = 'Enter a whole number, 0 or more';
    }
    for (const office of OFFICES) {
      const total = totals[office];
      const { reserved } = current.stock[office];
      if (!Number.isInteger(total) || total < reserved) {
        errors[`totals.${office}`] = `Cannot be below the ${reserved} reserved at ${office}`;
      }
    }
    if (Object.keys(errors).length) return refuse(errors);

    // All or nothing: the new record is built whole and swapped in once.
    const saved: Asset = {
      ...current,
      lowStockThreshold,
      stock: Object.fromEntries(
        OFFICES.map((o) => [o, { total: totals[o], reserved: current.stock[o].reserved }]),
      ) as Record<Office, StockLevels>,
    };
    assets = assets.map((a) => (a.id === id ? saved : a));
    return settle(clone(saved));
  },
};
