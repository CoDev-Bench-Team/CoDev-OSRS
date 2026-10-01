import itemLaptop from '../../assets/items/item-laptop.jpg';
import type { UnitStatus } from '../../shared/ui';
import type { Category, StockLevels } from '../assets/types';
import { OFFICES, type Office } from '../auth/types';
import { SEEDED_USERS } from './seeded-user-directory';
import type { UnitDetail } from './types';

/** The seeded unit register — one row per physical item, and the only place
 *  stock lives for Inventory and Assets (spec 015 plan P3). Assets derives its
 *  per-office Available and Reserved and its Assigned from here, so a unit
 *  added, edited or removed on Inventory moves the Assets figures as the API
 *  would. Nothing writes a count (constitution III).
 *
 *  Non-production placeholders under constitution IX: every serial, PR,
 *  BitLocker Identifier and Recovery Key/PIN is visibly fake (`DEMO-…`).
 *
 *  Module state, so a reload starts over. The catalog, the request submit and
 *  Profile keep their own seeded data (plan P13). */

/** A unit as the register holds it: the asset is referenced, not copied, so
 *  an asset renamed on Assets is renamed here; the assignee likewise. */
export type StoredUnit = Omit<UnitDetail, 'itemName' | 'model' | 'category' | 'assignee'> & { assignedToId?: string };

export type Removal = { id: string; reason: string; at: string };

type Split = [cebu: number, bacolod: number, makati: number, ortigas: number, davao: number];

type SeedRow = {
  assetId: string;
  /** Builds the fake serials. */
  code: string;
  category: Category;
  available: Split;
  reserved: Split;
  assigned: number;
  /** Out of service: in no count. */
  inactive?: number;
  price: number;
  supplier: string;
};

const NONE: Split = [0, 0, 0, 0, 0];

/** Spec 014's per-office counts, unit for unit: the Assets screen reads the
 *  same figures as before the register existed (asserted by
 *  `scripts/check-inventory.mjs`). */
const SEED: readonly SeedRow[] = [
  { assetId: 'asset-1', code: 'LAT7440', category: 'Laptop', available: [6, 3, 4, 2, 3], reserved: [6, 2, 4, 2, 0], assigned: 3, inactive: 1, price: 80000, supplier: 'Demo Tech Supply' },
  { assetId: 'asset-2', code: 'LG27UP', category: 'Monitor', available: [2, 2, 1, 1, 2], reserved: [6, 2, 5, 2, 1], assigned: 11, price: 32500, supplier: 'Demo Display Hub' },
  { assetId: 'asset-3', code: 'EVO255', category: 'Headset', available: [7, 4, 6, 3, 4], reserved: [5, 2, 4, 3, 2], assigned: 21, price: 9850.5, supplier: 'Demo Audio Co.' },
  { assetId: 'asset-4', code: 'MXM3S', category: 'Mice', available: [1, 1, 1, 1, 0], reserved: [9, 3, 6, 3, 3], assigned: 17, price: 5490, supplier: 'Demo Peripherals' },
  { assetId: 'asset-5', code: 'GALA15', category: 'Phone', available: [1, 1, 1, 1, 1], reserved: [5, 2, 4, 2, 2], assigned: 8, price: 8990, supplier: 'Demo Mobile Store' },
  { assetId: 'asset-6', code: 'USBC2M', category: 'Other Devices', available: NONE, reserved: [20, 10, 15, 8, 7], assigned: 44, price: 450, supplier: 'Demo Cables Inc.' },
  { assetId: 'asset-7', code: 'LAT5440', category: 'Laptop', available: [5, 2, 3, 0, 3], reserved: [1, 0, 1, 0, 0], assigned: 9, price: 62000, supplier: 'Demo Tech Supply' },
  { assetId: 'asset-8', code: 'ZV100', category: 'Headset', available: NONE, reserved: NONE, assigned: 6, price: 6750, supplier: 'Demo Audio Co.' },
  { assetId: 'asset-9', code: 'APC650', category: 'UPS', available: [4, 2, 2, 1, 1], reserved: NONE, assigned: 4, inactive: 1, price: 3890, supplier: 'Demo Power Systems' },
  { assetId: 'asset-10', code: 'AX55', category: 'Wifi', available: [2, 1, 2, 1, 1], reserved: [1, 0, 0, 0, 0], assigned: 2, price: 4290, supplier: 'Demo Network Depot' },
  { assetId: 'asset-11', code: 'ANK7IN1', category: 'Type C Hub', available: [8, 4, 5, 4, 4], reserved: [2, 0, 1, 0, 0], assigned: 12, price: 2499, supplier: 'Demo Peripherals' },
  { assetId: 'asset-12', code: 'T14G4', category: 'Laptop', available: [2, 0, 1, 1, 0], reserved: [3, 0, 2, 1, 0], assigned: 5, price: 89000, supplier: 'Demo Tech Supply' },
  { assetId: 'asset-13', code: 'IPH15', category: 'Phone', available: [0, 0, 1, 0, 0], reserved: [2, 0, 1, 0, 0], assigned: 3, price: 49990, supplier: 'Demo Mobile Store' },
  { assetId: 'asset-14', code: 'P2723DE', category: 'Monitor', available: [6, 2, 4, 2, 2], reserved: NONE, assigned: 7, inactive: 1, price: 21500, supplier: 'Demo Display Hub' },
  { assetId: 'asset-15', code: 'M185', category: 'Mice', available: [13, 4, 9, 5, 5], reserved: [2, 1, 1, 0, 0], assigned: 30, price: 695, supplier: 'Demo Peripherals' },
  { assetId: 'asset-16', code: 'BLK6OUT', category: 'Other Devices', available: NONE, reserved: NONE, assigned: 5, price: 1150, supplier: 'Demo Power Systems' },
];

/** Deterministic, so every run sees the same register. */
function random(seed: number) {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pad = (n: number, width = 4) => String(n).padStart(width, '0');
const hex = (next: () => number, length: number) =>
  Array.from({ length }, () => Math.floor(next() * 16).toString(16).toUpperCase()).join('');

function seedUnits(): StoredUnit[] {
  const next = random(150);
  const perAsset = SEED.map((row) => {
    const slots: { location: Office; status: UnitStatus }[] = [];
    OFFICES.forEach((location, i) => {
      for (let n = 0; n < row.available[i]; n++) slots.push({ location, status: 'Available' });
      for (let n = 0; n < row.reserved[i]; n++) slots.push({ location, status: 'Reserved' });
    });
    for (let n = 0; n < row.assigned; n++) slots.push({ location: OFFICES[n % OFFICES.length], status: 'Assigned' });
    for (let n = 0; n < (row.inactive ?? 0); n++) slots.push({ location: OFFICES[n % OFFICES.length], status: 'Inactive' });
    // Shuffled, so a page of the table mixes offices and statuses.
    for (let i = slots.length - 1; i > 0; i--) {
      const j = Math.floor(next() * (i + 1));
      [slots[i], slots[j]] = [slots[j], slots[i]];
    }
    return slots.map((slot, k) => ({ row, k, ...slot }));
  });

  // Round-robin across assets, newest first, so page 1 is not one asset.
  const merged: (typeof perAsset)[number] = [];
  for (let k = 0; merged.length < perAsset.reduce((n, a) => n + a.length, 0); k++) {
    for (const asset of perAsset) if (asset[k]) merged.push(asset[k]);
  }

  const newest = Date.UTC(2026, 8, 30, 9, 0);
  let assignee = 0;
  return merged.map(({ row, k, location, status }, n): StoredUnit => {
    const laptop = row.category === 'Laptop';
    const unit: StoredUnit = {
      id: `unit-${n + 1}`,
      assetId: row.assetId,
      // Every seventh unit was bought without a recorded PR.
      pr: n % 7 === 3 ? undefined : `DEMO-PR-2026-${pad(1000 + Math.floor(n / 4))}`,
      // Cables carry no serial; one mouse and one monitor were entered without
      // one (spec 015 Story 3 7a).
      serialNumber:
        row.assetId === 'asset-6' || (k === 0 && (row.assetId === 'asset-4' || row.assetId === 'asset-2'))
          ? undefined
          : `DEMO-${row.code}-${pad(k + 1)}`,
      location,
      status,
      assignedToId: status === 'Assigned' ? SEEDED_USERS[assignee++ % SEEDED_USERS.length].id : undefined,
      price: row.price,
      supplier: row.supplier,
      purchasedAt: new Date(Date.UTC(2026, (k * 5) % 9, 1 + ((k * 11) % 28))).toISOString().slice(0, 10),
      createdAt: new Date(newest - n * 47 * 60_000).toISOString(),
    };
    if (laptop) {
      unit.bitlockerIdentifier = `DEMO-BL-${hex(next, 8)}-${hex(next, 4)}`;
      unit.recoveryPin = `DEMO-RK-${pad(Math.floor(next() * 1_000_000), 6)}-${pad(Math.floor(next() * 1_000_000), 6)}`;
    }
    if (status === 'Inactive') unit.description = 'Out of service: awaiting repair assessment.';
    if (row.assetId === 'asset-1' && k === 1) {
      unit.description = 'Delivered with a dock and a sleeve.';
      unit.attachmentUrl = itemLaptop;
    }
    return unit;
  });
}

const zero = (): Record<Office, StockLevels> =>
  Object.fromEntries(OFFICES.map((o) => [o, { available: 0, reserved: 0 }])) as Record<Office, StockLevels>;

/** A register over a fresh seed. The app shares one (`unitRegister`); the dev
 *  stubs build their own, so a stub mode never touches it. */
export function createUnitRegister() {
  let units: StoredUnit[] = seedUnits();
  const removals: Removal[] = [];
  let seq = units.length;
  const clone = (u: StoredUnit): StoredUnit => structuredClone(u);

  return {
    list: () => units.map(clone),
    get: (id: string): StoredUnit | undefined => {
      const unit = units.find((u) => u.id === id);
      return unit && clone(unit);
    },
    nextId: () => `unit-${++seq}`,
    insert(added: readonly StoredUnit[]) {
      units = [...added.map(clone), ...units];
    },
    replace(unit: StoredUnit) {
      units = units.map((u) => (u.id === unit.id ? clone(unit) : u));
    },
    remove(id: string, reason: string) {
      units = units.filter((u) => u.id !== id);
      removals.push({ id, reason, at: new Date().toISOString() });
    },
    removals: (): Removal[] => removals.map((r) => ({ ...r })),
    /** Serials among `serials` already held by a unit other than `except`. */
    serialsInUse(serials: readonly string[], except?: string): string[] {
      const held = new Set(units.filter((u) => u.id !== except && u.serialNumber).map((u) => u.serialNumber));
      return serials.filter((s) => held.has(s));
    },
    /** Available and Reserved at each office: counts of units by status. */
    stockFor(assetId: string): Record<Office, StockLevels> {
      const stock = zero();
      for (const u of units) {
        if (u.assetId !== assetId) continue;
        if (u.status === 'Available') stock[u.location].available += 1;
        else if (u.status === 'Reserved') stock[u.location].reserved += 1;
      }
      return stock;
    },
    assignedFor: (assetId: string) => units.filter((u) => u.assetId === assetId && u.status === 'Assigned').length,
  };
}

export type UnitRegister = ReturnType<typeof createUnitRegister>;

export const unitRegister: UnitRegister = createUnitRegister();
