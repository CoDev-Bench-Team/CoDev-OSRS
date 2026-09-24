import type { AssetDraft, Category, SpecKey } from './types';

/** The field set each category's Add Asset frame draws (spec 001 FR-002a,
 *  spec 008 D5–D6). This table IS the form: the panel renders from it and the
 *  seeded source validates against it, so a new category is one row.
 *
 *  - `model` — `required` where the frame asterisks it, `optional` where it
 *    draws the field without one, `absent` where it draws none. The live
 *    contract requires `model` for every category (contract conflict 4).
 *  - `specs` — the SPECIFICATIONS rows, in the frame's order.
 *
 *  Monitor has no frame; it takes Headset's shape (spec 008 D4, flagged). */
export type ModelRule = 'required' | 'optional' | 'absent';

export type CategoryFields = { model: ModelRule; specs: readonly SpecKey[] };

export const CATEGORY_FIELDS: Record<Category, CategoryFields> = {
  Laptop: { model: 'required', specs: ['ram', 'storage', 'processor', 'graphics', 'operatingSystem'] },
  Phone: { model: 'required', specs: ['ram', 'storage'] },
  Headset: { model: 'required', specs: [] },
  Monitor: { model: 'required', specs: [] },
  Wifi: { model: 'optional', specs: [] },
  'Type C Hub': { model: 'optional', specs: [] },
  UPS: { model: 'absent', specs: [] },
  Mice: { model: 'absent', specs: [] },
  'Other Devices': { model: 'absent', specs: [] },
};

export const SPEC_LABEL: Record<SpecKey, string> = {
  ram: 'RAM',
  storage: 'Storage',
  processor: 'Processor',
  graphics: 'Graphics',
  operatingSystem: 'Operating System',
};

/** Drops what the category does not draw, so switching Laptop → Mice → Laptop
 *  in the form keeps values on screen but never submits a hidden field. */
export function draftForCategory(draft: AssetDraft): AssetDraft {
  const rule = CATEGORY_FIELDS[draft.category];
  const specs: AssetDraft['specs'] = {};
  for (const key of rule.specs) {
    const value = draft.specs[key]?.trim();
    if (value) specs[key] = value;
  }
  return {
    name: draft.name.trim(),
    category: draft.category,
    model: rule.model === 'absent' ? undefined : draft.model?.trim() || undefined,
    description: draft.description?.trim() || undefined,
    image: draft.image,
    specs,
    customSpecs: draft.customSpecs
      .map((s) => ({ key: s.key.trim(), value: s.value.trim() }))
      .filter((s) => s.key || s.value),
  };
}

/** The required-field check, as field → message. Keys are the contract's
 *  pointer names, so a client-side and a source-side refusal land in the same
 *  place. Run on a draft already passed through `draftForCategory`. */
export function missingFields(draft: AssetDraft): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!draft.name) errors.name = 'Enter the item name';
  if (CATEGORY_FIELDS[draft.category].model === 'required' && !draft.model) errors.model = 'Enter the model';
  draft.customSpecs.forEach((s, i) => {
    if (!s.key) errors[`customSpecs.${i}.key`] = 'Name this specification';
  });
  return errors;
}
