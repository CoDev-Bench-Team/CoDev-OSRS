import type { ReactNode } from 'react';
import { PageHeader } from '../layout/headings';

/** The shape every shell notice shares: a card on the page surface carrying an
 *  eyebrow, a title, one sentence of explanation, and a way out.
 *
 *  None of the four screens built on it is designed in the source (spec 003's
 *  Known Gaps), so they are deliberately ONE invented layout rather than four.
 *  Every value is a spec 002 token: the card is the system's structural
 *  container — radius 10, card surface, card shadow — and the type roles are
 *  the page title and body the rest of the product uses. Logged in
 *  docs/design-system/additions.md. */
export type NoticeTone = 'neutral' | 'info' | 'stopped';

const EYEBROW_TONE: Record<NoticeTone, string> = {
  neutral: 'bg-surface-table-header text-ink-secondary',
  info: 'bg-status-info-bg text-status-info-fg',
  stopped: 'bg-status-rejected-bg text-status-rejected-fg',
};

export function Notice({
  eyebrow,
  tone = 'neutral',
  title,
  body,
  actions,
  children,
}: {
  eyebrow: string;
  tone?: NoticeTone;
  title: string;
  body?: string;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex w-full justify-center py-32">
      <div className="flex w-full max-w-[629px] flex-col items-start gap-20 rounded-10 bg-surface-card p-32 shadow-card">
        <span className={`inline-flex items-center rounded-pill px-10 py-6 type-eyebrow uppercase ${EYEBROW_TONE[tone]}`}>
          {eyebrow}
        </span>
        <PageHeader title={title} subtitle={body} />
        {children}
        {actions ? <div className="flex flex-wrap items-center gap-12">{actions}</div> : null}
      </div>
    </div>
  );
}
