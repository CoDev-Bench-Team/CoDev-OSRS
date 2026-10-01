import { useId, useRef, useState, type DragEvent, type ReactNode } from 'react';

/** The Add / Update Asset uploader: `Drop file or browse`, `Format: .jpeg,
 *  .png & Max file size: 25 MB`.
 *
 *  The file is read into a data URI, the form the contract's `imageBase64`
 *  takes. A refused file never replaces the current image; the reason shows
 *  beneath the box, as a field's error does.
 *
 *  Empty, it is the file's `File_uploader`: a 158px white box on the strong
 *  hairline, `mdi-light:cloud-upload` over the bold 14px prompt and the 13.5px
 *  format line. The whole box is one button that opens the file chooser and
 *  takes a dropped file.
 *
 *  With an image, the box shows it and stacks Update Asset's three icon chips
 *  at its right edge: replace, download, remove (drift-2026-10-01 §4, A5). */
const ACCEPTED = ['image/jpeg', 'image/png'];

/** `mdi-light:cloud-upload`, the file's 23x15 outline at (0, 5) in a 24px frame. */
const CLOUD_UPLOAD =
  'M5.5 15C4.041 15 2.642 14.421 1.611 13.389 .579 12.358 0 10.959 0 9.5 0 8.041.579 6.642 1.611 5.611 2.642 4.579 4.041 4 5.5 4 6.5 1.65 8.8 0 11.5 0c3.43 0 6.24 2.66 6.5 6.03L18.5 6C21 6 23 8 23 10.5S21 15 18.5 15H5.5Zm0-10C3 5 1 7 1 9.5S3 14 5.5 14h13c.928 0 1.818-.369 2.475-1.025A3.5 3.5 0 0 0 22 10.5c0-.928-.369-1.818-1.025-2.475A3.5 3.5 0 0 0 18.5 7c-.56 0-1.1.13-1.57.37L17 6.5c0-1.459-.579-2.858-1.611-3.889A5.5 5.5 0 0 0 11.5 1c-1.206.001-2.379.397-3.338 1.129A5.4 5.4 0 0 0 6.19 5.05L5.5 5ZM12 12V6.75L14.25 9 15 8.34l-3.5-3.5L8 8.34l.75.66L11 6.75V12h1Z';
const MAX_BYTES = 25 * 1024 * 1024;

/** The chips' glyphs, redrawn as 1.5px strokes from the file's outlined
 *  geometry on an 18px grid. */
const GLYPH = {
  replace: 'M11.25 10.5 15 6.75 11.25 3M3 15V9.75a3 3 0 0 1 3-3h9',
  download: 'M15.75 11.25v3a1.5 1.5 0 0 1-1.5 1.5H3.75a1.5 1.5 0 0 1-1.5-1.5v-3M5.25 7.5 9 11.25l3.75-3.75M9 11.25v-9',
  remove:
    'M2.25 4.5h13.5M14.25 4.5V15a1.5 1.5 0 0 1-1.5 1.5h-7.5a1.5 1.5 0 0 1-1.5-1.5V4.5M6 4.5V3a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 12 3v1.5M7.5 8.25v4.5M10.5 8.25v4.5',
} as const;

function ImageAction({
  label,
  glyph,
  onClick,
  href,
}: {
  label: string;
  glyph: keyof typeof GLYPH;
  onClick?: () => void;
  href?: string;
}) {
  const danger = glyph === 'remove';
  const body: ReactNode = (
    <span
      className={`flex size-18 items-center justify-center rounded-4 ${
        danger ? 'bg-status-rejected-bg text-status-rejected-fg' : 'bg-brand-primary-alt/10 text-osrs-ink-800'
      }`}
    >
      <svg viewBox="0 0 18 18" className="size-18" fill="none" aria-hidden="true">
        <path d={GLYPH[glyph]} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
  const cls =
    'flex size-[40px] cursor-pointer items-center justify-center rounded-8 border border-line-default bg-surface-card p-0 transition-osrs hover:border-osrs-border-strong';
  return href ? (
    <a href={href} download="asset-image" aria-label={label} title={label} className={cls}>
      {body}
    </a>
  ) : (
    <button type="button" aria-label={label} title={label} onClick={onClick} className={cls}>
      {body}
    </button>
  );
}

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
        <div className="relative h-[158px] overflow-hidden rounded-8 border border-osrs-border-strong">
          <img src={value} alt="" className="size-full object-cover" />
          <div className="absolute top-[11px] right-10 flex flex-col gap-8">
            <ImageAction label="Replace image" glyph="replace" onClick={() => input.current?.click()} />
            <ImageAction label="Download image" glyph="download" href={value} />
            <ImageAction label="Remove image" glyph="remove" onClick={() => onChange(undefined)} />
          </div>
        </div>
      ) : (
        <button
          type="button"
          aria-labelledby={`${id}-label ${id}-prompt`}
          aria-describedby={message ? `${id}-hint ${id}-message` : `${id}-hint`}
          onClick={() => input.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`group flex h-[158px] w-full cursor-pointer flex-col items-center justify-center gap-4 rounded-8 border px-12 text-center transition-osrs ${
            dragging
              ? 'border-brand-primary bg-status-rejected-bg'
              : message
                ? 'border-status-rejected-fg bg-surface-card'
                : 'border-osrs-border-strong bg-surface-card'
          }`}
        >
          <svg viewBox="0 0 24 24" className="size-24 text-osrs-ink-800" fill="currentColor" aria-hidden="true">
            <path transform="translate(0 5)" d={CLOUD_UPLOAD} />
          </svg>
          <span id={`${id}-prompt`} className="font-sans text-14 font-bold leading-tight text-osrs-ink-800">
            Drop file or <span className="group-hover:underline">browse</span>
          </span>
          <span id={`${id}-hint`} className="font-sans text-[13.5px] leading-tight text-ink-secondary">
            Format: .jpeg, .png &amp; Max file size: 25 MB
          </span>
        </button>
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
      {message ? (
        <span id={`${id}-message`} role="alert" className="type-meta leading-body text-status-rejected-fg">
          {message}
        </span>
      ) : null}
    </div>
  );
}
