import { useId, useRef, useState, type DragEvent } from 'react';

/** The Add / Update Asset uploader: `Drop file or browse`, `Format: .jpeg,
 *  .png & Max file size: 25 MB`.
 *
 *  The file is read into a data URI, the form the contract's `imageBase64`
 *  takes. A refused file never replaces the current image; the reason shows
 *  beneath the box, as a field's error does. */
const ACCEPTED = ['image/jpeg', 'image/png'];
const MAX_BYTES = 25 * 1024 * 1024;

export function ImageField({
  value,
  onChange,
  error,
}: {
  value?: string;
  onChange: (dataUri: string | undefined) => void;
  /** A refusal from the source, e.g. `#/image`. */
  error?: string;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [refusal, setRefusal] = useState<string>();
  const [dragging, setDragging] = useState(false);
  const message = refusal ?? error;

  const accept = (file: File | undefined) => {
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      setRefusal('Choose a .jpeg or .png file');
      return;
    }
    if (file.size > MAX_BYTES) {
      setRefusal('Choose a file of 25 MB or less');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setRefusal(undefined);
      onChange(typeof reader.result === 'string' ? reader.result : undefined);
    };
    reader.onerror = () => setRefusal('That file could not be read');
    reader.readAsDataURL(file);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    accept(e.dataTransfer.files[0]);
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <span id={`${id}-label`} className="font-sans text-11 font-bold text-osrs-ink-800">
        Image
      </span>
      {value ? (
        <div className="flex items-center gap-12 rounded-6 border border-osrs-border-warm p-10">
          <img src={value} alt="" className="h-[64px] w-[64px] shrink-0 rounded-6 object-cover" />
          <div className="flex flex-1 flex-wrap items-center gap-12">
            <button
              type="button"
              onClick={() => input.current?.click()}
              className="cursor-pointer border-none bg-transparent p-0 type-ui-bold text-ink-link"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={() => onChange(undefined)}
              className="cursor-pointer border-none bg-transparent p-0 type-ui text-ink-secondary hover:text-ink-strong"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`flex flex-col items-center justify-center gap-6 rounded-6 border border-dashed px-12 py-20 text-center transition-osrs ${
            dragging ? 'border-brand-primary bg-status-rejected-bg' : message ? 'border-status-rejected-fg' : 'border-osrs-border-warm'
          }`}
        >
          <p className="type-meta text-osrs-ink-800">
            Drop file or{' '}
            <button
              type="button"
              aria-describedby={`${id}-label ${id}-hint`}
              onClick={() => input.current?.click()}
              className="cursor-pointer border-none bg-transparent p-0 type-meta font-bold text-ink-link underline"
            >
              browse
            </button>
          </p>
          <p id={`${id}-hint`} className="type-caption text-ink-secondary">
            Format: .jpeg, .png &amp; Max file size: 25 MB
          </p>
        </div>
      )}
      <input
        ref={input}
        type="file"
        accept=".jpeg,.jpg,.png,image/jpeg,image/png"
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          accept(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      {message ? <span className="type-meta leading-body text-status-rejected-fg">{message}</span> : null}
    </div>
  );
}
