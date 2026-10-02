import type { Category } from '../assets/types';

/** Which device fields a category carries, per the project owner's *IT
 *  Inventory Item Details* table (spec 015 D13, FR-011a; plan P7): Serial
 *  Number for every category, required except for Mice and Other Devices;
 *  BitLocker Identifier and Recovery Key/PIN for Laptop only. */
export type DeviceFields = { serial: 'required' | 'optional'; bitlocker: boolean };

export const DEVICE_FIELDS: Record<Category, DeviceFields> = {
  Laptop: { serial: 'required', bitlocker: true },
  Headset: { serial: 'required', bitlocker: false },
  Monitor: { serial: 'required', bitlocker: false },
  Phone: { serial: 'required', bitlocker: false },
  UPS: { serial: 'required', bitlocker: false },
  Mice: { serial: 'optional', bitlocker: false },
  Wifi: { serial: 'required', bitlocker: false },
  'Type C Hub': { serial: 'required', bitlocker: false },
  'Other Devices': { serial: 'optional', bitlocker: false },
};

/** Before a catalog item is chosen, DEVICE DETAILS shows Serial Number only. */
const NO_ITEM: DeviceFields = { serial: 'required', bitlocker: false };

export function deviceFieldsFor(category: Category | undefined): DeviceFields {
  return category ? DEVICE_FIELDS[category] : NO_ITEM;
}

type WithSecrets = { bitlockerIdentifier?: string; recoveryPin?: string };

/** Drops the fields the category does not carry, so a hidden field is never
 *  validated or sent. */
export function stripHidden<D extends WithSecrets>(draft: D, category: Category | undefined): D {
  if (deviceFieldsFor(category).bitlocker) return draft;
  return { ...draft, bitlockerIdentifier: undefined, recoveryPin: undefined };
}
