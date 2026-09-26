/** The Employee's Request List, before submit (spec 011).
 *
 *  Feature-local, client-held, never a backend shape. Nothing here reaches the
 *  system until submit, and adding to it reserves nothing (FR-001,
 *  constitution III). */

/** One line per asset (FR-002). The row draws the `category` as an eyebrow
 *  over the `name` (`03 - Request List`, edited 2026-09-23). `model` is not
 *  drawn and nothing reads it today — the confirmation's "<name> - <model>"
 *  line comes from the returned request, never the draft (D8a). It is kept,
 *  with `name`, as the SPA-side display data D8a's accepted risk may need if
 *  the live 201 carries only asset ids and quantities; it is never sent.
 *  `available` is the item's Available at the Employee's office as last read —
 *  the bound the stepper's `+` stops at (FR-003, D5). */
export type RequestListLine = {
  assetId: string;
  category: string;
  name: string;
  model: string;
  quantity: number;
  available: number;
};

/** What the drawer hands a submit source: the lines as asset + quantity, and
 *  the note. Nothing beyond what the published `CreateRequestDto` carries, but
 *  not its wire shape — the DTO names these `items` (with numeric `assetId`s)
 *  and `purpose`, and the live source maps names and types (FR-017, D16). No
 *  office: the system decides it. */
export type RequestListDraftInput = {
  lines: { assetId: string; quantity: number }[];
  note?: string;
};
