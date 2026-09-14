import type { ReactNode } from 'react';
import { SectionTitle } from '../layout/headings';

export function Section({ id, title, note, children }: { id: string; title: string; note?: string; children: ReactNode }) {
  return (
    <section id={id} className="flex scroll-mt-32 flex-col gap-16 border-t border-line-default pt-28">
      <div className="flex flex-col gap-4">
        <SectionTitle>{title}</SectionTitle>
        {note ? <p className="type-body max-w-[70ch] text-ink-body">{note}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function Row({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <div className="flex flex-col gap-8">
      {label ? <span className="type-eyebrow uppercase text-ink-secondary">{label}</span> : null}
      <div className="flex flex-wrap items-center gap-16">{children}</div>
    </div>
  );
}

export function Swatch({ token, name }: { token: string; name: string }) {
  return (
    <div className="flex w-[168px] flex-col gap-6">
      <span className="h-[56px] w-full rounded-8 ring-default" style={{ backgroundColor: `var(${token})` }} />
      <span className="font-sans text-12 font-bold leading-tight text-ink-primary">{name}</span>
      <code className="rounded-4 bg-surface-subtle px-4 py-2 font-sans text-11 leading-tight text-ink-secondary">
        {token}
      </code>
    </div>
  );
}
