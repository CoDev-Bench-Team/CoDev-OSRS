import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { Backdrop, Button, BytesizeClose, Field, Select, TextInput } from '../../shared/ui';
import { CATEGORIES, type InventoryItem } from './inventory-data';

/** The catalog-item drawer — figma `04 - Add Item` (113:27374) and
 *  `04 - Update Item` (113:28004).
 *
 *  Both frames draw the same 400px panel over the inventory screen and the
 *  same 50% scrim; only the heading differs, so this is one component with two
 *  entry points rather than two screens. Drawn geometry: a 400px panel with a
 *  left hairline, a 78px header on 16/24 padding with the 22px display title
 *  and the bytesize close glyph, three field groups 32px apart with 14px
 *  between a group's heading and its fields and 12px between fields, and a
 *  centred Cancel / Save Changes pair near the bottom edge.
 *
 *  Fields are initialised to exactly what each frame shows, so the port and
 *  the frame can be compared directly; Update additionally prefills the name,
 *  category and stock of the row that opened it, which is what "update this
 *  item" means and what the duplicated frame does not show.
 *
 *  **Nothing here writes anything.** Saving closes the drawer. Stock movement
 *  is transactional and belongs to the API (constitution III, spec 003
 *  FR-024); this screen is the form, not the arithmetic.
 */
export function ItemDrawer({
  title,
  item,
  onClose,
}: {
  title: string;
  /** Present when updating: the row the drawer was opened from. */
  item?: InventoryItem;
  onClose: () => void;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  const [name, setName] = useState(item?.name ?? '');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState(item?.category ?? 'Office Supplies');
  const [ram, setRam] = useState('10GB');
  const [storage, setStorage] = useState('512GB SSD');
  const [customFields, setCustomFields] = useState<string[]>([]);
  const [initialStock, setInitialStock] = useState(String(item?.total ?? 0));
  const [threshold, setThreshold] = useState('5');

  // A modal has to be operable from the keyboard: Escape leaves, Tab stays
  // inside, and focus starts in the panel rather than behind it. The design
  // file draws no focus behaviour at all — this is an addition.
  useEffect(() => {
    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>('input, button, [role="combobox"]')?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !panel) return;
      const focusable = [...panel.querySelectorAll<HTMLElement>('a[href], button, input, [role="combobox"]')].filter(
        (el) => !el.hasAttribute('disabled') && el.tabIndex !== -1,
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    onClose();
  }

  return (
    <>
      <Backdrop />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="fixed top-0 right-0 z-dialog flex h-dvh w-[400px] max-w-full flex-col border-l border-line-default bg-surface-card"
      >
        <header className="flex shrink-0 items-center justify-between border-b border-line-default px-16 py-24">
          <h2 id={titleId} className="font-display text-[22px] font-medium leading-display text-ink-primary">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="hit-area flex cursor-pointer border-none bg-transparent p-0 text-ink-primary transition-osrs hover:text-brand-primary"
          >
            <BytesizeClose />
          </button>
        </header>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto px-14 pt-10 pb-24">
            <div className="flex flex-col gap-32">
              <Group heading="BASICS">
                <Field label="Item name" required>
                  {({ id, required }) => (
                    <TextInput
                      id={id}
                      required={required}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. External Keyboard"
                    />
                  )}
                </Field>
                <Field label="Brand / model (optional)">
                  {({ id }) => (
                    <TextInput
                      id={id}
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      placeholder="e.g. External Keyboard"
                    />
                  )}
                </Field>
                <Field label="Category" required>
                  {({ id }) => (
                    <Select id={id} size="sm" label="Category" options={CATEGORIES} value={category} onChange={setCategory} />
                  )}
                </Field>
              </Group>

              <Group
                heading="SPECS"
                footer={
                  <button
                    type="button"
                    onClick={() => setCustomFields((fields) => [...fields, ''])}
                    className="w-fit cursor-pointer border-none bg-transparent p-0 font-sans text-11-5 font-bold leading-display text-brand-primary-alt transition-osrs hover:text-brand-primary"
                  >
                    + Add custom field
                  </button>
                }
              >
                <Field label="RAM">
                  {({ id }) => <TextInput id={id} value={ram} onChange={(e) => setRam(e.target.value)} />}
                </Field>
                <Field label="Storage">
                  {({ id }) => <TextInput id={id} value={storage} onChange={(e) => setStorage(e.target.value)} />}
                </Field>
                {/* The frame draws the control but not what it produces, so a
                    custom field is a plain extra spec row until the designer
                    says otherwise (docs/design-system/additions.md). */}
                {customFields.map((value, index) => (
                  <Field key={index} label={`Custom field ${index + 1}`}>
                    {({ id }) => (
                      <TextInput
                        id={id}
                        value={value}
                        onChange={(e) =>
                          setCustomFields((fields) => fields.map((f, i) => (i === index ? e.target.value : f)))
                        }
                      />
                    )}
                  </Field>
                ))}
              </Group>

              <Group heading="STOCKS">
                <Field label="Initial Stock">
                  {({ id }) => (
                    <TextInput
                      id={id}
                      inputMode="numeric"
                      value={initialStock}
                      onChange={(e) => setInitialStock(e.target.value)}
                    />
                  )}
                </Field>
                <Field label="Low-stock threshold">
                  {({ id }) => (
                    <TextInput
                      id={id}
                      inputMode="numeric"
                      value={threshold}
                      onChange={(e) => setThreshold(e.target.value)}
                    />
                  )}
                </Field>
              </Group>
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-center gap-12 px-16 pt-16 pb-[37px]">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}

/** A labelled band of fields: heading, then the fields 12px apart. */
function Group({
  heading,
  footer,
  children,
}: {
  heading: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex w-full flex-col gap-14">
      <h3 className="font-sans text-14 font-bold leading-body text-ink-muted">{heading}</h3>
      <div className="flex w-full flex-col gap-12">{children}</div>
      {footer}
    </section>
  );
}
