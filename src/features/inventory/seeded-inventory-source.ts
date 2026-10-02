import type { ValidationProblem } from '../../shared/validation';
import type { AssetSource } from '../assets/asset-source';
import type { Asset } from '../assets/types';
import { stripHidden } from './device-fields';
import type { InventorySource, UnitProblem } from './inventory-source';
import type { StoredUnit, UnitRegister } from './seeded-unit-register';
import type { UnitBatchDraft, UnitDetail, UnitDraft, UnitRow } from './types';
import { removal, statusOptions } from './unit-rules';
import { today, validateBatch, validateUnit } from './unit-validation';
import type { DirectoryUser, UserDirectory } from './user-directory';

/** The seeded `InventorySource` (spec 015 plan P2, P8).
 *
 *  It checks what a contract would, with the same rules the panels use, so it
 *  only refuses what a client check missed. The 404 and 409 serial messages
 *  are the backend's published strings. The reserved-behind-the-panel 409 is
 *  ours, seeded only: the API's guard is contracts conflict 11 G4. */

/** Our copy, seeded only (plan P16; logged in additions.md). */
export const RESERVED_BEHIND = 'This unit was reserved by a request. Reload to see its current status.';

/** Resolves after a beat, so loading and saving states are real. */
const settle = <T,>(value: T) => new Promise<T>((resolve) => setTimeout(() => resolve(value), 250));
const refuse = (body: unknown): Promise<never> => new Promise((_, reject) => setTimeout(() => reject(body), 250));

const invalid = (errors: Record<string, string>): ValidationProblem => ({
  type: 'validation-error',
  title: 'Validation Failed',
  status: 400,
  errors: Object.entries(errors).map(([field, detail]) => ({ detail, pointer: `#/${field.split('.').join('/')}` })),
});

const notFound = (id: string): UnitProblem => ({
  title: 'Not Found',
  status: 404,
  detail: `Inventory item with ID '${id}' could not be found.`,
});

const conflict = (detail: string): UnitProblem => ({ title: 'Conflict', status: 409, detail });

const serialsInUse = (serials: string[]) => conflict(`Serial numbers already in use: ${serials.join(', ')}.`);

const text = (value: string | undefined) => value?.trim() || undefined;

/** Trims every text field and drops the empty ones, so a cleared field is
 *  stored as absent. */
function tidy<D extends Partial<UnitDraft>>(draft: D): D {
  const out: Record<string, unknown> = { ...draft };
  for (const [key, value] of Object.entries(out)) if (typeof value === 'string') out[key] = text(value);
  return out as D;
}

function row(unit: StoredUnit, asset: Asset, users: ReadonlyMap<string, DirectoryUser>): UnitRow {
  const user = unit.assignedToId ? users.get(unit.assignedToId) : undefined;
  // Built field by field: a spread would carry the secrets into the table.
  return {
    id: unit.id,
    assetId: unit.assetId,
    itemName: asset.name,
    model: asset.model,
    category: asset.category,
    pr: unit.pr,
    serialNumber: unit.serialNumber,
    location: unit.location,
    status: unit.status,
    assignee: user && { id: user.id, name: user.name, department: user.department },
    createdAt: unit.createdAt,
  };
}

function detail(unit: StoredUnit, asset: Asset, users: ReadonlyMap<string, DirectoryUser>): UnitDetail {
  return {
    ...row(unit, asset, users),
    price: unit.price,
    supplier: unit.supplier,
    purchasedAt: unit.purchasedAt,
    bitlockerIdentifier: unit.bitlockerIdentifier,
    recoveryPin: unit.recoveryPin,
    description: unit.description,
    attachmentUrl: unit.attachmentUrl,
  };
}

const newestFirst = (a: { createdAt: string }, b: { createdAt: string }) => b.createdAt.localeCompare(a.createdAt);

export function createSeededInventorySource(
  register: UnitRegister,
  assetSource: Pick<AssetSource, 'list'>,
  directory: UserDirectory,
): InventorySource & { refuseNext(problem: unknown): void } {
  let refusal: { body: unknown } | null = null;

  const lookups = async () => {
    const [assets, users] = await Promise.all([assetSource.list(), directory.list()]);
    return { assets: new Map(assets.map((a) => [a.id, a])), users: new Map(users.map((u) => [u.id, u])) };
  };

  /** The dev hook's one-off answer to the next save (plan P16). */
  const takeRefusal = () => {
    const pending = refusal;
    refusal = null;
    return pending;
  };

  return {
    refuseNext(problem) {
      refusal = { body: problem };
    },

    async list() {
      const { assets, users } = await lookups();
      return register
        .list()
        .flatMap((unit) => {
          const asset = assets.get(unit.assetId);
          return asset ? [row(unit, asset, users)] : [];
        })
        .sort(newestFirst);
    },

    async get(id) {
      const { assets, users } = await lookups();
      const unit = register.get(id);
      const asset = unit && assets.get(unit.assetId);
      return unit && asset ? detail(unit, asset, users) : refuse(notFound(id));
    },

    async create(input) {
      const pending = takeRefusal();
      if (pending) return refuse(pending.body);
      const { assets, users } = await lookups();
      const asset = assets.get(input.assetId);
      const draft = stripHidden(tidy(input), asset?.category);
      const errors = validateUnit(draft, asset?.category, today());
      if (input.assetId && !asset) errors.assetId = 'Choose a catalog item from the list';
      if (draft.status && !statusOptions('add').some((s) => s === draft.status)) errors.status = 'Choose Available, Assigned or Inactive';
      if (draft.status === 'Assigned' && draft.assignedToId && !users.has(draft.assignedToId)) errors.assignedToId = 'Choose a user from the list';
      if (Object.keys(errors).length || !asset || !draft.location || !draft.status) return refuse(invalid(errors));
      const taken = register.serialsInUse(draft.serialNumber ? [draft.serialNumber] : []);
      if (taken.length) return refuse(serialsInUse(taken));

      const unit: StoredUnit = {
        id: register.nextId(),
        assetId: asset.id,
        pr: draft.pr,
        price: draft.price,
        supplier: draft.supplier,
        purchasedAt: draft.purchasedAt,
        serialNumber: draft.serialNumber,
        bitlockerIdentifier: draft.bitlockerIdentifier,
        recoveryPin: draft.recoveryPin,
        location: draft.location,
        status: draft.status,
        assignedToId: draft.status === 'Assigned' ? draft.assignedToId : undefined,
        description: draft.description,
        attachmentUrl: draft.attachmentUrl,
        createdAt: new Date().toISOString(),
      };
      register.insert([unit]);
      return settle(detail(unit, asset, users));
    },

    async createBatch(input) {
      const pending = takeRefusal();
      if (pending) return refuse(pending.body);
      const { assets, users } = await lookups();
      const asset = assets.get(input.assetId);
      const draft: UnitBatchDraft = {
        ...tidy({ assetId: input.assetId, pr: input.pr, price: input.price, supplier: input.supplier, purchasedAt: input.purchasedAt }),
        location: input.location,
        units: input.units.map((entry) => stripHidden(tidy(entry), asset?.category)),
      };
      const errors = validateBatch(draft, asset?.category, today());
      if (input.assetId && !asset) errors.assetId = 'Choose a catalog item from the list';
      if (Object.keys(errors).length || !asset) return refuse(invalid(errors));
      const taken = register.serialsInUse(draft.units.flatMap((u) => (u.serialNumber ? [u.serialNumber] : [])));
      if (taken.length) return refuse(serialsInUse(taken));

      // The first row is the newest, so the batch reads top-down in the table.
      const now = Date.now();
      const units = draft.units.map(
        (entry, i): StoredUnit => ({
          id: register.nextId(),
          assetId: asset.id,
          pr: draft.pr,
          price: draft.price,
          supplier: draft.supplier,
          purchasedAt: draft.purchasedAt,
          serialNumber: entry.serialNumber,
          bitlockerIdentifier: entry.bitlockerIdentifier,
          recoveryPin: entry.recoveryPin,
          location: draft.location,
          status: 'Available',
          createdAt: new Date(now - i).toISOString(),
        }),
      );
      register.insert(units);
      return settle(units.map((unit) => row(unit, asset, users)));
    },

    async update(id, input) {
      const pending = takeRefusal();
      if (pending) return refuse(pending.body);
      const { assets, users } = await lookups();
      const stored = register.get(id);
      const asset = stored && assets.get(stored.assetId);
      if (!stored || !asset) return refuse(notFound(id));
      // The panel sends a status only for a unit it read as not reserved.
      if (stored.status === 'Reserved' && input.status !== undefined) return refuse(conflict(RESERVED_BEHIND));

      const reserved = stored.status === 'Reserved';
      const draft = stripHidden(tidy({ ...input, assetId: stored.assetId }), asset.category);
      const errors = validateUnit(draft, asset.category, today(), stored);
      if (!reserved && draft.status && !statusOptions('edit', stored)?.some((s) => s === draft.status)) {
        errors.status = 'Choose Available, Assigned or Inactive';
      }
      if (!reserved && draft.status === 'Assigned' && draft.assignedToId && !users.has(draft.assignedToId)) {
        errors.assignedToId = 'Choose a user from the list';
      }
      if (Object.keys(errors).length || (!reserved && (!draft.location || !draft.status))) return refuse(invalid(errors));
      const taken = register.serialsInUse(draft.serialNumber ? [draft.serialNumber] : [], id);
      if (taken.length) return refuse(serialsInUse(taken));

      const status = reserved ? stored.status : draft.status!;
      const saved: StoredUnit = {
        id,
        assetId: stored.assetId,
        createdAt: stored.createdAt,
        pr: draft.pr,
        price: draft.price,
        supplier: draft.supplier,
        purchasedAt: draft.purchasedAt,
        serialNumber: draft.serialNumber,
        bitlockerIdentifier: draft.bitlockerIdentifier,
        recoveryPin: draft.recoveryPin,
        description: draft.description,
        attachmentUrl: draft.attachmentUrl,
        location: reserved ? stored.location : draft.location!,
        status,
        assignedToId: reserved ? stored.assignedToId : status === 'Assigned' ? draft.assignedToId : undefined,
      };
      register.replace(saved);
      return settle(detail(saved, asset, users));
    },

    async remove(id, reason) {
      const pending = takeRefusal();
      if (pending) return refuse(pending.body);
      const stored = register.get(id);
      if (!stored) return refuse(notFound(id));
      const allowed = removal(stored);
      if (!allowed.allowed) return refuse(conflict(allowed.reason));
      if (!reason.trim()) return refuse(invalid({ reason: 'Enter a reason for removal' }));
      register.remove(id, reason.trim());
      return settle(undefined);
    },
  };
}
