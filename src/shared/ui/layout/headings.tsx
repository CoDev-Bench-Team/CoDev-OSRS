/** Page titles are sentence case, even multi-word ones, and set in Space
 *  Grotesk Medium at 32/1.3. Subtitles are one sentence with no period. */
export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex max-w-[629px] flex-col gap-8">
      <h1 className="type-page-title text-ink-heading">{title}</h1>
      {subtitle ? <p className="type-body text-ink-body">{subtitle}</p> : null}
    </div>
  );
}

export function SectionTitle({ children, className }: { children: string; className?: string }) {
  return <h2 className={`type-section-title text-ink-heading ${className ?? ''}`}>{children}</h2>;
}
