# Implementation Plan: Profile

**Branch**: `emmanuelr/ben-49-p2spa-profile` (based on `origin/dev`; PR base `dev`)
**Date**: 2026-09-23 | **Spec**: [spec.md](spec.md) | **Linear**: [BEN-49](https://linear.app/bench-synergy-project/issue/BEN-49) (I1 [BEN-87](https://linear.app/bench-synergy-project/issue/BEN-87))
**Status**: Draft

## Summary

Replace the `/profile` placeholder with the designed Profile page. The identity block reads only from the session, which gains one new fact: the user's home office. `Currently Assigned` reads through an **assigned-equipment boundary** that works like spec 003's `SessionSource` and spec 005's `CatalogSource`. It has one difference: the boundary can be **absent**, and absence is how state (c) is represented. Today no implementation is registered, so the section is hidden. A stub that exists only in development exercises states (a) and (b).

## Technical Context

**Stack**: TypeScript (strict), React 19, Vite 8, Tailwind CSS 4, as already scaffolded
**Routing**: React Router v7. `/profile` is already mapped, guarded for all three roles, and reached from the account cluster (spec 003 FR-006a)
**Primary Dependencies**: none new. Uses spec 002's `PageHeader` and `Avatar`, plus `Intl.DateTimeFormat`. `SectionTitle` (19px) and `LoadingState` (full-screen) are deliberately not used; see Copy
**Storage**: none. Identity comes from the session context; equipment comes from the boundary
**Target Layer**: frontend only
**Performance Goals**: identity renders on first paint after the session resolves, with no extra round trip. Only the equipment section may load
**Constraints**: constitution VII (no invented contract) and VIII (no per-unit register); BEN-49 folder ownership (`src/features/profile/*`); spec FR-010 (no fabricated rows in shipped code)
**Testing**: `npm run verify` gates, plus a browser walk of all three roles and all five section states. Playwright is Parent J's job

## Blocking Preconditions

| Precondition | State |
|---|---|
| A6 / BEN-38 merged | **Met.** Shell, `/profile` route, guard and account-cluster link are live on this branch |
| Spec 002 components exported | **Met.** `Avatar` already documents its 56px profile size |
| Published contract exposes the user's office | **Met.** The current-user resource carries `location`: `Cebu \| Bacolod \| Makati \| Pasig \| Davao` |
| Published contract exposes assigned equipment | **Not met, and not required.** State (c) is the live state |

## Rendering Authority

The **rendered frame** `05 - Profile` (`~/Desktop/OSRS-figma-2026-09-22/BEN-49/01-profile.png`) wins over `design-system/ui_kits/osrs-web/ProfileScreen.jsx` wherever they disagree. The UI-kit JSX carries the file's cached text sizes, which drift §9 records as wrong. It also omits the office and hard-codes rows. Known differences the implementation follows from the frame:

| Element | UI kit | Frame (authority) |
|---|---|---|
| Name | 13px medium | Larger display name, about 24px |
| Identity line | email only | `email • Office` |
| Section title | 14px | Section-title scale, about 24px |
| List layout | one column, 700px cards | Two-column grid of equal cards |
| Date colour | primary | secondary / muted |

Exact values are settled against the frame by the `fidelity` gate during execution. None of them is a new token.

## Data Model

### Session: one additive fact (spec D3)

`src/features/auth/types.ts`

```ts
/** The published contract's office vocabulary, transcribed, not invented. */
export type Office = 'Cebu' | 'Bacolod' | 'Makati' | 'Pasig' | 'Davao';

export type User = {
  // …existing fields unchanged
  /** Optional: a user with none renders email alone (spec Edge Cases). */
  office?: Office;
};
```

Optional, so no existing caller changes and the shell's own gates are unaffected. When the contract-backed `SessionSource` lands, it maps the contract's `location` into `office`. That mapping belongs to the session source, not to Profile.

Seeded users (`src/features/auth/seeded-source.ts`):

| User | Office | Provenance |
|---|---|---|
| Maya Santos (Employee) | `Davao` | Design frame |
| Samantha Reyes (Approver) | `Makati` | **Placeholder** (constitution IX); no design source |
| Ethan Cruz (Supply Admin) | `Cebu` | **Placeholder**; no design source |

The two placeholders are distinct, so SC-001 can tell users apart by office as well as by name.

### Assigned equipment: feature-local, in SPA vocabulary

`src/features/profile/assigned-source.ts`

```ts
/** One piece of equipment assigned to the signed-in user. Every field but the
 *  name is optional: a row renders what it was given and never invents a
 *  value; a missing date is stated in words (spec Edge Cases, FR-009). */
export type AssignedItem = {
  id: string;
  name: string;
  tag?: string;
  /** Calendar date, `YYYY-MM-DD`. */
  assignedOn?: string;
};

/** The assigned-equipment boundary. No endpoint, payload or error code.
 *  There is deliberately no user parameter: the source answers for the
 *  signed-in user only (FR-006), exactly as the contract's current-user
 *  resource does. `assignedToMe()` REJECTS on failure and never resolves
 *  `[]` to mean failure, because empty and unreachable are different
 *  outcomes (FR-008, FR-011). */
export interface AssignedEquipmentSource {
  assignedToMe(): Promise<AssignedItem[]>;
}
```

`src/features/profile/assigned-source-registry.ts` exports the active source as `AssignedEquipmentSource | null`. **`null` is state (c).** In a production build it is always `null`. A contract-backed implementation replaces that `null` when the backend publishes an endpoint, and no page code changes.

### Section state

`src/features/profile/useAssignedEquipment.ts` returns a discriminated union. Each spec state maps to exactly one branch:

| Hook state | Spec | Renders |
|---|---|---|
| `{ kind: 'unavailable' }` | FR-007c | Nothing: no heading, no gap |
| `{ kind: 'loading' }` | FR-011 | Heading + loading indicator |
| `{ kind: 'failed' }` | FR-011 | Heading + inline error. Covers a source that fails to **resolve** as well as one that rejects, and logs the cause to the console |
| `{ kind: 'loaded', items: [] }` | FR-007b | Heading + empty state |
| `{ kind: 'loaded', items }` | FR-007a | Heading + two-column list |

`AssignedSection` is keyed by the session user's `id` plus the query string, so a sign-out and sign-in as someone else, or a change of dev stub mode, remounts it from `unavailable` and never shows the previous rows (FR-006, spec 003 SC-005). Within one mount, a response that arrives after the effect is torn down is discarded.

### Formatting

`src/features/profile/format.ts`: pure functions, and the only place these rules live.

- `identityLine(email, office?)` returns `` `${email} • ${office} Office` ``, or `email` when `office` is absent. The separator never dangles.
- `formatAssignedDate('2026-01-14')` returns `Jan 14, 2026` via `Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })`. It formats in UTC because the value is a calendar date, not an instant. Formatting it in local time would shift it by a day west of UTC.
- A missing or malformed date returns `null`, and the card's date line reads `Assignment date not available` rather than printing `Invalid Date` (FR-009 as amended 2026-09-23).

## Development-Only Stub (states a and b)

`src/features/profile/dev/assigned-stub.ts`: reachable **only** when `import.meta.env.DEV` is true, via a dynamic `import()` in the registry. The guard MUST be the literal `if (import.meta.env.DEV)` wrapping the `import()`, not a variable or helper, so Vite replaces it with a constant and removes the branch from the production build (R4).

It is selected by a query parameter on `/profile`, so every state is reachable in one dev-server run without restarts (SC-004):

| `?assigned=` | Behaviour |
|---|---|
| *(absent)* | `null`: state (c), same as production |
| `items` | Resolves three rows, including one with no tag and one with no date |
| `empty` | Resolves `[]` |
| `loading` | Resolves after a delay, so the loading state is visible |
| `failing` | Rejects |

Stub rows are **visibly synthetic**: names like `Stub item A` and tags like `STUB-0001`. They are not the design's laptop, mouse and phone, so no one mistakes them for data. This keeps FR-010 true: nothing fabricated ships, and nothing in the dev stub impersonates a real unit.

## API Contracts

Not authored here. `specs/001-office-supplies-mvp/contracts/README.md` points to the published contract, and this plan uses one fact from it: the current user's `location` enum. It adds no route, payload or error code, and does not request an assigned-equipment endpoint (spec Dependencies).

## Component / Module Breakdown

Owned: `src/features/profile/`

| File | Responsibility |
|---|---|
| `ProfilePage.tsx` | Composition: `PageHeader`, `IdentityBlock`, `AssignedSection`. Reads `useSession()` only. **Role-agnostic (R1):** no branch on `role`, so any role the session can express renders the same page. **Read-only (FR-013):** no inputs, forms or edit controls anywhere on the page |
| `IdentityBlock.tsx` | 56px `Avatar` (initials + `avatarColor`), name, identity line. Never passes a photo, even if the session or `Avatar` later supports one (FR-003, R1) |
| `AssignedSection.tsx` | Switches on the hook state; renders nothing for `unavailable` |
| `AssignedItemCard.tsx` | Name, optional tag chip (`bg-status-info-bg text-status-info-fg`, radius 4), optional `Assigned <date>` |
| `assigned-source.ts` | `AssignedItem`, `AssignedEquipmentSource` |
| `assigned-source-registry.ts` | The active source, or `null` |
| `useAssignedEquipment.ts` | Load state; resolution and load in one `try`; failure logged; stale-response guard. The caller keys it on user id + query |
| `format.ts` | `identityLine`, `formatAssignedDate` |
| `dev/assigned-stub.ts` | DEV-only stub (see above) |

Shared touch:

| File | Change | Why it is acceptable |
|---|---|---|
| `src/features/auth/types.ts` | Add `Office`; add optional `User.office` | Additive. FR-005 cannot be met without it, and the session is the only permitted identity source |
| `src/features/auth/seeded-source.ts` | Add `office` to three seeded users | Data only; no logic changes |
| `src/app/routes.tsx` | `ProfilePlaceholder` becomes `ProfilePage` (1 import + 1 element) | The swap spec 003 designed for |
| `src/app/placeholders.tsx` | Remove the dead `ProfilePlaceholder` | Same |
| `docs/design-system/additions.md` | Log the inventions: empty/loading/error presentation and copy, the Approver/Supply Admin reuse, and the placeholder offices | The repo's convention for undesigned surfaces |

**Exception to folder ownership, stated plainly:** the two `auth/` edits sit outside `src/features/profile/*`. They are taken because spec FR-005 requires the office to come from the session, and forking identity into the profile feature would create a second source of truth. Both edits are additive and optional-typed. Catalog (BEN-42) and Approvals (BEN-46) touch neither file (checked on their branches 2026-09-23), so only `routes.tsx` and `placeholders.tsx` can collide, one line each.

### Copy (resolves spec CHK001)

Following `docs/design-system/content-conventions.md`: sentence case, one sentence, no period on single-line UI text.

| State | Copy |
|---|---|
| Empty (b) | **`Nothing is assigned to you`**, with a secondary line: `Equipment issued to you will appear here` |
| Failed | `Couldn't load your assigned equipment`. Message only, no retry control: the spec asks for a distinct error state, not recovery, and reloading the page retries |
| Loading | An inline `role="status"` line, `Loading assigned equipment`. Not `LoadingState`, which is a full-screen (`min-h-screen`) surface and would push the identity block aside for one section |
| Heading | `Currently Assigned` as an `h2` at 24px display medium, not `SectionTitle` (19px): the frame draws it at the name's scale |

The empty copy states a fact the source reported. It is shown only in state (b) and never in state (c), where nothing is rendered, so it cannot be mistaken for "the system can't say" (FR-008). All three rows are flagged to the designer as invented.

## Project Structure

```
src/features/profile/
├── ProfilePage.tsx
├── IdentityBlock.tsx
├── AssignedSection.tsx
├── AssignedItemCard.tsx
├── assigned-source.ts
├── assigned-source-registry.ts
├── useAssignedEquipment.ts
├── format.ts
└── dev/
    └── assigned-stub.ts
```

## Dependencies

No new packages or services. External: none until the backend publishes an assigned-equipment resource, and nothing waits on it.

## Verification

| Gate | How | Spec |
|---|---|---|
| Typecheck / lint / build | `npx tsc -b --force`, `npm run lint`, `npm run build` | — |
| Full gates | `npm run verify` (dev server). `check-shell` asserts `/profile` is reached from the account cluster for all three roles; `check-profile` (added after review) asserts identity for all three roles and every `Currently Assigned` state | FR-001, FR-004, FR-007–FR-013 |
| Three roles | Sign in as each seeded user; name, email, office match the session; same layout | SC-001, SC-005, FR-012 |
| Five section states | `/profile`, `?assigned=items`, `empty`, `loading`, `failing` | SC-003, SC-004, FR-007, FR-011 |
| Partial rows | Stub row with no tag has no chip; the row with no date reads `Assignment date not available` and matches its neighbours' height | FR-009, Edge Cases |
| No office | Temporarily clear a seeded office in a dev session: email alone, no `•` | Edge Cases |
| No hard-coded identity | `grep` over `src/features/profile/` excluding `dev/` for seeded names, emails, offices, tags and dates: zero hits | SC-002 |
| Stub absent from prod | `check-profile-build` in `npm run verify`, after `build`: scans every text asset in `dist/` for the stub's `DEV_STUB_SENTINEL` (read from the stub's own source) and its chunk name, and refuses to pass on a `dist/` with no JavaScript | FR-010 |
| Role switch | Sign out as Maya, sign in as Ethan with `?assigned=items`: no stale rows or identity | FR-006 |
| Read-only | No `input`, `textarea`, `select` or edit control is rendered on `/profile` in any state | FR-013 |
| Narrow viewport | List collapses to one column; `a11y` gate passes | Edge Cases |
| Fidelity | `fidelity` and `pixels` gates against `05 - Profile` with `?assigned=items`, compared structurally, not by row content | SC-005 |

## Implementation Sequence

1. `Office` + `User.office`, then the seeded offices
2. `format.ts`
3. Boundary types, registry (`null`), and the DEV stub
4. `useAssignedEquipment`
5. `IdentityBlock`, `AssignedItemCard`, `AssignedSection`, `ProfilePage`
6. Route swap; remove the placeholder
7. Log the inventions in `additions.md`
8. Run the gates and the verification walk

## Known Risks

| # | Risk | Disposition |
|---|---|---|
| R1 | **The unmerged auth branch** (`origin/ruben/auth-google-integration`) lands first. It adopts the contract's two-role model (adds `admin`, constitution 3.0.0, ADR-0005), makes `Avatar` render the Google photo, and edits `auth/types.ts` and `seeded-source.ts`. | **Mitigated.** Profile never branches on role, so `admin` renders with no change. `IdentityBlock` never passes a photo, so FR-003 holds whatever `Avatar` supports. Rebase note: our `auth/` edits are one optional `office` field, one `Office` type, and three seeded values. Re-apply them on top of that branch's `User` (which adds `avatarUrl`) rather than resolving hunks. If constitution 3.0.0 merges, spec 006's "three roles" wording is amended in the same rebase; the page itself does not change. |
| R2 | **Office never reaches the real session.** That branch's contract-backed session source lists `location` as unconsumed, so in production the identity line would fall back to email alone and BEN-49 acceptance 1 would pass only in the demo. | **Mitigated, tracked as [BEN-112](https://linear.app/bench-synergy-project/issue/BEN-112)** (sub-issue of BEN-49, created 2026-09-23). The mapping belongs in the contract-backed `SessionSource`, which is not on this branch. The PR lists BEN-112 as an open dependency. |
| R3 | **The hidden section reads as a bug.** With today's backend there is no `Currently Assigned` at all, and QA files it as missing against the frame. | **Mitigated.** The PR description states that state (c) is the intended live state (spec FR-007c, Linear Reconciliation) and lists the `?assigned=items\|empty\|loading\|failing` stub states for QA. |
| R4 | **The stub leaks into production** if the DEV guard isn't statically removable. | **Mitigated.** Literal `import.meta.env.DEV` guard (see Development-Only Stub) plus the `dist/` search in Verification. |
| R5 | **The fidelity gates can't judge the list.** The frame shows the design's rows and the stub shows synthetic ones; `compare-pixels` does not cover `/profile` today. | **Mitigated as planned.** Structural comparison only: layout, sizes, tokens, chip treatment. The pixel gate is not extended to Profile in this feature. |

## Constitution Compliance

| Principle | Status | Note |
|---|---|---|
| I. Spec-Driven | PASS | Implements spec 006 only. CHK001 resolved here, as the spec deferred it. FR-010 and SC-002 amended in the spec before planning relied on the stub |
| II. Three Roles | PASS | One page for all three; no combined role; the contract's two-role vocabulary is left to the session boundary |
| III. Inventory Integrity | PASS | Reads nothing from inventory; mutates nothing |
| IV. State Machine | PASS | No request transitions |
| V. Notifications | PASS | None emitted |
| VI. Testable Increments | PASS | Story 1 ships alone; Story 2's three states each reachable via the DEV stub |
| VII. Typed Contracts | PASS | Only `location` is used, transcribed as `Office`; no route, field or error code invented; the equipment boundary is SPA vocabulary |
| VIII. MVP Restraint | PASS | No register, no units, no dependency; stub is DEV-only and synthetic |
| IX. Secrets | PASS | Placeholder offices are non-production seed data; no credentials |
