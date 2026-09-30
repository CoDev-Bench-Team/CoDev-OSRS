import { useId, useState, type FormEvent } from 'react';
import { Button, Field, FieldGroup, Select, SidePanel, TextArea, TextInput } from '../../shared/ui';
import { fieldErrors, isValidationProblem } from '../../shared/validation';
import { CATEGORY_FIELDS, SPEC_LABEL, draftForCategory, missingFields } from './category-fields';
import { ImageField } from './ImageField';
import { CATEGORIES, SPEC_KEYS, type Asset, type AssetDraft, type Category, type CustomSpec, type SpecKey } from './types';

/** Add Asset and Update Asset — `03.1 Add Asset - <category>` and the update
 *  panel on the second `03- Assets` frame (spec 014 Stories 2 and 3).
 *
 *  One panel, rendered from `CATEGORY_FIELDS`: the category decides whether
 *  Model is required, optional or absent and which SPECIFICATIONS rows show.
 *  Every value typed is kept while the category changes, so Laptop → Mice →
 *  Laptop loses nothing; `draftForCategory` drops what the category does not
 *  draw at submit, so a hidden field is never sent.
 *
 *  No location or quantity: stock is units, added on Inventory (ADR-0008).
 *  Update Asset ends with STOCKS · Low-stock threshold, one per asset
 *  (drift-2026-09-26 §2, spec 014 D8); Add Asset draws none, so a new asset
 *  takes the source's default. The custom-spec rows are Update-only, as drawn,
 *  and have no contract field (spec 014 D7). */
type FormState = {
  name: string;
  category: Category;
  model: string;
  description: string;
  image?: string;
  specs: Record<SpecKey, string>;
  customSpecs: CustomSpec[];
  /** As typed; parsed on submit. Update only. */
  lowStockThreshold: string;
};

function initial(asset?: Asset): FormState {
  return {
    name: asset?.name ?? '',
    category: asset?.category ?? 'Laptop',
    model: asset?.model ?? '',
    description: asset?.description ?? '',
    image: asset?.image,
    specs: Object.fromEntries(SPEC_KEYS.map((k) => [k, asset?.specs[k] ?? ''])) as Record<SpecKey, string>,
    customSpecs: asset?.customSpecs.map((s) => ({ ...s })) ?? [],
    lowStockThreshold: asset ? String(asset.lowStockThreshold) : '',
  };
}

/** Blank is not 0: it is refused, as any non-whole number is. */
function parseThreshold(typed: string): number {
  return typed.trim() === '' ? NaN : Number(typed);
}

const MODEL_PLACEHOLDER = 'e.g. Latitude 7440';

export function AssetFormPanel({
  asset,
  onClose,
  onSave,
}: {
  /** Present to update; absent to add. */
  asset?: Asset;
  onClose: () => void;
  onSave: (draft: AssetDraft) => Promise<unknown>;
}) {
  const updating = !!asset;
  const title = updating ? 'Update Asset' : 'Add Asset';
  const [form, setForm] = useState<FormState>(() => initial(asset));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const rule = CATEGORY_FIELDS[form.category];
  const formId = useId();

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => {
      if (!(key in e)) return e;
      const next = { ...e };
      delete next[key];
      return next;
    });
  };

  const setCustom = (index: number, patch: Partial<CustomSpec>) =>
    set(
      'customSpecs',
      form.customSpecs.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    );

  async function submit(event: FormEvent) {
    event.preventDefault();
    // Blank custom rows are dropped from the form too, so an error's
    // `customSpecs.<i>` index names the same row on screen as in the draft.
    const kept = { ...form, customSpecs: form.customSpecs.filter((s) => s.key.trim() || s.value.trim()) };
    setForm(kept);
    const draft = draftForCategory({
      ...kept,
      lowStockThreshold: updating ? parseThreshold(kept.lowStockThreshold) : undefined,
    });
    const missing = missingFields(draft);
    if (Object.keys(missing).length) {
      setErrors(missing);
      return;
    }
    setSaving(true);
    try {
      await onSave(draft);
      onClose();
    } catch (error) {
      if (isValidationProblem(error)) {
        setErrors(fieldErrors(error));
      } else {
        console.error('[assets] save failed', error);
        setErrors({ '': 'The asset could not be saved. Try again' });
      }
      setSaving(false);
    }
  }

  return (
    <SidePanel
      title={title}
      onClose={onClose}
      header={<h2 className="font-display text-[22px] font-medium leading-display text-ink-primary">{title}</h2>}
      footer={
        <div className="flex items-center justify-center gap-12 border-t border-line-default pt-16">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form={formId} disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      }
    >
      <form id={formId} onSubmit={(e) => void submit(e)} noValidate className="flex flex-col gap-32">
        {errors[''] ? (
          <p role="alert" className="rounded-6 bg-status-rejected-bg px-12 py-10 type-meta leading-body text-status-rejected-fg">
            {errors['']}
          </p>
        ) : null}

        <FieldGroup heading="BASICS">
          <ImageField value={form.image} onChange={(v) => set('image', v)} error={errors.image} />
          <Field label="Item Name" required error={errors.name}>
            {({ id, required, invalid, describedBy }) => (
              <TextInput
                id={id}
                required={required}
                invalid={invalid}
                aria-describedby={describedBy}
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="e.g. Dell Latitude 7440"
              />
            )}
          </Field>
          <Field label="Category" required error={errors.category}>
            {({ id }) => (
              <Select
                id={id}
                label="Category"
                options={[...CATEGORIES]}
                value={form.category}
                onChange={(v) => set('category', v as Category)}
              />
            )}
          </Field>
          {rule.model !== 'absent' ? (
            <Field label="Model" required={rule.model === 'required'} error={errors.model}>
              {({ id, required, invalid, describedBy }) => (
                <TextInput
                  id={id}
                  required={required}
                  invalid={invalid}
                  aria-describedby={describedBy}
                  value={form.model}
                  onChange={(e) => set('model', e.target.value)}
                  placeholder={MODEL_PLACEHOLDER}
                />
              )}
            </Field>
          ) : null}
          <Field label="Description" error={errors.description}>
            {({ id, invalid, describedBy }) => (
              <TextArea
                id={id}
                invalid={invalid}
                aria-describedby={describedBy}
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder="What it is and who it is for"
              />
            )}
          </Field>
        </FieldGroup>

        {rule.specs.length || updating ? (
          <FieldGroup heading="SPECIFICATIONS">
            {rule.specs.map((key) => (
              <Field key={key} label={SPEC_LABEL[key]} error={errors[`specs.${key}`]}>
                {({ id, invalid, describedBy }) => (
                  <TextInput
                    id={id}
                    invalid={invalid}
                    aria-describedby={describedBy}
                    value={form.specs[key]}
                    onChange={(e) => set('specs', { ...form.specs, [key]: e.target.value })}
                  />
                )}
              </Field>
            ))}

            {updating ? (
              <>
                {form.customSpecs.map((spec, i) => (
                  <div key={i} className="flex items-start gap-8">
                    <Field label="Specification" required className="flex-1" error={errors[`customSpecs.${i}.key`]}>
                      {({ id, required, invalid, describedBy }) => (
                        <TextInput
                          id={id}
                          required={required}
                          invalid={invalid}
                          aria-describedby={describedBy}
                          value={spec.key}
                          onChange={(e) => setCustom(i, { key: e.target.value })}
                          placeholder="e.g. External Keyboard"
                        />
                      )}
                    </Field>
                    <Field label="Value" className="flex-1" error={errors[`customSpecs.${i}.value`]}>
                      {({ id, invalid, describedBy }) => (
                        <TextInput
                          id={id}
                          invalid={invalid}
                          aria-describedby={describedBy}
                          value={spec.value}
                          onChange={(e) => setCustom(i, { value: e.target.value })}
                        />
                      )}
                    </Field>
                    <button
                      type="button"
                      aria-label={`Remove ${spec.key || 'this specification'}`}
                      onClick={() => set('customSpecs', form.customSpecs.filter((_, j) => j !== i))}
                      className="mt-[19px] flex h-[39px] cursor-pointer items-center border-none bg-transparent px-4 type-meta text-ink-secondary hover:text-brand-primary"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => set('customSpecs', [...form.customSpecs, { key: '', value: '' }])}
                  className="w-fit cursor-pointer border-none bg-transparent p-0 font-sans text-11-5 font-bold leading-display text-brand-primary-alt transition-osrs hover:text-brand-primary"
                >
                  + Add specification
                </button>
              </>
            ) : null}
          </FieldGroup>
        ) : null}

        {updating ? (
          <FieldGroup heading="STOCKS">
            <Field label="Low-stock threshold" error={errors.lowStockThreshold}>
              {({ id, invalid, describedBy }) => (
                <TextInput
                  id={id}
                  inputMode="numeric"
                  invalid={invalid}
                  aria-describedby={describedBy}
                  value={form.lowStockThreshold}
                  onChange={(e) => set('lowStockThreshold', e.target.value)}
                />
              )}
            </Field>
          </FieldGroup>
        ) : null}
      </form>
    </SidePanel>
  );
}
