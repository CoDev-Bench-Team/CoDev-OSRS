import { useId, useState, type FormEvent } from 'react';
import { Button, Field, FieldGroup, Select, SidePanel, TextArea, TextInput, usePanelTask, type TaskCopy } from '../../shared/ui';
import { fieldErrors, isValidationProblem } from '../../shared/validation';
import { CATEGORY_FIELDS, SPEC_LABEL, SPEC_PLACEHOLDER, draftForCategory, missingFields } from './category-fields';
import { ImageField } from './ImageField';
import { CATEGORIES, SPEC_KEYS, type Asset, type AssetDraft, type Category, type SpecKey } from './types';

/** Add Asset and Update Asset — `03.1 Add Asset - <category>` and the update
 *  panel on the second `03- Assets` frame (spec 014 Stories 2 and 3).
 *
 *  One panel, rendered from `CATEGORY_FIELDS`: the category decides whether
 *  Model is required, optional or absent and which SPECIFICATIONS rows show.
 *  Every value typed is kept while the category changes, so Laptop → Mice →
 *  Laptop loses nothing; `draftForCategory` drops what the category does not
 *  draw at submit, so a hidden field is never sent.
 *
 *  Description is a single-line field on Add Asset and a 99px multi-line one
 *  on Update Asset, as the two frames draw it.
 *
 *  No location or quantity: stock is units, added on Inventory (ADR-0008).
 *  Both panels end with STOCKS · Low-stock threshold, one per asset; Add Asset
 *  prefills the drawn `5`, the contract's `lowQtyAlert` default (spec 014 D8). */
type FormState = {
  name: string;
  category: Category;
  model: string;
  description: string;
  image?: string;
  specs: Record<SpecKey, string>;
  /** As typed; parsed on submit. */
  lowStockThreshold: string;
};

const DEFAULT_THRESHOLD = 5;

function initial(asset?: Asset): FormState {
  return {
    name: asset?.name ?? '',
    category: asset?.category ?? 'Laptop',
    model: asset?.model ?? '',
    description: asset?.description ?? '',
    image: asset?.image,
    specs: Object.fromEntries(SPEC_KEYS.map((k) => [k, asset?.specs[k] ?? ''])) as Record<SpecKey, string>,
    lowStockThreshold: String(asset?.lowStockThreshold ?? DEFAULT_THRESHOLD),
  };
}

/** Digits only. Blank is not 0, and `Number` would read `0x10` or `1e2` as
 *  whole numbers the Admin never typed; all of them are refused. */
function parseThreshold(typed: string): number {
  const trimmed = typed.trim();
  return /^\d+$/.test(trimmed) ? Number(trimmed) : NaN;
}

/** The error keys the panel can show under a field for this category. */
function shownFields(category: Category): Set<string> {
  const rule = CATEGORY_FIELDS[category];
  return new Set([
    'name',
    'category',
    'description',
    'image',
    'lowStockThreshold',
    ...(rule.model === 'absent' ? [] : ['model']),
    ...rule.specs.map((key) => `specs.${key}`),
  ]);
}

const MODEL_PLACEHOLDER = 'e.g. Latitude 7440';
const DESCRIPTION_PLACEHOLDER = 'What it is and who it is for';

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
  const rule = CATEGORY_FIELDS[form.category];
  const formId = useId();
  // The save. Closing the panel while it runs hands it to a toast, which
  // reports how it ended; the panel then shows nothing of it.
  const task = usePanelTask();
  const saving = task.busy;

  /** `errorKey` is the message the edit clears: the field's own, or for a
   *  specification row its `specs.<key>`. */
  const set = <K extends keyof FormState>(key: K, value: FormState[K], errorKey: string = key) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => {
      if (!(errorKey in e)) return e;
      const next = { ...e };
      delete next[errorKey];
      return next;
    });
  };

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (task.inFlight()) return; // a second press, dropped
    const draft = draftForCategory({ ...form, lowStockThreshold: parseThreshold(form.lowStockThreshold) });
    const missing = missingFields(draft);
    if (Object.keys(missing).length) {
      setErrors(missing);
      return;
    }
    const name = draft.name.trim() || 'The asset';
    const copy: TaskCopy<unknown> = {
      loading: updating ? `Saving ${name}…` : `Adding ${name}…`,
      success: () => ({ title: updating ? `${name} saved` : `${name} added` }),
      failure: (error) => ({
        title: updating ? `${name} could not be saved` : `${name} could not be added`,
        body: isValidationProblem(error)
          ? `${Object.values(fieldErrors(error))[0] ?? 'A field was refused.'} Open the asset to correct it.`
          : 'Nothing was changed. Try again.',
      }),
    };
    const result = await task.run('save', copy, () => onSave(draft));
    if (result.detached) return;
    if (result.ok) {
      onClose();
      return;
    }
    const { error } = result;
    if (isValidationProblem(error)) {
      const mapped = fieldErrors(error);
      const shown = shownFields(draft.category);
      const unshown = Object.keys(mapped).find((key) => !shown.has(key));
      setErrors(unshown === undefined ? mapped : { ...mapped, '': `The asset could not be saved: ${mapped[unshown]}` });
    } else {
      console.error('[assets] save failed', error);
      setErrors({ '': 'The asset could not be saved. Try again' });
    }
  }

  return (
    <SidePanel
      title={title}
      onClose={onClose}
      header={<h2 className="font-display text-[22px] font-medium leading-display text-ink-primary">{title}</h2>}
      bodyClassName="px-14 pt-10 pb-24"
      footerClassName="border-t border-osrs-border-warm px-16 pt-9 pb-8"
      busy={saving}
      onLeave={() => task.handOff()}
      footer={
        <div className="flex items-center justify-center gap-12">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form={formId} disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      }
    >
      <form id={formId} onSubmit={(e) => void submit(e)} noValidate>
        {/* While saving, every control in the form is disabled at once: the
            fieldset disables its inputs, the textarea, the Category select and
            the image buttons, and the base `[disabled]` rule dims it and stops
            pointer input, image drops included. */}
        <fieldset disabled={saving} aria-busy={saving || undefined} className="m-0 flex min-w-0 flex-col gap-32 border-0 p-0">
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
              {({ id, required, invalid, describedBy }) => (
                <Select
                  id={id}
                  label="Category"
                  size="field"
                  required={required}
                  invalid={invalid}
                  describedBy={describedBy}
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
              {({ id, invalid, describedBy }) => {
                const shared = {
                  id,
                  invalid,
                  'aria-describedby': describedBy,
                  value: form.description,
                  onChange: (e: { target: { value: string } }) => set('description', e.target.value),
                  placeholder: DESCRIPTION_PLACEHOLDER,
                };
                return updating ? <TextArea {...shared} className="h-[99px] py-12!" /> : <TextInput {...shared} />;
              }}
            </Field>
          </FieldGroup>

          {rule.specs.length ? (
            <FieldGroup heading="SPECIFICATIONS">
              {rule.specs.map((key) => (
                <Field key={key} label={SPEC_LABEL[key]} error={errors[`specs.${key}`]}>
                  {({ id, invalid, describedBy }) => (
                    <TextInput
                      id={id}
                      invalid={invalid}
                      aria-describedby={describedBy}
                      placeholder={SPEC_PLACEHOLDER[key]}
                      value={form.specs[key]}
                      onChange={(e) => set('specs', { ...form.specs, [key]: e.target.value }, `specs.${key}`)}
                    />
                  )}
                </Field>
              ))}
            </FieldGroup>
          ) : null}

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
        </fieldset>
      </form>
    </SidePanel>
  );
}
