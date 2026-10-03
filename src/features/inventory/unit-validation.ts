import type { UnitStatus } from '../../shared/ui';
import type { Category } from '../assets/types';
import { deviceFieldsFor } from './device-fields';
import type { UnitBatchDraft, UnitBatchEntry, UnitDraft } from './types';

/** The unit rules as field → message, shared by the panels and the seeded
 *  source (spec 015 plan P8; FR-008, FR-010, FR-011a, FR-013). Keys are the
 *  contract's field paths — `units.2.serialNumber` for a batch row — so a
 *  client refusal and a source refusal land under the same field.
 *
 *  The attachment's type and size are the uploader's to check, as on Assets.
 *  Run on a draft already passed through `stripHidden`. */

const MAX_TEXT = 255;
const MAX_DESCRIPTION = 2048;
export const MAX_BATCH = 100;

const blank = (value: string | undefined) => !value?.trim();
const tooLong = (value: string | undefined, max = MAX_TEXT) => (value?.length ?? 0) > max;

type Errors = Record<string, string>;

function checkPurchase(draft: Pick<UnitDraft, 'price' | 'purchasedAt' | 'supplier'>, today: string, errors: Errors) {
  const { price } = draft;
  if (price !== undefined) {
    if (!Number.isFinite(price) || price < 0) errors.price = 'Enter a price of 0 or more';
    else if (Math.abs(Math.round(price * 100) - price * 100) > 1e-6) errors.price = 'Use at most two decimal places';
  }
  if (draft.purchasedAt && draft.purchasedAt > today) errors.purchasedAt = 'The purchase date can’t be in the future';
  if (tooLong(draft.supplier)) errors.supplier = 'Use 255 characters or fewer';
}

function checkDevice(entry: UnitBatchEntry, category: Category | undefined, prefix: string, errors: Errors) {
  if (deviceFieldsFor(category).serial === 'required' && blank(entry.serialNumber)) {
    errors[`${prefix}serialNumber`] = 'Enter the serial number';
  } else if (tooLong(entry.serialNumber)) {
    errors[`${prefix}serialNumber`] = 'Use 255 characters or fewer';
  }
  if (tooLong(entry.bitlockerIdentifier)) errors[`${prefix}bitlockerIdentifier`] = 'Use 255 characters or fewer';
  if (tooLong(entry.recoveryPin)) errors[`${prefix}recoveryPin`] = 'Use 255 characters or fewer';
}

/** Add Single Unit and Review/Edit. `stored` is the unit being edited: a
 *  Reserved unit's draft carries no status, user or office (plan P5). */
export function validateUnit(
  draft: UnitDraft,
  category: Category | undefined,
  today: string,
  stored?: { status: UnitStatus },
): Errors {
  const errors: Errors = {};
  if (blank(draft.assetId)) errors.assetId = 'Choose a catalog item';
  checkPurchase(draft, today, errors);
  checkDevice(draft, category, '', errors);
  if (stored?.status !== 'Reserved') {
    if (!draft.location) errors.location = 'Choose an office';
    if (!draft.status) errors.status = 'Choose a status';
    // An assignee is chosen when a unit becomes Assigned. One already Assigned
    // keeps its assignment when the field is left blank: the API does not
    // publish who it is (contracts G6), and sending it again would reset the
    // assigned date.
    else if (draft.status === 'Assigned' && blank(draft.assignedToId) && stored?.status !== 'Assigned')
      errors.assignedToId = 'Choose who this unit is assigned to';
  }
  if (tooLong(draft.description, MAX_DESCRIPTION)) errors.description = 'Use 2,048 characters or fewer';
  return errors;
}

/** Add Multiple Units: 1–100 rows, a required serial by category, and no
 *  non-blank serial twice in the batch (FR-010). */
export function validateBatch(draft: UnitBatchDraft, category: Category | undefined, today: string): Errors {
  const errors: Errors = {};
  if (blank(draft.assetId)) errors.assetId = 'Choose a catalog item';
  if (!draft.location) errors.location = 'Choose an office';
  checkPurchase(draft, today, errors);
  if (draft.units.length === 0) errors.units = 'Add at least one unit';
  else if (draft.units.length > MAX_BATCH) errors.units = `Add at most ${MAX_BATCH} units`;

  const seen = new Map<string, number>();
  draft.units.forEach((entry, i) => {
    checkDevice(entry, category, `units.${i}.`, errors);
    const serial = entry.serialNumber?.trim();
    if (!serial) return;
    const first = seen.get(serial);
    if (first === undefined) seen.set(serial, i);
    else {
      errors[`units.${first}.serialNumber`] ??= 'This serial number is repeated in the batch';
      errors[`units.${i}.serialNumber`] ??= 'This serial number is repeated in the batch';
    }
  });
  return errors;
}

/** Today as `YYYY-MM-DD` in local time — the Purchased Date's `max`. */
export function today(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
