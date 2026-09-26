import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useRequestListCount } from '../../../app/request-list-count';
import { useSession } from '../../auth/session-context';
import { NO_PROBLEMS, type PlacedProblems } from './place-problems';
import {
  RequestListContext,
  type RequestList,
  type RequestListDraft,
  type SubmitTicket,
  type SubmittedDraft,
} from './request-draft';
import type { EmployeeRequest } from '../detail/request-detail-types';
import type { RequestListLine } from './request-list-types';

/** The Employee's Request List, for the whole signed-in session (spec 010
 *  FR-004a, D1).
 *
 *  Mounted above the routes, so the list survives moving between Catalog, My
 *  Requests and Profile. When the signed-in user changes — sign-out, or a
 *  different account — the list resets to empty. It is reset in place, not by
 *  re-keying this provider: a key here would remount every route beneath it,
 *  and the shell's own role-change handling (spec 003 FR-017b) depends on
 *  staying mounted. Nothing persists across a reload: nothing was reserved, so
 *  nothing is lost on the system side. */
export function RequestListProvider({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const { setCount } = useRequestListCount();
  const owner = session?.user.id;
  const [lines, setLines] = useState<RequestListLine[]>([]);
  const [note, setNote] = useState('');
  const [isOpen, setOpen] = useState(false);
  const [listOwner, setListOwner] = useState(owner);
  /* FR-010: one submit at a time for the whole session, held here rather than
     in the drawer so no remount of the drawer can start a second one. A ref
     for the claim — the check and the claim happen in the same tick as the
     click — holding the ticket of the submit in flight and what it sent; state
     for what the drawer draws (`Submitting…`). */
  const inFlight = useRef<{ ticket: SubmitTicket; sent: SubmittedDraft } | null>(null);
  const lastTicket = useRef(0);
  const [submitting, setSubmitting] = useState(false);
  /* D7: the outcome of the last submit, held for the session rather than in
     the drawer. Leaving the Catalog mid-submit closes the drawer (FR-006a), but
     the submit still settles; the confirmation and its id, or the refusal, wait
     here for the next time the Employee opens the list. */
  const [submitted, setSubmitted] = useState<EmployeeRequest | null>(null);
  const [problems, setProblems] = useState<PlacedProblems>(NO_PROBLEMS);
  const [refusals, setRefusals] = useState(0);
  /* FR-011: counts successful submits, so whichever Catalog is mounted when
     one lands re-reads the stock it moved — including a Catalog mounted after
     the drawer that sent it was closed by leaving mid-submit (D7). */
  const [submissions, setSubmissions] = useState(0);
  if (listOwner !== owner) {
    setListOwner(owner);
    setLines([]);
    setNote('');
    setOpen(false);
    setSubmitting(false);
    setSubmitted(null);
    setProblems(NO_PROBLEMS);
  }
  /* A submit started for one signed-in user must neither block the next one
     nor show them its outcome: dropping its ticket frees the slot and turns
     its `endSubmit` into a no-op. */
  useEffect(() => {
    inFlight.current = null;
  }, [owner]);

  /* The list is the only writer of the shell's badge (spec 003 FR-015), so
     the two cannot disagree (FR-005, D2). The badge is an external system this
     provider keeps in step, which is what the effect is for. */
  useEffect(() => {
    setCount(lines.length);
  }, [lines.length, setCount]);

  /* Every method goes through an updater, so none captures a stale list and
     the value below only changes when the list, note or open state does. */
  const actions = useMemo(
    () => ({
      add: ((item, quantity) => {
        if (quantity <= 0 || item.available <= 0) return;
        setLines((prev) => {
          const i = prev.findIndex((l) => l.assetId === item.id);
          if (i === -1) {
            const line = {
              assetId: item.id,
              category: item.category,
              name: item.name,
              model: item.model,
              quantity: Math.min(quantity, item.available),
              available: item.available,
            };
            return [...prev, line];
          }
          // FR-002: merge, capped at Available — and never lowered by the add.
          const line = prev[i];
          const merged = Math.max(line.quantity, Math.min(line.quantity + quantity, item.available));
          const next = [...prev];
          next[i] = { ...line, quantity: merged, available: item.available };
          return next;
        });
      }) satisfies RequestListDraft['add'],
      setNote,
      setQuantity: (assetId: string, quantity: number) =>
        setLines((prev) =>
          prev.map((line) => {
            if (line.assetId !== assetId) return line;
            const raised = quantity > line.quantity;
            const bounded = raised
              ? Math.min(quantity, Math.max(line.quantity, line.available))
              : Math.max(1, Math.trunc(quantity));
            return { ...line, quantity: bounded };
          }),
        ),
      remove: (assetId: string) => setLines((prev) => prev.filter((l) => l.assetId !== assetId)),
      refreshAvailability: (available: ReadonlyMap<string, number>) =>
        setLines((prev) => prev.map((line) => ({ ...line, available: available.get(line.assetId) ?? 0 }))),
      openList: () => setOpen(true),
      closeList: () => setOpen(false),
      beginSubmit: (sent: SubmittedDraft) => {
        if (inFlight.current !== null) return null;
        const ticket = ++lastTicket.current;
        inFlight.current = { ticket, sent };
        setSubmitting(true);
        setProblems(NO_PROBLEMS);
        return ticket;
      },
      endSubmit: (ticket: SubmitTicket, outcome: { created: EmployeeRequest } | { problems: PlacedProblems }) => {
        if (inFlight.current?.ticket !== ticket) return;
        const { sent } = inFlight.current;
        inFlight.current = null;
        setSubmitting(false);
        if ('created' in outcome) {
          // FR-011: a created request takes what it sent out of the list. Only
          // that: an item added after leaving the Catalog mid-submit (D7) was
          // never sent, so it stays — as a line of its own, or as the part of
          // a merged line above the quantity that was sent.
          const sentQuantity = new Map(sent.lines.map((l) => [l.assetId, l.quantity]));
          setLines((prev) =>
            prev.flatMap((line) => {
              const left = line.quantity - (sentQuantity.get(line.assetId) ?? 0);
              return left > 0 ? [{ ...line, quantity: left }] : [];
            }),
          );
          setNote((prev) => (prev === sent.note ? '' : prev));
          setSubmitted(outcome.created);
          setSubmissions((n) => n + 1);
        } else {
          // FR-015: a refusal keeps the list and the note as they were.
          setProblems(outcome.problems);
          setRefusals((n) => n + 1);
        }
      },
      editProblems: setProblems,
      dismissSubmitted: () => setSubmitted(null),
    }),
    [],
  );

  const value: RequestList = useMemo(
    () => ({ ...actions, lines, note, isOpen, submitting, submitted, problems, refusals, submissions }),
    [actions, lines, note, isOpen, submitting, submitted, problems, refusals, submissions],
  );

  return <RequestListContext value={value}>{children}</RequestListContext>;
}
