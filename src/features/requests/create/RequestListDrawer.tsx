import { useEffect, useId, useRef, type FormEvent } from 'react';
import { Button, focusRequestListMarkerIfIdle, MdiClipboardTextOutline, SidePanel, StatusPill } from '../../../shared/ui';
import { useSession } from '../../auth/session-context';
import type { CatalogSource } from '../../catalog/catalog-source';
import type { CatalogOffice } from '../../catalog/types';
import { RefusalAlert } from '../detail/RefusalAlert';
import { NO_PROBLEMS, placeProblems } from './place-problems';
import { useRequestList } from './request-draft';
import { REFUSED_COPY, type RequestSubmitSource, type SubmitResult } from './request-submit-source';
import { RequestListLineRow } from './RequestListLineRow';
import { SubmittedView } from './SubmittedView';

/** The Request List drawer — `03 - Request List` and, after a successful
 *  submit, `03.1 - Request List - Request Submitted` (spec 011).
 *
 *  Three states, one panel (D7): **editing** the list; **submitting**, when
 *  nothing can change, the drawer cannot be closed, and a second submit cannot
 *  be sent (FR-010, FR-010a) — the one-submit guard is the session list's, so
 *  not even a fresh drawer could start another;
 *  and **submitted**, which reads back the request the system created. The
 *  confirmation is a state of the drawer, not a toast, so the id stays on
 *  screen until the Employee closes it. `submitting`, `submitted` and a
 *  refusal's messages are all held by the session list, not here: leaving the
 *  Catalog mid-submit closes the drawer (FR-006a) without losing the outcome —
 *  the confirmation or the refusal — which the next open from the marker
 *  shows. Closing the confirmation dismisses it, so the open
 *  after that is editing again — on an empty list, since a submit clears it
 *  (Story 3 AC6).
 *
 *  A refusal leaves the lines and the note exactly as they were (FR-015).
 *  Validation messages go under the field the system's pointer names; anything
 *  else, and every other refusal, goes in one alert at the top (FR-013,
 *  FR-014). The system's words are shown as they came. Focus then moves to the
 *  first thing that needs attention, in reading order — the alert, a line, the
 *  note — whose message is tied to it by `aria-describedby`; and again when the
 *  drawer opens on a refusal that landed while it was closed. */

/** The design draws no empty drawer (additions.md). */
const EMPTY_COPY = 'Your request list is empty. Add supplies from the catalog.';
const UNREACHABLE_COPY = 'Your request was not sent. Check your connection and try again.';

export function RequestListDrawer({
  catalogSource,
  submitSource,
  homeOffice,
}: {
  /** Read on every open, at the Employee's own office, to refresh each line's
   *  bound (FR-006b, D6). */
  catalogSource: CatalogSource;
  submitSource: RequestSubmitSource;
  homeOffice: CatalogOffice | undefined;
}) {
  const { session } = useSession();
  const list = useRequestList();
  const { lines, note, refreshAvailability, submitted, problems, refusals, editProblems: setProblems } = list;
  const heading = useRef<HTMLHeadingElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  const linesRef = useRef<HTMLUListElement>(null);
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const noteId = useId();
  const noteMessageId = `${noteId}-message`;

  // FR-006b: the bound is Available as last read, and it is read on open.
  // A failed read keeps the last one; the system decides at submit anyway.
  useEffect(() => {
    if (!homeOffice) return;
    let live = true;
    catalogSource
      .items(homeOffice)
      .then((items) => {
        if (live) refreshAvailability(new Map(items.map((i) => [i.id, i.available])));
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [catalogSource, homeOffice, refreshAvailability]);

  // The Submit button unmounts on success; keep focus inside the dialog, on
  // the heading that now names the created request.
  useEffect(() => {
    if (submitted) heading.current?.focus();
  }, [submitted]);

  // After a refusal — or on opening onto one held since (D7) — focus the first
  // thing that needs attention. Submit was disabled while in flight, so focus
  // may be on nothing at all. This runs after SidePanel's own opening focus.
  useEffect(() => {
    if (refusals === 0) return;
    const line = linesRef.current?.querySelector<HTMLElement>('li[data-invalid] button:not([disabled])');
    (alertRef.current ?? line ?? (noteRef.current?.getAttribute('aria-invalid') ? noteRef.current : null))?.focus();
  }, [refusals]);

  const busy = list.submitting;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!session || lines.length === 0) return;
    // Sent in list order, so `#/items/N` names row N (D8). A note of only
    // spaces is no note (D16).
    const sent = lines.map(({ assetId, quantity }) => ({ assetId, quantity }));
    const ticket = list.beginSubmit({ lines: sent, note });
    if (ticket === null) return;

    const trimmed = note.trim();
    const draft = { lines: sent, ...(trimmed ? { note: trimmed } : {}) };
    let result: SubmitResult;
    try {
      result = await submitSource.submit(session.user, draft);
    } catch {
      result = { ok: false, reason: 'unreachable' };
    }
    // Through the session list, so the outcome lands even if this drawer was
    // closed by leaving the Catalog while the system was answering (D7).
    if (result.ok) {
      // The Catalog re-reads on the session's success count (FR-011), not
      // here: this drawer, and the Catalog it opened over, may be gone.
      list.endSubmit(ticket, { created: result.request });
      return;
    }
    const placed =
      result.reason === 'invalid'
        ? placeProblems(result.problems, lines.length)
        : { ...NO_PROBLEMS, drawer: [result.reason === 'refused' ? result.message : UNREACHABLE_COPY] };
    // A refusal is never silent (SC-003): an empty message is no message, and
    // one that placed nothing anywhere still says, at the top, that it was
    // refused.
    placed.drawer = placed.drawer.filter((m) => m.trim() !== '');
    if (placed.drawer.length === 0 && placed.note.length === 0 && Object.keys(placed.lines).length === 0) {
      placed.drawer = [REFUSED_COPY];
    }
    list.endSubmit(ticket, { problems: placed });
  };

  // Closing from a route change can leave SidePanel's recorded opener as
  // <body>; the marker that opened the list is where focus belongs (D3).
  // After SidePanel's own return, hence the frame.
  const close = () => {
    list.dismissSubmitted();
    list.closeList();
    requestAnimationFrame(focusRequestListMarkerIfIdle);
  };

  if (submitted) {
    const request = submitted;
    return (
      <SidePanel
        title={`Request ${request.id}`}
        onClose={close}
        header={
          <>
            <h2 ref={heading} tabIndex={-1} className="type-section-title truncate text-ink-heading outline-none">
              {request.id}
            </h2>
            <StatusPill status={request.status} />
          </>
        }
      >
        <SubmittedView request={request} />
      </SidePanel>
    );
  }

  const noteInvalid = problems.note.length > 0;
  const footer = (
    <form onSubmit={submit} className="flex flex-col gap-18" noValidate>
      {/* `Purpose field`: Inter Regular 11 `ink-secondary` label, 6px above a 78px
          r6 box with 12px padding and Inter Regular 12 `ink-strong` text. */}
      <div className="flex flex-col gap-6">
        <label htmlFor={noteId} className="type-caption text-ink-secondary">
          Note to Approver (optional)
        </label>
        <textarea
          ref={noteRef}
          id={noteId}
          rows={4}
          value={note}
          disabled={busy}
          aria-invalid={noteInvalid || undefined}
          aria-describedby={noteInvalid ? noteMessageId : undefined}
          onChange={(e) => {
            list.setNote(e.target.value);
            if (noteInvalid) setProblems((p) => ({ ...p, note: [] }));
          }}
          className={`min-h-[78px] w-full resize-y appearance-none rounded-6 border-none bg-surface-card p-12 type-meta text-ink-strong outline-none transition-osrs placeholder:text-ink-muted focus:ring-brand disabled:opacity-60 ${noteInvalid ? 'ring-brand' : 'ring-default'}`}
        />
        {noteInvalid ? (
          <ul id={noteMessageId} className="flex flex-col gap-2">
            {problems.note.map((m) => (
              <li key={m} className="type-meta text-status-rejected-fg">
                {m}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <Button type="submit" variant="accent" className="w-full" disabled={busy || lines.length === 0}>
        {busy ? 'Submitting…' : 'Submit Request'}
      </Button>
    </form>
  );

  return (
    <SidePanel
      title="Request List"
      onClose={close}
      dismissible={!busy}
      header={
        <>
          <MdiClipboardTextOutline size={24} className="shrink-0 text-ink-primary" />
          <h2 className="type-section-title truncate text-ink-heading">Request List</h2>
        </>
      }
      footer={footer}
    >
      {problems.drawer.length > 0 ? <RefusalAlert ref={alertRef} messages={problems.drawer} /> : null}

      {lines.length === 0 ? (
        <p className="type-body text-ink-secondary">{EMPTY_COPY}</p>
      ) : (
        <ul ref={linesRef} className="flex flex-col gap-12" aria-label="Items in your request list">
          {lines.map((line, i) => (
            <RequestListLineRow
              key={line.assetId}
              line={line}
              disabled={busy}
              messages={problems.lines[i] ?? []}
              onQuantity={(q) => {
                list.setQuantity(line.assetId, q);
                if (problems.lines[i]?.length) setProblems((p) => ({ ...p, lines: { ...p.lines, [i]: [] } }));
              }}
              onRemove={() => {
                list.remove(line.assetId);
                // Messages are placed by position, and removing shifts every
                // row after this one; drop them rather than misplace them.
                setProblems((p) => ({ ...p, lines: {} }));
              }}
            />
          ))}
        </ul>
      )}
    </SidePanel>
  );
}
