import type { InputHTMLAttributes } from 'react';

/** The 46px catalog / inventory search field. Ringed rather than shadowed,
 *  following the source's rule that interactive inputs get the ring. */
export function Search({
  placeholder = 'Search supplies by name or category',
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div
      className={`flex h-control-height-lg items-center gap-10 overflow-hidden rounded-10 bg-surface-card px-16 ring-default text-ink-secondary transition-osrs focus-within:ring-brand ${className ?? ''}`}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true" className="shrink-0">
        <circle cx="8.25" cy="8.25" r="6" stroke="currentColor" strokeWidth="1" />
        <path d="M 12.5 12.5 L 15.75 15.75" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      </svg>
      <input
        type="search"
        placeholder={placeholder}
        className="min-w-0 flex-1 border-none bg-transparent font-sans text-14 leading-tight text-ink-primary outline-none placeholder:text-ink-secondary"
        {...rest}
      />
    </div>
  );
}
