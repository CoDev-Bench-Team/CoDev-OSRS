import type { ReactNode } from 'react';
import { tableColumnStyle, TABLE_ROW_PADDING_CLASS, type ColumnWidth } from './table-columns';

const METRIC_TONE = { brand: 'text-brand-primary', neutral: 'text-osrs-ink-800' } as const;

/** `regular` is the UI kit's 103px card, 22px all round. `compact` is the
 *  262x75 card `02 - Requests Queue` draws beside its header: the same 22px
 *  sides and 7px gap, but 8px top and bottom (drift-2026-09-24 §7). The 75px
 *  floor restates the file's height: its text boxes carry taller line-heights
 *  than the shared type styles, which other screens depend on. */
const CARD_SIZE = { regular: 'min-h-[103px] p-22', compact: 'min-h-[75px] px-22 py-8' } as const;

/** Promoted from the UI kit (spec 002 FR-006). The metric is the one place
 *  besides links and the active nav item where brand red carries data.
 *
 *  `neutral` sets the value in ink rather than red. `02 - Requests Queue`
 *  reserves red for the metric that asks for action (Pending approval) and
 *  binds the others to the `Ink-900` style. */
export function SummaryCard({
  value,
  label,
  tone = 'brand',
  size = 'regular',
}: {
  value: ReactNode;
  label: string;
  tone?: 'brand' | 'neutral';
  size?: 'regular' | 'compact';
}) {
  return (
    <div className={`flex flex-1 flex-col items-start gap-7 rounded-10 bg-surface-card shadow-card ${CARD_SIZE[size]}`}>
      <span className={`type-metric ${METRIC_TONE[tone]}`}>{value}</span>
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
export function TableHead({ cols }: { cols: [label: string, width?: ColumnWidth][] }) {
  return (
    <div className={`flex bg-surface-table-header ${TABLE_ROW_PADDING_CLASS} py-14`}>
      {cols.map(([label, width]) => (
        <span key={label} className="type-eyebrow uppercase text-ink-secondary" style={tableColumnStyle(width)}>
          {label}
        </span>
      ))}
    </div>
  );
}
