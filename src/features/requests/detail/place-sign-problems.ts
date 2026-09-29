import type { FieldProblem } from '../../../shared/validation';

/** Where each validation message goes on the Accountability Form (spec 012
 *  FR-011, D13): under the checkbox, under the name, or at the top of the form.
 *
 *  **The pointer table is empty on purpose.** The backend contract does not
 *  yet name the form's fields (contracts/README.md conflict 5), and the SPA
 *  must not guess them (constitution VII), so every message goes to the top of
 *  the form for now. K3 (BEN-140) fills `FIELD_FOR` from the published
 *  contract, e.g. its pointer for the typed name → `'fullName'`.
 *
 *  Identical messages for one place are shown once, as the Request List does
 *  (spec 011 D14). */
export type PlacedSignProblems = {
  agreed: string[];
  fullName: string[];
  form: string[];
};

export const NO_SIGN_PROBLEMS: PlacedSignProblems = { agreed: [], fullName: [], form: [] };

/** Decoded pointer path (joined with `/`) → the form field it names. */
const FIELD_FOR: Readonly<Record<string, 'agreed' | 'fullName'>> = {};

export function placeSignProblems(problems: readonly FieldProblem[]): PlacedSignProblems {
  const placed: PlacedSignProblems = { agreed: [], fullName: [], form: [] };
  for (const { path, detail } of problems) {
    const into = placed[FIELD_FOR[path.join('/')] ?? 'form'];
    if (!into.includes(detail)) into.push(detail);
  }
  return placed;
}
