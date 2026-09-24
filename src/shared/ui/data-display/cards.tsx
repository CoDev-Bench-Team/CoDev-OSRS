import type { ReactNode } from 'react';
import { tableColumnStyle } from './table-columns';

/** Promoted from the UI kit (spec 002 FR-006). The metric is the one place
 *  besides links and the active nav item where brand red carries data. */
export function SummaryCard({ value, label }: { value: ReactNode; label: string }) {
  return (
    <div className="flex min-h-[103px] flex-1 flex-col items-start gap-7 rounded-10 bg-surface-card p-22 shadow-card">
      <span className="type-metric text-brand-primary">{value}</span>
      <span className="font-sans text-13 leading-tight text-ink-secondary">{label}</span>
    </div>
  );
}

/** Structural containers get the shadow; data rows inside get borders. Never
 *  a shadow and a ring on the same element. */
export function TableCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col overflow-hidden rounded-10 bg-surface-card shadow-card ${className ?? ''}`}>
      {children}
    </div>
  );
}

/** Column headings are ALL CAPS, 11px bold, on the cool header surface — the
 *  warm-page / cool-header pairing is the design system's signature. Size row
 *  cells with the same `tableColumnStyle` so they line up under these. */
export function TableHead({ cols }: { cols: [label: string, width?: string][] }) {
  return (
    <div className="flex bg-surface-table-header px-20 py-14">
      {cols.map(([label, width]) => (
        <span key={label} className="type-eyebrow uppercase text-ink-secondary" style={tableColumnStyle(width)}>
          {label}
        </span>
      ))}
    </div>
  );
}
