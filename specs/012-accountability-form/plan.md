# Implementation Plan: Accountability Form (Employee confirms receipt on `Received`)

**Date**: 2026-09-26
**Spec**: `specs/012-accountability-form/spec.md`
**Linear**: [BEN-136](https://linear.app/bench-synergy-project/issue/BEN-136); this plan is K1 ([BEN-138](https://linear.app/bench-synergy-project/issue/BEN-138))
**Amended**: 2026-09-29 (constitution 6.0.0, [ADR-0010](../../docs/adr/0010-admin-sets-received-employee-signs.md): the Admin sets `Received`; the form is offered on an unsigned `Received` request and records the acknowledgement without changing the status)
**Status**: Draft

## Summary

Add the Accountability Form to the Employee request panel of spec 007. A **Sign accountability form** link under the timeline switches the same `SidePanel` into a 564px form view, as `04.1` draws it. The view has the request's lines, the eleven conditions in a scrolling box, a required checkbox that unlocks once the box has been scrolled to its end, a required full-name field, and **Cancel** / **I acknowledge and sign**. Signing goes through a new `sign` method on the existing `EmployeeRequestSource` seam. For now a seeded source answers it by setting `Received` with its time. K3 replaces the seeded source with a contract-backed one, and nothing above the seam changes.

## Technical Context

**Stack**: React 19, TypeScript 6 (strict), Vite 8, Tailwind CSS 4
**Primary Dependencies**: existing shared OSRS UI (`SidePanel`, `Button`, `StatusPill`, `StatusTimeline`, `TableCard`), `src/shared/validation.ts` (BEN-98 parser). **No new package.**
**Storage**: none in the SPA. The seeded source's in-memory store is mutable and resets on reload (as spec 007).
**Target Layer**: frontend SPA only
**Performance Goals**: none beyond the panel's existing behaviour; no new network call in K2
**Constraints**: constitution 6.0.0 II/IV (owner-only, unsigned `Received` only, signing changes no status; the Admin sets `Received`) and VII (no invented route, field or error code). No per-unit tags, no *Other Notes*, and no Employee *Complete Request* control (spec 012 FR-001a, Out of Scope). Feature code stays under `src/features/requests/detail/`.

**Design source**: `04.1 - My Requests - View Request`, the 2026-09-26 `.fig`, decoded node by node during planning. Three variants: the pending read view (400px), the read view with the sign link (400px), and the form view (**564×1079**). Type is taken from the **bound style, not the cached value** (drift-2026-09-22 §9). The acknowledgement text caches Inter Bold 11.5, binds **`Body 3`** (Inter Regular 12.5 / 1.45), and has no character overrides, so it is `Body 3`.

## Decisions

| # | Decision | Why |
|---|----------|-----|
| D1 | **Extend the seam, don't add one.** `EmployeeRequestSource` gains `sign(user, id, signature)`. The page's `sign` handler mirrors its `cancel`: call, catch, reload, reconcile. | Spec 012 FR-015. The panel already reads through this seam (spec 007 D1), and K3 swaps one source. |
| D2 | **The panel has three modes**: `read`, `cancel` (spec 007's footer form) and `sign`. In `sign` the header reads **Accountability Form** (`H2`) with no pill. The body is the form, the footer carries the two buttons, and the sheet is 564px. | `04.1`'s form variant: a different title, no pill, a wider sheet. The address is unchanged (FR-002). |
| D3 | **`SidePanel` gains `width?: 'default' \| 'wide'`** (400px / 564px), each applied as `min(<width>, 100vw)`, so the sheet never overflows a narrow viewport. The form's inner 500px blocks become `w-full`. `check-a11y-responsive` gains the form view at 1440px, 768px and 375px, with no horizontal page scroll and every control reachable. | The form is drawn at 564px. One prop, rather than a second sheet. |
| D4 | **The submit button sits in the footer and targets the form with `form={id}`.** | `SidePanel` pins the footer outside the scrolling body (spec 011). The form spans both without restructuring the sheet. |
| D5 | **New shared `forms/Checkbox.tsx`**, from the drawn `.bases / checkbox`: a 24px hit box with a 22px thumb, `r=6` and a 1px inside border in `--color-black` on white. When ticked, the thumb is `--color-black` with a white check. The drawn paints are **unbound** raw `#000000` (resolved during planning), so they take the black token, not an ink or line token. The label sits 4px after it, in `Body 1`, `Ink-900`. It is built on a native `<input type="checkbox">`, visually hidden, so keyboard and screen-reader behaviour is the platform's. It has an **invalid state**, which the file does not draw: a `red-600` ring plus one line of message, announced through `aria-describedby`, as `TextField` does. It also has an **unavailable state** for the read gate (D8a), which the file does not draw either. That state uses **`aria-disabled="true"`, never the native `disabled` attribute**. A native disabled input fires no click and cannot take focus, so it could never show the read-first message. While unavailable, the checkbox cancels its change, the thumb takes `Border-Strong` and the label `Ink-400`, and `onBlockedAttempt` fires on click and on Space. | The component is drawn, so it isn't an addition. Only its invalid and unavailable states are (additions §3h). |
| D6 | **New shared `forms/InputField.tsx`**, a labelled one-line `<input>`, as `04.1`'s `Field` draws it: the label is Inter Bold 11 in `Ink-900`, 6px above a 39px box with a 1px `Border` stroke, `r=6`, 12px side padding and Inter Regular 12. It takes `required`, `invalid` and `message` like `TextField`. | A signature is one line. `TextField` is a growing textarea in a card and is drawn differently (`04.2`'s reason block). The two share the `required` / `invalid` / `message` props and the `aria-describedby` wiring, so a caller treats them alike, but not their box. Folding the drawn `Field` into `TextField` as a third tone would make one component draw two unrelated boxes. The JSDoc of each names the other, so the next form picks the right one. |
| D7 | **Extract `RequestLinesTable`** (ITEM / QTY) out of `RequestReadBack`. The read-back renders it under *Items Requested*, and the form under **EQUIPMENT ASSIGNED**, both with the same heading treatment. | FR-003: the same lines the read-back names, and one table that cannot drift. The drawn **PR** column is replaced by **QTY** (ADR-0009 decision 7). |
| D8 | **The conditions live in one constant**, `accountability-conditions.ts`: `04.1`'s lead-in, the project owner's **eleven** items (spec 012 FR-004, amended 2026-09-26) and `04.1`'s closing line, rendered as `<p>` + `<ol>` + `<p>`. They sit in a **412px-tall scrolling box**: 1px border, `r=8`, 10px padding, `Body 3`. The border binds the file's **`Border-Strong`** style (`#d8d7d2`) and caches `#000`, another stale cache, so it is **`--color-osrs-border-strong`**. It is *not* `--color-line-strong`: that token is the vendored `--border-strong`, which is black, and only the name is similar. The box is `tabIndex={0}` with `role="region"` and `aria-label="Acknowledgement"`, so a keyboard user can scroll it. It uses the native scrollbar, not the drawn 10px track. | FR-004 and SC-006. The drawn text overflows its 412px box (a 702px block), so the box scrolls. A native scrollbar is a toolchain call (additions §1). |
| D8a | **Read-to-the-end gate** (FR-005a). `AccountabilityForm` holds `read: boolean`, which starts `false` on every opening. A `useReadToEnd(boxRef)` hook sets it to `true`, **once, and never back**, when `scrollTop + clientHeight >= scrollHeight - 2`. The 2px tolerance absorbs subpixel rounding under zoom. The hook checks on the box's `scroll` event, which fires for wheel, touch, drag, and keyboard scrolling of the focusable region (D8). It also checks on mount and on a `ResizeObserver` of the box, so text that fits, or comes to fit after a resize or zoom, unlocks at once. Until `read`, the checkbox is unavailable (D5). A blocked attempt shows *"Scroll to the end of the acknowledgement and read it before agreeing."* under the checkbox. The message clears when `read` becomes `true`. On submit before `read`, the checkbox's message is that one, not D10's agreement message. | The project owner's requirement (spec 012 Story 2a). A scroll position is the only signal the SPA has; it proves the text was reached, not read (Known Risks 6). The gate lives in the feature, not in `Checkbox`, which only knows it is unavailable. |
| D9 | **Sign link**: a `<button>` styled as the drawn link, placed after the timeline. It has the 16px `boxicons:pen-alt` icon, 4px gap, and `Label 1` (Inter Bold 11.5 / 1.3) in `Codev Red`. It is rendered only when the request is `Received` and has no `signedAt` (FR-001, amended 2026-09-29). Once signed, **D18**'s line takes its place. New icon: `icons/BoxiconsPenAlt.tsx`, with the path taken from the file. | It changes a view and does not navigate, so it is a button. Ownership needs no check in the panel: the page only ever holds the signed-in Employee's own requests (spec 007). |
| D9a | **Focus across the mode switch.** Entering `sign` moves focus to the **Accountability Form** heading (`tabIndex={-1}`, as the panel's id heading is today). **Cancel** returns focus to **Sign accountability form**. A successful sign or a `status-changed` refusal returns focus to the panel heading, or to the `RefusalAlert` when one shows. It is never left on `<body>`. | Spec 012 Story 1 AC3 and FR-014. The switch unmounts whichever control held focus (red-team 3). |
| D10 | **Client-side validation on submit.** `agreed` must be `true`, and `fullName.trim()` must be non-empty. Each unmet field shows its message, and focus moves to the first invalid control. A field's message clears as soon as that field is valid again. Copy: *"Tick the box to confirm you agree to the conditions."* and *"Type your full name to sign."* Before the read gate opens, the checkbox's message is D8a's instead. | FR-005 and FR-006. The copy closes CHK003 and follows the cancel reason's voice (spec 007). |
| D11 | **One signature per open form.** `submitting` state disables both buttons. A `useRef` guard also drops a second activation that lands before the re-render. `SidePanel dismissible={!submitting}`. | FR-008. The panel must not unmount mid-send (the same rule as spec 011 FR-010). |
| D12 | **Outcome handling**, in the panel: **ok**: back to `read`; the page has already reloaded, so the request is still `Received` but now carries `signedAt`: the sign link has gone and D18's signed line shows (FR-009). **`status-changed`**: back to `read`, with the `RefusalAlert` above the read-back showing the source's `detail`, or the SPA's copy when there is none (FR-010). **`invalid`**: stay in `sign`, placing each problem (D13) (FR-011). **`unavailable`** or a throw: stay in `sign` with the values kept, and show a refusal at the top of the form: *"Your signature was not sent. Try again."* (FR-012). | Mirrors spec 007's cancel. Unlike cancel, `unavailable` keeps the form, because the spec asks for a retry. |
| D13 | **`placeSignProblems(problems)`** maps BEN-98 `FieldProblem`s to `{ agreed, fullName, form }`. **The pointer-to-field table is empty in K2.** The contract names no field for the form yet, and constitution VII forbids guessing, so every problem goes to the top of the form. K3 adds the contract's pointers. | FR-011, without inventing `#/fullName`. The function and its fallback ship now; only the table waits. |
| D14 | **Seeded `sign`** refuses, in this order: not an Employee, or a request they don't own → `unavailable`; not agreed, or a blank name → `invalid` with one problem at the whole document; status not `Received`, or already signed → `status-changed`. Otherwise it sets `signedAt: now`, leaves the status alone, and returns the request. It keeps the time only, not the typed name (no read-back of the name; spec 012 Out of Scope). It models no stock (constitution III is the API's). | Mirrors the guards the API will hold, so the demo cannot sign what the backend would refuse. |
| D15 | **Dev stub modes** on `/requests?requests=`: `sign-changes` (signed from another tab meanwhile: refused `status-changed`, and the reload shows the request signed), `sign-invalid` (refused with a BEN-98 body: one whole-document message and one pointer the form doesn't know, both at the top), `sign-fails` (`sign` rejects, so `unavailable` keeps the form), `sign-slow` (`sign` takes 2s, to prove D11). They live in `dev/request-stub.ts`, behind `import.meta.env.DEV`. | What the seed cannot reach, the same way spec 007 reaches its refusal paths. |
| D18 | **The signed line** (FR-009, amended 2026-09-29). A signed `Received` request shows, where the link was, the same 16px pen icon and `Label 1` text in `Ink-400`: *Accountability form signed · \<date, time\>*, using the panel's existing date format. Not a control. | Signing no longer changes the status, so without it nothing tells the Employee the signature landed. Not drawn (additions §3h). |
| D19 | **Mark as Received** (spec 012 Story 0, FR-016–FR-019). A fourth panel mode, `receive`. On an owned `For Delivery` / `Ready for Pickup` request the footer carries a full-width ghost **Mark as Received** (as **Cancel Request** does). Pressing it swaps the footer for the confirmation copy, **Cancel** and **Confirm Received**; the sheet stays 400px. The seam gains `markReceived(user, id): Promise<ReceiveResult>` (`{ ok: true, request }` or `{ ok: false, refusal: 'status-changed' \| 'unavailable', detail? }`). The page handles it as it does `cancel`: catch → `unavailable`, reload, and a `status-changed` whose reload fails → `unavailable`. **ok**: back to `read`, focus to **Sign accountability form**. **`status-changed`**: back to `read`, `RefusalAlert` with `detail` or SPA copy, focus to the alert. **`unavailable`**: back to `read` with *"This request was not marked received. Try again."*, focus to the alert. A `useRef` guard plus disabled buttons send once. The seeded source sets `status: 'Received'` and `receivedAt: now` for the owner on `For Delivery` / `Ready for Pickup`, and refuses otherwise. Dev stub: `receive-changes` (an Admin cancelled it meanwhile). | Constitution 6.0.0 IV lets the owning Employee set `Received`. It assigns units and cannot be undone, so it is confirmed first (Clarifications, 2026-09-29). |
| D16 | **Amend spec 007.** Story 3 and SC-005 ("no control mentions receipt, received, or completion") now read: no control **sets** `Received` or `Completed` directly, and the only receipt control is spec 012's form. `check-request-detail`'s regex already passes: *Sign accountability form* matches none of its patterns. | Constitution I: the older spec contradicts this one, so it is amended rather than overridden silently. |
| D16a | **Re-check `04.1` before K2 starts, and again before the PR.** If the export's `exported_at` is newer than 2026-09-26T02:49:27Z, re-decode `04.1` and diff it against this plan's reading: the Other Notes card, the Complete Request button, the timeline order, and the form's fields and copy. Any change goes to a drift entry first (constitution I). No code is built from an undiffed export. | Red-team 4. Other Notes and the button are waiting on the designer, so the file is expected to move. |
| D17 | **Record the design departures** in `docs/design-system/additions.md` under a new §3h: the checkbox's invalid and unavailable states, the read-to-the-end gate, the project owner's eleven conditions in place of the drawn ten (flagged to the designer), the name field's invalid state, the field messages, the refusal notes, QTY instead of PR, the omitted *Other Notes* card and *Complete Request* button, the native scrollbar, and the header without a pill. | Constitution I: every departure from the file is written down. |

## Data Model

Feature-local read model (`src/features/requests/detail/request-detail-types.ts`), not a backend shape:

- `EmployeeRequest`: **gains `signedAt?: string`**, the time the Accountability Form was signed (2026-09-29). `status: 'Received'` and `receivedAt` already exist (T000g). The contract must carry it too (conflict 5, amended).
- **New** `Signature`: `{ agreed: true; fullName: string }`. `fullName` is sent trimmed (D10). The literal `true` makes an unagreed signature unrepresentable past the form. **`Signature` is a UI type, not a payload.** K3's source translates it into whatever the contract publishes. If the API takes no agreement flag, `agreed` stays a front-end guard and is not sent. If the API takes more fields than the SPA holds, that is a new contract conflict: it is raised and recorded, and nothing is invented to fill it (constitution VII; red-team 1).
- **New** `SignRefusal`: `'status-changed' | 'invalid' | 'unavailable'`.
- **New** `SignResult`: `{ ok: true; request: EmployeeRequest }`, or `{ ok: false; refusal: 'status-changed' | 'unavailable'; detail?: string }`, or `{ ok: false; refusal: 'invalid'; problems: FieldProblem[] }`. `detail` is the system's own message, shown in preference to SPA copy.
- `EmployeeRequestSource` **gains** `sign(user: User, id: string, signature: Signature): Promise<SignResult>` and, since 2026-09-29, `markReceived(user: User, id: string): Promise<ReceiveResult>` (D19).

No migration. No stock is modelled.

## API Contracts

**None in K2.** The published contract has neither `Received` nor a form submission (`specs/001-office-supplies-mvp/contracts/README.md` conflict 5, amended 2026-09-26 by spec 012). `sign` is an internal UI seam, not a proposed REST call, and no route, payload or error code is named here. K3 (BEN-140) maps the backend's published submission into `Signature` / `SignResult`, fills D13's pointer table from the contract, and passes RFC 9457 `detail` through as `detail`.

## Component / Module Breakdown

**Shared UI** (exported from `src/shared/ui/index.ts`, each with a gallery row in `src/shared/ui/gallery/Gallery.tsx`)

- `src/shared/ui/forms/Checkbox.tsx`: **new** (D5)
- `src/shared/ui/forms/InputField.tsx`: **new** (D6)
- `src/shared/ui/icons/BoxiconsPenAlt.tsx`: **new** (D9)
- `src/shared/ui/overlay/SidePanel.tsx`: **modified**, adds `width` (D3)

**Feature** (`src/features/requests/detail/`)

- `request-detail-types.ts`: **modified**, adds `Signature`, `SignResult`, and `sign` on the source
- `RequestLinesTable.tsx`: **new**, extracted from `RequestReadBack` (D7)
- `RequestReadBack.tsx`: **modified**, renders `RequestLinesTable`; its DOM is otherwise unchanged
- `accountability-conditions.ts`: **new**, the FR-004 text (D8)
- `use-read-to-end.ts`: **new**, the gate hook (D8a)
- `AccountabilityForm.tsx`: **new**, the form body (EQUIPMENT ASSIGNED, ACKNOWLEDGEMENT, checkbox, name) plus its footer buttons. It owns validation and field problems (D4, D10, D13)
- `place-sign-problems.ts`: **new** (D13)
- `RequestDetailPanel.tsx`: **modified**, adds the three modes, the sign link, width switching, the sign outcome handling and `dismissible` (D2, D9, D11, D12)
- `seeded-employee-request-source.ts`: **modified**, adds `sign` (D14)
- `dev/request-stub.ts`: **modified**, adds the four sign modes and `sign` passthrough in the existing modes (D15)

**Page** (`src/features/requests/history/MyRequestsPage.tsx`): **modified**. A `sign` handler beside `cancel`: catch → `unavailable`, reload, a `status-changed` whose reload fails → `unavailable`, and a failed reload keeps the list with the signed request swapped in. It is passed to the panel as `onSign`.

**Checks**

- `scripts/check-accountability-form.mjs`: **new**. SC-001 to SC-006 over CDP, like `check-request-detail`. SC-006 reads FR-004 out of `spec.md` and compares it with the rendered box text. Both sides are normalised first: blockquote markers, list numbering and markdown emphasis are stripped, and whitespace is collapsed. So only a change of words fails, and the failure prints a word-level diff of the first mismatch (red-team 5). The check also asserts D9a's focus targets. **SC-006a**: on opening, a click and a Space on the checkbox leave it unticked and show the read-first message. The check then scrolls the box to its end, and the checkbox ticks; after scrolling back to the top, it still ticks. With the root font size shrunk until the text fits its box, a freshly opened form has the checkbox available at once. SC-004 is split, as spec 012 now words it. **SC-004a** (the system's message for a changed request, and messages that name no field shown at the top) is proven in K2 through `?requests=sign-changes` and `?requests=sign-invalid`. **SC-004b** (each message under the field it names) is proven in K3, once the contract names the form's pointers and D13's table is filled.
- `scripts/verify.mjs`: **modified**, adds `['accountability form (spec 012)', 'node', ['scripts/check-accountability-form.mjs']]`.
- `scripts/check-request-detail.mjs`: **unchanged**, and must still pass (SC-007).

**Docs**

- `specs/007-employee-request-panel/spec.md`: amendment session (D16)
- `docs/design-system/additions.md`: §3h (D17)

## Project Structure

```
src/
├── shared/ui/
│   ├── forms/Checkbox.tsx            (new)
│   ├── forms/InputField.tsx          (new)
│   ├── icons/BoxiconsPenAlt.tsx      (new)
│   ├── overlay/SidePanel.tsx         (width prop)
│   ├── gallery/Gallery.tsx           (three rows)
│   └── index.ts                      (exports)
└── features/requests/
    ├── detail/
    │   ├── AccountabilityForm.tsx         (new)
    │   ├── accountability-conditions.ts   (new)
    │   ├── use-read-to-end.ts             (new)
    │   ├── place-sign-problems.ts         (new)
    │   ├── RequestLinesTable.tsx          (new)
    │   ├── RequestDetailPanel.tsx         (modes, link, sign)
    │   ├── RequestReadBack.tsx            (uses RequestLinesTable)
    │   ├── request-detail-types.ts        (Signature, SignResult, sign)
    │   ├── seeded-employee-request-source.ts (sign)
    │   └── dev/request-stub.ts            (sign modes)
    └── history/MyRequestsPage.tsx         (sign handler)
scripts/
├── check-accountability-form.mjs     (new)
└── verify.mjs                        (wired)
```

## Dependencies

- **No new packages.**
- BEN-45 / spec 007 (the panel) and T000g (`Received`, the five-node timeline): both on `dev`.
- K3 depends on the backend publishing `Received` and the submission (conflict 5). K2 does not.

## Requirement coverage

| Spec | Plan |
|------|------|
| FR-001, FR-001a | D9; no Complete control is rendered (D17 records the omission) |
| FR-002 | D2, D3 |
| FR-003 | D7 |
| FR-004 | D8 |
| FR-005, FR-006 | D5, D6, D10 |
| FR-005a | D5 (unavailable state), D8a |
| FR-007 | Data Model `Signature`; D10 trims |
| FR-008 | D11 |
| FR-009 | D12 ok path; page reload |
| FR-010 | D12 `status-changed`; D15 `sign-changes` |
| FR-011 | D13; D15 `sign-invalid` (SC-004a in K2, SC-004b in K3) |
| FR-012 | D12 `unavailable`; D15 `sign-fails` |
| FR-013 | Only the Employee panel gains the form; the Admin queue is untouched |
| FR-014 | D5 and D6 on native controls, D8 focusable region, D9a focus across modes, D10 focus to the first invalid control, D3 responsive gate |
| FR-015 | D1, D14 |
| Edge: panel closed with the form open | Mode is component state; unmount discards it |
| Edge: already `Received` | D14 → `status-changed` |
| Edge: refresh after signing | The seeded store holds `Received` until reload; the contract source reads it back |

## Constitution Compliance

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Spec-Driven Development | PASS | Implements spec 012. Its departures from `04.1` are in spec 012's Clarifications and D17. Spec 007 is amended (D16), not overridden |
| II. Two Distinct Human Roles | PASS | Only the Employee panel offers the form. The seeded `sign` refuses non-Employees and non-owners (D14). The Admin's *mark received* is spec 001 T017, not this feature |
| III. Inventory Integrity | PASS | The SPA models no stock. The assignment on `Received` is the API's |
| IV. Explicit Request State Machine | PASS | Offered only on an unsigned `Received` request, and signing changes no status (6.0.0). No Employee Complete control (FR-001a). `Received` shows no Cancel Request, because the existing `cancellable` guard is `Pending Approval` only |
| V. Notification Completeness | PASS | The API sends `Status changed`. The SPA shows status only |
| VI. Independently Testable Increments | PASS | Demonstrable on the seed. `check-accountability-form` gates it |
| VII. Typed Contracts | PASS | No route, field or error code named. The pointer table is empty until the contract names fields (D13) |
| VIII. MVP Restraint | PASS | No package, no per-unit UI, no reminder or timeout |
| IX. Secrets and Internal Data | PASS | The signature is not logged or stored by the seed |

## Analysis Overrides

None dismissed. A1 was fixed by splitting spec 012 SC-004 into SC-004a (K2) and SC-004b (K3). A2 was fixed in D5 and D8 (resolved paints and bindings). A3 was fixed by recording the `TextField` / `InputField` split and cross-referencing JSDoc in D6.

## Known Risks

Each red-team failure mode was mitigated. What remains after mitigation:

| # | Risk | Mitigation in the plan | Residual |
|---|------|------------------------|----------|
| 1 | The contract's submission does not match `Signature` | `Signature` is a UI type, and K3 translates it; any gap is raised as a contract conflict (Data Model) | K3 may need a new conflict entry and a small source change. The form stays unchanged |
| 2 | The 564px sheet breaks narrow viewports or a11y | `min(width, 100vw)`, `w-full` inner blocks, form view added to `check-a11y-responsive` (D3) | None expected |
| 3 | Focus is lost on the mode switch | Explicit focus targets, asserted by the check (D9a) | None expected |
| 4 | The designer changes `04.1` again | Re-check before K2 and before the PR; departures kept in one place (D16a, D17) | A real redesign still costs rework. Accepted, since the file is known to be in motion |
| 5 | SC-006 fails on markdown formatting | Normalised comparison with a word diff (Checks) | None expected |
| 6 | The read gate proves the text was reached, not read. A fast scroll unlocks it | None possible in the UI. The gate is a speed bump, which is what was asked | Accepted |
| 7 | The gate traps someone whose box never reports its end (rounding, or reading by screen-reader virtual cursor without moving the scroll) | 2px tolerance; unlock on mount and on resize when the text fits; the region is focusable and keyboard-scrollable; the blocked message says exactly what to do (D8a) | A virtual-cursor reader must still scroll the region once. The message tells them to |

**Strengthened position:** the form is one mode of the panel the Employee already uses, on the one seam K3 replaces. The panel tolerates a changing design and a still-unpublished contract. Everything the backend will refuse, the seed already refuses. Everything the design leaves open is written down. Every guess the contract would have to confirm (field pointers, payload shape) is deferred to K3 rather than invented.
