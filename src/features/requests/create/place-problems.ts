import type { FieldProblem } from '../../../shared/validation';

/** Where each validation message goes in the Request List drawer (spec 011
 *  FR-013, FR-013a, D14).
 *
 *  - `#/purpose` names the note — the contract's name for Note to Approver.
 *  - `#/items/N/…` names the Nth submitted line, which is row N of the drawer,
 *    because lines are sent in list order.
 *  - Everything else — `#/items` itself, the whole document, a path the drawer
 *    has no field for, a line index it does not have — goes to the top of the
 *    drawer, so nothing the system said is dropped.
 *
 *  Identical messages for one place are shown once: the contract's own example
 *  repeats the same `detail` three times. */
export type PlacedProblems = {
  note: string[];
  lines: Record<number, string[]>;
  drawer: string[];
};

/** Nothing to show: the state before any refusal, and after a success. */
export const NO_PROBLEMS: PlacedProblems = { note: [], lines: {}, drawer: [] };

export function placeProblems(problems: readonly FieldProblem[], lineCount: number): PlacedProblems {
  const placed: PlacedProblems = { note: [], lines: {}, drawer: [] };
  const push = (into: string[], detail: string) => {
    if (!into.includes(detail)) into.push(detail);
  };

  for (const { path, detail } of problems) {
    const [head, index] = path;
    if (head === 'purpose' && path.length === 1) {
      push(placed.note, detail);
      continue;
    }
    if (head === 'items' && index !== undefined && /^\d+$/.test(index)) {
      const n = Number(index);
      if (n < lineCount) {
        placed.lines[n] ??= [];
        push(placed.lines[n], detail);
        continue;
      }
    }
    push(placed.drawer, detail);
  }
  return placed;
}
