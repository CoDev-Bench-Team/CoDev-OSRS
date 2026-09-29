import { useId, type ReactNode } from 'react';
import { Avatar, TABLE_ROW_PADDING_CLASS, TableCard, TableHead, tableColumnStyle, type ColumnWidth } from '../../shared/ui';
import type { Office } from '../auth/types';
import { keyedLines, NO_VALUE } from './format';
import { officeLabel } from './queue/review-types';
import { NO_REASON, stoppedReason, type StoppedFacts } from './stopped-reason';

/** The read-back parts more than one request panel draws: the Admin's review
 *  panel (spec 008), the Employee's request panel (spec 007) and the Admin's
 *  History panel (spec 012). Each lives once, so the panels cannot drift apart
 *  (spec 012 plan D7). */

/** Derived, where `User.initials` in auth/types.ts is carried: the request read
 *  models hold only the requestor's name, and the contract has no initials
 *  field to carry (constitution VII). A name that is not two words still gets
 *  its first letter, and an empty one the marker. */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase() || NO_VALUE;
}

/** **REQUESTED BY:** — avatar, name, and `email • Office` (frames `02.2`,
 *  `04 - History`). */
export function RequesterBlock({
  name,
  email,
  office,
}: {
  name: string;
  email?: string;
  office: Office;
}) {
  const headingId = useId();
  return (
    <section className="flex flex-col gap-10" aria-labelledby={headingId}>
      <h3 id={headingId} className="type-eyebrow uppercase text-ink-secondary">
        Requested by:
      </h3>
      <div className="flex items-center gap-12 rounded-10 bg-surface-card p-20 shadow-card">
        <Avatar initials={initials(name)} />
        <div className="flex min-w-0 flex-col gap-4">
          <span className="truncate type-ui-bold text-ink-primary">{name}</span>
          <span className="truncate type-meta text-ink-secondary">
            {[email, officeLabel(office)].filter(Boolean).join(' • ')}
          </span>
        </div>
      </div>
    </section>
  );
}

/** A titled card: the Note to Approver and the pickup location (frames `02.2`,
 *  `04 - History`). */
export function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-8 rounded-10 bg-surface-card p-20 shadow-card">
      <h3 className="type-ui-bold text-ink-primary">{title}</h3>
      {children}
    </section>
  );
}

/** The reason callout: a 1px border, 20px padding, a 9px gap, title Inter 13
 *  bold over reason Inter 12.5 regular (additions.md §3h). */
export function StoppedReason({ request }: { request: StoppedFacts }) {
  const stopped = stoppedReason(request);
  if (!stopped) return null;
  return (
    <section className={`flex flex-col gap-9 rounded-10 border p-20 ${stopped.tone}`}>
      <h3 className="type-ui-bold">{stopped.label}</h3>
      <p className={`font-sans text-12-5 font-regular ${stopped.reason ? '' : 'italic'}`}>{stopped.reason ?? NO_REASON}</p>
    </section>
  );
}

const QTY_WIDTH: ColumnWidth = '50px';

/** **ITEMS REQUESTED** as `ITEM · QTY` (frames `03.1`, `04.1`, `04 - History`).
 *  The heading is `Body 1` with a character override to Inter **Bold** 14 / 1.5
 *  in `Ink-400`, 18px above the table. */
export function ItemsRequested({ lines }: { lines: readonly { description: string; qty: number }[] }) {
  const headingId = useId();
  return (
    <section className="flex flex-col gap-18" aria-labelledby={headingId}>
      <h3 id={headingId} className="font-sans text-14 font-bold leading-body uppercase text-ink-muted">
        Items Requested
      </h3>
      <TableCard>
        <TableHead cols={[['Item'], ['Qty', QTY_WIDTH]]} />
        <ul>
          {keyedLines(lines).map(({ key, line }) => (
            <li key={key} className={`flex items-center border-t border-line-default ${TABLE_ROW_PADDING_CLASS} py-18`}>
              <span style={tableColumnStyle()} className="type-ui-bold-wrap text-ink-primary">
                {line.description}
              </span>
              <span style={tableColumnStyle(QTY_WIDTH)} className="type-ui-bold tabular-nums text-ink-primary">
                {line.qty}
              </span>
            </li>
          ))}
        </ul>
      </TableCard>
    </section>
  );
}
