import type { UnitStatus } from '../../shared/ui';
import type { Category } from '../assets/types';
import type { Office } from '../auth/types';

/** Units of the register, in product language (spec 015, plan P5).
 *
 *  SPA terms, not HTTP terms. Draft field names are the published
 *  `/inventory-items` contract's wherever it has one, so a problem's pointer
 *  names a form field with no translation table. `pr` is the SPA's own: the
 *  contract has no Purchase Request number (contracts conflict 11, G5). */

/** What Add Single Unit offers: the contract creates a unit Available, or
 *  Assigned when a user is given (spec 015 D3). */
export type AddStatus = Extract<UnitStatus, 'Available' | 'Assigned' | 'Inactive'>;

/** What Review/Edit offers for a unit that is not reserved (spec 015 D4).
 *  Reserved is in neither option type, so no control can set it (D2). */
export type EditStatus = Extract<UnitStatus, 'Available' | 'Assigned' | 'Inactive'>;

export type Assignee = { id: string; name: string; department?: string };

/** One row of the table. It carries no secret field, so the table has none to
 *  render (FR-002, plan P4). */
export type UnitRow = {
  id: string;
  assetId: string;
  /** The asset's item name — the table's MODEL (spec 015 D7). */
  itemName: string;
  model?: string;
  category: Category;
  /** The Purchase Request number (spec 015 D14). */
  pr?: string;
  serialNumber?: string;
  location: Office;
  status: UnitStatus;
  assignee?: Assignee;
  /** ISO 8601; the table lists newest first (FR-005). */
  createdAt: string;
};

/** One unit as Review/Edit reads it: the only shape that carries the
 *  BitLocker Identifier and Recovery Key/PIN (constitution VIII, IX). */
export type UnitDetail = UnitRow & {
  price?: number;
  supplier?: string;
  /** `YYYY-MM-DD`. */
  purchasedAt?: string;
  bitlockerIdentifier?: string;
  recoveryPin?: string;
  description?: string;
  /** A data URI until an upload operation is published (G7). */
  attachmentUrl?: string;
};

/** What Add Single Unit and Review/Edit submit.
 *
 *  `status` is optional: a Reserved unit's draft omits `status`,
 *  `assignedToId` and `location`, and the source leaves them unchanged, so
 *  editing its other details can never release it (constitution III). A
 *  contract-backed source sends `status` on update only; on create it follows
 *  `assignedToId`. `assetId` is ignored on update. */
export type UnitDraft = {
  assetId: string;
  pr?: string;
  price?: number;
  supplier?: string;
  purchasedAt?: string;
  serialNumber?: string;
  bitlockerIdentifier?: string;
  recoveryPin?: string;
  location?: Office;
  status?: EditStatus;
  assignedToId?: string;
  description?: string;
  attachmentUrl?: string;
};

/** One row of Add Multiple Units: the device fields the category carries. */
export type UnitBatchEntry = Pick<UnitDraft, 'serialNumber' | 'bitlockerIdentifier' | 'recoveryPin'>;

/** What Add Multiple Units submits: one asset, one office, shared purchase
 *  details and 1–100 units, all created Available (FR-010). */
export type UnitBatchDraft = Pick<UnitDraft, 'assetId' | 'pr' | 'price' | 'supplier' | 'purchasedAt'> & {
  location: Office;
  units: UnitBatchEntry[];
};

/** The chips Inventory draws, in order. Inactive has none: an inactive unit
 *  is counted under All items only (spec 015 FR-003). */
export const UNIT_CHIPS = ['Assigned', 'Available', 'Reserved'] as const satisfies readonly UnitStatus[];
export type UnitChip = (typeof UNIT_CHIPS)[number];
